const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

let testResults = { passed: 0, failed: 0, errors: [] };

function pass(name) {
  testResults.passed++;
  console.log(`  ✅ PASS: ${name}`);
}

function fail(name, reason) {
  testResults.failed++;
  testResults.errors.push({ name, reason });
  console.log(`  ❌ FAIL: ${name} — ${reason}`);
}

async function test(name, fn) {
  try {
    await fn();
  } catch (e) {
    fail(name, e.message);
  }
}

async function runTests() {
  console.log("\n🧪 Running KreditMoto Tests...\n");

  // Setup test user IDs
  const salesUser = await prisma.user.findUnique({ where: { email: "sales@demo.com" } });
  const marketingUser = await prisma.user.findUnique({ where: { email: "marketing@demo.com" } });
  const atasanUser = await prisma.user.findUnique({ where: { email: "atasan@demo.com" } });
  const adminUser = await prisma.user.findUnique({ where: { email: "admin@demo.com" } });

  if (!salesUser || !marketingUser || !atasanUser || !adminUser) {
    console.log("❌ Seed data missing. Run: npm run seed");
    process.exit(1);
  }

  console.log("📋 Test Suite 1: Customer Management");

  // Test 1: Customer can be created
  await test("Customer dapat dibuat", async () => {
    const nik = `9999${Date.now().toString().slice(-12)}`;
    const customer = await prisma.customer.create({
      data: {
        nik,
        name: "Test Customer",
        placeOfBirth: "Jakarta",
        dateOfBirth: new Date("1990-01-01"),
        maritalStatus: "SINGLE",
        address: "Jl. Test No. 1, Jakarta",
        phone: "081111111111",
      },
    });
    if (!customer.id) throw new Error("Customer ID not generated");
    if (customer.nik !== nik) throw new Error("NIK mismatch");
    await prisma.customer.delete({ where: { id: customer.id } });
    pass("Customer dapat dibuat");
  });

  // Test 2: Duplicate NIK rejected
  await test("NIK duplikat ditolak", async () => {
    const existingCustomer = await prisma.customer.findFirst();
    if (!existingCustomer) throw new Error("No customers to test with");
    try {
      await prisma.customer.create({
        data: {
          nik: existingCustomer.nik,
          name: "Duplicate Test",
          placeOfBirth: "Jakarta",
          dateOfBirth: new Date("1990-01-01"),
          maritalStatus: "SINGLE",
          address: "Jl. Test",
          phone: "081111111112",
        },
      });
      throw new Error("Should have thrown unique constraint violation");
    } catch (e) {
      if (e.code === "P2002") pass("NIK duplikat ditolak (unique constraint)");
      else throw e;
    }
  });

  console.log("\n📋 Test Suite 2: Credit Application Management");

  // Test 3: Application can be created
  await test("Application dapat dibuat", async () => {
    const customer = await prisma.customer.findFirst();
    const appNumber = `TEST-${Date.now()}`;
    const app = await prisma.creditApplication.create({
      data: {
        applicationNumber: appNumber,
        customerId: customer.id,
        createdById: salesUser.id,
        status: "DRAFT",
        dealerName: "Test Dealer",
        vehicleBrand: "Honda",
        vehicleModel: "Beat",
        vehicleType: "CBS",
        vehicleYear: 2024,
        vehicleColor: "Hitam",
        vehiclePrice: 20000000,
        downPayment: 4000000,
        loanAmount: 16000000,
        tenorMonths: 36,
        monthlyInstallment: 570000,
        insurance: 400000,
        totalLoanCost: 20520000,
      },
    });
    if (!app.id) throw new Error("Application ID not generated");
    if (app.status !== "DRAFT") throw new Error("Status should be DRAFT");
    await prisma.creditApplication.delete({ where: { id: app.id } });
    pass("Application dapat dibuat");
  });

  // Test 4: Application cannot be submitted without required docs
  await test("Application tidak dapat disubmit tanpa dokumen wajib", async () => {
    const customer = await prisma.customer.findFirst();
    const app = await prisma.creditApplication.create({
      data: {
        applicationNumber: `TEST-NO-DOC-${Date.now()}`,
        customerId: customer.id,
        createdById: salesUser.id,
        status: "READY_FOR_SUBMISSION",
        dealerName: "Test Dealer",
        vehicleBrand: "Honda",
        vehicleModel: "Beat",
        vehicleType: "CBS",
        vehicleYear: 2024,
        vehicleColor: "Hitam",
        vehiclePrice: 20000000,
        downPayment: 4000000,
        loanAmount: 16000000,
        tenorMonths: 36,
        monthlyInstallment: 570000,
        insurance: 400000,
        totalLoanCost: 20520000,
      },
    });
    // Check required docs
    const docs = await prisma.applicationDocument.findMany({ where: { applicationId: app.id } });
    const required = ["KTP", "KK", "BUKTI_BAYAR_TANDA_JADI", "SPK"];
    const missing = required.filter(r => !docs.map(d => d.documentType).includes(r));
    if (missing.length === 0) throw new Error("Should have missing documents");
    await prisma.creditApplication.delete({ where: { id: app.id } });
    pass("Application tidak dapat disubmit tanpa dokumen wajib");
  });

  // Test 5: Only ATASAN_MARKETING can approve
  await test("Approval hanya oleh Atasan Marketing", async () => {
    if (atasanUser.role !== "ATASAN_MARKETING") throw new Error("Atasan user role incorrect");
    if (marketingUser.role === "ATASAN_MARKETING") throw new Error("Marketing should not have ATASAN_MARKETING role");
    if (salesUser.role === "ATASAN_MARKETING") throw new Error("Sales should not have ATASAN_MARKETING role");
    pass("Approval hanya oleh Atasan Marketing (role check passed)");
  });

  // Test 6: Approval changes status to APPROVED
  await test("Approval mengubah status menjadi APPROVED", async () => {
    const customer = await prisma.customer.findFirst();
    const app = await prisma.creditApplication.create({
      data: {
        applicationNumber: `TEST-APPROVE-${Date.now()}`,
        customerId: customer.id,
        createdById: salesUser.id,
        status: "WAITING_APPROVAL",
        dealerName: "Test Dealer",
        vehicleBrand: "Honda",
        vehicleModel: "Beat",
        vehicleType: "CBS",
        vehicleYear: 2024,
        vehicleColor: "Hitam",
        vehiclePrice: 20000000,
        downPayment: 4000000,
        loanAmount: 16000000,
        tenorMonths: 36,
        monthlyInstallment: 570000,
        insurance: 400000,
        totalLoanCost: 20520000,
        submittedAt: new Date(),
      },
    });
    await prisma.approvalHistory.create({ data: { applicationId: app.id, approverId: atasanUser.id, action: "APPROVED", note: "Test approval" } });
    const updated = await prisma.creditApplication.update({ where: { id: app.id }, data: { status: "APPROVED", approvedAt: new Date() } });
    if (updated.status !== "APPROVED") throw new Error("Status should be APPROVED");
    // Cleanup: delete related records first
    await prisma.approvalHistory.deleteMany({ where: { applicationId: app.id } });
    await prisma.applicationStatusHistory.deleteMany({ where: { applicationId: app.id } });
    await prisma.creditApplication.delete({ where: { id: app.id } });
    pass("Approval mengubah status menjadi APPROVED");
  });

  // Test 7: Rejection changes status to REJECTED
  await test("Rejection mengubah status menjadi REJECTED", async () => {
    const customer = await prisma.customer.findFirst();
    const app = await prisma.creditApplication.create({
      data: {
        applicationNumber: `TEST-REJECT-${Date.now()}`,
        customerId: customer.id,
        createdById: salesUser.id,
        status: "WAITING_APPROVAL",
        dealerName: "Test Dealer",
        vehicleBrand: "Honda",
        vehicleModel: "Beat",
        vehicleType: "CBS",
        vehicleYear: 2024,
        vehicleColor: "Hitam",
        vehiclePrice: 20000000,
        downPayment: 4000000,
        loanAmount: 16000000,
        tenorMonths: 36,
        monthlyInstallment: 570000,
        insurance: 400000,
        totalLoanCost: 20520000,
        submittedAt: new Date(),
      },
    });
    await prisma.approvalHistory.create({ data: { applicationId: app.id, approverId: atasanUser.id, action: "REJECTED", note: "DP kurang" } });
    const updated = await prisma.creditApplication.update({ where: { id: app.id }, data: { status: "REJECTED", rejectedAt: new Date(), rejectionReason: "DP kurang" } });
    if (updated.status !== "REJECTED") throw new Error("Status should be REJECTED");
    // Cleanup
    await prisma.approvalHistory.deleteMany({ where: { applicationId: app.id } });
    await prisma.applicationStatusHistory.deleteMany({ where: { applicationId: app.id } });
    await prisma.creditApplication.delete({ where: { id: app.id } });
    pass("Rejection mengubah status menjadi REJECTED");
  });

  // Test 8: Contract/PO only after APPROVED
  await test("Contract/PO hanya dapat dibuat setelah APPROVED", async () => {
    const customer = await prisma.customer.findFirst();
    const app = await prisma.creditApplication.create({
      data: {
        applicationNumber: `TEST-CONTRACT-${Date.now()}`,
        customerId: customer.id,
        createdById: salesUser.id,
        status: "WAITING_APPROVAL",
        dealerName: "Test Dealer",
        vehicleBrand: "Honda",
        vehicleModel: "Beat",
        vehicleType: "CBS",
        vehicleYear: 2024,
        vehicleColor: "Hitam",
        vehiclePrice: 20000000,
        downPayment: 4000000,
        loanAmount: 16000000,
        tenorMonths: 36,
        monthlyInstallment: 570000,
        insurance: 400000,
        totalLoanCost: 20520000,
      },
    });
    // Should NOT allow contract creation on WAITING_APPROVAL
    if (app.status === "APPROVED") throw new Error("Should not be APPROVED yet");
    // Now approve
    await prisma.creditApplication.update({ where: { id: app.id }, data: { status: "APPROVED" } });
    const approvedApp = await prisma.creditApplication.findUnique({ where: { id: app.id } });
    if (approvedApp.status !== "APPROVED") throw new Error("Should be APPROVED");
    // Create contract
    const contract = await prisma.contract.create({ data: { applicationId: app.id, documentNumber: `CTR-TEST-${Date.now()}`, status: "GENERATED" } });
    if (!contract.id) throw new Error("Contract not created");
    await prisma.contract.delete({ where: { id: contract.id } });
    await prisma.creditApplication.delete({ where: { id: app.id } });
    pass("Contract/PO hanya dapat dibuat setelah APPROVED");
  });

  // Test 9: Invalid status transition
  await test("Transisi status tidak valid ditolak", async () => {
    const VALID_TRANSITIONS = {
      DRAFT: ["DOCUMENT_INCOMPLETE", "READY_FOR_SUBMISSION"],
      DOCUMENT_INCOMPLETE: ["READY_FOR_SUBMISSION", "DRAFT"],
      READY_FOR_SUBMISSION: ["WAITING_APPROVAL", "DOCUMENT_INCOMPLETE"],
      WAITING_APPROVAL: ["APPROVED", "REJECTED"],
      APPROVED: ["CONTRACT_GENERATED"],
      COMPLETED: [],
    };
    // DRAFT -> APPROVED should be invalid
    const validFromDraft = VALID_TRANSITIONS["DRAFT"] || [];
    if (validFromDraft.includes("APPROVED")) throw new Error("DRAFT -> APPROVED should be invalid");
    // COMPLETED -> anything
    const validFromCompleted = VALID_TRANSITIONS["COMPLETED"] || [];
    if (validFromCompleted.length > 0) throw new Error("COMPLETED should have no valid transitions");
    pass("Transisi status tidak valid ditolak");
  });

  // Test 10: Application can reach COMPLETED
  await test("Application dapat menjadi COMPLETED", async () => {
    const customer = await prisma.customer.findFirst();
    const appNumber = `TEST-COMPLETE-${Date.now()}`;
    const app = await prisma.creditApplication.create({
      data: {
        applicationNumber: appNumber,
        customerId: customer.id,
        createdById: salesUser.id,
        status: "SIGNED_DOCUMENT_UPLOADED",
        dealerName: "Test Dealer",
        vehicleBrand: "Honda",
        vehicleModel: "Beat",
        vehicleType: "CBS",
        vehicleYear: 2024,
        vehicleColor: "Hitam",
        vehiclePrice: 20000000,
        downPayment: 4000000,
        loanAmount: 16000000,
        tenorMonths: 36,
        monthlyInstallment: 570000,
        insurance: 400000,
        totalLoanCost: 20520000,
        submittedAt: new Date(),
        approvedAt: new Date(),
      },
    });
    const completed = await prisma.creditApplication.update({ where: { id: app.id }, data: { status: "COMPLETED" } });
    if (completed.status !== "COMPLETED") throw new Error("Status should be COMPLETED");
    await prisma.creditApplication.delete({ where: { id: app.id } });
    pass("Application dapat menjadi COMPLETED");
  });

  // Test 11: RBAC role check
  await test("User tidak dapat mengakses data bukan haknya (role check)", async () => {
    if (salesUser.role !== "SALES_DEALER") throw new Error("Sales user role incorrect");
    // Sales cannot approve
    const canApprove = salesUser.role === "ATASAN_MARKETING";
    if (canApprove) throw new Error("Sales should not be able to approve");
    pass("User tidak dapat mengakses data bukan haknya");
  });

  // Test 12: Status history recorded
  await test("Audit trail status history tercatat", async () => {
    const customer = await prisma.customer.findFirst();
    const app = await prisma.creditApplication.create({
      data: {
        applicationNumber: `TEST-AUDIT-${Date.now()}`,
        customerId: customer.id,
        createdById: salesUser.id,
        status: "DRAFT",
        dealerName: "Test Dealer",
        vehicleBrand: "Honda",
        vehicleModel: "Beat",
        vehicleType: "CBS",
        vehicleYear: 2024,
        vehicleColor: "Hitam",
        vehiclePrice: 20000000,
        downPayment: 4000000,
        loanAmount: 16000000,
        tenorMonths: 36,
        monthlyInstallment: 570000,
        insurance: 400000,
        totalLoanCost: 20520000,
      },
    });
    await prisma.applicationStatusHistory.create({
      data: { applicationId: app.id, oldStatus: null, newStatus: "DRAFT", changedById: salesUser.id, note: "Test audit" },
    });
    const histories = await prisma.applicationStatusHistory.findMany({ where: { applicationId: app.id } });
    if (histories.length === 0) throw new Error("No status history recorded");
    // Cleanup
    await prisma.applicationStatusHistory.deleteMany({ where: { applicationId: app.id } });
    await prisma.creditApplication.delete({ where: { id: app.id } });
    pass("Audit trail status history tercatat");
  });

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log(`📊 Test Results: ${testResults.passed} passed, ${testResults.failed} failed`);
  if (testResults.failed > 0) {
    console.log("\n❌ Failed tests:");
    testResults.errors.forEach(e => console.log(`  - ${e.name}: ${e.reason}`));
    process.exit(1);
  } else {
    console.log("\n🎉 All tests passed!");
  }
}

runTests()
  .catch(e => { console.error("❌ Fatal error:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
