<?php

namespace App\Policies;

use App\Models\Trip;
use App\Models\User;

class TripPolicy
{
    public function view(User $user, Trip $trip): bool
    {
        return $trip->users()->where('user_id', $user->id)->exists();
    }

    public function update(User $user, Trip $trip): bool
    {
        return $this->isAdmin($user, $trip);
    }

    public function delete(User $user, Trip $trip): bool
    {
        return $this->isAdmin($user, $trip);
    }

    private function isAdmin(User $user, Trip $trip): bool
    {
        return $trip->users()
            ->where('user_id', $user->id)
            ->wherePivot('permission', 'admin')
            ->exists();
    }
}
