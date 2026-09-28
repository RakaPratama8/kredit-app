import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { ROLES } from "@/lib/constants";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  if (user.role !== ROLES.ADMIN_BACKOFFICE && user.role !== ROLES.MARKETING) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const app = await prisma.creditApplication.findUnique({ where: { id } });
  if (!app) return NextResponse.json({ success: false, error: "Pengajuan tidak ditemukan" }, { status: 404 });
  if (app.status !== "SIGNED_DOCUMENT_UPLOADED") {
    return NextResponse.json({ success: false, error: "Pengajuan hanya dapat diselesaikan setelah dokumen signed diupload" }, { status: 422 });
  }

  const oldStatus = app.status;
  const updated = await prisma.creditApplication.update({ where: { id }, data: { status: "COMPLETED" } });
  await prisma.applicationStatusHistory.create({
    data: { applicationId: id, oldStatus, newStatus: "COMPLETED", changedById: user.userId, note: "Proses selesai" },
  });

  return NextResponse.json({ success: true, data: updated });
}
