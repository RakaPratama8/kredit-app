export const APP_NAME = "KreditMoto";
export const APP_VERSION = "1.0.0";

export const ROLES = {
  SALES_DEALER: "SALES_DEALER",
  MARKETING: "MARKETING",
  ATASAN_MARKETING: "ATASAN_MARKETING",
  ADMIN_BACKOFFICE: "ADMIN_BACKOFFICE",
} as const;

export const ROLE_LABELS: Record<string, string> = {
  SALES_DEALER: "Sales Dealer",
  MARKETING: "Marketing",
  ATASAN_MARKETING: "Atasan Marketing",
  ADMIN_BACKOFFICE: "Admin Backoffice",
};

export const APPLICATION_STATUS = {
  DRAFT: "DRAFT",
  DOCUMENT_INCOMPLETE: "DOCUMENT_INCOMPLETE",
  READY_FOR_SUBMISSION: "READY_FOR_SUBMISSION",
  WAITING_APPROVAL: "WAITING_APPROVAL",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  CONTRACT_GENERATED: "CONTRACT_GENERATED",
  WAITING_DOCUMENT_APPROVAL: "WAITING_DOCUMENT_APPROVAL",
  DOCUMENT_SIGNED: "DOCUMENT_SIGNED",
  SIGNED_DOCUMENT_UPLOADED: "SIGNED_DOCUMENT_UPLOADED",
  COMPLETED: "COMPLETED",
} as const;

export const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  DOCUMENT_INCOMPLETE: "Dokumen Belum Lengkap",
  READY_FOR_SUBMISSION: "Siap Submit",
  WAITING_APPROVAL: "Menunggu Approval",
  APPROVED: "Disetujui",
  REJECTED: "Ditolak",
  CONTRACT_GENERATED: "Kontrak Dibuat",
  WAITING_DOCUMENT_APPROVAL: "Menunggu Persetujuan Dokumen",
  DOCUMENT_SIGNED: "Dokumen Ditandatangani",
  SIGNED_DOCUMENT_UPLOADED: "Dokumen Signed Diupload",
  COMPLETED: "Selesai",
};

export const STATUS_COLORS: Record<string, string> = {
  DRAFT: "status-draft",
  DOCUMENT_INCOMPLETE: "status-incomplete",
  READY_FOR_SUBMISSION: "status-ready",
  WAITING_APPROVAL: "status-waiting",
  APPROVED: "status-approved",
  REJECTED: "status-rejected",
  CONTRACT_GENERATED: "status-contract",
  WAITING_DOCUMENT_APPROVAL: "status-doc-waiting",
  DOCUMENT_SIGNED: "status-signed",
  SIGNED_DOCUMENT_UPLOADED: "status-uploaded",
  COMPLETED: "status-completed",
};

export const DOCUMENT_TYPES = {
  KTP: "KTP",
  KK: "KK",
  BUKTI_BAYAR_TANDA_JADI: "BUKTI_BAYAR_TANDA_JADI",
  SPK: "SPK",
  SIGNED_CONTRACT: "SIGNED_CONTRACT",
  OTHER: "OTHER",
} as const;

export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  KTP: "KTP (Kartu Tanda Penduduk)",
  KK: "KK (Kartu Keluarga)",
  BUKTI_BAYAR_TANDA_JADI: "Bukti Bayar Tanda Jadi",
  SPK: "SPK (Surat Pemesanan Kendaraan)",
  SIGNED_CONTRACT: "Kontrak Ditandatangani",
  OTHER: "Dokumen Lainnya",
};

export const REQUIRED_DOCUMENTS = ["KTP", "KK", "BUKTI_BAYAR_TANDA_JADI", "SPK"];

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/pdf",
];

export const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ["DOCUMENT_INCOMPLETE", "READY_FOR_SUBMISSION"],
  DOCUMENT_INCOMPLETE: ["READY_FOR_SUBMISSION", "DRAFT"],
  READY_FOR_SUBMISSION: ["WAITING_APPROVAL", "DOCUMENT_INCOMPLETE"],
  WAITING_APPROVAL: ["APPROVED", "REJECTED"],
  APPROVED: ["CONTRACT_GENERATED"],
  REJECTED: [],
  CONTRACT_GENERATED: ["WAITING_DOCUMENT_APPROVAL"],
  WAITING_DOCUMENT_APPROVAL: ["DOCUMENT_SIGNED"],
  DOCUMENT_SIGNED: ["SIGNED_DOCUMENT_UPLOADED"],
  SIGNED_DOCUMENT_UPLOADED: ["COMPLETED"],
  COMPLETED: [],
};

export const MARITAL_STATUS_OPTIONS = [
  { value: "SINGLE", label: "Belum Menikah" },
  { value: "MARRIED", label: "Sudah Menikah" },
  { value: "DIVORCED", label: "Cerai" },
  { value: "WIDOWED", label: "Janda/Duda" },
];
