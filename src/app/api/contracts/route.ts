import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { generateContractNumber } from "@/lib/generate-number";
import { hasPermission } from "@/lib/rbac";

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(user.role, "contract:generate")) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

  const { applicationId } = await request.json();
  const app = await prisma.creditApplication.findUnique({ where: { id: applicationId }, include: { customer: true, contract: true } });
  if (!app) return NextResponse.json({ success: false, error: "Pengajuan tidak ditemukan" }, { status: 404 });
  if (app.status !== "APPROVED") return NextResponse.json({ success: false, error: "Kontrak hanya dapat dibuat setelah pengajuan disetujui" }, { status: 422 });
  if (app.contract) return NextResponse.json({ success: false, error: "Kontrak sudah dibuat" }, { status: 409 });

  const documentNumber = await generateContractNumber(app.applicationNumber);

  const contract = await prisma.contract.create({
    data: { applicationId, documentNumber, status: "GENERATED" },
  });

  const oldStatus = app.status;
  await prisma.creditApplication.update({ where: { id: applicationId }, data: { status: "CONTRACT_GENERATED" } });
  await prisma.applicationStatusHistory.create({
    data: { applicationId, oldStatus, newStatus: "CONTRACT_GENERATED", changedById: user.userId, note: `Kontrak ${documentNumber} dibuat` },
  });

  return NextResponse.json({ success: true, data: contract }, { status: 201 });
}
