import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { creditApplicationSchema } from "@/lib/validations";
import { canReadApplication, hasPermission } from "@/lib/rbac";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const app = await prisma.creditApplication.findUnique({
    where: { id },
    include: {
      customer: true,
      createdBy: { select: { id: true, name: true, email: true, role: true } },
      assignedMarketing: { select: { id: true, name: true, email: true, role: true } },
      documents: { include: { uploadedBy: { select: { id: true, name: true, role: true } } }, orderBy: { uploadedAt: "desc" } },
      approvalHistories: { include: { approver: { select: { id: true, name: true, role: true } } }, orderBy: { createdAt: "desc" } },
      statusHistories: { include: { changedBy: { select: { id: true, name: true, role: true } } }, orderBy: { createdAt: "asc" } },
      contract: true,
    },
  });

  if (!app) return NextResponse.json({ success: false, error: "Pengajuan tidak ditemukan" }, { status: 404 });
  if (!canReadApplication(user.role, user.userId, app.createdById, app.assignedMarketingId)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ success: true, data: app });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(user.role, "application:update")) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await request.json();
  const parsed = creditApplicationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
  }

  const existing = await prisma.creditApplication.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ success: false, error: "Pengajuan tidak ditemukan" }, { status: 404 });

  const editableStatuses = ["DRAFT", "DOCUMENT_INCOMPLETE", "READY_FOR_SUBMISSION"];
  if (!editableStatuses.includes(existing.status)) {
    return NextResponse.json({ success: false, error: "Pengajuan tidak dapat diubah pada status ini" }, { status: 422 });
  }

  const updated = await prisma.creditApplication.update({
    where: { id },
    data: {
      customerId: parsed.data.customerId,
      assignedMarketingId: parsed.data.assignedMarketingId || null,
      dealerName: parsed.data.dealerName,
      vehicleBrand: parsed.data.vehicleBrand,
      vehicleModel: parsed.data.vehicleModel,
      vehicleType: parsed.data.vehicleType,
      vehicleYear: parsed.data.vehicleYear,
      vehicleColor: parsed.data.vehicleColor,
      vehiclePrice: parsed.data.vehiclePrice,
      downPayment: parsed.data.downPayment,
      loanAmount: parsed.data.loanAmount,
      tenorMonths: parsed.data.tenorMonths,
      monthlyInstallment: parsed.data.monthlyInstallment,
      insurance: parsed.data.insurance || 0,
      totalLoanCost: parsed.data.totalLoanCost || 0,
    },
  });

  return NextResponse.json({ success: true, data: updated });
}
