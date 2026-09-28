"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { STATUS_LABELS, STATUS_COLORS } from "@/lib/constants";

interface Application {
  id: string;
  applicationNumber: string;
  status: string;
  dealerName: string;
  vehicleBrand: string;
  vehicleModel: string;
  loanAmount: number;
  tenorMonths: number;
  monthlyInstallment: number;
  createdAt: string;
  submittedAt?: string;
  customer: { name: string; nik: string };
  createdBy: { name: string };
  assignedMarketing?: { name: string };
  contract?: { documentNumber: string; status: string };
}

const statusOptions = [
  { value: "", label: "Semua Status" },
  { value: "DRAFT", label: "Draft" },
  { value: "DOCUMENT_INCOMPLETE", label: "Dokumen Belum Lengkap" },
  { value: "READY_FOR_SUBMISSION", label: "Siap Submit" },
  { value: "WAITING_APPROVAL", label: "Menunggu Approval" },
  { value: "APPROVED", label: "Disetujui" },
  { value: "REJECTED", label: "Ditolak" },
  { value: "CONTRACT_GENERATED", label: "Kontrak Dibuat" },
  { value: "WAITING_DOCUMENT_APPROVAL", label: "Menunggu Tanda Tangan" },
  { value: "DOCUMENT_SIGNED", label: "Dokumen Ditandatangani" },
  { value: "SIGNED_DOCUMENT_UPLOADED", label: "Dokumen Signed Diupload" },
  { value: "COMPLETED", label: "Selesai" },
];

export default function MonitoringPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 20;

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ search, status, dateFrom, dateTo, page: String(page), pageSize: String(pageSize) });
    const res = await fetch(`/api/monitoring?${params}`);
    const data = await res.json();
    if (data.success) {
      setApps(data.data);
      setTotal(data.total);
      setTotalPages(data.totalPages);
      setStats(data.stats || {});
    }
    setLoading(false);
  }, [search, status, dateFrom, dateTo, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, status, dateFrom, dateTo]);

  const fmt = (n: number) => "Rp " + n.toLocaleString("id-ID");

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <h2>Monitoring Pengajuan</h2>
          <p>Pantau seluruh status pengajuan kredit kendaraan</p>
        </div>
        <div className="page-header-actions">
          <span className="text-sm text-muted">Total: {total} pengajuan</span>
        </div>
      </div>

      <div className="page-content">
        {/* Stats Summary */}
        <div className="stat-grid" style={{ marginBottom: 24 }}>
          {[
            { key: "WAITING_APPROVAL", label: "Menunggu Approval", color: "yellow", icon: "⏳" },
            { key: "APPROVED", label: "Disetujui", color: "green", icon: "✅" },
            { key: "REJECTED", label: "Ditolak", color: "red", icon: "❌" },
            { key: "COMPLETED", label: "Selesai", color: "purple", icon: "🏁" },
            { key: "DOCUMENT_SIGNED", label: "Perlu Upload Signed", color: "blue", icon: "✍️" },
          ].map(s => (
            <div key={s.key} className={`stat-card ${s.color}`} style={{ cursor: "pointer" }} onClick={() => { setStatus(s.key); setPage(1); }}>
              <div className="stat-icon">{s.icon}</div>
              <div className="stat-value">{stats[s.key] || 0}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="card-header">
            <div className="filter-bar" style={{ margin: 0, flex: 1 }}>
              <div className="search-input-wrap">
                <span className="search-icon">🔍</span>
                <input id="search-monitor" className="form-control" placeholder="Cari no. pengajuan / konsumen..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <select id="filter-status-monitor" className="form-control filter-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                {statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <input id="filter-date-from" type="date" className="form-control" style={{ maxWidth: 160 }} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} placeholder="Dari tanggal" />
              <input id="filter-date-to" type="date" className="form-control" style={{ maxWidth: 160 }} value={dateTo} onChange={(e) => setDateTo(e.target.value)} placeholder="Sampai tanggal" />
              {(search || status || dateFrom || dateTo) && (
                <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(""); setStatus(""); setDateFrom(""); setDateTo(""); }}>✕ Reset</button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="loading-overlay"><div className="spinner"></div><p>Memuat data...</p></div>
          ) : !apps.length ? (
            <div className="empty-state"><div className="empty-icon">📡</div><h3>Tidak ada data</h3><p>Tidak ada pengajuan yang sesuai dengan filter</p></div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>No. Pengajuan</th>
                    <th>Konsumen</th>
                    <th>Kendaraan</th>
                    <th>Dealer</th>
                    <th>Pembiayaan</th>
                    <th>Marketing</th>
                    <th>Status</th>
                    <th>Kontrak</th>
                    <th>Tanggal</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {apps.map((app) => (
                    <tr key={app.id}>
                      <td><span style={{ fontWeight: 700, fontFamily: "monospace", fontSize: 11, color: "var(--primary)" }}>{app.applicationNumber}</span></td>
                      <td><div style={{ fontWeight: 600, fontSize: 13 }}>{app.customer.name}</div><div style={{ fontSize: 10, color: "var(--gray-400)" }}>{app.customer.nik}</div></td>
                      <td className="text-sm">{app.vehicleBrand} {app.vehicleModel}</td>
                      <td className="text-sm text-muted">{app.dealerName}</td>
                      <td><div style={{ fontSize: 12, fontWeight: 700 }}>{fmt(app.loanAmount)}</div><div style={{ fontSize: 10, color: "var(--gray-400)" }}>{app.tenorMonths}bln</div></td>
                      <td className="text-sm">{app.assignedMarketing?.name || <span className="text-muted">-</span>}</td>
                      <td><span className={`badge ${STATUS_COLORS[app.status] || ""}`} style={{ fontSize: 10 }}>{STATUS_LABELS[app.status] || app.status}</span></td>
                      <td className="text-sm text-muted">{app.contract ? <span style={{ fontFamily: "monospace", fontSize: 10 }}>{app.contract.documentNumber}</span> : "-"}</td>
                      <td className="text-sm text-muted">{new Date(app.createdAt).toLocaleDateString("id-ID")}</td>
                      <td><Link href={`/applications/${app.id}`} className="btn btn-ghost btn-sm">Detail →</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="card-footer">
              <div className="pagination">
                <span className="pagination-info">Menampilkan {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)} dari {total}</span>
                <div className="pagination-buttons">
                  <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                    return p <= totalPages ? (
                      <button key={p} className={`page-btn ${p === page ? "active" : ""}`} onClick={() => setPage(p)}>{p}</button>
                    ) : null;
                  })}
                  <button className="page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>›</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
