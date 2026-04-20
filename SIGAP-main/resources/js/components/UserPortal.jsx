import React, { useState } from 'react';
import axios from 'axios';
import './UserPortal.css';

const STATUS_STAGES = [
  { key: 'Dalam Antrean',    label: 'Input',       desc: 'Proposal disubmit dan masuk antrean sistem.' },
  { key: 'Dalam Review',     label: 'Review',      desc: 'Proposal sedang direview oleh pimpinan.' },
  { key: 'Menunggu Fisik',   label: 'Fisik',       desc: 'Menunggu penyerahan berkas fisik proposal.' },
  { key: 'Dana Cair',        label: 'Dana Cair',   desc: 'Dana telah berhasil dicairkan kepada pemohon.' },
  { key: 'Menunggu Evidence',label: 'Upload LPJ',  desc: 'Pemohon harus mengunggah bukti/evidence.' },
  { key: 'Selesai',          label: 'Selesai',     desc: 'Seluruh proses telah selesai dan laporan diterima.' },
];

const formatRupiah = (angka) => {
  if (!angka && angka !== 0) return '';
  return new Intl.NumberFormat('id-ID').format(angka);
};

const getStatusClass = (status) => {
  if (status === 'Menunggu Evidence' || status === 'Menunggu Verif') return 'sw';
  if (status === 'Selesai')   return 'sd';
  if (status === 'Gagal Bayar') return 'sf';
  if (status === 'Dalam Review') return 'sr';
  if (status === 'Menunggu Fisik') return 'sn';
  return 'sq';
};

const getCardStatusClass = (status) => {
  if (status === 'Selesai')          return 'status-done';
  if (status === 'Menunggu Evidence' || status === 'Menunggu Verif') return 'status-wait';
  if (status === 'Gagal Bayar')      return 'status-fail';
  return 'status-active';
};

