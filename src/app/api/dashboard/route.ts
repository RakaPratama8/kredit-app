import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { ROLES } from "@/lib/constants";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const baseWhere: Record<string, unknown> =
    user.role === ROLES.SALES_DEALER
      ? { createdById: user.userId }
      : user.role === ROLES.MARKETING
      ? { OR: [{ createdById: user.userId }, { assignedMarketingId: user.userId }] }
      : {};

  const [stats, recent, customers] = await Promise.all([
    prisma.creditApplication.groupBy({ by: ["status"], _count: { status: true }, where: baseWhere }),
    prisma.creditApplication.findMany({
      where: baseWhere,
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        customer: { select: { name: true } },
        assignedMarketing: { select: { name: true } },
      },
    }),
    user.role === ROLES.ADMIN_BACKOFFICE || user.role === ROLES.MARKETING
      ? prisma.customer.count()
      : Promise.resolve(0),
  ]);

  const statsMap: Record<string, number> = {};
  stats.forEach((s) => { statsMap[s.status] = s._count.status; });
  const total = Object.values(statsMap).reduce((a, b) => a + b, 0);

  return NextResponse.json({
    success: true,
    data: {
      stats: { total, ...statsMap },
      recent,
      totalCustomers: customers,
    },
  });
}
