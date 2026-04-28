<?php

namespace App\Jobs;

use App\Models\Recommendation;
use App\Models\RecommendationType;
use App\Services\RecommendationService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Log;

class GenerateRecommendationsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $locations;
    protected $type;
    protected $trip_id;

    /**
     * Create a new job instance.
     */
    public function __construct(array $locations, string $type, int $trip_id)
    {
        $this->locations = $locations;
        $this->type = $type;
        $this->trip_id = $trip_id;
    }

    /**
     * Execute the job.
     */
    public function handle(RecommendationService $service): void
    {
        try {
            $recommendations = $service->generateRecommendations($this->locations, $this->type);

            $type_model = RecommendationType::where('name', $this->type)->first();

            foreach ($recommendations as $item) {
                Recommendation::create([
                    'trip_id' => $this->trip_id,
                    'recommendation_type_id' => $type_model->id,
                    'recommendation' => $item['recomendacion'],
                    'reason' => $item['motivo'],
                ]);
            }

        } catch (\Throwable $e) {
            Log::error("Recommendation Job failed for type {$this->type}: " . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            // Relanzar para que el Job falle y lo reintente
            throw $e; 
        }
    }
}
