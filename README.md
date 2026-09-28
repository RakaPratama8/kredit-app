# KreditMoto — Sistem Pengajuan Kredit Kendaraan Bermotor

Aplikasi digitalisasi proses pengajuan kredit kendaraan bermotor, menggantikan alur manual berbasis dokumen fisik dengan sistem web terintegrasi.

---

## Project Overview

KreditMoto mendukung digitalisasi end-to-end proses pengajuan kredit kendaraan bermotor:

- **Pengumpulan data konsumen** secara digital
- **Input data pengajuan kredit** dengan validasi otomatis
- **Upload & validasi dokumen** persyaratan
- **Workflow approval** berjenjang dengan audit trail
- **Generate Kontrak/PO** digital
- **Persetujuan & tanda tangan** dokumen
- **Monitoring status** real-time
- **Penyimpanan dokumen** aman

---

## Architecture

```
kredit-app/
├── src/
│   ├── app/
│   │   ├── (auth)/login/          # Login page
│   │   ├── (dashboard)/           # Protected dashboard pages
│   │   │   ├── dashboard/         # Dashboard & stats
│   │   │   ├── customers/         # Customer management
│   │   │   ├── applications/      # Credit application management
│   │   │   ├── approvals/         # Approval workflow (Atasan Marketing)
│   │   │   └── monitoring/        # Monitoring (Admin & Atasan)
│   │   └── api/                   # REST API routes
│   │       ├── auth/              # Authentication
│   │       ├── customers/         # Customer CRUD
│   │       ├── applications/      # Application CRUD + workflow
│   │       ├── approvals/         # Approval endpoints
│   │       ├── contracts/         # Contract generation
│   │       ├── monitoring/        # Monitoring & stats
│   │       ├── dashboard/         # Dashboard data
│   │       ├── users/             # User lookup
│   │       └── uploads/           # Secure file serving
│   ├── components/                # Reusable React components
│   ├── lib/                       # Utilities & configuration
│   │   ├── auth.ts                # JWT auth helpers
│   │   ├── prisma.ts              # Prisma client singleton
│   │   ├── validations.ts         # Zod validation schemas
│   │   ├── rbac.ts                # Role-based access control
│   │   ├── file-upload.ts         # File upload handler
│   │   ├── generate-number.ts     # Application/contract number generator
│   │   └── constants.ts           # App constants (statuses, roles, etc.)
│   ├── middleware.ts               # Route protection middleware
│   └── types/                     # TypeScript type definitions
├── prisma/
│   ├── schema.prisma              # Database schema
│   ├── seed.js                    # Demo data seeder
│   └── test.js                    # Business logic tests
├── uploads/                       # File storage (gitignored)
└── .env.local                     # Environment variables
```

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router) + React 19 |
| Backend | Next.js API Routes |
| ORM | Prisma v5 |
| Database | SQLite (file-based, zero config) |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Validation | Zod |
| Styling | Vanilla CSS (custom design system) |
| Language | TypeScript |

---

## Installation

### Prerequisites
- Node.js >= 18.x
- npm >= 9.x

### Steps

```bash
# 1. Masuk ke direktori aplikasi
cd kredit-app

# 2. Install dependencies
npm install

# 3. Setup database & seed data
npm run setup
```

---

## Environment Configuration

File `.env.local` sudah tersedia dengan konfigurasi default:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="kredit-moto-super-secret-key-bca-finance-2024"
NODE_ENV="development"
```

Untuk production, ganti JWT_SECRET dengan nilai yang lebih aman.

---

## Database Setup

```bash
# Push schema ke database (SQLite)
npx prisma db push

# Atau gunakan migration (untuk production)
npm run db:migrate
```

---

## Migration

```bash
# Buat migration baru (development)
npx prisma migrate dev --name <nama-migration>

# Apply migrations (production)
npx prisma migrate deploy
```

---

## Seeder

```bash
# Jalankan seed data demo
npm run seed
# atau
npm run db:seed
```

---

## Cara Menjalankan Aplikasi

```bash
# Development mode
npm run dev
# Aplikasi berjalan di http://localhost:3000

# Production build
npm run build
npm start
```

---

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Sales Dealer | `sales@demo.com` | `password123` |
| Marketing | `marketing@demo.com` | `password123` |
| Marketing 2 | `marketing2@demo.com` | `password123` |
| Atasan Marketing | `atasan@demo.com` | `password123` |
| Admin Backoffice | `admin@demo.com` | `password123` |

---

## Struktur Folder

```
src/app/api/                    REST API endpoints
src/app/(auth)/                 Authentication pages (login)
src/app/(dashboard)/            Protected dashboard pages
src/lib/auth.ts                 JWT token management
src/lib/rbac.ts                 Permission matrix
src/lib/validations.ts          Input validation schemas
src/lib/constants.ts            Status codes, roles, document types
src/middleware.ts               Route-level auth protection
prisma/schema.prisma            Database schema (7 entities)
prisma/seed.js                  Demo data (5 users, 5 customers, 6 apps)
prisma/test.js                  Business workflow tests (12 tests)
uploads/                        Uploaded file storage
```

---

## Role / Permission

### Sales Dealer
- Membuat data konsumen baru
- Membuat pengajuan kredit baru
- Upload dokumen awal (KTP, KK, dll)
- Melihat pengajuan yang dibuatnya

### Marketing
- Melihat & mengelola pengajuan yang ditugaskan
- Edit data pengajuan
- Upload/hapus dokumen
- Submit pengajuan untuk approval
- Generate kontrak setelah approved
- Upload dokumen signed

### Atasan Marketing
- Review daftar pengajuan pending approval
- Approve atau reject pengajuan (dengan catatan)
- Melihat riwayat approval
- Approve kontrak/PO yang sudah dibuat

### Admin Backoffice
- Monitoring seluruh pengajuan
- Melihat semua data, dokumen, dan kontrak
- Menyelesaikan proses (mark as COMPLETED)
- Akses monitoring dan filter terlengkap

---

## Penjelasan Workflow

```
Sales Dealer
  → Buat Konsumen
  → Buat Pengajuan (DRAFT)
  → Upload KTP + KK + Bukti Bayar + SPK
  
