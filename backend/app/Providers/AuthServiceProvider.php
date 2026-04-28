<?php

namespace App\Providers;

use App\Models\Trip;
use App\Policies\TripPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    /** Mapeo modelo → policy. */
    protected $policies = [
        Trip::class => TripPolicy::class,
    ];

    public function boot(): void
    {
        $this->registerPolicies();
    }
}
