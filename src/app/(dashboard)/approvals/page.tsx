"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { STATUS_LABELS } from "@/lib/constants";

interface Application {
  id: string;
  applicationNumber: string;
  status: string;
  dealerName: string;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleType: string;
  vehiclePrice: number;
  loanAmount: number;
  tenorMonths: number;
  monthlyInstallment: number;
  downPayment: number;
  submittedAt?: string;
  customer: { name: string; nik: string };
  createdBy: { name: string };
  assignedMarketing?: { name: string };
  documents: Array<{ documentType: string; fileName: string }>;
}

export default function ApprovalsPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Application | null>(null);
  const [action, setAction] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [note, setNote] = useState("");
  const [processing, setProcessing] = useState(false);
  const [toast, setToast] = useState<{ type: string; msg: string } | null>(null);

  function showToast(type: string, msg: string) { setToast({ type, msg }); setTimeout(() => setToast(null), 4000); }

  async function load() {
    setLoading(true);
    const res = await fetch("/api/approvals");
    const data = await res.json();
    if (data.success) setApps(data.data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleApproval() {
    if (!selected) return;
    setProcessing(true);
    try {
      const res = await fetch(`/api/approvals/${selected.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, note }),
      });
      const data = await res.json();
      if (!res.ok) { showToast("error", data.error || "Gagal"); return; }
      showToast("success", `Pengajuan berhasil ${action === "APPROVED" ? "disetujui" : "ditolak"}!`);
      setSelected(null);
      setNote("");
      load();
    } finally {
      setProcessing(false);
    }
  }

  const fmt = (n: number) => "Rp " + n.toLocaleString("id-ID");

  return (
    <>
      {toast && <div className="toast-container"><div className={`toast ${toast.type}`}><span>{toast.type === "success" ? "✅" : "❌"}</span><span className="toast-message">{toast.msg}</span></div></div>}

      <div className="page-header">
        <div className="page-header-left">
          <h2>Approval Pengajuan</h2>
          <p>Daftar pengajuan yang menunggu persetujuan Anda</p>
        </div>
        <div className="page-header-actions">
          <span className="badge status-waiting" style={{ fontSize: 14, padding: "6px 14px" }}>⏳ {apps.length} Menunggu</span>
        </div>
      </div>

      <div className="page-content" style={{ display: "grid", gridTemplateColumns: selected ? "1fr 1fr" : "1fr", gap: 20 }}>
        <div className="card">
          <div className="card-header"><span className="card-title">📋 Daftar Pengajuan Pending</span></div>
          {loading ? (
            <div className="loading-overlay"><div className="spinner"></div><p>Memuat...</p></div>
          ) : !apps.length ? (
            <div className="empty-state">
              <div className="empty-icon">🎉</div>
              <h3>Tidak ada pengajuan pending</h3>
              <p>Semua pengajuan sudah diproses</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>No. Pengajuan</th>
                    <th>Konsumen</th>
                    <th>Kendaraan</th>
                    <th>Pembiayaan</th>
                    <th>Marketing</th>
                    <th>Tgl Submit</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {apps.map((app) => (
                    <tr key={app.id} style={{ cursor: "pointer", background: selected?.id === app.id ? "var(--primary-bg)" : undefined }}>
                      <td><span style={{ fontWeight: 700, fontFamily: "monospace", fontSize: 12, color: "var(--primary)" }}>{app.applicationNumber}</span></td>
                      <td><div style={{ fontWeight: 600 }}>{app.customer.name}</div><div style={{ fontSize: 11, color: "var(--gray-400)" }}>{app.customer.nik}</div></td>
                      <td className="text-sm">{app.vehicleBrand} {app.vehicleModel}</td>
                      <td><div style={{ fontWeight: 700, fontSize: 13 }}>{fmt(app.loanAmount)}</div><div style={{ fontSize: 11, color: "var(--gray-400)" }}>{app.tenorMonths}bln @ {fmt(app.monthlyInstallment)}</div></td>
                      <td className="text-sm">{app.assignedMarketing?.name || app.createdBy.name}</td>
                      <td className="text-sm text-muted">{app.submittedAt ? new Date(app.submittedAt).toLocaleDateString("id-ID") : "-"}</td>
                      <td>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button id={`btn-review-${app.id}`} className="btn btn-outline btn-sm" onClick={() => setSelected(app)}>👁️ Review</button>
                          <Link href={`/applications/${app.id}`} className="btn btn-ghost btn-sm">Detail</Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {selected && (
          <div>
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-header">
                <span className="card-title">📋 {selected.applicationNumber}</span>
                <button className="modal-close" onClick={() => setSelected(null)}>×</button>
              </div>
              <div className="card-body">
                <div style={{ marginBottom: 20 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10, color: "var(--gray-600)" }}>Data Konsumen</h4>
                  <div className="detail-grid">
                    <div className="detail-item"><span className="detail-label">Nama</span><span className="detail-value">{selected.customer.name}</span></div>
                    <div className="detail-item"><span className="detail-label">NIK</span><span className="detail-value"><code>{selected.customer.nik}</code></span></div>
                  </div>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10, color: "var(--gray-600)" }}>Data Kendaraan</h4>
                  <div className="detail-grid">
                    <div className="detail-item"><span className="detail-label">Kendaraan</span><span className="detail-value">{selected.vehicleBrand} {selected.vehicleModel} ({selected.vehicleType})</span></div>
                    <div className="detail-item"><span className="detail-label">Dealer</span><span className="detail-value">{selected.dealerName}</span></div>
                  </div>
                </div>

                <div style={{ marginBottom: 20, padding: 16, background: "var(--primary-bg)", borderRadius: "var(--border-radius-sm)", border: "1px solid #bfdbfe" }}>
                  <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10, color: "var(--primary-dark)" }}>💰 Pembiayaan</h4>
                  <div className="detail-grid">
                    <div className="detail-item"><span className="detail-label">Harga</span><span className="detail-value money">{fmt(selected.vehiclePrice)}</span></div>
                    <div className="detail-item"><span className="detail-label">DP</span><span className="detail-value money">{fmt(selected.downPayment)}</span></div>
                    <div className="detail-item"><span className="detail-label">Pembiayaan</span><span className="detail-value money" style={{ color: "var(--primary)", fontWeight: 700 }}>{fmt(selected.loanAmount)}</span></div>
                    <div className="detail-item"><span className="detail-label">Tenor</span><span className="detail-value">{selected.tenorMonths} bulan</span></div>
                    <div className="detail-item"><span className="detail-label">Angsuran</span><span className="detail-value money" style={{ color: "var(--success)", fontWeight: 700 }}>{fmt(selected.monthlyInstallment)}/bln</span></div>
                  </div>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: "var(--gray-600)" }}>📄 Dokumen ({selected.documents.length})</h4>
                  {selected.documents.map((d) => (
                    <div key={d.fileName} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid var(--gray-100)", fontSize: 13 }}>
                      <span>📄</span>
                      <span style={{ color: "var(--primary)", fontWeight: 600, fontSize: 11 }}>{d.documentType}</span>
                      <span className="text-muted">{d.fileName}</span>
                    </div>
                  ))}
                </div>

                <div className="divider"></div>

                <div className="form-group">
                  <label className="form-label">Catatan {action === "REJECTED" && <span className="required">*</span>}</label>
                  <textarea
                    id="approval-note-text"
                    className="form-control"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder={action === "APPROVED" ? "Catatan opsional..." : "Berikan alasan penolakan..."}
                    rows={3}
                  />
                </div>

                <div style={{ display: "flex", gap: 12 }}>
                  <button
                    id="btn-do-approve"
                    className="btn btn-success"
                    style={{ flex: 1 }}
                    onClick={() => { setAction("APPROVED"); handleApproval(); }}
                    disabled={processing}
                  >
                    {processing && action === "APPROVED" ? "Memproses..." : "✅ Approve"}
                  </button>
                  <button
                    id="btn-do-reject"
                    className="btn btn-danger"
                    style={{ flex: 1 }}
                    onClick={() => { setAction("REJECTED"); }}
                    disabled={processing}
                  >
                    ❌ Reject
                  </button>
                </div>
                {action === "REJECTED" && (
                  <button
                    id="btn-confirm-reject"
                    className="btn btn-danger"
                    style={{ width: "100%", marginTop: 8 }}
                    onClick={handleApproval}
                    disabled={!note || processing}
                  >
                    {processing ? "Memproses..." : "Konfirmasi Penolakan"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
