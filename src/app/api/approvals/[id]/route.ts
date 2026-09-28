import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { approvalSchema } from "@/lib/validations";
import { ROLES } from "@/lib/constants";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  if (user.role !== ROLES.ATASAN_MARKETING) {
    return NextResponse.json({ success: false, error: "Hanya Atasan Marketing yang dapat melakukan approval" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = approvalSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });

  const app = await prisma.creditApplication.findUnique({ where: { id } });
  if (!app) return NextResponse.json({ success: false, error: "Pengajuan tidak ditemukan" }, { status: 404 });
  if (app.status !== "WAITING_APPROVAL") {
    return NextResponse.json({ success: false, error: "Pengajuan tidak sedang dalam status menunggu approval" }, { status: 422 });
  }

  const { action, note } = parsed.data;
  const newStatus = action === "APPROVED" ? "APPROVED" : "REJECTED";
  const oldStatus = app.status;

  const updated = await prisma.creditApplication.update({
    where: { id },
    data: {
      status: newStatus,
      approvedAt: action === "APPROVED" ? new Date() : undefined,
      rejectedAt: action === "REJECTED" ? new Date() : undefined,
      rejectionReason: action === "REJECTED" ? note : undefined,
    },
  });

  await prisma.approvalHistory.create({
    data: { applicationId: id, approverId: user.userId, action, note: note || null },
  });

  await prisma.applicationStatusHistory.create({
    data: { applicationId: id, oldStatus, newStatus, changedById: user.userId, note: note || `Pengajuan ${action === "APPROVED" ? "disetujui" : "ditolak"}` },
  });

  return NextResponse.json({ success: true, data: updated });
}