// Vertical timeline khusus mobile
const VerticalTimeline = ({ currentStatus }) => {
  let currentIndex = STATUS_STAGES.findIndex(s => s.key === currentStatus);
  const isFailed = currentStatus === 'Gagal Bayar';
  if (isFailed) currentIndex = 3;
  if (currentIndex === -1 && !isFailed) currentIndex = 0;

  return (
    <div className="up-timeline-vertical">
      {STATUS_STAGES.map((stage, idx) => {
        const isDone    = idx < currentIndex || currentStatus === 'Selesai';
        const isNow     = idx === currentIndex && !isFailed;
        const isFailStep = isFailed && idx === 3;

        return (
          <div key={stage.key}
            className={`up-tlv-item ${isDone ? 'done' : ''} ${isNow ? 'now' : ''} ${isFailStep ? 'fail-step' : ''}`}
          >
            <div className="up-tlv-left">
              <div className={`up-tlv-dot ${isDone ? 'done' : ''} ${isNow ? 'now' : ''} ${isFailStep ? 'fail' : ''}`}>
                {isDone ? '✓' : isFailStep ? '✕' : (idx + 1)}
              </div>
              <div className={`up-tlv-line ${isDone ? 'done' : ''}`} />
            </div>
            <div className="up-tlv-content">
              <div className="up-tlv-label">{stage.label}</div>
              <div className="up-tlv-desc">{stage.desc}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default function UserPortal({ user, proposals, showToast, fetchProposals, portalTab, setPortalTab }) {
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [searchQuery, setSearchQuery]       = useState('');
  const [newProposal, setNewProposal]       = useState({
    kegiatan: '', jenis: 'Advance', tgl_pelaksanaan: '', dana_diajukan: '', catatan: '', file: null
  });

  // Filtered proposals
  const filteredProposals = proposals.filter(p => {
    const q = searchQuery.toLowerCase();
    return !q || (
      (p.kode_tiket || '').toLowerCase().includes(q) ||
      (p.kegiatan   || '').toLowerCase().includes(q) ||
      (p.jenis      || '').toLowerCase().includes(q)
    );
  });

  // Stats counts
  const totalCount   = proposals.length;
  const actionCount  = proposals.filter(p => p.status === 'Menunggu Evidence').length;
  const doneCount    = proposals.filter(p => p.status === 'Selesai').length;

  const handleCreateProposal = async () => {
    try {
      const formData = new FormData();
      formData.append('kegiatan',        newProposal.kegiatan);
      formData.append('email_organisasi', newProposal.email_organisasi);
      formData.append('no_wa',           newProposal.no_wa);
      formData.append('tgl_pelaksanaan', newProposal.tgl_pelaksanaan);
      formData.append('dana_diajukan',   newProposal.dana_diajukan.toString().replace(/\./g, ''));
      if (newProposal.file) formData.append('file_proposal', newProposal.file);

      await axios.post('/api/proposals', formData);
      showToast('Proposal berhasil diajukan!');
      setNewProposal({ kegiatan: '', email_organisasi: '', no_wa: '', tgl_pelaksanaan: '', dana_diajukan: '', file: null });
      fetchProposals();
      setPortalTab('home');
    } catch (e) {
      let msg = 'Gagal mengajukan proposal.';
      if (e.response?.data?.errors)  msg = Object.values(e.response.data.errors)[0][0];
      else if (e.response?.data?.message) msg = e.response.data.message;
      showToast(msg);
    }
  };

  const handleUploadEvidence = async (proposalId) => {
    const fileInput = document.getElementById(`evidence-up-${proposalId}`);
    if (!fileInput || fileInput.files.length === 0) {
      showToast('Pilih file terlebih dahulu!');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('evidence_dokumen', fileInput.files[0]);
      await axios.post(`/api/proposals/${proposalId}/upload-evidence`, formData);
      showToast('Evidence berhasil dikirim!');
      fetchProposals();
      setPortalTab('home');
    } catch (e) {
      showToast('Gagal mengupload evidence.');
    }
  };

  // ===== HOME TAB =====
  const renderHome = () => (
    <div className="user-portal-content">
      {/* Greeting Banner */}
      <div className="up-greeting" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="up-greeting-hi">Selamat datang,</div>
          <div className="up-greeting-name">{user?.name || 'Pemohon'}</div>
          <div className="up-greeting-sub">
            Pantau status pengajuan Anda secara real-time di sini.
            {actionCount > 0 && ` Ada ${actionCount} proposal yang butuh tindakan!`}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="up-stats">
        <div className="sc c-blue">
          <div className="sc-l">Total Diajukan</div>
          <div className="sc-v">{totalCount}</div>
          <div className="sc-sub">Semua Proposal</div>
        </div>
        <div className="sc c-amber">
          <div className="sc-l">Perlu Tindakan</div>
          <div className="sc-v">{actionCount}</div>
          <div className="sc-sub">Upload LPJ / Revisi</div>
        </div>
        <div className="sc c-green">
          <div className="sc-l">Selesai</div>
          <div className="sc-v">{doneCount}</div>
          <div className="sc-sub">Diarsipkan</div>
        </div>
      </div>

      {/* Search */}
      <div className="up-search-wrap">
        <span className="up-search-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg></span>
        <input
          className="up-search-input"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Cari kegiatan, ID, atau jenis..."
        />
      </div>

      {/* Proposal List */}
      <div className="up-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="up-section-title" style={{ fontSize: '16px' }}>Daftar Proposal Saya</div>
          <div className="up-section-count">
            {searchQuery ? `${filteredProposals.length} dari ${totalCount}` : `${totalCount} proposal`}
          </div>
        </div>
        <button 
          className="btn btn-p" 
          onClick={() => setPortalTab('new')}
          style={{ whiteSpace: 'nowrap', padding: '8px 16px', fontSize: '13px' }}
        >
          + Ajukan Baru
        </button>
      </div>

      {filteredProposals.length === 0 ? (
        <div className="up-empty">
          <div className="up-empty-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {searchQuery ? 
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg> : 
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>
            }
          </div>
          <div className="up-empty-title">
            {searchQuery ? 'Tidak ditemukan' : 'Belum ada proposal'}
          </div>
          <div className="up-empty-desc">
            {searchQuery
              ? `Tidak ada proposal yang cocok dengan "${searchQuery}"`
              : 'Klik tombol + di bawah untuk mengajukan proposal pertama Anda.'}
          </div>
          {!searchQuery && (
            <button
              className="up-btn-submit"
              style={{ margin: '0 auto' }}
              onClick={() => setPortalTab('new')}
            >
              + Ajukan Proposal Baru
            </button>
          )}
        </div>
      ) : (
        <div className="up-card-list">
          {filteredProposals.map(p => (
            <div
              key={p.id}
              className={`up-proposal-card ${getCardStatusClass(p.status)}`}
              onClick={() => { setSelectedProposal(p); setPortalTab('detail'); }}
            >
              <div className="up-card-top">
                <span className="up-card-id">{p.kode_tiket}</span>
                <span className={`status ${getStatusClass(p.status)}`}>{p.status}</span>
              </div>
              <div className="up-card-kegiatan">{p.kegiatan}</div>
              <div className="up-card-meta">
                <div className="up-card-meta-item">
                  <span className="up-card-meta-icon" style={{ display: 'inline-flex', alignItems: 'center' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg></span>
                  {p.tgl_pelaksanaan || '-'}
                </div>
                <div className="up-card-meta-item">
                  <span className="up-card-meta-icon" style={{ display: 'inline-flex', alignItems: 'center' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg></span>
                  {p.jenis}
                </div>
                {p.status === 'Menunggu Evidence' && (
                  <span className="up-action-needed" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg> Upload LPJ</span>
                )}
              </div>
              <div className="up-card-dana">
                <div>
                  <div className="up-card-dana-label">Dana Diajukan</div>
                  <div>Rp {formatRupiah(p.dana_diajukan)}</div>
                </div>
                <span className="up-card-arrow">›</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ===== NEW PROPOSAL TAB =====
  const renderNewForm = () => (
    <div className="up-form-wrapper">
      <div className="up-form-card">
        <div className="up-form-header">
          <div className="up-form-header-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg> Ajukan Proposal Baru</div>
          <div className="up-form-header-sub">Isi formulir dengan lengkap dan benar.</div>
        </div>

        <div className="up-form-body">
          {/* Nama Kegiatan */}
          <div className="up-form-group">
            <label className="up-form-label">Nama / Judul Kegiatan <span>*</span></label>
            <input
              className="up-form-input"
              value={newProposal.kegiatan}
              onChange={e => setNewProposal({ ...newProposal, kegiatan: e.target.value })}
              required
            />
          </div>

          {/* Email Organisasi & No WA */}
          <div className="up-form-row">
            <div className="up-form-group">
              <label className="up-form-label">Email Organisasi <span>*</span></label>
              <input
                className="up-form-input"
                type="email"
                value={newProposal.email_organisasi}
                onChange={e => setNewProposal({ ...newProposal, email_organisasi: e.target.value })}
                required
              />
            </div>
            <div className="up-form-group">
              <label className="up-form-label">Nomor WA Pengirim <span>*</span></label>
              <input
                className="up-form-input"
                type="text"
                value={newProposal.no_wa}
                onChange={e => setNewProposal({ ...newProposal, no_wa: e.target.value })}
                placeholder="Contoh: 081234567890"
                required
              />
            </div>
          </div>
          {/* Tanggal & File */}
          <div className="up-form-row">
            <div className="up-form-group">
              <label className="up-form-label">Tanggal Rencana Pelaksanaan <span>*</span></label>
              <input
                className="up-form-input"
                type="date"
                value={newProposal.tgl_pelaksanaan}
                onChange={e => setNewProposal({ ...newProposal, tgl_pelaksanaan: e.target.value })}
                required
              />
            </div>
            <div className="up-form-group">
              <label className="up-form-label">Upload File Proposal (PDF) <span>*</span></label>
              <input
                className="up-form-input"
                type="file"
                accept="application/pdf"
                onChange={e => setNewProposal({ ...newProposal, file: e.target.files[0] })}
                style={{ padding: '7px 12px' }}
                required
              />
            </div>
          </div>

          {/* Dana */}
          <div className="up-form-row">
            <div className="up-form-group">
              <label className="up-form-label">Total Dana Diajukan (Rp) <span>*</span></label>
              <input
                className="up-form-input"
                type="text"
                value={newProposal.dana_diajukan ? formatRupiah(newProposal.dana_diajukan.toString().replace(/\./g, '')) : ''}
                onChange={e => setNewProposal({ ...newProposal, dana_diajukan: e.target.value.replace(/[^0-9]/g, '') })}
                placeholder="Contoh: 5.000.000"
                required
              />
            </div>
            <div className="up-form-group">
            </div>
          </div>

        </div>

        <div className="up-form-footer">
          <button className="up-btn-back" onClick={() => setPortalTab('home')}>
            Batal
          </button>
          <button
            className="up-btn-submit"
            disabled={!newProposal.kegiatan || !newProposal.email_organisasi || !newProposal.no_wa || !newProposal.tgl_pelaksanaan || !newProposal.dana_diajukan || !newProposal.file}
            onClick={handleCreateProposal}
          >
            Kirim Pengajuan
          </button>
        </div>
      </div>
    </div>
  );

  // ===== DETAIL / TRACK PROGRESS TAB =====
  const renderDetail = () => {
    if (!selectedProposal) return null;
    const p = selectedProposal;

    return (
      <div className="up-detail-wrapper">
        <button
          className="up-btn-back"
          style={{ marginBottom: '16px' }}
          onClick={() => { setPortalTab('home'); setSelectedProposal(null); }}
        >
          ← Kembali
        </button>

        <div className="up-detail-card">
          {/* Header */}
          <div className="up-detail-header">
            <div className="up-detail-id">{p.kode_tiket}</div>
            <div className="up-detail-title">{p.kegiatan}</div>
            <div className="up-detail-sub">{p.user?.name} — {p.jenis}</div>
            <div className="up-detail-status-row">
              <span className={`status ${getStatusClass(p.status)}`}>{p.status}</span>
              {p.tgl_pelaksanaan && (
                <span className="up-detail-date" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg> {p.tgl_pelaksanaan}</span>
              )}
            </div>
          </div>

          {/* Info Grid */}
          <div className="up-info-grid">
            <div className="up-info-item">
              <div className="up-info-key">Dana Diajukan</div>
              <div className="up-info-val" style={{ color: 'var(--up-green)', fontWeight: 800 }}>
                Rp {formatRupiah(p.dana_diajukan)}
              </div>
            </div>
            <div className="up-info-item">
              <div className="up-info-key">Jenis</div>
              <div className="up-info-val">{p.jenis}</div>
            </div>
            {p.user?.instansi && (
              <div className="up-info-item">
                <div className="up-info-key">Instansi</div>
                <div className="up-info-val">{p.user.instansi}</div>
              </div>
            )}
            {p.user?.nomor_telepon && (
              <div className="up-info-item">
                <div className="up-info-key">No. Telepon</div>
                <div className="up-info-val">{p.user.nomor_telepon}</div>
              </div>
            )}
          </div>

          {/* Catatan Admin */}
          {p.comments && p.comments.length > 0 && (
            <div className="up-admin-notes">
              <div className="up-admin-notes-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg> Catatan dari Admin</div>
              {p.comments.map(c => (
                <div key={c.id} className="up-note-item">
                  <div className="up-note-date">
                    {new Date(c.created_at).toLocaleString('id-ID')}
                  </div>
                  {c.komentar}
                </div>
              ))}
            </div>
          )}

          {/* Timeline Progress */}
          <div className="up-timeline-section">
            <div className="up-timeline-title">Progres Pengajuan</div>
            <VerticalTimeline currentStatus={p.status} />

            {/* Bukti transfer */}
            {p.bukti_transfer && (
              <div className="up-transfer-card">
                <div className="up-transfer-card-left">
                  <div className="up-transfer-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg> Bukti Pengiriman Dana</div>
                  <div className="up-transfer-sub">Admin telah melampirkan slip pencairan dana.</div>
                </div>
                <a
                  href={`/storage/${p.bukti_transfer}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="up-transfer-link"
                >
                  Lihat →
                </a>
              </div>
            )}
          </div>

          {/* Dokumen Terlampir */}
          {(p.file_proposal || p.evidence_dokumen || p.bukti_transfer) && (
            <div className="up-docs-section">
              <div className="up-docs-title">Dokumen Terlampir</div>
              {p.file_proposal && (
                <div className="up-doc-item" style={{ background: '#f0fdf4', borderColor: '#d1fae5' }}>
                  <div className="up-doc-item-label" style={{ color: '#346739', display: 'flex', alignItems: 'center', gap: '6px' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg> File Proposal</div>
                  <a href={`/storage/${p.file_proposal}`} target="_blank" rel="noopener noreferrer" className="up-doc-item-link">
                    Lihat →
                  </a>
                </div>
              )}
              {p.evidence_dokumen && (
                <div className="up-doc-item" style={{ background: '#fffbeb', borderColor: '#fef3c7' }}>
                  <div className="up-doc-item-label" style={{ color: '#92400e', display: 'flex', alignItems: 'center', gap: '6px' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg> File LPJ / Evidence</div>
                  <a href={`/storage/${p.evidence_dokumen}`} target="_blank" rel="noopener noreferrer" className="up-doc-item-link">
                    Lihat →
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Action Section */}
          <div className="up-action-section">
            {p.status === 'Menunggu Evidence' && (
              <div>
                <div className="up-notice warn">
                  <span className="up-notice-icon" style={{ display: 'flex', alignItems: 'center' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg></span>
                  <span>Status Anda memerlukan tindakan. Unggah dokumen LPJ sebelum batas waktu yang tertera.</span>
                </div>
                <div className="up-upload-zone" onClick={() => document.getElementById(`evidence-up-${p.id}`)?.click()}>
                  <div className="up-upload-zone-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg></div>
                  <div className="up-upload-zone-text">Ketuk untuk pilih file</div>
                  <div className="up-upload-zone-sub">PDF, JPG, PNG — Maks. 10MB</div>
                </div>
                <input
                  type="file"
                  id={`evidence-up-${p.id}`}
                  className="up-upload-input"
                  accept=".pdf,.jpg,.jpeg,.png"
                  style={{ display: 'none' }}
                />
                <button
                  className="up-submit-evidence-btn"
                  onClick={() => handleUploadEvidence(p.id)}
                >
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg> Upload Dokumen LPJ / Evidence</span>
                </button>
                <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '12px', color: 'var(--t3)' }}>
                  Laporan Absen • Foto Kegiatan • LPJ PDF
                </div>
              </div>
            )}

            {p.status === 'Selesai' && (
              <div className="up-notice success">
                <span className="up-notice-icon" style={{ display: 'flex', alignItems: 'center' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg></span>
                <span>Proses Selesai! Dana telah sukses dicairkan dan seluruh dokumen LPJ telah diverifikasi.</span>
              </div>
            )}

            {p.status === 'Gagal Bayar' && (
              <div className="up-notice error">
                <span className="up-notice-icon" style={{ display: 'flex', alignItems: 'center' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg></span>
                <span>Mohon maaf, proposal ini mengalami Gagal Bayar. Silakan hubungi admin untuk informasi lebih lanjut.</span>
              </div>
            )}

            {p.status !== 'Menunggu Evidence' && p.status !== 'Selesai' && p.status !== 'Gagal Bayar' && (
              <div style={{ textAlign: 'center', color: 'var(--t2)', fontSize: '13.5px', padding: '8px 0', lineHeight: '1.6' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg> Sedang dalam tahap administrasi internal.</span><br />
                <span style={{ color: 'var(--t3)', fontSize: '12px' }}>Pantau progres Anda secara berkala di halaman ini.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Tab Content */}
      <div className="page-view active content">
        {portalTab === 'home'   && renderHome()}
        {portalTab === 'new'    && renderNewForm()}
        {portalTab === 'detail' && renderDetail()}
      </div>

      {/* Bottom Navigation Bar (mobile) */}
      <nav className="user-bottom-nav" role="navigation" aria-label="User navigation">
        <div
          className={`ubn-item ${portalTab === 'home' ? 'active' : ''}`}
          onClick={() => { setPortalTab('home'); setSelectedProposal(null); }}
          id="ubn-home"
        >
          <span className="ubn-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg></span>
          <span className="ubn-label">Beranda</span>
        </div>

        <div
          className={`ubn-item ${portalTab === 'new' ? 'active' : ''}`}
          onClick={() => setPortalTab('new')}
          id="ubn-new"
        >
          <div className="ubn-icon" style={{ fontSize: '22px', lineHeight: 1 }}>＋</div>
          <span className="ubn-label">Ajukan</span>
        </div>

        <div
          className={`ubn-item ${portalTab === 'detail' ? 'active' : ''}`}
          onClick={() => {
            if (selectedProposal) setPortalTab('detail');
            else if (proposals.length > 0) {
              setSelectedProposal(proposals[0]);
              setPortalTab('detail');
            }
          }}
          id="ubn-track"
        >
          <span className="ubn-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg></span>
          <span className="ubn-label">Track</span>
          {actionCount > 0 && <span className="ubn-badge">{actionCount}</span>}
        </div>
      </nav>
    </>
  );
}
