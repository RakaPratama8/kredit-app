"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ROLE_LABELS, ROLES } from "@/lib/constants";

interface User {
  userId: string;
  name: string;
  email: string;
  role: string;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => { if (d.success) setUser(d.data); else router.push("/login"); })
      .catch(() => router.push("/login"));
  }, [router]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  if (!user) {
    return (
      <div className="loading-overlay" style={{ minHeight: "100vh" }}>
        <div className="spinner spinner-lg"></div>
        <p>Memuat aplikasi...</p>
      </div>
    );
  }

  const isAdmin = user.role === ROLES.ADMIN_BACKOFFICE;
  const isAtasan = user.role === ROLES.ATASAN_MARKETING;
  const isMarketing = user.role === ROLES.MARKETING;
  const isSales = user.role === ROLES.SALES_DEALER;

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: "📊", section: "Utama" },
    ...(isAdmin || isMarketing || isSales ? [{ href: "/customers", label: "Data Konsumen", icon: "👥", section: "Data" }] : []),
    { href: "/applications", label: "Pengajuan Kredit", icon: "📋", section: "Data" },
    ...(isAtasan ? [{ href: "/approvals", label: "Approval", icon: "✅", section: "Proses" }] : []),
    ...(isAdmin || isAtasan ? [{ href: "/monitoring", label: "Monitoring", icon: "📡", section: "Monitoring" }] : []),
  ];

  const sections: string[] = [];
  navItems.forEach((n) => { if (!sections.includes(n.section)) sections.push(n.section); });

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">🏍️</div>
          <h1>KreditMoto</h1>
          <p>Kredit Kendaraan Bermotor</p>
        </div>

        <nav className="sidebar-nav">
          {sections.map((section) => (
            <div key={section}>
              <div className="nav-section-label">{section}</div>
              {navItems.filter((n) => n.section === section).map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-item ${pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href)) ? "active" : ""}`}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-user">
          <div className="user-info">
            <div className="user-avatar">{user.name.charAt(0).toUpperCase()}</div>
            <div className="user-details">
              <div className="user-name">{user.name}</div>
              <div className="user-role">{ROLE_LABELS[user.role] || user.role}</div>
            </div>
            <button id="logout-btn" onClick={handleLogout} className="logout-btn" title="Logout">🚪</button>
          </div>
        </div>
      </aside>

      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
