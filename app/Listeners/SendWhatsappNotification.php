<?php

namespace App\Listeners;

use App\Events\ProposalStatusChanged;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use App\Services\WhatsappService;
use App\Models\WhatsappNotificationLog;

class SendWhatsappNotification
{
    protected $waService;

    /**
     * Create the event listener.
     */
    public function __construct(WhatsappService $waService)
    {
        $this->waService = $waService;
    }

    /**
     * Handle the event.
     */
    public function handle(ProposalStatusChanged $event): void
    {
        $proposal = $event->proposal;
        $oldStatus = $event->oldStatus;
        $newStatus = $event->newStatus;

        // Validasi: hanya kirim jika status benar-benar berubah
        if ($oldStatus === $newStatus) {
            return;
        }

        // Ambil data user
        $user = $proposal->user;
        $phone = $proposal->no_wa ?? $user->whatsapp ?? $user->nomor_telepon;

        if (!$phone) {
            return; // Tidak ada nomor telepon
        }

        // Template Pesan Dinamis
        $message = "Halo *{$user->name}*,\n\n";
        $message .= "Status proposal Anda dengan ID *{$proposal->kode_tiket}* ({$proposal->kegiatan}) ";
        $message .= "telah berubah menjadi: *{$newStatus}*.\n\n";
        $message .= "Silakan cek dashboard secara berkala untuk info lebih lanjut.\n";
        $message .= "Terima kasih.\n\n- *Sistem SIGAP*";

        // Kirim via Service
        $response = $this->waService->sendMessage($phone, $message);

        // Logging ke Database
        WhatsappNotificationLog::create([
            'proposal_id' => $proposal->id,
            'nomor_tujuan' => $phone,
            'pesan' => $message,
            'status' => $response['status'] ?? 'unknown',
            'response' => json_encode($response),
        ]);
    }
}

