"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MARITAL_STATUS_OPTIONS } from "@/lib/constants";

interface CustomerFormProps {
  initialData?: {
    nik: string;
    name: string;
    placeOfBirth: string;
    dateOfBirth: string;
    maritalStatus: string;
    spouseName?: string;
    address: string;
    phone: string;
    email?: string;
  };
  customerId?: string;
  onSuccess?: (id: string) => void;
}

export default function CustomerForm({ initialData, customerId, onSuccess }: CustomerFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ type: string; msg: string } | null>(null);

  const [form, setForm] = useState({
    nik: initialData?.nik || "",
    name: initialData?.name || "",
    placeOfBirth: initialData?.placeOfBirth || "",
    dateOfBirth: initialData?.dateOfBirth?.split("T")[0] || "",
    maritalStatus: initialData?.maritalStatus || "SINGLE",
    spouseName: initialData?.spouseName || "",
    address: initialData?.address || "",
    phone: initialData?.phone || "",
    email: initialData?.email || "",
  });

  function setField(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
  }

  function showToast(type: string, msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const method = customerId ? "PUT" : "POST";
      const url = customerId ? `/api/customers/${customerId}` : "/api/customers";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.errors) {
          const errs: Record<string, string> = {};
          data.errors.forEach((e: { path: string[]; message: string }) => {
            errs[e.path[0]] = e.message;
          });
          setErrors(errs);
        }
        showToast("error", data.error || "Gagal menyimpan data");
        return;
      }

      showToast("success", customerId ? "Data konsumen berhasil diperbarui!" : "Konsumen berhasil ditambahkan!");
      if (onSuccess) {
        onSuccess(data.data.id);
      } else {
        setTimeout(() => router.push(`/customers/${data.data.id}`), 800);
      }
    } catch {
      showToast("error", "Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  }

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
          <div className="form-section-title">🪪 Data Identitas</div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">NIK <span className="required">*</span></label>
              <input id="field-nik" className={`form-control ${errors.nik ? "error" : ""}`} value={form.nik} onChange={(e) => setField("nik", e.target.value)} placeholder="16 digit NIK" maxLength={16} />
              {errors.nik && <p className="form-error">⚠️ {errors.nik}</p>}
              <p className="form-hint">Nomor Induk Kependudukan 16 digit</p>
            </div>
            <div className="form-group">
              <label className="form-label">Nama Lengkap <span className="required">*</span></label>
              <input id="field-name" className={`form-control ${errors.name ? "error" : ""}`} value={form.name} onChange={(e) => setField("name", e.target.value)} placeholder="Nama sesuai KTP" />
              {errors.name && <p className="form-error">⚠️ {errors.name}</p>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Tempat Lahir <span className="required">*</span></label>
              <input id="field-placeOfBirth" className={`form-control ${errors.placeOfBirth ? "error" : ""}`} value={form.placeOfBirth} onChange={(e) => setField("placeOfBirth", e.target.value)} placeholder="Kota tempat lahir" />
              {errors.placeOfBirth && <p className="form-error">⚠️ {errors.placeOfBirth}</p>}
            </div>
            <div className="form-group">
              <label className="form-label">Tanggal Lahir <span className="required">*</span></label>
              <input id="field-dateOfBirth" type="date" className={`form-control ${errors.dateOfBirth ? "error" : ""}`} value={form.dateOfBirth} onChange={(e) => setField("dateOfBirth", e.target.value)} />
              {errors.dateOfBirth && <p className="form-error">⚠️ {errors.dateOfBirth}</p>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Status Pernikahan <span className="required">*</span></label>
              <select id="field-maritalStatus" className="form-control" value={form.maritalStatus} onChange={(e) => setField("maritalStatus", e.target.value)}>
                {MARITAL_STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            {form.maritalStatus === "MARRIED" && (
              <div className="form-group">
                <label className="form-label">Nama Pasangan</label>
                <input id="field-spouseName" className="form-control" value={form.spouseName} onChange={(e) => setField("spouseName", e.target.value)} placeholder="Nama suami/istri" />
              </div>
            )}
          </div>
        </div>

        <div className="form-section">
          <div className="form-section-title">📞 Data Kontak</div>
          <div className="form-group">
            <label className="form-label">Alamat <span className="required">*</span></label>
            <textarea id="field-address" className={`form-control ${errors.address ? "error" : ""}`} value={form.address} onChange={(e) => setField("address", e.target.value)} placeholder="Alamat lengkap sesuai KTP" rows={3} />
            {errors.address && <p className="form-error">⚠️ {errors.address}</p>}
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Nomor Telepon <span className="required">*</span></label>
              <input id="field-phone" className={`form-control ${errors.phone ? "error" : ""}`} value={form.phone} onChange={(e) => setField("phone", e.target.value)} placeholder="08xx-xxxx-xxxx" />
              {errors.phone && <p className="form-error">⚠️ {errors.phone}</p>}
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input id="field-email" type="email" className={`form-control ${errors.email ? "error" : ""}`} value={form.email} onChange={(e) => setField("email", e.target.value)} placeholder="email@contoh.com" />
              {errors.email && <p className="form-error">⚠️ {errors.email}</p>}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <button type="button" className="btn btn-ghost" onClick={() => router.back()}>Batal</button>
          <button id="btn-save-customer" type="submit" className="btn btn-primary btn-lg" disabled={loading}>
            {loading ? <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></span> Menyimpan...</> : customerId ? "💾 Perbarui Data" : "➕ Tambah Konsumen"}
          </button>
        </div>
      </form>
    </>
  );
}
