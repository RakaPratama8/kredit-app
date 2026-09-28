import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { customerSchema } from "@/lib/validations";
import { hasPermission } from "@/lib/rbac";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  
  const { id } = await params;
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: { applications: { orderBy: { createdAt: "desc" }, select: { id: true, applicationNumber: true, status: true, createdAt: true } } },
  });
  
  if (!customer) return NextResponse.json({ success: false, error: "Konsumen tidak ditemukan" }, { status: 404 });
  return NextResponse.json({ success: true, data: customer });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(user.role, "customer:update")) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await request.json();
  const parsed = customerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
  }

  const existing = await prisma.customer.findUnique({ where: { nik: parsed.data.nik } });
  if (existing && existing.id !== id) return NextResponse.json({ success: false, error: "NIK sudah digunakan oleh konsumen lain" }, { status: 409 });

  const customer = await prisma.customer.update({
    where: { id },
    data: { ...parsed.data, dateOfBirth: new Date(parsed.data.dateOfBirth), email: parsed.data.email || null, spouseName: parsed.data.spouseName || null },
  });

  return NextResponse.json({ success: true, data: customer });
}
