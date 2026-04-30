<?php

namespace App\Http\Traits;

trait ApiResponse
{
    /**
     * Return a consistent JSON response.
     */
    protected function successResponse($message, $data = null, $status = 200)
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $data
        ], $status);
    }

    /**
     * Return an error JSON response.
     */
    protected function errorResponse($message, $errors = null, $status = 400)
    {
        return response()->json([
            'success' => false,
            'message' => $message,
            'data' => $errors
        ], $status);
    }

    /**
     * Return a not found JSON response.
     */
    protected function notFoundResponse($message = 'Resource not found')
    {
        return $this->errorResponse($message, null, 404);
    }

    /**
     * Return a validation error JSON response.
     */
    protected function validationErrorResponse($errors)
    {
        return $this->errorResponse('Validation error', $errors, 422);
    }

    /**
     * Return an unauthorized JSON response.
     */
    protected function unauthorizedResponse($message = 'Unauthorized')
    {
        return $this->errorResponse($message, null, 401);
    }

    /**
     * Return a forbidden JSON response.
     */
    protected function forbiddenResponse($message = 'Forbidden')
    {
        return $this->errorResponse($message, null, 403);
    }
}