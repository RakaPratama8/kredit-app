"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { STATUS_LABELS, STATUS_COLORS, DOCUMENT_TYPE_LABELS, REQUIRED_DOCUMENTS } from "@/lib/constants";

interface Application {
  id: string;
  applicationNumber: string;
  status: string;
  dealerName: string;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleType: string;
  vehicleYear: number;
  vehicleColor: string;
  vehiclePrice: number;
  downPayment: number;
  loanAmount: number;
  tenorMonths: number;
  monthlyInstallment: number;
  insurance: number;
  totalLoanCost: number;
  submittedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  customer: { id: string; nik: string; name: string; phone: string; email?: string; address: string; placeOfBirth: string; dateOfBirth: string; maritalStatus: string };
  createdBy: { id: string; name: string; role: string };
  assignedMarketing?: { id: string; name: string; role: string };
  documents: Array<{ id: string; documentType: string; fileName: string; filePath: string; mimeType: string; fileSize: number; status: string; uploadedAt: string; uploadedBy: { name: string }; notes?: string }>;
  approvalHistories: Array<{ id: string; action: string; note?: string; createdAt: string; approver: { name: string } }>;
  statusHistories: Array<{ id: string; oldStatus?: string; newStatus: string; note?: string; createdAt: string; changedBy: { name: string } }>;
  contract?: { id: string; documentNumber: string; status: string; generatedAt: string; approvedAt?: string };
}

const WORKFLOW_STEPS = [
  { status: "DRAFT", label: "Draft Dibuat", icon: "📝" },
  { status: "DOCUMENT_INCOMPLETE", label: "Dokumen Belum Lengkap", icon: "📄" },
  { status: "READY_FOR_SUBMISSION", label: "Siap Submit", icon: "✅" },
  { status: "WAITING_APPROVAL", label: "Menunggu Approval", icon: "⏳" },
  { status: "APPROVED", label: "Disetujui", icon: "🎉" },
  { status: "REJECTED", label: "Ditolak", icon: "❌" },
  { status: "CONTRACT_GENERATED", label: "Kontrak Dibuat", icon: "📃" },
  { status: "WAITING_DOCUMENT_APPROVAL", label: "Menunggu Tanda Tangan", icon: "🖊️" },
  { status: "DOCUMENT_SIGNED", label: "Dokumen Ditandatangani", icon: "✍️" },
  { status: "SIGNED_DOCUMENT_UPLOADED", label: "Dokumen Signed Diupload", icon: "📤" },
  { status: "COMPLETED", label: "Selesai", icon: "🏁" },
];

const STATUS_ORDER = WORKFLOW_STEPS.map(s => s.status).filter(s => s !== "REJECTED");

