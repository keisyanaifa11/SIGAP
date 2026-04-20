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
            // OPSI A: Karena berpindah ke Frontend WhatsApp Click-to-Chat (wa.me),
            // kita mematikan API gateway Fonnte di backend ini agar tidak dobel.
            
            // $response = \Illuminate\Support\Facades\Http::withHeaders([
            //     'Authorization' => env('FONNTE_TOKEN')
            // ])->post('https://api.fonnte.com/send', [ ... ]);

            Log::info("WhatsApp Disabled Setup (Option A) selected. Sending handled by frontend wa.me for: {$phone}");
            
            return [
                'status' => 'success',
                'message' => 'Opsi A',
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
