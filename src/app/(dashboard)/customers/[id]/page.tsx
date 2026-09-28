"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { STATUS_LABELS, STATUS_COLORS } from "@/lib/constants";

interface Customer {
  id: string;
  nik: string;
  name: string;
  placeOfBirth: string;
  dateOfBirth: string;
  maritalStatus: string;
  spouseName?: string;
  address: string;
  phone: string;
  email?: string;
  createdAt: string;
  applications: Array<{ id: string; applicationNumber: string; status: string; createdAt: string }>;
}

const MARITAL_LABELS: Record<string, string> = { SINGLE: "Belum Menikah", MARRIED: "Menikah", DIVORCED: "Cerai", WIDOWED: "Janda/Duda" };

export default function CustomerDetailPage() {
  const { id } = useParams();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/customers/${id}`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setCustomer(d.data); })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="loading-overlay"><div className="spinner spinner-lg"></div><p>Memuat data...</p></div>;
  if (!customer) return <div className="page-content"><div className="alert alert-error"><span>Konsumen tidak ditemukan</span></div></div>;

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <h2>{customer.name}</h2>
          <p>NIK: {customer.nik}</p>
        </div>
        <div className="page-header-actions">
          <Link href={`/applications/new?customerId=${customer.id}`} className="btn btn-primary">📋 Buat Pengajuan</Link>
          <Link href={`/customers/${customer.id}/edit`} className="btn btn-outline">✏️ Edit</Link>
        </div>
      </div>

      <div className="page-content" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div>
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header"><span className="card-title">🪪 Data Identitas</span></div>
            <div className="card-body">
              <div className="detail-grid">
                <div className="detail-item"><span className="detail-label">NIK</span><span className="detail-value"><code>{customer.nik}</code></span></div>
                <div className="detail-item"><span className="detail-label">Nama</span><span className="detail-value">{customer.name}</span></div>
                <div className="detail-item"><span className="detail-label">Tempat Lahir</span><span className="detail-value">{customer.placeOfBirth}</span></div>
                <div className="detail-item"><span className="detail-label">Tanggal Lahir</span><span className="detail-value">{new Date(customer.dateOfBirth).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</span></div>
                <div className="detail-item"><span className="detail-label">Status Nikah</span><span className="detail-value">{MARITAL_LABELS[customer.maritalStatus]}</span></div>
                {customer.spouseName && <div className="detail-item"><span className="detail-label">Nama Pasangan</span><span className="detail-value">{customer.spouseName}</span></div>}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><span className="card-title">📞 Data Kontak</span></div>
            <div className="card-body">
              <div className="detail-grid">
                <div className="detail-item"><span className="detail-label">Telepon</span><span className="detail-value">{customer.phone}</span></div>
                <div className="detail-item"><span className="detail-label">Email</span><span className="detail-value">{customer.email || "-"}</span></div>
                <div className="detail-item" style={{ gridColumn: "1/-1" }}><span className="detail-label">Alamat</span><span className="detail-value">{customer.address}</span></div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="card">
            <div className="card-header">
              <span className="card-title">📋 Riwayat Pengajuan ({customer.applications.length})</span>
            </div>
            {!customer.applications.length ? (
              <div className="empty-state">
                <div className="empty-icon">📭</div>
                <h3>Belum ada pengajuan</h3>
                <Link href={`/applications/new?customerId=${customer.id}`} className="btn btn-primary btn-sm">Buat Pengajuan</Link>
              </div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr><th>No. Pengajuan</th><th>Status</th><th>Tanggal</th></tr>
                  </thead>
                  <tbody>
                    {customer.applications.map((app) => (
                      <tr key={app.id}>
                        <td><Link href={`/applications/${app.id}`} style={{ color: "var(--primary)", fontWeight: 600, fontFamily: "monospace", fontSize: 12 }}>{app.applicationNumber}</Link></td>
                        <td><span className={`badge ${STATUS_COLORS[app.status]}`}>{STATUS_LABELS[app.status] || app.status}</span></td>
                        <td className="text-sm text-muted">{new Date(app.createdAt).toLocaleDateString("id-ID")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
