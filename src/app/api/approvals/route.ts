import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { ROLES } from "@/lib/constants";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  if (user.role !== ROLES.ATASAN_MARKETING && user.role !== ROLES.ADMIN_BACKOFFICE) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const applications = await prisma.creditApplication.findMany({
    where: { status: "WAITING_APPROVAL" },
    orderBy: { submittedAt: "asc" },
    include: {
      customer: { select: { id: true, name: true, nik: true } },
      createdBy: { select: { id: true, name: true, role: true } },
      assignedMarketing: { select: { id: true, name: true, role: true } },
      documents: true,
    },
  });

  return NextResponse.json({ success: true, data: applications });
}
