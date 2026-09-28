import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { uploadFile } from "@/lib/file-upload";
import { hasPermission, canReadApplication } from "@/lib/rbac";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const app = await prisma.creditApplication.findUnique({ where: { id } });
  if (!app) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  if (!canReadApplication(user.role, user.userId, app.createdById, app.assignedMarketingId)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const documents = await prisma.applicationDocument.findMany({
    where: { applicationId: id },
    include: { uploadedBy: { select: { id: true, name: true, role: true } } },
    orderBy: { uploadedAt: "desc" },
  });

  return NextResponse.json({ success: true, data: documents });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(user.role, "document:upload")) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const app = await prisma.creditApplication.findUnique({ where: { id } });
  if (!app) return NextResponse.json({ success: false, error: "Pengajuan tidak ditemukan" }, { status: 404 });

  const formData = await request.formData();
  const file = formData.get("file") as File;
  const documentType = formData.get("documentType") as string;
  const notes = formData.get("notes") as string;

  if (!file || !documentType) {
    return NextResponse.json({ success: false, error: "File dan tipe dokumen wajib diisi" }, { status: 400 });
  }

  const result = await uploadFile(file, `applications/${id}`);
  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 400 });
  }

  const document = await prisma.applicationDocument.create({
    data: {
      applicationId: id,
      documentType,
      fileName: result.fileName!,
      storageName: result.storageName!,
      filePath: result.filePath!,
      mimeType: result.mimeType!,
      fileSize: result.fileSize!,
      uploadedById: user.userId,
      notes: notes || null,
    },
  });

  // Update application status
  const allDocs = await prisma.applicationDocument.findMany({ where: { applicationId: id } });
  const uploadedTypes = allDocs.map((d) => d.documentType);
  const requiredDocs = ["KTP", "KK", "BUKTI_BAYAR_TANDA_JADI", "SPK"];
  const hasAll = requiredDocs.every((r) => uploadedTypes.includes(r));

  if (["DRAFT", "DOCUMENT_INCOMPLETE"].includes(app.status)) {
    const newStatus = hasAll ? "READY_FOR_SUBMISSION" : "DOCUMENT_INCOMPLETE";
    if (newStatus !== app.status) {
      await prisma.creditApplication.update({ where: { id }, data: { status: newStatus } });
      await prisma.applicationStatusHistory.create({
        data: { applicationId: id, oldStatus: app.status, newStatus, changedById: user.userId, note: "Status diupdate otomatis setelah upload dokumen" },
      });
    }
  }

  return NextResponse.json({ success: true, data: document }, { status: 201 });
}
