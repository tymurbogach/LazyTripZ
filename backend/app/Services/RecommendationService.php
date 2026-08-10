<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class RecommendationService
{
    private function callGemini(string $prompt, array $responseSchema)
    {
        $apiKey = config('services.gemini.key');
        $model  = config('services.gemini.model');
        $url    = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}";

        $response = Http::post($url, [
            'systemInstruction' => [
                'parts' => [['text' => 'Eres un asistente de viajes. Responde SIEMPRE con JSON puro siguiendo el schema indicado. Nunca añadas texto fuera del JSON.']],
            ],
            'contents' => [
                ['parts' => [['text' => $prompt]]],
            ],
            'generationConfig' => [
                'temperature'      => 0.7,
                'responseMimeType' => 'application/json',
                'responseSchema'   => $responseSchema,
            ],
        ]);

        if ($response->failed()) {
            $status = $response->status();
            Log::error("Gemini API error [{$status}]", [
                'status' => $status,
                'body'   => $response->body(),
            ]);
            if ($status === 429) {
                throw new \RuntimeException("Gemini quota exceeded (429). Please check your API quota.");
            }
            return [];
        }

        $content = $response['candidates'][0]['content']['parts'][0]['text'] ?? '';
        $content = trim(str_replace(['```json', '```'], '', $content));

        $json = json_decode($content, true);

        if (!is_array($json)) {
            Log::error('Respuesta de Gemini no es JSON válido', ['content' => $content]);
            return [];
        }

        // Normalizar: si ya es array indexado lo devolvemos tal cual, si no lo envolvemos
        return array_is_list($json) ? $json : [$json];
    }

    // ── Recomendaciones generales ─────────────────────────────────────────

    public function generateRecommendations(array $locations, $type_model): array
    {
        $detail_trip = collect($locations)->map(fn($l) =>
            "- Estaré en {$l['name']} del {$l['start_date']} al {$l['end_date']}."
        )->implode("\n");

        $type_prompt = $type_model->prompt_template
            ?? 'Dame 2 recomendaciones útiles para cada destino.';

        $prompt = <<<PROMPT
        Estoy planeando un viaje. Ubicaciones y fechas:
        $detail_trip

        Tarea: $type_prompt

        Proporciona entre 2 y 4 recomendaciones concretas y útiles.
        PROMPT;

        $schema = [
            'type'  => 'array',
            'items' => [
                'type'       => 'object',
                'properties' => [
                    'recomendacion' => ['type' => 'string', 'description' => 'Recomendación concreta'],
                    'motivo'        => ['type' => 'string', 'description' => 'Por qué es útil'],
                ],
                'required' => ['recomendacion', 'motivo'],
            ],
        ];

        return $this->callGemini($prompt, $schema);
    }

    // ── Recomendaciones de mascotas ───────────────────────────────────────

    public function generatePetRecommendationsForEachPet(array $locations, $type_model, array $pets): array
    {
        $details_trip = collect($locations)->map(fn($l) =>
            "- Estaré en {$l['name']} del {$l['start_date']} al {$l['end_date']}."
        )->implode("\n");

        $details_pets = collect($pets)->map(fn($p) =>
            "- Mascota tipo '{$p['type']}' con ID {$p['id']}"
        )->implode("\n");

        $pets_text = collect($pets)->pluck('type')->implode(' y ') ?: 'mascotas';

        $type_prompt = strtr(
            $type_model->prompt_template ?? 'Dame 2 recomendaciones sobre {$type} para viajar con {$pets}.',
            ['{$type}' => $type_model->label, '{$pets}' => $pets_text]
        );

        $pet_ids = collect($pets)->pluck('id')->implode(', ');

        $prompt = <<<PROMPT
        Estoy planeando un viaje con mis mascotas. Ubicaciones y fechas:
        $details_trip

        Mascotas (con sus IDs):
        $details_pets

        Tarea: $type_prompt

        IDs de mascotas disponibles: $pet_ids
        Da exactamente 2 recomendaciones por mascota.
        Si una recomendación aplica a varias mascotas, incluye todos sus IDs en pet_id.
        PROMPT;

        $schema = [
            'type'  => 'array',
            'items' => [
                'type'       => 'object',
                'properties' => [
                    'pet_id'        => [
                        'type'  => 'array',
                        'items' => ['type' => 'integer'],
                        'description' => 'IDs de las mascotas a las que aplica',
                    ],
                    'recomendacion' => ['type' => 'string'],
                    'motivo'        => ['type' => 'string'],
                ],
                'required' => ['pet_id', 'recomendacion', 'motivo'],
            ],
        ];

        return $this->callGemini($prompt, $schema);
    }
}
