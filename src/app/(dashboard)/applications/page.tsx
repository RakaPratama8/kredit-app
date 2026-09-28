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
  createdAt: string;
  submittedAt?: string;
  customer: { name: string };
  createdBy: { name: string };
  assignedMarketing?: { name: string };
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
  { value: "WAITING_DOCUMENT_APPROVAL", label: "Menunggu Persetujuan Dokumen" },
  { value: "DOCUMENT_SIGNED", label: "Dokumen Ditandatangani" },
  { value: "SIGNED_DOCUMENT_UPLOADED", label: "Dokumen Signed Diupload" },
  { value: "COMPLETED", label: "Selesai" },
];

export default function ApplicationsPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ search, status, page: String(page), pageSize: String(pageSize) });
    const res = await fetch(`/api/applications?${params}`);
    const data = await res.json();
    if (data.success) {
      setApps(data.data);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    }
    setLoading(false);
  }, [search, status, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, status]);

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <h2>Pengajuan Kredit</h2>
          <p>Kelola pengajuan kredit kendaraan bermotor</p>
        </div>
        <div className="page-header-actions">
          <Link href="/applications/new" id="btn-new-application" className="btn btn-primary">➕ Pengajuan Baru</Link>
        </div>
      </div>

      <div className="page-content">
        <div className="card">
          <div className="card-header">
            <div className="filter-bar" style={{ margin: 0, flex: 1 }}>
              <div className="search-input-wrap">
                <span className="search-icon">🔍</span>
                <input id="search-application" className="form-control" placeholder="Cari no. pengajuan / konsumen..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <select id="filter-status" className="form-control filter-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                {statusOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <span className="text-sm text-muted">{total} pengajuan</span>
          </div>

          {loading ? (
            <div className="loading-overlay"><div className="spinner"></div><p>Memuat data...</p></div>
          ) : !apps.length ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h3>Tidak ada pengajuan</h3>
              <p>{search || status ? "Tidak ada hasil untuk filter yang dipilih" : "Mulai dengan membuat pengajuan kredit baru"}</p>
              {!search && !status && <Link href="/applications/new" className="btn btn-primary">Buat Pengajuan</Link>}
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>No. Pengajuan</th>
                    <th>Konsumen</th>
                    <th>Kendaraan</th>
                    <th>Dealer</th>
                    <th>Marketing</th>
                    <th>Status</th>
                    <th>Tanggal</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {apps.map((app) => (
                    <tr key={app.id}>
                      <td><span style={{ fontWeight: 700, fontFamily: "monospace", fontSize: 12, color: "var(--primary)" }}>{app.applicationNumber}</span></td>
                      <td style={{ fontWeight: 600 }}>{app.customer.name}</td>
                      <td className="text-sm">{app.vehicleBrand} {app.vehicleModel}</td>
                      <td className="text-sm text-muted">{app.dealerName}</td>
                      <td className="text-sm">{app.assignedMarketing?.name || <span className="text-muted">-</span>}</td>
                      <td><span className={`badge ${STATUS_COLORS[app.status] || ""}`}>{STATUS_LABELS[app.status] || app.status}</span></td>
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
