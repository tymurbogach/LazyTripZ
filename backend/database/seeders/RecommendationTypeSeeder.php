<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\RecommendationType;
use DB;

class RecommendationTypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        if (RecommendationType::count() > 0) {
            $this->command->info('Recommendation types already exist. Skipping seeding.');
            return;
        }

        $data = [
            // Categorias generales
            [
                'name' => 'alojamiento',
                'label' => 'Alojamiento',
                'prompt_template' => 'Quiero recibir recomendaciones de alojamiento en cada destino.',
                'category' => 'general',
                'icon' => 'hotel',
            ],
            [
                'name' => 'cultura',
                'label' => 'Cultura',
                'prompt_template' => 'Quiero saber normas culturales o de etiqueta importantes en cada lugar.',
                'category' => 'general',
                'icon' => 'psychology',
            ],
            [
                'name' => 'salud',
                'label' => 'Salud',
                'prompt_template' => 'Quiero saber si hay recomendaciones de salud, vacunas o precauciones médicas en esos destinos.',
                'category' => 'general',
                'icon' => 'health_and_safety',
            ],
            [
                'name' => 'documentación',
                'label' => 'Documentación',
                'prompt_template' => 'Soy ciudadano español. ¿Hay requisitos legales, visados o documentos que deba preparar para estas fechas?',
                'category' => 'legal',
                'icon' => 'description',
            ],
            [
                'name' => 'transporte',
                'label' => 'Transporte',
                'prompt_template' => 'Recomiéndame formas comunes o eficientes de moverme dentro de cada destino.',
                'category' => 'general',
                'icon' => 'commute',
            ],
            [
                'name' => 'conectividad',
                'label' => 'Conectividad',
                'prompt_template' => '¿Qué opciones tengo para mantenerme conectado (Internet, SIMs, apps locales) en estos destinos?',
                'category' => 'tecnología',
                'icon' => 'wifi',
            ],
            [
                'name' => 'seguridad',
                'label' => 'Seguridad',
                'prompt_template' => 'Quiero saber si hay zonas a evitar, precauciones o consejos de seguridad en esos destinos.',
                'category' => 'general',
                'icon' => 'security',
            ],
            [
                'name' => 'eventos',
                'label' => 'Eventos',
                'prompt_template' => '¿Habrá algún evento importante o festivo durante esas fechas que deba tener en cuenta?',
                'category' => 'cultura',
                'icon' => 'event',
            ],
            [
                'name' => 'ecología',
                'label' => 'Ecología',
                'prompt_template' => 'Quiero recomendaciones sobre cómo respetar el entorno y ser sostenible durante mi viaje.',
                'category' => 'sostenibilidad',
                'icon' => 'eco',
            ],
            [
                'name' => 'social',
                'label' => 'Vida social',
                'prompt_template' => '¿Cómo puedo conocer gente local o participar en la vida social sin parecer un turista incómodo?',
                'category' => 'social',
                'icon' => 'diversity_3',
            ],
            [
                'name' => 'pago',
                'label' => 'Métodos de pago',
                'prompt_template' => '¿Es común pagar con tarjeta o efectivo? ¿Qué métodos de pago funcionan mejor en cada destino?',
                'category' => 'dinero',
                'icon' => 'payments',
            ],

            // Categoría: mascotas
            [
                'name' => 'alojamiento_mascotas',
                'label' => 'Alojamiento pet-friendly',
                'prompt_template' => '¿Qué alojamientos permiten mascotas en cada destino? Indica si tienen restricciones por tamaño o tipo.',
                'category' => 'mascotas',
                'icon' => 'hotel',
            ],
            [
                'name' => 'restaurantes_mascotas',
                'label' => 'Restaurantes pet-friendly',
                'prompt_template' => 'Recomiéndame cafeterías o restaurantes pet-friendly en cada destino, donde pueda estar con mi mascota.',
                'category' => 'mascotas',
                'icon' => 'restaurant',
            ],
            [
                'name' => 'transporte_mascotas',
                'label' => 'Transporte',
                'prompt_template' => '¿Qué debo tener en cuenta para viajar con mi mascota en avión, tren o transporte local en estos destinos?',
                'category' => 'mascotas',
                'icon' => 'commute',
            ],
            [
                'name' => 'documentación_mascotas',
                'label' => 'Documentación y requisitos',
                'prompt_template' => '¿Qué requisitos legales debo cumplir para llevar a mi mascota (vacunas, microchip, pasaporte, certificados)?',
                'category' => 'mascotas',
                'icon' => 'description',
            ],
            [
                'name' => 'veterinarios_emergencias',
                'label' => 'Veterinarios y emergencias',
                'prompt_template' => 'Indícame clínicas veterinarias o teléfonos de emergencia disponibles en estos destinos.',
                'category' => 'mascotas',
                'icon' => 'medical_services',
            ],
            [
                'name' => 'parques_y_paseo',
                'label' => 'Parques y paseo',
                'prompt_template' => '¿Dónde puedo pasear a mi mascota? ¿Hay parques o zonas específicas para mascotas?',
                'category' => 'mascotas',
                'icon' => 'park',
            ],
            [
                'name' => 'normativa_local_mascotas',
                'label' => 'Normativa local',
                'prompt_template' => '¿Qué normas debo seguir con mi mascota en estos lugares? ¿Hay zonas prohibidas, necesidad de correa o multas comunes?',
                'category' => 'mascotas',
                'icon' => 'rule',
            ],
            [
                'name' => 'tiendas_y_comida_mascotas',
                'label' => 'Tiendas y comida',
                'prompt_template' => '¿Dónde puedo comprar comida o accesorios para mi mascota en cada destino? ¿Qué marcas están disponibles?',
                'category' => 'mascotas',
                'icon' => 'pet_supplies',
            ],
            [
                'name' => 'servicios_para_mascotas',
                'label' => 'Servicios',
                'prompt_template' => '¿Existen guarderías, cuidadores o peluquerías para mascotas en estos destinos?',
                'category' => 'mascotas',
                'icon' => 'store',
            ],
            [
                'name' => 'clima_y_salud_mascotas',
                'label' => 'Clima y salud',
                'prompt_template' => '¿Qué precauciones debo tomar respecto al clima o enfermedades comunes que puedan afectar a mi mascota?',
                'category' => 'mascotas',
                'icon' => 'health_and_safety',
            ],
            [
                'name' => 'consejos_adaptacion_mascota',
                'label' => 'Adaptación',
                'prompt_template' => '¿Qué recomendaciones hay para que mi mascota no se estrese durante el viaje y se adapte al nuevo entorno?',
                'category' => 'mascotas',
                'icon' => 'emoji_objects',
            ],
            [
                'name' => 'actividades_mascotas',
                'label' => 'Actividades',
                'prompt_template' => '¿Qué actividades, eventos o experiencias puedo hacer con mi mascota en estos lugares?',
                'category' => 'mascotas',
                'icon' => 'pets',
            ],
        ];

        foreach ($data as $item) {
            DB::table('recommendation_types')->updateOrInsert(
                ['name' => $item['name']],
                $item
            );
        }
    }
}
