"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

interface Customer { id: string; name: string; nik: string; }
interface User { id: string; name: string; role: string; }

function NewApplicationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preSelectedCustomerId = searchParams.get("customerId") || "";

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [marketings, setMarketings] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: string; msg: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    customerId: preSelectedCustomerId,
    assignedMarketingId: "",
    dealerName: "",
    vehicleBrand: "",
    vehicleModel: "",
    vehicleType: "",
    vehicleYear: new Date().getFullYear(),
    vehicleColor: "",
    vehiclePrice: 0,
    downPayment: 0,
    loanAmount: 0,
    tenorMonths: 36,
    monthlyInstallment: 0,
    insurance: 0,
    totalLoanCost: 0,
  });

  useEffect(() => {
    fetch("/api/customers?pageSize=100").then(r => r.json()).then(d => { if (d.success) setCustomers(d.data); });
    fetch("/api/users?role=MARKETING").then(r => r.json()).then(d => { if (d.success) setMarketings(d.data); });
  }, []);

  function setField(key: string, value: string | number) {
    setForm((f) => {
      const updated = { ...f, [key]: value };
      // Auto-calculate
      if (key === "vehiclePrice" || key === "downPayment") {
        const price = key === "vehiclePrice" ? Number(value) : updated.vehiclePrice;
        const dp = key === "downPayment" ? Number(value) : updated.downPayment;
        updated.loanAmount = Math.max(0, price - dp);
      }
      if (key === "loanAmount" || key === "tenorMonths" || key === "vehiclePrice" || key === "downPayment") {
        const loan = updated.loanAmount;
        const tenor = updated.tenorMonths;
        if (loan > 0 && tenor > 0) {
          const rate = 0.018; // 1.8% per month flat
          updated.monthlyInstallment = Math.round(loan / tenor + loan * rate);
          updated.totalLoanCost = updated.monthlyInstallment * tenor;
        }
      }
      return updated;
    });
    setErrors((e) => ({ ...e, [key]: "" }));
  }

  function showToast(type: string, msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, vehiclePrice: Number(form.vehiclePrice), downPayment: Number(form.downPayment), loanAmount: Number(form.loanAmount), tenorMonths: Number(form.tenorMonths), monthlyInstallment: Number(form.monthlyInstallment), insurance: Number(form.insurance), totalLoanCost: Number(form.totalLoanCost) }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.errors) {
          const errs: Record<string, string> = {};
          data.errors.forEach((e: { path: string[]; message: string }) => { errs[e.path[0]] = e.message; });
          setErrors(errs);
        }
        showToast("error", data.error || "Gagal membuat pengajuan");
        return;
      }
      showToast("success", "Pengajuan berhasil dibuat!");
      setTimeout(() => router.push(`/applications/${data.data.id}`), 800);
    } catch {
      showToast("error", "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  const fmt = (n: number) => n.toLocaleString("id-ID");

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

      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <div className="form-section-title">👤 Data Konsumen</div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Konsumen <span className="required">*</span></label>
              <select id="field-customerId" className={`form-control ${errors.customerId ? "error" : ""}`} value={form.customerId} onChange={(e) => setField("customerId", e.target.value)}>
                <option value="">-- Pilih Konsumen --</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.nik})</option>)}
              </select>
              {errors.customerId && <p className="form-error">⚠️ {errors.customerId}</p>}
            </div>
            <div className="form-group">
              <label className="form-label">Assigned Marketing</label>
              <select id="field-assignedMarketingId" className="form-control" value={form.assignedMarketingId} onChange={(e) => setField("assignedMarketingId", e.target.value)}>
                <option value="">-- Pilih Marketing --</option>
                {marketings.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="form-section">
          <div className="form-section-title">🏍️ Data Kendaraan</div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Nama Dealer <span className="required">*</span></label>
              <input id="field-dealerName" className={`form-control ${errors.dealerName ? "error" : ""}`} value={form.dealerName} onChange={(e) => setField("dealerName", e.target.value)} placeholder="Nama dealer" />
              {errors.dealerName && <p className="form-error">⚠️ {errors.dealerName}</p>}
            </div>
            <div className="form-group">
              <label className="form-label">Merek <span className="required">*</span></label>
              <input id="field-vehicleBrand" className={`form-control ${errors.vehicleBrand ? "error" : ""}`} value={form.vehicleBrand} onChange={(e) => setField("vehicleBrand", e.target.value)} placeholder="Honda, Yamaha, dll" />
              {errors.vehicleBrand && <p className="form-error">⚠️ {errors.vehicleBrand}</p>}
            </div>
          </div>
          <div className="form-row three">
            <div className="form-group">
              <label className="form-label">Model <span className="required">*</span></label>
              <input id="field-vehicleModel" className="form-control" value={form.vehicleModel} onChange={(e) => setField("vehicleModel", e.target.value)} placeholder="Beat, Vario, dll" />
            </div>
            <div className="form-group">
              <label className="form-label">Tipe <span className="required">*</span></label>
              <input id="field-vehicleType" className="form-control" value={form.vehicleType} onChange={(e) => setField("vehicleType", e.target.value)} placeholder="CBS, ABS, dll" />
            </div>
            <div className="form-group">
              <label className="form-label">Tahun <span className="required">*</span></label>
              <input id="field-vehicleYear" type="number" className="form-control" value={form.vehicleYear} onChange={(e) => setField("vehicleYear", parseInt(e.target.value))} min={2000} max={2030} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Warna <span className="required">*</span></label>
              <input id="field-vehicleColor" className="form-control" value={form.vehicleColor} onChange={(e) => setField("vehicleColor", e.target.value)} placeholder="Merah, Hitam, dll" />
            </div>
            <div className="form-group">
              <label className="form-label">Harga Kendaraan (Rp) <span className="required">*</span></label>
              <input id="field-vehiclePrice" type="number" className="form-control" value={form.vehiclePrice || ""} onChange={(e) => setField("vehiclePrice", parseFloat(e.target.value) || 0)} placeholder="0" />
              {form.vehiclePrice > 0 && <p className="form-hint">Rp {fmt(form.vehiclePrice)}</p>}
            </div>
          </div>
        </div>

        <div className="form-section">
          <div className="form-section-title">💰 Data Pembiayaan</div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Uang Muka / DP (Rp) <span className="required">*</span></label>
              <input id="field-downPayment" type="number" className="form-control" value={form.downPayment || ""} onChange={(e) => setField("downPayment", parseFloat(e.target.value) || 0)} />
              {form.downPayment > 0 && <p className="form-hint">Rp {fmt(form.downPayment)}</p>}
            </div>
            <div className="form-group">
              <label className="form-label">Jumlah Pembiayaan (Rp)</label>
              <input id="field-loanAmount" type="number" className="form-control" value={form.loanAmount || ""} readOnly style={{ background: "var(--gray-50)" }} />
              {form.loanAmount > 0 && <p className="form-hint">Rp {fmt(form.loanAmount)}</p>}
            </div>
          </div>
          <div className="form-row three">
            <div className="form-group">
              <label className="form-label">Tenor (bulan) <span className="required">*</span></label>
              <select id="field-tenorMonths" className="form-control" value={form.tenorMonths} onChange={(e) => setField("tenorMonths", parseInt(e.target.value))}>
                {[12, 18, 24, 30, 36, 42, 48].map(t => <option key={t} value={t}>{t} bulan</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Angsuran/Bulan (Rp)</label>
              <input id="field-monthlyInstallment" type="number" className="form-control" value={form.monthlyInstallment || ""} readOnly style={{ background: "var(--gray-50)" }} />
              {form.monthlyInstallment > 0 && <p className="form-hint">Rp {fmt(form.monthlyInstallment)}</p>}
            </div>
            <div className="form-group">
              <label className="form-label">Asuransi (Rp)</label>
              <input id="field-insurance" type="number" className="form-control" value={form.insurance || ""} onChange={(e) => setField("insurance", parseFloat(e.target.value) || 0)} />
            </div>
          </div>
          {form.totalLoanCost > 0 && (
            <div className="alert alert-info">
              <span className="alert-icon">💡</span>
              <div>
                <strong>Estimasi Total Pembiayaan: Rp {fmt(form.totalLoanCost)}</strong>
                <p style={{ fontSize: 12, marginTop: 4, opacity: 0.8 }}>Asumsi bunga flat 1.8%/bulan. Angka ini hanya estimasi dan dapat berubah sesuai kebijakan perusahaan.</p>
              </div>
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <button type="button" className="btn btn-ghost" onClick={() => router.back()}>Batal</button>
          <button id="btn-submit-application" type="submit" className="btn btn-primary btn-lg" disabled={loading}>
            {loading ? <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></span> Menyimpan...</> : "📋 Buat Pengajuan"}
          </button>
        </div>
      </form>
    </>
  );
}

export default function NewApplicationPage() {
  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <h2>Pengajuan Kredit Baru</h2>
          <p>Isi data pengajuan kredit kendaraan bermotor</p>
        </div>
      </div>
      <div className="page-content">
        <div className="card">
          <div className="card-body">
            <Suspense fallback={<div className="loading-overlay"><div className="spinner"></div></div>}>
              <NewApplicationForm />
            </Suspense>
          </div>
        </div>
      </div>
    </>
  );
}
