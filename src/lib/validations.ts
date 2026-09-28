import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

export const customerSchema = z.object({
  nik: z
    .string()
    .min(16, "NIK harus 16 digit")
    .max(16, "NIK harus 16 digit")
    .regex(/^[0-9]+$/, "NIK hanya boleh berisi angka"),
  name: z.string().min(2, "Nama minimal 2 karakter"),
  placeOfBirth: z.string().min(2, "Tempat lahir wajib diisi"),
  dateOfBirth: z.string().min(1, "Tanggal lahir wajib diisi"),
  maritalStatus: z.enum(["SINGLE", "MARRIED", "DIVORCED", "WIDOWED"]),
  spouseName: z.string().optional(),
  address: z.string().min(10, "Alamat minimal 10 karakter"),
  phone: z
    .string()
    .min(10, "Nomor telepon minimal 10 digit")
    .regex(/^[0-9+\-\s]+$/, "Format nomor telepon tidak valid"),
  email: z.string().email("Format email tidak valid").optional().or(z.literal("")),
});

export const creditApplicationSchema = z.object({
  customerId: z.string().min(1, "Konsumen wajib dipilih"),
  assignedMarketingId: z.string().optional(),
  dealerName: z.string().min(2, "Nama dealer wajib diisi"),
  vehicleBrand: z.string().min(1, "Merek kendaraan wajib diisi"),
  vehicleModel: z.string().min(1, "Model kendaraan wajib diisi"),
  vehicleType: z.string().min(1, "Tipe kendaraan wajib diisi"),
  vehicleYear: z.number().min(2000).max(2030),
  vehicleColor: z.string().min(1, "Warna kendaraan wajib diisi"),
  vehiclePrice: z.number().min(1, "Harga kendaraan wajib diisi"),
  downPayment: z.number().min(0, "Uang muka tidak boleh negatif"),
  loanAmount: z.number().min(1, "Jumlah pembiayaan wajib diisi"),
  tenorMonths: z.number().min(6).max(60),
  monthlyInstallment: z.number().min(0),
  insurance: z.number().min(0).default(0),
  totalLoanCost: z.number().min(0).default(0),
});

export const approvalSchema = z.object({
  action: z.enum(["APPROVED", "REJECTED"]),
  note: z.string().optional(),
});
