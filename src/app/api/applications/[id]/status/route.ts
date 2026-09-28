import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { VALID_STATUS_TRANSITIONS } from "@/lib/constants";
import { hasPermission } from "@/lib/rbac";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(user.role, "application:update")) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { newStatus, note } = await request.json();

  const app = await prisma.creditApplication.findUnique({ where: { id } });
  if (!app) return NextResponse.json({ success: false, error: "Pengajuan tidak ditemukan" }, { status: 404 });

  const validTransitions = VALID_STATUS_TRANSITIONS[app.status] || [];
  if (!validTransitions.includes(newStatus)) {
    return NextResponse.json({ success: false, error: `Transisi status dari ${app.status} ke ${newStatus} tidak diizinkan` }, { status: 422 });
  }

  const oldStatus = app.status;
  const updated = await prisma.creditApplication.update({ where: { id }, data: { status: newStatus } });

  await prisma.applicationStatusHistory.create({
    data: { applicationId: id, oldStatus, newStatus, changedById: user.userId, note: note || null },
  });

  return NextResponse.json({ success: true, data: updated });
}
