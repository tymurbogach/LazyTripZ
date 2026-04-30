<?php

namespace App\Jobs;

use App\Models\PetRecommendation;
use App\Models\RecommendationType;
use App\Services\RecommendationService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Log;

class GeneratePetRecommendationsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 30; // 30s entre reintentos para respetar rate limits de Gemini

    protected $locations;
    protected $type;
    protected $trip_id;
    protected $pets;

    public function __construct(array $locations, string $type, int $trip_id, array $pets)
    {
        $this->locations = $locations;
        $this->type = $type;
        $this->trip_id = $trip_id;
        $this->pets = $pets;
    }

    public function handle(RecommendationService $service): void
    {
        try {
            $type_model = RecommendationType::where('name', $this->type)->first();
            if (!$type_model) {
                Log::error("Recommendation type '{$this->type}' not found in DB.");
                return;
            }
            $recommendations = $service->generatePetRecommendationsForEachPet($this->locations, $type_model, $this->pets);

            foreach ($recommendations as $recommendation) {
                foreach ($recommendation['pet_id'] as $pet_id) {
                    PetRecommendation::create([
                        'pet_id' => $pet_id,
                        'recommendation_type_id' => $type_model->id,
                        'recommendation' => $recommendation['recomendacion'],
                        'reason' => $recommendation['motivo'],
                    ]);
                }
            }
        } catch (\Throwable $e) {
            Log::error("Pet Recommendation Job failed for type {$this->type}: " . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            // Relanzar para que el Job falle y lo reintente
            throw $e;
        }
    }
}
