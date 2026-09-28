import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { REQUIRED_DOCUMENTS, VALID_STATUS_TRANSITIONS } from "@/lib/constants";
import { hasPermission } from "@/lib/rbac";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(user.role, "application:submit")) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const app = await prisma.creditApplication.findUnique({
    where: { id },
    include: { documents: true },
  });

  if (!app) return NextResponse.json({ success: false, error: "Pengajuan tidak ditemukan" }, { status: 404 });

  const validTransitions = VALID_STATUS_TRANSITIONS[app.status] || [];
  if (!validTransitions.includes("WAITING_APPROVAL")) {
    return NextResponse.json({ success: false, error: `Pengajuan tidak dapat disubmit dari status ${app.status}` }, { status: 422 });
  }

  // Check required documents
  const uploadedTypes = app.documents.map((d) => d.documentType);
  const missing = REQUIRED_DOCUMENTS.filter((r) => !uploadedTypes.includes(r));

  if (missing.length > 0) {
    return NextResponse.json({
      success: false,
      error: `Dokumen wajib belum lengkap: ${missing.join(", ")}`,
      missingDocuments: missing,
    }, { status: 422 });
  }

  const oldStatus = app.status;
  const updated = await prisma.creditApplication.update({
    where: { id },
    data: { status: "WAITING_APPROVAL", submittedAt: new Date() },
  });

  await prisma.applicationStatusHistory.create({
    data: { applicationId: id, oldStatus, newStatus: "WAITING_APPROVAL", changedById: user.userId, note: "Pengajuan disubmit oleh marketing" },
  });

  return NextResponse.json({ success: true, data: updated });
}