function fmt(n: number) { return "Rp " + n.toLocaleString("id-ID"); }
function fmtDate(d: string) { return new Date(d).toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }); }
function fmtSize(bytes: number) { return bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`; }

export default function ApplicationDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [app, setApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ userId: string; role: string; name: string } | null>(null);
  const [activeTab, setActiveTab] = useState("detail");
  const [toast, setToast] = useState<{ type: string; msg: string } | null>(null);
  const [uploadModal, setUploadModal] = useState(false);
  const [uploadType, setUploadType] = useState("KTP");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [approvalModal, setApprovalModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [approvalNote, setApprovalNote] = useState("");
  const [contractLoading, setContractLoading] = useState(false);
  const [signedModal, setSignedModal] = useState(false);
  const [signedFile, setSignedFile] = useState<File | null>(null);

  function showToast(type: string, msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  }

  const loadApp = useCallback(async () => {
    const [appRes, userRes] = await Promise.all([
      fetch(`/api/applications/${id}`),
      fetch("/api/auth/me"),
    ]);
    const appData = await appRes.json();
    const userData = await userRes.json();
    if (appData.success) setApp(appData.data);
    if (userData.success) setUser(userData.data);
    setLoading(false);
  }, [id]);

  useEffect(() => { loadApp(); }, [loadApp]);

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/applications/${id}/submit`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) { showToast("error", data.error || "Gagal submit"); return; }
      showToast("success", "Pengajuan berhasil disubmit!");
      loadApp();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpload() {
    if (!uploadFile) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", uploadFile);
      fd.append("documentType", uploadType);
      const res = await fetch(`/api/applications/${id}/documents`, { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { showToast("error", data.error || "Gagal upload"); return; }
      showToast("success", "Dokumen berhasil diupload!");
      setUploadModal(false);
      setUploadFile(null);
      loadApp();
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteDoc(docId: string) {
    if (!confirm("Hapus dokumen ini?")) return;
    const res = await fetch(`/api/applications/${id}/documents/${docId}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) { showToast("error", data.error || "Gagal hapus"); return; }
    showToast("success", "Dokumen dihapus");
    loadApp();
  }

  async function handleApproval() {
    const res = await fetch(`/api/approvals/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: approvalAction, note: approvalNote }),
    });
    const data = await res.json();
    if (!res.ok) { showToast("error", data.error || "Gagal"); return; }
    showToast("success", `Pengajuan berhasil ${approvalAction === "APPROVED" ? "disetujui" : "ditolak"}!`);
    setApprovalModal(false);
    setApprovalNote("");
    loadApp();
  }

  async function handleGenerateContract() {
    setContractLoading(true);
    const res = await fetch("/api/contracts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applicationId: id }),
    });
    const data = await res.json();
    if (!res.ok) { showToast("error", data.error || "Gagal generate kontrak"); setContractLoading(false); return; }
    showToast("success", `Kontrak ${data.data.documentNumber} berhasil dibuat!`);
    loadApp();
    setContractLoading(false);
  }

  async function handleContractAction(contractId: string, action: "approve" | "sign") {
    const res = await fetch(`/api/contracts/${contractId}/${action}`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) { showToast("error", data.error || "Gagal"); return; }
    showToast("success", action === "approve" ? "Kontrak disetujui!" : "Kontrak ditandatangani!");
    loadApp();
  }

  async function handleUploadSigned() {
    if (!signedFile) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", signedFile);
      const res = await fetch(`/api/applications/${id}/signed-document`, { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { showToast("error", data.error || "Gagal"); return; }
      showToast("success", "Dokumen signed berhasil diupload!");
      setSignedModal(false);
      setSignedFile(null);
      loadApp();
    } finally {
      setUploading(false);
    }
  }

  async function handleComplete() {
    const res = await fetch(`/api/applications/${id}/complete`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) { showToast("error", data.error || "Gagal"); return; }
    showToast("success", "Pengajuan selesai!");
    loadApp();
  }

  if (loading) return <div className="loading-overlay"><div className="spinner spinner-lg"></div><p>Memuat data pengajuan...</p></div>;
  if (!app) return <div className="page-content"><div className="alert alert-error"><span>Pengajuan tidak ditemukan</span></div></div>;

  const uploadedTypes = app.documents.map(d => d.documentType);
  const missingDocs = REQUIRED_DOCUMENTS.filter(r => !uploadedTypes.includes(r));
  const canEdit = ["DRAFT", "DOCUMENT_INCOMPLETE", "READY_FOR_SUBMISSION"].includes(app.status);
  const canSubmit = app.status === "READY_FOR_SUBMISSION" && user?.role === "MARKETING";
  const canApprove = app.status === "WAITING_APPROVAL" && user?.role === "ATASAN_MARKETING";
  const canGenerateContract = app.status === "APPROVED" && user?.role === "MARKETING" && !app.contract;
  const canApproveContract = app.contract && app.contract.status === "GENERATED" && (user?.role === "ATASAN_MARKETING" || user?.role === "ADMIN_BACKOFFICE" || user?.role === "MARKETING");
  const canSignContract = app.contract && app.contract.status === "APPROVED";
  const canUploadSigned = app.status === "DOCUMENT_SIGNED" && user?.role === "MARKETING";
  const canComplete = app.status === "SIGNED_DOCUMENT_UPLOADED" && (user?.role === "ADMIN_BACKOFFICE" || user?.role === "MARKETING");

  const currentStatusIdx = STATUS_ORDER.indexOf(app.status);

  return (
    <>
      {toast && (
        <div className="toast-container">
          <div className={`toast ${toast.type}`}>
            <span className="toast-icon">{toast.type === "success" ? "✅" : "❌"}</span>
            <span className="toast-message">{toast.msg}</span>
          </div>
        </div>
      )}

      <div className="page-header">
        <div className="page-header-left">
          <h2 style={{ fontFamily: "monospace" }}>{app.applicationNumber}</h2>
          <p>{app.customer.name} • {new Date(app.createdAt).toLocaleDateString("id-ID")}</p>
        </div>
        <div className="page-header-actions">
          <span className={`badge ${STATUS_COLORS[app.status]}`} style={{ fontSize: 13, padding: "6px 14px" }}>{STATUS_LABELS[app.status] || app.status}</span>
          {canEdit && <Link href={`/applications/${id}/edit`} className="btn btn-outline btn-sm">✏️ Edit</Link>}
          {canSubmit && (
            <button id="btn-submit" className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Memproses..." : "📤 Submit Pengajuan"}
            </button>
          )}
          {canApprove && (
            <>
              <button id="btn-approve" className="btn btn-success" onClick={() => { setApprovalAction("APPROVED"); setApprovalModal(true); }}>✅ Approve</button>
              <button id="btn-reject" className="btn btn-danger" onClick={() => { setApprovalAction("REJECTED"); setApprovalModal(true); }}>❌ Reject</button>
            </>
          )}
          {canGenerateContract && (
            <button id="btn-generate-contract" className="btn btn-primary" onClick={handleGenerateContract} disabled={contractLoading}>
              {contractLoading ? "Generating..." : "📃 Generate Kontrak"}
            </button>
          )}
          {canComplete && (
            <button id="btn-complete" className="btn btn-success" onClick={() => confirm("Tandai pengajuan sebagai SELESAI?") && handleComplete()}>🏁 Selesaikan</button>
          )}
        </div>
      </div>

      {app.status === "REJECTED" && app.rejectionReason && (
        <div style={{ padding: "0 32px" }}>
          <div className="alert alert-error"><span className="alert-icon">❌</span><div><strong>Ditolak:</strong> {app.rejectionReason}</div></div>
        </div>
      )}

      {missingDocs.length > 0 && canEdit && (
        <div style={{ padding: "0 32px" }}>
          <div className="alert alert-warning">
            <span className="alert-icon">⚠️</span>
            <div><strong>Dokumen wajib belum lengkap:</strong> {missingDocs.map(d => DOCUMENT_TYPE_LABELS[d] || d).join(", ")}</div>
          </div>
        </div>
      )}

      <div className="page-content">
        <div className="tabs">
          {["detail", "dokumen", "kontrak", "history"].map(t => (
            <div key={t} className={`tab ${activeTab === t ? "active" : ""}`} onClick={() => setActiveTab(t)}>
              {t === "detail" ? "📋 Detail" : t === "dokumen" ? `📄 Dokumen (${app.documents.length})` : t === "kontrak" ? "📃 Kontrak/PO" : "📜 History"}
            </div>
          ))}
        </div>

        {activeTab === "detail" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div>
              <div className="card" style={{ marginBottom: 20 }}>
                <div className="card-header"><span className="card-title">👤 Data Konsumen</span></div>
                <div className="card-body">
                  <div className="detail-grid">
                    <div className="detail-item"><span className="detail-label">NIK</span><span className="detail-value"><code>{app.customer.nik}</code></span></div>
                    <div className="detail-item"><span className="detail-label">Nama</span><span className="detail-value">{app.customer.name}</span></div>
                    <div className="detail-item"><span className="detail-label">Telepon</span><span className="detail-value">{app.customer.phone}</span></div>
                    <div className="detail-item"><span className="detail-label">Email</span><span className="detail-value">{app.customer.email || "-"}</span></div>
                    <div className="detail-item" style={{ gridColumn: "1/-1" }}><span className="detail-label">Alamat</span><span className="detail-value">{app.customer.address}</span></div>
                  </div>
                  <Link href={`/customers/${app.customer.id}`} className="btn btn-ghost btn-sm" style={{ marginTop: 12 }}>Lihat Profil Konsumen →</Link>
                </div>
              </div>

              <div className="card">
                <div className="card-header"><span className="card-title">🏍️ Data Kendaraan</span></div>
                <div className="card-body">
                  <div className="detail-grid">
                    <div className="detail-item"><span className="detail-label">Dealer</span><span className="detail-value">{app.dealerName}</span></div>
                    <div className="detail-item"><span className="detail-label">Merek</span><span className="detail-value">{app.vehicleBrand}</span></div>
                    <div className="detail-item"><span className="detail-label">Model</span><span className="detail-value">{app.vehicleModel}</span></div>
                    <div className="detail-item"><span className="detail-label">Tipe</span><span className="detail-value">{app.vehicleType}</span></div>
                    <div className="detail-item"><span className="detail-label">Tahun</span><span className="detail-value">{app.vehicleYear}</span></div>
                    <div className="detail-item"><span className="detail-label">Warna</span><span className="detail-value">{app.vehicleColor}</span></div>
                    <div className="detail-item" style={{ gridColumn: "1/-1" }}><span className="detail-label">Harga</span><span className="detail-value money">{fmt(app.vehiclePrice)}</span></div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="card" style={{ marginBottom: 20 }}>
                <div className="card-header"><span className="card-title">💰 Data Pembiayaan</span></div>
                <div className="card-body">
                  <div className="detail-grid">
                    <div className="detail-item"><span className="detail-label">Harga Kendaraan</span><span className="detail-value money">{fmt(app.vehiclePrice)}</span></div>
                    <div className="detail-item"><span className="detail-label">Uang Muka</span><span className="detail-value money">{fmt(app.downPayment)}</span></div>
                    <div className="detail-item"><span className="detail-label">Jumlah Pembiayaan</span><span className="detail-value money" style={{ color: "var(--primary)", fontSize: 16, fontWeight: 700 }}>{fmt(app.loanAmount)}</span></div>
                    <div className="detail-item"><span className="detail-label">Tenor</span><span className="detail-value">{app.tenorMonths} bulan</span></div>
                    <div className="detail-item"><span className="detail-label">Angsuran/Bulan</span><span className="detail-value money" style={{ color: "var(--success)", fontWeight: 700 }}>{fmt(app.monthlyInstallment)}</span></div>
                    <div className="detail-item"><span className="detail-label">Asuransi</span><span className="detail-value money">{fmt(app.insurance)}</span></div>
                    <div className="detail-item" style={{ gridColumn: "1/-1" }}><span className="detail-label">Total Biaya</span><span className="detail-value money">{fmt(app.totalLoanCost)}</span></div>
                  </div>
                </div>
              </div>

              <div className="card" style={{ marginBottom: 20 }}>
                <div className="card-header"><span className="card-title">👥 Informasi Pengajuan</span></div>
                <div className="card-body">
                  <div className="detail-grid">
                    <div className="detail-item"><span className="detail-label">Dibuat Oleh</span><span className="detail-value">{app.createdBy.name}</span></div>
                    <div className="detail-item"><span className="detail-label">Marketing</span><span className="detail-value">{app.assignedMarketing?.name || "-"}</span></div>
                    <div className="detail-item"><span className="detail-label">Tgl Dibuat</span><span className="detail-value">{fmtDate(app.createdAt)}</span></div>
                    {app.submittedAt && <div className="detail-item"><span className="detail-label">Tgl Submit</span><span className="detail-value">{fmtDate(app.submittedAt)}</span></div>}
                    {app.approvedAt && <div className="detail-item"><span className="detail-label">Tgl Approve</span><span className="detail-value">{fmtDate(app.approvedAt)}</span></div>}
                  </div>
                </div>
              </div>

              {/* Workflow Timeline */}
              <div className="card">
                <div className="card-header"><span className="card-title">📊 Progress Workflow</span></div>
                <div className="card-body">
                  <div className="timeline">
                    {WORKFLOW_STEPS.filter(s => s.status !== "REJECTED" || app.status === "REJECTED").map((step, idx) => {
                      const stepIdx = STATUS_ORDER.indexOf(step.status);
                      let dotClass = "pending";
                      if (app.status === "REJECTED" && step.status === "REJECTED") dotClass = "error";
                      else if (stepIdx < currentStatusIdx) dotClass = "completed";
                      else if (stepIdx === currentStatusIdx) dotClass = "current";
                      
                      const histEntry = app.statusHistories.find(h => h.newStatus === step.status);
                      return (
                        <div key={step.status} className="timeline-item">
                          <div className={`timeline-dot ${dotClass}`}>{dotClass === "completed" ? "✓" : step.icon}</div>
                          <div className="timeline-content">
                            <div className="timeline-title">{step.label}</div>
                            {histEntry && (
                              <>
                                <div className="timeline-meta">{fmtDate(histEntry.createdAt)} • {histEntry.changedBy.name}</div>
                                {histEntry.note && <div className="timeline-note">{histEntry.note}</div>}
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "dokumen" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                {missingDocs.length === 0 ? (
                  <span className="badge status-approved">✓ Semua dokumen wajib terpenuhi</span>
                ) : (
                  <span className="badge status-incomplete">⚠️ {missingDocs.length} dokumen wajib belum ada</span>
                )}
              </div>
              {canEdit && (
                <button id="btn-upload-doc" className="btn btn-primary" onClick={() => setUploadModal(true)}>📤 Upload Dokumen</button>
              )}
              {canUploadSigned && (
                <button id="btn-upload-signed" className="btn btn-success" onClick={() => setSignedModal(true)}>📤 Upload Dokumen Signed</button>
              )}
            </div>

            {!app.documents.length ? (
              <div className="empty-state"><div className="empty-icon">📄</div><h3>Belum ada dokumen</h3><p>Upload dokumen persyaratan untuk melanjutkan pengajuan</p></div>
            ) : (
              <div className="doc-grid">
                {app.documents.map((doc) => (
                  <div key={doc.id} className="doc-card">
                    <div className="doc-card-type">
                      <span className="doc-icon">{doc.mimeType.includes("pdf") ? "📕" : "🖼️"}</span>
                      <span className="doc-type-name">{DOCUMENT_TYPE_LABELS[doc.documentType] || doc.documentType}</span>
                    </div>
                    <div className="doc-filename">{doc.fileName}</div>
                    <div className="doc-meta">{fmtSize(doc.fileSize)} • {fmtDate(doc.uploadedAt)}</div>
                    <div className="doc-meta">Diupload: {doc.uploadedBy.name}</div>
                    {doc.notes && <div className="doc-meta" style={{ fontStyle: "italic", marginTop: 4 }}>{doc.notes}</div>}
                    <div className="doc-actions">
                      <a href={`/api/uploads/${doc.filePath}`} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">👁️ Lihat</a>
                      <a href={`/api/uploads/${doc.filePath}`} download={doc.fileName} className="btn btn-ghost btn-sm">⬇️</a>
                      {canEdit && (
                        <button className="btn btn-danger btn-sm" onClick={() => handleDeleteDoc(doc.id)}>🗑️</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "kontrak" && (
          <div>
            {!app.contract ? (
              <div className="empty-state">
                <div className="empty-icon">📃</div>
                <h3>Belum ada kontrak</h3>
                <p>Kontrak dapat dibuat setelah pengajuan disetujui (APPROVED)</p>
                {canGenerateContract && (
                  <button className="btn btn-primary" onClick={handleGenerateContract} disabled={contractLoading}>
                    {contractLoading ? "Generating..." : "📃 Generate Kontrak"}
                  </button>
                )}
              </div>
            ) : (
              <div className="card">
                <div className="card-header">
                  <span className="card-title">📃 Kontrak/PO</span>
                  <span className={`badge ${app.contract.status === "SIGNED" ? "status-signed" : app.contract.status === "APPROVED" ? "status-approved" : "status-contract"}`}>
                    {app.contract.status}
                  </span>
                </div>
                <div className="card-body">
                  <div className="detail-grid">
                    <div className="detail-item"><span className="detail-label">No. Dokumen</span><span className="detail-value" style={{ fontFamily: "monospace", fontWeight: 700 }}>{app.contract.documentNumber}</span></div>
                    <div className="detail-item"><span className="detail-label">Status</span><span className="detail-value">{app.contract.status}</span></div>
                    <div className="detail-item"><span className="detail-label">Dibuat</span><span className="detail-value">{fmtDate(app.contract.generatedAt)}</span></div>
                    {app.contract.approvedAt && <div className="detail-item"><span className="detail-label">Disetujui</span><span className="detail-value">{fmtDate(app.contract.approvedAt)}</span></div>}
                  </div>

                  <div style={{ marginTop: 20, padding: 20, background: "var(--gray-50)", borderRadius: "var(--border-radius)", border: "1px solid var(--gray-200)" }}>
                    <h4 style={{ marginBottom: 16, fontSize: 15, fontWeight: 700 }}>📋 Ringkasan Kontrak</h4>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 14 }}>
                      <div><span style={{ color: "var(--gray-500)" }}>Konsumen:</span> <strong>{app.customer.name}</strong></div>
                      <div><span style={{ color: "var(--gray-500)" }}>NIK:</span> {app.customer.nik}</div>
                      <div><span style={{ color: "var(--gray-500)" }}>Kendaraan:</span> <strong>{app.vehicleBrand} {app.vehicleModel}</strong></div>
                      <div><span style={{ color: "var(--gray-500)" }}>Tahun:</span> {app.vehicleYear}</div>
                      <div><span style={{ color: "var(--gray-500)" }}>Harga:</span> <strong>{fmt(app.vehiclePrice)}</strong></div>
                      <div><span style={{ color: "var(--gray-500)" }}>DP:</span> {fmt(app.downPayment)}</div>
                      <div><span style={{ color: "var(--gray-500)" }}>Pembiayaan:</span> <strong style={{ color: "var(--primary)" }}>{fmt(app.loanAmount)}</strong></div>
                      <div><span style={{ color: "var(--gray-500)" }}>Tenor:</span> {app.tenorMonths} bulan</div>
                      <div><span style={{ color: "var(--gray-500)" }}>Angsuran:</span> <strong style={{ color: "var(--success)" }}>{fmt(app.monthlyInstallment)}/bulan</strong></div>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
                    {canApproveContract && app.contract.status === "GENERATED" && (
                      <button id="btn-approve-contract" className="btn btn-success" onClick={() => handleContractAction(app.contract!.id, "approve")}>✅ Setujui Kontrak</button>
                    )}
                    {canSignContract && (
                      <button id="btn-sign-contract" className="btn btn-primary" onClick={() => handleContractAction(app.contract!.id, "sign")}>✍️ Tandatangani Kontrak</button>
                    )}
                    {canUploadSigned && (
                      <button id="btn-upload-signed-contract" className="btn btn-warning" onClick={() => setSignedModal(true)}>📤 Upload Dokumen Signed</button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "history" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div className="card">
              <div className="card-header"><span className="card-title">📊 Riwayat Status</span></div>
              <div className="card-body">
                {!app.statusHistories.length ? (
                  <p className="text-muted text-sm">Belum ada riwayat</p>
                ) : (
                  <div className="timeline">
                    {[...app.statusHistories].reverse().map((h) => (
                      <div key={h.id} className="timeline-item">
                        <div className="timeline-dot completed" style={{ width: 32, height: 32, fontSize: 12 }}>✓</div>
                        <div className="timeline-content">
                          <div className="timeline-title">
                            {h.oldStatus && <><span className={`badge ${STATUS_COLORS[h.oldStatus] || ""}`} style={{ fontSize: 10 }}>{STATUS_LABELS[h.oldStatus]}</span> → </>}
                            <span className={`badge ${STATUS_COLORS[h.newStatus] || ""}`} style={{ fontSize: 10 }}>{STATUS_LABELS[h.newStatus] || h.newStatus}</span>
                          </div>
                          <div className="timeline-meta">{fmtDate(h.createdAt)} • {h.changedBy.name}</div>
                          {h.note && <div className="timeline-note">{h.note}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-header"><span className="card-title">✅ Riwayat Approval</span></div>
              <div className="card-body">
                {!app.approvalHistories.length ? (
                  <p className="text-muted text-sm">Belum ada riwayat approval</p>
                ) : (
                  <div className="timeline">
                    {app.approvalHistories.map((h) => (
                      <div key={h.id} className="timeline-item">
                        <div className={`timeline-dot ${h.action === "APPROVED" ? "completed" : "error"}`} style={{ width: 32, height: 32, fontSize: 14 }}>
                          {h.action === "APPROVED" ? "✓" : "✕"}
                        </div>
                        <div className="timeline-content">
                          <div className="timeline-title">
                            <span className={`badge ${h.action === "APPROVED" ? "status-approved" : "status-rejected"}`}>{h.action === "APPROVED" ? "Disetujui" : "Ditolak"}</span>
                          </div>
                          <div className="timeline-meta">{fmtDate(h.createdAt)} • {h.approver.name}</div>
                          {h.note && <div className="timeline-note">{h.note}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Upload Document Modal */}
      {uploadModal && (
        <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setUploadModal(false); }}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">📤 Upload Dokumen</span>
              <button className="modal-close" onClick={() => setUploadModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Tipe Dokumen <span className="required">*</span></label>
                <select id="upload-doc-type" className="form-control" value={uploadType} onChange={(e) => setUploadType(e.target.value)}>
                  {Object.entries(DOCUMENT_TYPE_LABELS).filter(([k]) => k !== "SIGNED_CONTRACT").map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">File <span className="required">*</span></label>
                <div className="upload-zone" onClick={() => document.getElementById("file-input")?.click()}>
                  {uploadFile ? (
                    <div>
                      <div style={{ fontSize: 32 }}>📄</div>
                      <h4>{uploadFile.name}</h4>
                      <p>{fmtSize(uploadFile.size)}</p>
                    </div>
                  ) : (
                    <div>
                      <div className="upload-icon">☁️</div>
                      <h4>Klik untuk pilih file</h4>
                      <p>JPG, PNG, WebP, atau PDF (maks. 5MB)</p>
                    </div>
                  )}
                </div>
                <input id="file-input" type="file" accept="image/*,.pdf" style={{ display: "none" }} onChange={(e) => setUploadFile(e.target.files?.[0] || null)} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setUploadModal(false)}>Batal</button>
              <button id="btn-confirm-upload" className="btn btn-primary" onClick={handleUpload} disabled={!uploadFile || uploading}>
                {uploading ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></span> Mengupload...</> : "📤 Upload"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approval Modal */}
      {approvalModal && (
        <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setApprovalModal(false); }}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">{approvalAction === "APPROVED" ? "✅ Setujui Pengajuan" : "❌ Tolak Pengajuan"}</span>
              <button className="modal-close" onClick={() => setApprovalModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: 16, color: "var(--gray-600)" }}>
                {approvalAction === "APPROVED"
                  ? "Apakah Anda yakin ingin menyetujui pengajuan ini?"
                  : "Berikan alasan penolakan pengajuan ini."}
              </p>
              <div className="form-group">
                <label className="form-label">Catatan {approvalAction === "REJECTED" && <span className="required">*</span>}</label>
                <textarea
                  id="approval-note"
                  className="form-control"
                  value={approvalNote}
                  onChange={(e) => setApprovalNote(e.target.value)}
                  placeholder={approvalAction === "APPROVED" ? "Catatan opsional..." : "Alasan penolakan..."}
                  rows={3}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setApprovalModal(false)}>Batal</button>
              <button
                id="btn-confirm-approval"
                className={`btn ${approvalAction === "APPROVED" ? "btn-success" : "btn-danger"}`}
                onClick={handleApproval}
                disabled={approvalAction === "REJECTED" && !approvalNote}
              >
                {approvalAction === "APPROVED" ? "✅ Ya, Setujui" : "❌ Ya, Tolak"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Signed Document Upload Modal */}
      {signedModal && (
        <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setSignedModal(false); }}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">📤 Upload Dokumen Signed</span>
              <button className="modal-close" onClick={() => setSignedModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="alert alert-info"><span className="alert-icon">ℹ️</span><span>Upload dokumen kontrak yang telah ditandatangani oleh konsumen</span></div>
              <div className="form-group" style={{ marginTop: 16 }}>
                <label className="form-label">File Dokumen Signed <span className="required">*</span></label>
                <div className="upload-zone" onClick={() => document.getElementById("signed-file-input")?.click()}>
                  {signedFile ? (
                    <div><div style={{ fontSize: 32 }}>📄</div><h4>{signedFile.name}</h4><p>{fmtSize(signedFile.size)}</p></div>
                  ) : (
                    <div><div className="upload-icon">📝</div><h4>Klik untuk pilih file</h4><p>JPG, PNG, WebP, atau PDF (maks. 5MB)</p></div>
                  )}
                </div>
                <input id="signed-file-input" type="file" accept="image/*,.pdf" style={{ display: "none" }} onChange={(e) => setSignedFile(e.target.files?.[0] || null)} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setSignedModal(false)}>Batal</button>
              <button id="btn-confirm-upload-signed" className="btn btn-success" onClick={handleUploadSigned} disabled={!signedFile || uploading}>
                {uploading ? "Mengupload..." : "📤 Upload Dokumen Signed"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