Marketing
  → Review Dokumen (DOCUMENT_INCOMPLETE / READY_FOR_SUBMISSION)
  → Submit Pengajuan (WAITING_APPROVAL)

Atasan Marketing
  → Review Pengajuan
  → APPROVE → status: APPROVED
  → REJECT  → status: REJECTED

Marketing (setelah APPROVED)
  → Generate Kontrak/PO (CONTRACT_GENERATED)
  → Approve Kontrak (WAITING_DOCUMENT_APPROVAL)
  → Mark Signed (DOCUMENT_SIGNED)
  → Upload Dokumen Signed (SIGNED_DOCUMENT_UPLOADED)

Admin / Marketing
  → Selesaikan Proses (COMPLETED)
```

### Status Lifecycle

```
DRAFT
  → DOCUMENT_INCOMPLETE   (ada dokumen tapi belum lengkap)
  → READY_FOR_SUBMISSION  (semua dokumen wajib ada)
  → WAITING_APPROVAL      (submitted)
  → APPROVED              (disetujui atasan)
  → REJECTED              (ditolak atasan)
  → CONTRACT_GENERATED    (kontrak/PO dibuat)
  → WAITING_DOCUMENT_APPROVAL (kontrak disetujui, menunggu TTD)
  → DOCUMENT_SIGNED       (dokumen ditandatangani)
  → SIGNED_DOCUMENT_UPLOADED (dokumen signed diupload)
  → COMPLETED             (selesai)
```

---

## API Endpoint Utama

### Authentication
- `POST /api/auth/login` — Login
- `POST /api/auth/logout` — Logout
- `GET /api/auth/me` — Current user

### Customers
- `GET /api/customers` — List customers (search, pagination)
- `POST /api/customers` — Create customer
- `GET /api/customers/:id` — Customer detail
- `PUT /api/customers/:id` — Update customer

### Applications
- `GET /api/applications` — List applications (filter, pagination)
- `POST /api/applications` — Create application
- `GET /api/applications/:id` — Application detail (full)
- `PUT /api/applications/:id` — Update application
- `POST /api/applications/:id/submit` — Submit for approval
- `POST /api/applications/:id/documents` — Upload document
- `DELETE /api/applications/:id/documents/:docId` — Delete document
- `POST /api/applications/:id/signed-document` — Upload signed doc
- `POST /api/applications/:id/complete` — Mark as completed

### Approvals
- `GET /api/approvals` — List pending approvals
- `POST /api/approvals/:id` — Approve or reject

### Contracts
- `POST /api/contracts` — Generate contract/PO
- `POST /api/contracts/:id/approve` — Approve contract
- `POST /api/contracts/:id/sign` — Mark as signed

### Monitoring & Dashboard
- `GET /api/monitoring` — Full monitoring (filter, pagination, stats)
- `GET /api/dashboard` — Dashboard summary

### Files
- `GET /api/uploads/[...path]` — Secure file access (auth required)

---

## Cara Menjalankan Test

```bash
npm test
# atau
node prisma/test.js
```

Test mencakup 12 skenario:
1. Customer dapat dibuat
2. NIK duplikat ditolak
3. Application dapat dibuat
4. Application tidak dapat disubmit tanpa dokumen wajib
5. Approval hanya oleh Atasan Marketing
6. Approval mengubah status menjadi APPROVED
7. Rejection mengubah status menjadi REJECTED
8. Contract/PO hanya setelah APPROVED
9. Transisi status invalid ditolak
10. Application dapat menjadi COMPLETED
11. Role-based access control check
12. Audit trail status history tercatat

---

## Asumsi yang Digunakan

1. **Perhitungan angsuran**: Menggunakan bunga flat 1.8%/bulan. Formula: `angsuran = (pokok/tenor) + (pokok × rate)`. Ini adalah asumsi demo; angka aktual mengikuti kebijakan perusahaan.

2. **Dokumen wajib**: KTP, KK, Bukti Bayar Tanda Jadi, SPK. Aplikasi hanya dapat disubmit jika keempat dokumen ini ada.

3. **Konsumen tidak login**: Konsumen hanya direpresentasikan sebagai data. Scope tidak mencakup portal konsumen.

4. **File storage**: File disimpan di folder `uploads/` lokal. Untuk production, gunakan cloud storage (S3, GCS, dll).

5. **JWT auth**: Session disimpan sebagai HTTP-only cookie dengan masa berlaku 24 jam. Tidak menggunakan refresh token untuk simplisitas.

6. **Tanda tangan elektronik**: Tidak menggunakan e-sign provider eksternal. Workflow tanda tangan dilakukan melalui upload scan/foto dokumen yang sudah ditandatangani secara fisik.

7. **Nomor dokumen**: Dibuat secara sistematis dengan format `APP-YYYYMM-XXXX` untuk aplikasi dan `CTR-YYYYMM-XXXX` untuk kontrak.
