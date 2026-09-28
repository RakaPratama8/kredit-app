import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { ROLES } from "@/lib/constants";
import { hasPermission } from "@/lib/rbac";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(user.role, "monitoring:read")) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";
  const dealer = searchParams.get("dealer") || "";
  const marketingId = searchParams.get("marketingId") || "";
  const dateFrom = searchParams.get("dateFrom") || "";
  const dateTo = searchParams.get("dateTo") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "20");

  const where: Record<string, unknown> = {};

  if (user.role === ROLES.SALES_DEALER) where.createdById = user.userId;
  if (user.role === ROLES.MARKETING) where.OR = [{ createdById: user.userId }, { assignedMarketingId: user.userId }];

  if (search) {
    where.OR = [{ applicationNumber: { contains: search } }, { customer: { name: { contains: search } } }];
  }
  if (status) where.status = status;
  if (dealer) where.dealerName = { contains: dealer };
  if (marketingId) where.assignedMarketingId = marketingId;
  if (dateFrom || dateTo) {
    where.createdAt = {
      ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
      ...(dateTo ? { lte: new Date(dateTo + "T23:59:59") } : {}),
    };
  }

  const [data, total, stats] = await Promise.all([
    prisma.creditApplication.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        customer: { select: { id: true, name: true, nik: true } },
        createdBy: { select: { id: true, name: true, role: true } },
        assignedMarketing: { select: { id: true, name: true, role: true } },
        contract: true,
      },
    }),
    prisma.creditApplication.count({ where }),
    prisma.creditApplication.groupBy({ by: ["status"], _count: { status: true }, where: user.role === ROLES.SALES_DEALER ? { createdById: user.userId } : undefined }),
  ]);

  const statsMap: Record<string, number> = {};
  stats.forEach((s) => { statsMap[s.status] = s._count.status; });

  return NextResponse.json({ success: true, data, total, page, pageSize, totalPages: Math.ceil(total / pageSize), stats: statsMap });
}
