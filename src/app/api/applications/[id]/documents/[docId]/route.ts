import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { unlink } from "fs/promises";
import path from "path";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; docId: string }> }) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { id, docId } = await params;
  const doc = await prisma.applicationDocument.findFirst({ where: { id: docId, applicationId: id } });
  if (!doc) return NextResponse.json({ success: false, error: "Dokumen tidak ditemukan" }, { status: 404 });

  const app = await prisma.creditApplication.findUnique({ where: { id } });
  const editableStatuses = ["DRAFT", "DOCUMENT_INCOMPLETE", "READY_FOR_SUBMISSION"];
  if (!app || !editableStatuses.includes(app.status)) {
    return NextResponse.json({ success: false, error: "Dokumen tidak dapat dihapus pada status ini" }, { status: 422 });
  }

  // Delete file
  try {
    const filePath = path.join(process.cwd(), "uploads", doc.filePath);
    await unlink(filePath);
  } catch {}

  await prisma.applicationDocument.delete({ where: { id: docId } });

  // Recheck doc completeness
  const remaining = await prisma.applicationDocument.findMany({ where: { applicationId: id } });
  const uploadedTypes = remaining.map((d) => d.documentType);
  const requiredDocs = ["KTP", "KK", "BUKTI_BAYAR_TANDA_JADI", "SPK"];
  const hasAll = requiredDocs.every((r) => uploadedTypes.includes(r));
  const newStatus = hasAll ? "READY_FOR_SUBMISSION" : "DOCUMENT_INCOMPLETE";
  if (newStatus !== app.status) {
    await prisma.creditApplication.update({ where: { id }, data: { status: newStatus } });
    await prisma.applicationStatusHistory.create({
      data: { applicationId: id, oldStatus: app.status, newStatus, changedById: user.userId, note: "Status diupdate setelah hapus dokumen" },
    });
  }

  return NextResponse.json({ success: true, message: "Dokumen dihapus" });
}
