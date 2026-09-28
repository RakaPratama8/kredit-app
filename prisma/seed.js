const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // Create users
  const passwordHash = await bcrypt.hash("password123", 12);

  const sales = await prisma.user.upsert({
    where: { email: "sales@demo.com" },
    update: {},
    create: {
      name: "Budi Santoso",
      email: "sales@demo.com",
      password: passwordHash,
      role: "SALES_DEALER",
      isActive: true,
    },
  });

  const marketing1 = await prisma.user.upsert({
    where: { email: "marketing@demo.com" },
    update: {},
    create: {
      name: "Siti Rahayu",
      email: "marketing@demo.com",
      password: passwordHash,
      role: "MARKETING",
      isActive: true,
    },
  });

  const marketing2 = await prisma.user.upsert({
    where: { email: "marketing2@demo.com" },
    update: {},
    create: {
      name: "Agus Prayogo",
      email: "marketing2@demo.com",
      password: passwordHash,
      role: "MARKETING",
      isActive: true,
    },
  });

  const atasan = await prisma.user.upsert({
    where: { email: "atasan@demo.com" },
    update: {},
    create: {
      name: "Hendra Kurniawan",
      email: "atasan@demo.com",
      password: passwordHash,
      role: "ATASAN_MARKETING",
      isActive: true,
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@demo.com" },
    update: {},
    create: {
      name: "Dewi Lestari",
      email: "admin@demo.com",
      password: passwordHash,
      role: "ADMIN_BACKOFFICE",
      isActive: true,
    },
  });

  console.log("✅ Users created:", [sales.name, marketing1.name, marketing2.name, atasan.name, admin.name].join(", "));

  // Create customers
  const customers = await Promise.all([
    prisma.customer.upsert({
      where: { nik: "3171012345678901" },
      update: {},
      create: {
        nik: "3171012345678901",
        name: "Ahmad Fauzi",
        placeOfBirth: "Jakarta",
        dateOfBirth: new Date("1990-05-15"),
        maritalStatus: "MARRIED",
        spouseName: "Rina Fauzi",
        address: "Jl. Merdeka No. 10, Jakarta Pusat, DKI Jakarta 10110",
        phone: "081234567890",
        email: "ahmad.fauzi@email.com",
      },
    }),
    prisma.customer.upsert({
      where: { nik: "3372022345678902" },
      update: {},
      create: {
        nik: "3372022345678902",
        name: "Rini Susanti",
        placeOfBirth: "Semarang",
        dateOfBirth: new Date("1992-08-22"),
        maritalStatus: "SINGLE",
        address: "Jl. Diponegoro No. 25, Semarang, Jawa Tengah 50244",
        phone: "082345678901",
        email: "rini.susanti@email.com",
      },
    }),
    prisma.customer.upsert({
      where: { nik: "3578033456789903" },
      update: {},
      create: {
        nik: "3578033456789903",
        name: "Wahyu Setiawan",
        placeOfBirth: "Surabaya",
        dateOfBirth: new Date("1988-12-10"),
        maritalStatus: "MARRIED",
        spouseName: "Indah Setiawan",
        address: "Jl. Pemuda No. 88, Surabaya, Jawa Timur 60271",
        phone: "083456789012",
        email: "wahyu.setiawan@email.com",
      },
    }),
    prisma.customer.upsert({
      where: { nik: "3273044567890004" },
      update: {},
      create: {
        nik: "3273044567890004",
        name: "Nurul Hidayah",
        placeOfBirth: "Bandung",
        dateOfBirth: new Date("1995-03-28"),
        maritalStatus: "SINGLE",
        address: "Jl. Asia Afrika No. 12, Bandung, Jawa Barat 40111",
        phone: "084567890123",
        email: "nurul.hidayah@email.com",
      },
    }),
    prisma.customer.upsert({
      where: { nik: "3471055678901105" },
      update: {},
      create: {
        nik: "3471055678901105",
        name: "Dedi Kurniawan",
        placeOfBirth: "Yogyakarta",
        dateOfBirth: new Date("1985-07-04"),
        maritalStatus: "MARRIED",
        spouseName: "Sri Kurniawan",
        address: "Jl. Malioboro No. 56, Yogyakarta 55213",
        phone: "085678901234",
        email: "dedi.kurniawan@email.com",
      },
    }),
  ]);
  console.log("✅ Customers created:", customers.map(c => c.name).join(", "));

  // Counter for unique application numbers
  const now = new Date();
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;

  const createApp = async (appNum, customerId, createdById, assignedId, status, vehicleData, financingData, extraData = {}) => {
    const existing = await prisma.creditApplication.findUnique({ where: { applicationNumber: appNum } });
    if (existing) return existing;
    return prisma.creditApplication.create({
      data: {
        applicationNumber: appNum,
        customerId,
        createdById,
        assignedMarketingId: assignedId,
        status,
        ...vehicleData,
        ...financingData,
        ...extraData,
      },
    });
  };

  // Application 1: WAITING_APPROVAL
  const app1 = await createApp(
    `APP-${yearMonth}-0001`,
    customers[0].id, sales.id, marketing1.id,
    "WAITING_APPROVAL",
    { dealerName: "Honda Mega Prima Jakarta", vehicleBrand: "Honda", vehicleModel: "Beat", vehicleType: "CBS ISS", vehicleYear: 2024, vehicleColor: "Merah", vehiclePrice: 21500000 },
    { downPayment: 4000000, loanAmount: 17500000, tenorMonths: 36, monthlyInstallment: 622000, insurance: 500000, totalLoanCost: 22392000 },
    { submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) }
  );

  if (app1 && app1.status === "WAITING_APPROVAL") {
    await prisma.applicationStatusHistory.createMany({
      data: [
        { applicationId: app1.id, oldStatus: null, newStatus: "DRAFT", changedById: sales.id, note: "Pengajuan dibuat", createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
        { applicationId: app1.id, oldStatus: "DRAFT", newStatus: "DOCUMENT_INCOMPLETE", changedById: sales.id, note: "Dokumen diupload", createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) },
        { applicationId: app1.id, oldStatus: "DOCUMENT_INCOMPLETE", newStatus: "READY_FOR_SUBMISSION", changedById: marketing1.id, note: "Dokumen lengkap", createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
        { applicationId: app1.id, oldStatus: "READY_FOR_SUBMISSION", newStatus: "WAITING_APPROVAL", changedById: marketing1.id, note: "Submit untuk approval", createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
      ],
      skipDuplicates: true,
    }).catch(() => {});
  }

  // Application 2: APPROVED with CONTRACT
  const app2 = await createApp(
    `APP-${yearMonth}-0002`,
    customers[1].id, sales.id, marketing1.id,
    "CONTRACT_GENERATED",
    { dealerName: "Yamaha Sentral Motor Semarang", vehicleBrand: "Yamaha", vehicleModel: "NMAX", vehicleType: "ABS", vehicleYear: 2024, vehicleColor: "Hitam", vehiclePrice: 35800000 },
    { downPayment: 7000000, loanAmount: 28800000, tenorMonths: 48, monthlyInstallment: 819000, insurance: 800000, totalLoanCost: 39312000 },
    { submittedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), approvedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
  );

  if (app2) {
    const contractExists = await prisma.contract.findUnique({ where: { applicationId: app2.id } });
    if (!contractExists) {
      await prisma.contract.create({
        data: {
          applicationId: app2.id,
          documentNumber: `CTR-${yearMonth}-0002`,
          status: "GENERATED",
          generatedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        },
      });
    }
    await prisma.approvalHistory.createMany({
      data: [{ applicationId: app2.id, approverId: atasan.id, action: "APPROVED", note: "Data dan dokumen lengkap, disetujui", createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }],
      skipDuplicates: true,
    }).catch(() => {});
    await prisma.applicationStatusHistory.createMany({
      data: [
        { applicationId: app2.id, oldStatus: null, newStatus: "DRAFT", changedById: sales.id, note: "Dibuat", createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) },
        { applicationId: app2.id, oldStatus: "DRAFT", newStatus: "READY_FOR_SUBMISSION", changedById: marketing1.id, note: "Dokumen lengkap", createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000) },
        { applicationId: app2.id, oldStatus: "READY_FOR_SUBMISSION", newStatus: "WAITING_APPROVAL", changedById: marketing1.id, note: "Disubmit", createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) },
        { applicationId: app2.id, oldStatus: "WAITING_APPROVAL", newStatus: "APPROVED", changedById: atasan.id, note: "Disetujui", createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        { applicationId: app2.id, oldStatus: "APPROVED", newStatus: "CONTRACT_GENERATED", changedById: marketing1.id, note: "Kontrak dibuat", createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000) },
      ],
      skipDuplicates: true,
    }).catch(() => {});
  }

  // Application 3: COMPLETED
  const app3 = await createApp(
    `APP-${yearMonth}-0003`,
    customers[2].id, marketing2.id, marketing2.id,
    "COMPLETED",
    { dealerName: "Honda Surabaya Motor", vehicleBrand: "Honda", vehicleModel: "PCX", vehicleType: "ABS", vehicleYear: 2023, vehicleColor: "Putih", vehiclePrice: 33900000 },
    { downPayment: 6500000, loanAmount: 27400000, tenorMonths: 36, monthlyInstallment: 972000, insurance: 750000, totalLoanCost: 34992000 },
    { submittedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), approvedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000) }
  );

  if (app3) {
    const contractExists = await prisma.contract.findUnique({ where: { applicationId: app3.id } });
    if (!contractExists) {
      await prisma.contract.create({
        data: {
          applicationId: app3.id,
          documentNumber: `CTR-${yearMonth}-0003`,
          status: "SIGNED",
          generatedAt: new Date(Date.now() - 24 * 24 * 60 * 60 * 1000),
          approvedAt: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000),
        },
      });
    }
  }

  // Application 4: REJECTED
  const app4 = await createApp(
    `APP-${yearMonth}-0004`,
    customers[3].id, sales.id, marketing1.id,
    "REJECTED",
    { dealerName: "Suzuki Bandung Center", vehicleBrand: "Suzuki", vehicleModel: "GSX-R150", vehicleType: "Standard", vehicleYear: 2024, vehicleColor: "Biru", vehiclePrice: 29500000 },
    { downPayment: 3000000, loanAmount: 26500000, tenorMonths: 48, monthlyInstallment: 753000, insurance: 600000, totalLoanCost: 36144000 },
    { submittedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), rejectedAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000), rejectionReason: "DP terlalu kecil, minimum DP 20% dari harga kendaraan. Silakan ajukan ulang dengan DP yang sesuai." }
  );

  // Application 5: DRAFT
  const app5 = await createApp(
    `APP-${yearMonth}-0005`,
    customers[4].id, sales.id, marketing2.id,
    "DRAFT",
    { dealerName: "Kawasaki Motor Yogyakarta", vehicleBrand: "Kawasaki", vehicleModel: "Ninja ZX-25R", vehicleType: "Sport", vehicleYear: 2024, vehicleColor: "Hijau", vehiclePrice: 89500000 },
    { downPayment: 20000000, loanAmount: 69500000, tenorMonths: 36, monthlyInstallment: 2469000, insurance: 1500000, totalLoanCost: 88884000 }
  );

  // Application 6: DOCUMENT_INCOMPLETE
  const app6 = await createApp(
    `APP-${yearMonth}-0006`,
    customers[0].id, sales.id, marketing1.id,
    "DOCUMENT_INCOMPLETE",
    { dealerName: "Honda Mega Prima Jakarta", vehicleBrand: "Honda", vehicleModel: "Vario 160", vehicleType: "CBS ISS", vehicleYear: 2024, vehicleColor: "Silver", vehiclePrice: 26900000 },
    { downPayment: 5000000, loanAmount: 21900000, tenorMonths: 24, monthlyInstallment: 1059000, insurance: 550000, totalLoanCost: 25416000 }
  );

  console.log("✅ Sample applications created");
  console.log("\n🎉 Seed complete! Demo credentials:");
  console.log("  Sales Dealer    : sales@demo.com / password123");
  console.log("  Marketing       : marketing@demo.com / password123");
  console.log("  Atasan Marketing: atasan@demo.com / password123");
  console.log("  Admin Backoffice: admin@demo.com / password123");
}

main()
  .catch((e) => { console.error("❌ Seed error:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
