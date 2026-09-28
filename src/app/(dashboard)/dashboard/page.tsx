"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { STATUS_LABELS, STATUS_COLORS } from "@/lib/constants";

interface DashboardData {
  stats: Record<string, number>;
  recent: Array<{
    id: string;
    applicationNumber: string;
    status: string;
    createdAt: string;
    customer: { name: string };
    assignedMarketing?: { name: string };
  }>;
  totalCustomers: number;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => { if (d.success) setData(d.data); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-overlay"><div className="spinner spinner-lg"></div><p>Memuat dashboard...</p></div>;

  const stats = data?.stats || {};

  const statCards = [
    { key: "total", label: "Total Pengajuan", icon: "📋", color: "blue" },
    { key: "DRAFT", label: "Draft", icon: "📝", color: "gray" },
    { key: "WAITING_APPROVAL", label: "Menunggu Approval", icon: "⏳", color: "yellow" },
    { key: "APPROVED", label: "Disetujui", icon: "✅", color: "green" },
    { key: "REJECTED", label: "Ditolak", icon: "❌", color: "red" },
    { key: "COMPLETED", label: "Selesai", icon: "🏁", color: "purple" },
  ];

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <h2>Dashboard</h2>
          <p>Ringkasan status pengajuan kredit kendaraan</p>
        </div>
        <div className="page-header-actions">
          <Link href="/applications/new" className="btn btn-primary">
            ➕ Pengajuan Baru
          </Link>
        </div>
      </div>

      <div className="page-content">
        <div className="stat-grid">
          {statCards.map((card) => (
            <div key={card.key} className={`stat-card ${card.color}`}>
              <div className="stat-icon">{card.icon}</div>
              <div className="stat-value">{stats[card.key] || 0}</div>
              <div className="stat-label">{card.label}</div>
            </div>
          ))}
          {data && data.totalCustomers > 0 && (
            <div className="stat-card teal">
              <div className="stat-icon">👥</div>
              <div className="stat-value">{data.totalCustomers}</div>
              <div className="stat-label">Total Konsumen</div>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">📋 Pengajuan Terbaru</span>
            <Link href="/applications" className="btn btn-ghost btn-sm">Lihat Semua →</Link>
          </div>
          {!data?.recent?.length ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <h3>Belum ada pengajuan</h3>
              <p>Mulai dengan membuat pengajuan kredit baru</p>
              <Link href="/applications/new" className="btn btn-primary">Buat Pengajuan</Link>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>No. Pengajuan</th>
                    <th>Konsumen</th>
                    <th>Marketing</th>
                    <th>Status</th>
                    <th>Tanggal</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recent.map((app) => (
                    <tr key={app.id}>
                      <td><span style={{ fontWeight: 600, fontFamily: "monospace", fontSize: 13 }}>{app.applicationNumber}</span></td>
                      <td>{app.customer.name}</td>
                      <td>{app.assignedMarketing?.name || <span className="text-muted">-</span>}</td>
                      <td><span className={`badge ${STATUS_COLORS[app.status] || ""}`}>{STATUS_LABELS[app.status] || app.status}</span></td>
                      <td className="text-sm text-muted">{new Date(app.createdAt).toLocaleDateString("id-ID")}</td>
                      <td><Link href={`/applications/${app.id}`} className="btn btn-ghost btn-sm">Detail</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
