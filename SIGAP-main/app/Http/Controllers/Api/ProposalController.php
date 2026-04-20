<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Proposal;
use App\Models\ActivityLog;
use App\Models\ProposalComment;
use App\Events\ProposalStatusChanged;

class ProposalController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        if ($user->role === 'user') {
            $proposals = Proposal::with(['user', 'comments.user'])->where('user_id', $user->id)->get();
        } else {
            $proposals = Proposal::with(['user', 'comments.user'])->get();
        }

        return response()->json([
            'status' => 'success',
            'data' => $proposals
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'kegiatan' => 'required|string',
            'tgl_pelaksanaan' => 'required|date',
            'dana_diajukan' => 'required|numeric',
            'email_organisasi' => 'required|email',
            'no_wa' => 'required|string',
            'file_proposal' => 'required|file'
        ]);

        $latest = Proposal::orderBy('id', 'desc')->first();
        $nextId = $latest ? $latest->id + 1 : 1;
        $kode_tiket = 'PRO-' . str_pad($nextId, 3, '0', STR_PAD_LEFT);

        $path = null;
        if ($request->hasFile('file_proposal')) {
            $file = $request->file('file_proposal');
            if (!$file->isValid()) {
                return response()->json(['message' => 'Gagal mengupload file proposal. Ukuran file mungkin terlalu besar atau format tidak didukung.'], 422);
            }
            $path = $file->store('proposals', 'public');
        }

        $proposal = Proposal::create([
            'kode_tiket' => $kode_tiket,
            'user_id' => $request->user()->id,
            'kegiatan' => $request->kegiatan,
            'jenis' => 'Advance Payment (Dana Di Depan)', // default scheme since removed from UI
            'tgl_pelaksanaan' => $request->tgl_pelaksanaan,
            'dana_diajukan' => $request->dana_diajukan,
            'email_organisasi' => $request->email_organisasi,
            'no_wa' => $request->no_wa,
            'file_proposal' => $path,
            'status' => 'Dalam Antrean'
        ]);

        ActivityLog::create([
            'user_id' => $request->user()->id,
            'name' => $request->user()->name,
            'role' => $request->user()->role,
            'action' => 'Mengajukan Proposal Baru',
            'description' => "Proposal {$kode_tiket} diajukan untuk kegiatan {$request->kegiatan}."
        ]);

        return response()->json(['status' => 'success', 'data' => $proposal]);
    }

    public function updateStatus(Request $request, $id)
    {
        $proposal = Proposal::findOrFail($id);
        $oldStatus = $proposal->status;
        $proposal->status = $request->status;
        $proposal->save();

        if ($oldStatus !== $proposal->status) {
            event(new ProposalStatusChanged($proposal, $oldStatus, $proposal->status));
        }

        if ($request->filled('catatan_revisi')) {
            ProposalComment::create([
                'user_id' => $request->user()->id,
                'proposal_id' => $proposal->id,
                'komentar' => $request->catatan_revisi,
            ]);
        }

        ActivityLog::create([
            'user_id' => $request->user()->id,
            'name' => $request->user()->name,
            'role' => $request->user()->role,
            'action' => 'Update Status Proposal',
            'description' => "Status proposal {$proposal->kode_tiket} diubah dari {$oldStatus} menjadi {$request->status}."
        ]);

        return response()->json(['status' => 'success', 'data' => $proposal]);
    }

    public function uploadEvidence(Request $request, $id)
    {
        $proposal = Proposal::findOrFail($id);
        
        $evidencePath = $proposal->evidence_dokumen;
        if ($request->hasFile('evidence_dokumen')) {
            $evidencePath = $request->file('evidence_dokumen')->store('evidence', 'public');
        }
        
        $proposal->evidence_dokumen = $evidencePath;
        $oldStatus = $proposal->status;
        $proposal->status = 'Menunggu Verif';
        $proposal->save();

        if ($oldStatus !== $proposal->status) {
            event(new ProposalStatusChanged($proposal, $oldStatus, $proposal->status));
        }

        ActivityLog::create([
            'user_id' => $request->user()->id,
            'name' => $request->user()->name,
            'role' => $request->user()->role,
            'action' => 'Upload Evidence',
            'description' => "Pengguna mengunggah evidence untuk proposal {$proposal->kode_tiket}."
        ]);

        return response()->json(['status' => 'success', 'data' => $proposal]);
    }

    public function uploadBuktiTransfer(Request $request, $id)
    {
        $request->validate([
            'bukti_transfer' => 'required|mimes:pdf|max:5120'
        ]);

        $proposal = Proposal::findOrFail($id);
        
        $path = $request->file('bukti_transfer')->store('bukti_transfer', 'public');
        
        $oldStatus = $proposal->status;
        $proposal->bukti_transfer = $path;
        $proposal->status = 'Dana Cair';
        $proposal->save();

        if ($oldStatus !== $proposal->status) {
            event(new ProposalStatusChanged($proposal, $oldStatus, $proposal->status));
        }

        ActivityLog::create([
            'user_id' => $request->user()->id,
            'name' => $request->user()->name,
            'role' => $request->user()->role,
            'action' => 'Upload Bukti Transfer',
            'description' => "Admin mengunggah bukti pengiriman dana PDF untuk {$proposal->kode_tiket}. Status dari {$oldStatus} ke Dana Cair."
        ]);

        return response()->json(['status' => 'success', 'data' => $proposal]);
    }

    public function getLogs()
    {
        $logs = ActivityLog::orderBy('created_at', 'desc')->take(50)->get();
        return response()->json([
            'status' => 'success',
            'data' => $logs
        ]);
    }

    public function addComment(Request $request, $id)
    {
        $request->validate([
            'komentar' => 'required|string'
        ]);

        $proposal = Proposal::findOrFail($id);
        
        $comment = ProposalComment::create([
            'proposal_id' => $proposal->id,
            'user_id' => $request->user()->id,
            'komentar' => $request->komentar
        ]);

        ActivityLog::create([
            'user_id' => $request->user()->id,
            'name' => $request->user()->name,
            'role' => $request->user()->role,
            'action' => 'Komentar Proposal',
            'description' => "Menambahkan komentar pada proposal {$proposal->kode_tiket}."
        ]);

        return response()->json(['status' => 'success', 'data' => $comment->load('user')]);
    }

    public function deleteComment(Request $request, $id)
    {
        $user = $request->user();
        if (!in_array($user->role, ['superadmin', 'admin'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $comment = ProposalComment::findOrFail($id);
        $proposalId = $comment->proposal_id;
        $comment->delete();

        ActivityLog::create([
            'user_id' => $user->id,
            'name' => $user->name,
            'role' => $user->role,
            'action' => 'Hapus Catatan Revisi',
            'description' => "Menghapus catatan revisi pada proposal ID {$proposalId}."
        ]);

        return response()->json(['status' => 'success']);
    }
}
