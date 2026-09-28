import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { creditApplicationSchema } from "@/lib/validations";
import { hasPermission, canReadApplication } from "@/lib/rbac";
import { generateApplicationNumber } from "@/lib/generate-number";
import { ROLES } from "@/lib/constants";

const includeAll = {
  customer: true,
  createdBy: { select: { id: true, name: true, email: true, role: true } },
  assignedMarketing: { select: { id: true, name: true, email: true, role: true } },
  documents: { include: { uploadedBy: { select: { id: true, name: true, role: true } } } },
  contract: true,
  _count: { select: { approvalHistories: true, statusHistories: true } },
};

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";
  const dealer = searchParams.get("dealer") || "";
  const marketingId = searchParams.get("marketingId") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "10");

  let where: Record<string, unknown> = {};

  // Role-based filtering
  if (user.role === ROLES.SALES_DEALER) {
    where.createdById = user.userId;
  } else if (user.role === ROLES.MARKETING) {
    where.OR = [{ createdById: user.userId }, { assignedMarketingId: user.userId }];
  }

  if (search) {
    const searchWhere = {
      OR: [
        { applicationNumber: { contains: search } },
        { customer: { name: { contains: search } } },
      ],
    };
    where = { AND: [where, searchWhere] };
  }

  if (status) (where as Record<string, unknown>).status = status;
  if (dealer) (where as Record<string, unknown>).dealerName = { contains: dealer };
  if (marketingId) (where as Record<string, unknown>).assignedMarketingId = marketingId;

  const [data, total] = await Promise.all([
    prisma.creditApplication.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        customer: { select: { id: true, name: true, nik: true } },
        createdBy: { select: { id: true, name: true, role: true } },
        assignedMarketing: { select: { id: true, name: true, role: true } },
      },
    }),
    prisma.creditApplication.count({ where }),
  ]);

  return NextResponse.json({ success: true, data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(user.role, "application:create")) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const parsed = creditApplicationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.issues[0].message, errors: parsed.error.issues }, { status: 400 });
  }

  const applicationNumber = await generateApplicationNumber();

  const application = await prisma.creditApplication.create({
    data: {
      applicationNumber,
      customerId: parsed.data.customerId,
      createdById: user.userId,
      assignedMarketingId: parsed.data.assignedMarketingId || null,
      status: "DRAFT",
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

  // Log status history
  await prisma.applicationStatusHistory.create({
    data: {
      applicationId: application.id,
      oldStatus: null,
      newStatus: "DRAFT",
      changedById: user.userId,
      note: "Pengajuan dibuat",
    },
  });

  return NextResponse.json({ success: true, data: application }, { status: 201 });
}
