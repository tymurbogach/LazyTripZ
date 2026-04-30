<?php

namespace App\Http\Controllers;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use App\Http\Traits\ApiResponse;

abstract class Controller
{
    use AuthorizesRequests, ApiResponse;

    protected function sendResponse($success, $message, $data = null, $status = 200)
    {
        if ($success) {
            return $this->successResponse($message, $data, $status);
        }

        return $this->errorResponse($message, $data, $status);
    }
}
