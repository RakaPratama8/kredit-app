"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

interface Application {
  id: string;
  customerId: string;
  assignedMarketingId?: string;
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
}

export default function EditApplicationPage() {
  const { id } = useParams();
  const router = useRouter();
  const [app, setApp] = useState<Application | null>(null);
  const [customers, setCustomers] = useState<{ id: string; name: string; nik: string }[]>([]);
  const [marketings, setMarketings] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: string; msg: string } | null>(null);

  function showToast(type: string, msg: string) { setToast({ type, msg }); setTimeout(() => setToast(null), 3000); }

  useEffect(() => {
    Promise.all([
      fetch(`/api/applications/${id}`).then(r => r.json()),
      fetch("/api/customers?pageSize=100").then(r => r.json()),
      fetch("/api/users?role=MARKETING").then(r => r.json()),
    ]).then(([appData, custData, mktData]) => {
      if (appData.success) setApp(appData.data);
      if (custData.success) setCustomers(custData.data);
      if (mktData.success) setMarketings(mktData.data);
    }).finally(() => setLoading(false));
  }, [id]);

  function setField(key: string, value: string | number) {
    setApp(prev => {
      if (!prev) return prev;
      const updated = { ...prev, [key]: value };
      if (key === "vehiclePrice" || key === "downPayment") {
        const price = key === "vehiclePrice" ? Number(value) : updated.vehiclePrice;
        const dp = key === "downPayment" ? Number(value) : updated.downPayment;
        updated.loanAmount = Math.max(0, price - dp);
      }
      if (["loanAmount", "tenorMonths", "vehiclePrice", "downPayment"].includes(key)) {
        const rate = 0.018;
        updated.monthlyInstallment = Math.round(updated.loanAmount / updated.tenorMonths + updated.loanAmount * rate);
        updated.totalLoanCost = updated.monthlyInstallment * updated.tenorMonths;
      }
      return updated;
    });
  }

  async function handleSave() {
    if (!app) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(app),
      });
      const data = await res.json();
      if (!res.ok) { showToast("error", data.error || "Gagal menyimpan"); return; }
      showToast("success", "Pengajuan berhasil diperbarui!");
      setTimeout(() => router.push(`/applications/${id}`), 800);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="loading-overlay"><div className="spinner spinner-lg"></div></div>;
  if (!app) return <div className="page-content"><div className="alert alert-error">Pengajuan tidak ditemukan</div></div>;

  const fmt = (n: number) => n.toLocaleString("id-ID");

  return (
    <>
      {toast && <div className="toast-container"><div className={`toast ${toast.type}`}><span>{toast.type === "success" ? "✅" : "❌"}</span><span className="toast-message">{toast.msg}</span></div></div>}
      <div className="page-header">
        <div className="page-header-left"><h2>Edit Pengajuan</h2></div>
      </div>
      <div className="page-content">
        <div className="card">
          <div className="card-body">
            <div className="form-section">
              <div className="form-section-title">👤 Data Konsumen</div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Konsumen</label>
                  <select className="form-control" value={app.customerId} onChange={(e) => setField("customerId", e.target.value)}>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.nik})</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Marketing</label>
                  <select className="form-control" value={app.assignedMarketingId || ""} onChange={(e) => setField("assignedMarketingId", e.target.value)}>
                    <option value="">-- Pilih Marketing --</option>
                    {marketings.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="form-section">
              <div className="form-section-title">🏍️ Data Kendaraan</div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Dealer</label><input className="form-control" value={app.dealerName} onChange={(e) => setField("dealerName", e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Merek</label><input className="form-control" value={app.vehicleBrand} onChange={(e) => setField("vehicleBrand", e.target.value)} /></div>
              </div>
              <div className="form-row three">
                <div className="form-group"><label className="form-label">Model</label><input className="form-control" value={app.vehicleModel} onChange={(e) => setField("vehicleModel", e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Tipe</label><input className="form-control" value={app.vehicleType} onChange={(e) => setField("vehicleType", e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Tahun</label><input type="number" className="form-control" value={app.vehicleYear} onChange={(e) => setField("vehicleYear", parseInt(e.target.value))} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Warna</label><input className="form-control" value={app.vehicleColor} onChange={(e) => setField("vehicleColor", e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Harga</label><input type="number" className="form-control" value={app.vehiclePrice} onChange={(e) => setField("vehiclePrice", parseFloat(e.target.value) || 0)} />{app.vehiclePrice > 0 && <p className="form-hint">Rp {fmt(app.vehiclePrice)}</p>}</div>
              </div>
            </div>
            <div className="form-section">
              <div className="form-section-title">💰 Data Pembiayaan</div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">DP</label><input type="number" className="form-control" value={app.downPayment} onChange={(e) => setField("downPayment", parseFloat(e.target.value) || 0)} />{app.downPayment > 0 && <p className="form-hint">Rp {fmt(app.downPayment)}</p>}</div>
                <div className="form-group"><label className="form-label">Jumlah Pembiayaan</label><input type="number" className="form-control" value={app.loanAmount} readOnly style={{ background: "var(--gray-50)" }} />{app.loanAmount > 0 && <p className="form-hint">Rp {fmt(app.loanAmount)}</p>}</div>
              </div>
              <div className="form-row three">
                <div className="form-group">
                  <label className="form-label">Tenor</label>
                  <select className="form-control" value={app.tenorMonths} onChange={(e) => setField("tenorMonths", parseInt(e.target.value))}>
                    {[12, 18, 24, 30, 36, 42, 48].map(t => <option key={t} value={t}>{t} bulan</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Angsuran/Bulan</label><input type="number" className="form-control" value={app.monthlyInstallment} readOnly style={{ background: "var(--gray-50)" }} />{app.monthlyInstallment > 0 && <p className="form-hint">Rp {fmt(app.monthlyInstallment)}</p>}</div>
                <div className="form-group"><label className="form-label">Asuransi</label><input type="number" className="form-control" value={app.insurance} onChange={(e) => setField("insurance", parseFloat(e.target.value) || 0)} /></div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button className="btn btn-ghost" onClick={() => router.back()}>Batal</button>
              <button className="btn btn-primary btn-lg" onClick={handleSave} disabled={saving}>{saving ? "Menyimpan..." : "💾 Simpan Perubahan"}</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
