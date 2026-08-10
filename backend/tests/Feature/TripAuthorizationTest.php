<?php

namespace Tests\Feature;

use App\Models\Trip;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Passport\Passport;
use Tests\TestCase;

/**
 * Regresión de autorización a nivel de objeto (OWASP API1).
 *
 * Antes, las rutas con {trip} solo pasaban por `auth:api`: cualquier usuario autenticado
 * podía leer o borrar datos de un viaje ajeno pasando su id. Estos tests fijan el
 * comportamiento correcto para que no vuelva a colarse.
 */
class TripAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    private function tripOwnedBy(User $user, string $permission = 'admin'): Trip
    {
        $trip = Trip::factory()->create();
        $trip->users()->attach($user->id, ['permission' => $permission]);

        return $trip;
    }

    public function test_un_extrano_no_puede_borrar_recomendaciones_de_mascotas_de_otro_viaje(): void
    {
        $owner = User::factory()->create();
        $trip = $this->tripOwnedBy($owner);
        $stranger = User::factory()->create();

        Passport::actingAs($stranger);

        $this->deleteJson("/api/trip/{$trip->id}/pet_recommendations")
            ->assertForbidden();
    }

    public function test_un_extrano_no_puede_leer_las_actividades_de_otro_viaje(): void
    {
        $owner = User::factory()->create();
        $trip = $this->tripOwnedBy($owner);
        $stranger = User::factory()->create();

        Passport::actingAs($stranger);

        $this->getJson("/api/trip/{$trip->id}/activities")
            ->assertForbidden();
    }

    public function test_un_extrano_no_puede_borrar_los_destinos_de_otro_viaje(): void
    {
        $owner = User::factory()->create();
        $trip = $this->tripOwnedBy($owner);
        $stranger = User::factory()->create();

        Passport::actingAs($stranger);

        $this->deleteJson("/api/trip/{$trip->id}/locations")
            ->assertForbidden();
    }

    public function test_un_extrano_no_puede_ver_el_viaje_por_apiresource(): void
    {
        $owner = User::factory()->create();
        $trip = $this->tripOwnedBy($owner);
        $stranger = User::factory()->create();

        Passport::actingAs($stranger);

        $this->getJson("/api/trips/{$trip->id}")
            ->assertForbidden();
    }

    public function test_un_miembro_si_puede_leer_las_actividades_de_su_viaje(): void
    {
        $member = User::factory()->create();
        $trip = $this->tripOwnedBy($member, 'user');

        Passport::actingAs($member);

        $this->getJson("/api/trip/{$trip->id}/activities")
            ->assertOk();
    }

    public function test_un_viaje_inexistente_devuelve_404_no_403(): void
    {
        $user = User::factory()->create();

        Passport::actingAs($user);

        $this->getJson('/api/trip/999999/activities')
            ->assertNotFound();
    }

}
