import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { uploadFile } from "@/lib/file-upload";
import { hasPermission } from "@/lib/rbac";
import { VALID_STATUS_TRANSITIONS } from "@/lib/constants";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(user.role, "document:upload-signed")) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const app = await prisma.creditApplication.findUnique({ where: { id } });
  if (!app) return NextResponse.json({ success: false, error: "Pengajuan tidak ditemukan" }, { status: 404 });

  if (!VALID_STATUS_TRANSITIONS[app.status]?.includes("SIGNED_DOCUMENT_UPLOADED") && app.status !== "DOCUMENT_SIGNED") {
    return NextResponse.json({ success: false, error: "Dokumen signed hanya dapat diupload setelah dokumen ditandatangani" }, { status: 422 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File;
  if (!file) return NextResponse.json({ success: false, error: "File wajib diupload" }, { status: 400 });

  const result = await uploadFile(file, `applications/${id}/signed`);
  if (!result.success) return NextResponse.json({ success: false, error: result.error }, { status: 400 });

  const document = await prisma.applicationDocument.create({
    data: {
      applicationId: id,
      documentType: "SIGNED_CONTRACT",
      fileName: result.fileName!,
      storageName: result.storageName!,
      filePath: result.filePath!,
      mimeType: result.mimeType!,
      fileSize: result.fileSize!,
      uploadedById: user.userId,
      notes: "Dokumen kontrak yang sudah ditandatangani",
    },
  });

  // Update status
  const oldStatus = app.status;
  await prisma.creditApplication.update({ where: { id }, data: { status: "SIGNED_DOCUMENT_UPLOADED" } });
  await prisma.applicationStatusHistory.create({
    data: { applicationId: id, oldStatus, newStatus: "SIGNED_DOCUMENT_UPLOADED", changedById: user.userId, note: "Dokumen signed diupload" },
  });

  return NextResponse.json({ success: true, data: document }, { status: 201 });
}
