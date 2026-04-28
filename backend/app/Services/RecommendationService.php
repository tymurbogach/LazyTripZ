<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class RecommendationService
{
    private function callGemini(string $prompt)
    {
        $apiKey = config('services.gemini.key');
        $url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={$apiKey}";

        $response = Http::post($url, [
            'systemInstruction' => [
                'parts' => [['text' => 'Eres una IA que responde solo con JSON sin explicación. No escribas nada fuera del bloque JSON.']],
            ],
            'contents' => [
                ['parts' => [['text' => $prompt]]],
            ],
            'generationConfig' => ['temperature' => 0.7],
        ]);

        if ($response->failed()) {
            Log::error('Gemini API error', [
                'status' => $response->status(),
                'body'   => $response->body(),
            ]);
            return [];
        }

        $content = $response['candidates'][0]['content']['parts'][0]['text'] ?? '';

        // Eliminar bloques de código markdown que Gemini puede añadir
        $content = str_replace(['```json', '```'], '', $content);
        $content = trim($content);

        $json = json_decode($content, true);

        if (!is_array($json)) {
            Log::error('Respuesta de Gemini no es un array JSON válido', [
                'original_content' => $content,
            ]);
            return [];
        }

        // Normalizar a array numérico
        if (array_keys($json) === range(0, count($json) - 1)) {
            return $json;
        }
        return [$json];
    }

    // Funciones para recomendaciones generales
    private function generateTextType($type_model) 
    {
        $template = $type_model->prompt_template ?? 'Quiero recibir 2 recomendaciones útiles en cada destino sobre {$type}.';
        
        return strtr($template, [
            '{$type}' => $type_model
        ]);
    }

    public function generateRecommendations(array $locations, $type_model)
    {
        $detail_trip = collect($locations)->map(function ($location) {
            return "- Estaré en {$location['name']} del {$location['start_date']} al {$location['end_date']}.";
        })->implode("\n");

        $type_prompt = $this->generateTextType($type_model);

        $prompt = <<<PROMPT
        Estoy planeando un viaje. Aquí están las ubicaciones y fechas:

        $detail_trip

        $type_prompt

        Responde con un JSON válido. No incluyas ```json ni formato de bloque de código. Solo responde con el JSON puro.

        El formato que quiero es estrictamente este. Si no hay recomendaciones, devuelve un array vacío:

        [
            {
                "recomendacion": "Texto de la recomendación",
                "motivo": "Motivo por el cual se recomienda esa actividad"
            }
        ]
        PROMPT;

        return $this->callGemini($prompt);
    }

    // Funciones para recomendaciones de mascotas
    private function generateTextPetType($type_model, $pets) 
    {
        $template = $type_model->prompt_template ?? 'Quiero recibir 2 recomendaciones útiles en cada destino sobre {$type} adecuadas para viajar con {$pets_text}.';

        $pets_text = $pets ? collect($pets)->pluck('type')->implode('y ') : '';
        if (empty($pets_text)) {
            $pets_text = 'mascotas';
        }
        return strtr($template, [
            '{$type}' => $type_model,
            '{$pets}' => $pets_text 
        ]);
    }

    public function generatePetRecommendationsForEachPet(array $locations, $type_model, array $pets)
    {
        $details_trip = collect($locations)->map(function ($location) {
            return "- Estaré en {$location['name']} del {$location['start_date']} al {$location['end_date']}.";
        })->implode("\n");

        $details_pets = collect($pets)->map(function ($pet) {
            return "- La mascota {$pet['type']} tiene el ID ({$pet['id']})";
        })->implode("\n");

        $type_prompt = $this->generateTextPetType($type_model, $pets);

        $prompt = <<<PROMPT

        Estoy planeando un viaje con mis mascotas. Aquí están las ubicaciones y fechas:
        $details_trip

        Aquí están las mascotas que viajan conmigo y sus IDs:
        $details_pets

        $type_prompt

        Necesito exactamente **dos recomendaciones por mascota**.

        Si una recomendación sirve para más de una mascota, en pet_id se pone un array con los IDs de las mascotas (respetando el formato y cambiando el `pet_id`).
        
        Si una recomendación es individual para una sola mascota, asígnala únicamente a ella.

        Responde con un JSON válido. No incluyas ```json ni formato de bloque de código. Solo responde con el JSON puro.

        El formato que quiero es estrictamente este. Si no hay recomendaciones, devuelve un array vacío:

        [
            {
                "pet_id": ["ID de la mascota", "ID de la mascota si es para varias"],
                "recomendacion": "Texto de la recomendación",
                "motivo": "Motivo por el cual se recomienda esa actividad"
            }
        ]

        PROMPT;

        return $this->callGemini($prompt);
    }
}
