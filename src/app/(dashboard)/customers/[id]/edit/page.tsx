"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import CustomerForm from "@/components/CustomerForm";

export default function EditCustomerPage() {
  const { id } = useParams();
  const [customer, setCustomer] = useState<Record<string, string> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/customers/${id}`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setCustomer(d.data); })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="loading-overlay"><div className="spinner spinner-lg"></div></div>;

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <h2>Edit Konsumen</h2>
          <p>{customer?.name}</p>
        </div>
      </div>
      <div className="page-content">
        <div className="card">
          <div className="card-body">
            {customer && <CustomerForm initialData={customer as unknown as Parameters<typeof CustomerForm>[0]["initialData"]} customerId={id as string} />}
          </div>
        </div>
      </div>
    </>
  );
}
