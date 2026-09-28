import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { ROLES } from "@/lib/constants";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  if (user.role !== ROLES.ATASAN_MARKETING && user.role !== ROLES.ADMIN_BACKOFFICE) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const contract = await prisma.contract.findUnique({ where: { id }, include: { application: true } });
  if (!contract) return NextResponse.json({ success: false, error: "Kontrak tidak ditemukan" }, { status: 404 });

  const updatedContract = await prisma.contract.update({
    where: { id },
    data: { status: "APPROVED", approvedAt: new Date() },
  });

  const app = contract.application;
  const oldStatus = app.status;

  // Transition to WAITING_DOCUMENT_APPROVAL
  if (app.status === "CONTRACT_GENERATED") {
    await prisma.creditApplication.update({ where: { id: app.id }, data: { status: "WAITING_DOCUMENT_APPROVAL" } });
    await prisma.applicationStatusHistory.create({
      data: { applicationId: app.id, oldStatus, newStatus: "WAITING_DOCUMENT_APPROVAL", changedById: user.userId, note: "Kontrak disetujui, menunggu tanda tangan" },
    });
  }

  return NextResponse.json({ success: true, data: updatedContract });
}
