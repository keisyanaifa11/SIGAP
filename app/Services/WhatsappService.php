<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;

class WhatsappService
{
    /**
     * Simulate sending a WhatsApp message.
     * In a real app, this integrates with APIs like Fonnte, Twilio, or WABlas.
     *
     * @param string $phone
     * @param string $message
     * @return array
     */
    public function sendMessage($phone, $message)
    {
        // Sanitize phone number (e.g. replace 0 with 62)
        if (substr($phone, 0, 1) === '0') {
            $phone = '62' . substr($phone, 1);
        }

        try {
            $token = env('FONNTE_TOKEN', 'your-fonnte-token-here'); // Dapatkan token dari https://md.fonnte.com/

            $response = \Illuminate\Support\Facades\Http::asForm()->withHeaders([
                'Authorization' => $token
            ])->post('https://api.fonnte.com/send', [
                'target' => $phone,
                'message' => $message,
                'countryCode' => '62',
            ]);

            Log::info("WhatsApp Fonnte API sent to: {$phone}. Response: " . $response->body());
            
            return [
                'status' => $response->successful() ? 'success' : 'failed',
                'message' => $response->body(),
            ];
        } catch (\Exception $e) {
            Log::error("WhatsApp Sending Failed to {$phone}: " . $e->getMessage());
            
            return [
                'status' => 'failed',
                'message' => $e->getMessage(),
            ];
        }
    }
}
