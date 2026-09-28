import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { ROLES } from "@/lib/constants";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const contract = await prisma.contract.findUnique({ where: { id }, include: { application: true } });
  if (!contract) return NextResponse.json({ success: false, error: "Kontrak tidak ditemukan" }, { status: 404 });

  const updatedContract = await prisma.contract.update({ where: { id }, data: { status: "SIGNED" } });

  const app = contract.application;
  if (app.status === "WAITING_DOCUMENT_APPROVAL") {
    await prisma.creditApplication.update({ where: { id: app.id }, data: { status: "DOCUMENT_SIGNED" } });
    await prisma.applicationStatusHistory.create({
      data: { applicationId: app.id, oldStatus: app.status, newStatus: "DOCUMENT_SIGNED", changedById: user.userId, note: "Dokumen ditandatangani" },
    });
  }

  return NextResponse.json({ success: true, data: updatedContract });
}
