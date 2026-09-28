"use client";

import { useRouter } from "next/navigation";
import CustomerForm from "@/components/CustomerForm";

export default function NewCustomerPage() {
  const router = useRouter();
  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <h2>Tambah Konsumen Baru</h2>
          <p>Masukkan data calon konsumen kredit kendaraan</p>
        </div>
      </div>
      <div className="page-content">
        <div className="card">
          <div className="card-body">
            <CustomerForm onSuccess={(id) => router.push(`/customers/${id}`)} />
          </div>
        </div>
      </div>
    </>
  );
}
