"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Customer {
  id: string;
  nik: string;
  name: string;
  phone: string;
  email?: string;
  maritalStatus: string;
  createdAt: string;
  _count: { applications: number };
}

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ search, page: String(page), pageSize: String(pageSize) });
    const res = await fetch(`/api/customers?${params}`);
    const data = await res.json();
    if (data.success) {
      setCustomers(data.data);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    }
    setLoading(false);
  }, [search, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search]);

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <h2>Data Konsumen</h2>
          <p>Kelola data calon konsumen kredit kendaraan</p>
        </div>
        <div className="page-header-actions">
          <Link href="/customers/new" id="btn-add-customer" className="btn btn-primary">➕ Tambah Konsumen</Link>
        </div>
      </div>

      <div className="page-content">
        <div className="card">
          <div className="card-header">
            <div className="filter-bar" style={{ margin: 0 }}>
              <div className="search-input-wrap">
                <span className="search-icon">🔍</span>
                <input
                  id="search-customer"
                  className="form-control"
                  placeholder="Cari nama, NIK, telepon..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <span className="text-sm text-muted">{total} konsumen</span>
          </div>

          {loading ? (
            <div className="loading-overlay"><div className="spinner"></div><p>Memuat data...</p></div>
          ) : !customers.length ? (
            <div className="empty-state">
              <div className="empty-icon">👥</div>
              <h3>Belum ada konsumen</h3>
              <p>Tambahkan konsumen pertama untuk memulai pengajuan kredit</p>
              <Link href="/customers/new" className="btn btn-primary">Tambah Konsumen</Link>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>NIK</th>
                    <th>Nama</th>
                    <th>Telepon</th>
                    <th>Email</th>
                    <th>Status Nikah</th>
                    <th>Pengajuan</th>
                    <th>Terdaftar</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c) => (
                    <tr key={c.id}>
                      <td><code style={{ fontSize: 12, background: "var(--gray-100)", padding: "2px 6px", borderRadius: 4 }}>{c.nik}</code></td>
                      <td style={{ fontWeight: 600 }}>{c.name}</td>
                      <td>{c.phone}</td>
                      <td className="text-sm text-muted">{c.email || "-"}</td>
                      <td className="text-sm">{c.maritalStatus === "MARRIED" ? "Menikah" : c.maritalStatus === "SINGLE" ? "Belum Menikah" : c.maritalStatus === "DIVORCED" ? "Cerai" : "Janda/Duda"}</td>
                      <td><span style={{ fontWeight: 700, color: "var(--primary)" }}>{c._count.applications}</span></td>
                      <td className="text-sm text-muted">{new Date(c.createdAt).toLocaleDateString("id-ID")}</td>
                      <td>
                        <div style={{ display: "flex", gap: 6 }}>
                          <Link href={`/customers/${c.id}`} className="btn btn-ghost btn-sm">Detail</Link>
                          <Link href={`/customers/${c.id}/edit`} className="btn btn-outline btn-sm">Edit</Link>
                        </div>
                      </td>
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
