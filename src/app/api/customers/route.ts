import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { customerSchema } from "@/lib/validations";
import { hasPermission } from "@/lib/rbac";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(user.role, "customer:read")) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "10");

  const where = search
    ? { OR: [{ name: { contains: search } }, { nik: { contains: search } }, { phone: { contains: search } }] }
    : {};

  const [data, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { _count: { select: { applications: true } } },
    }),
    prisma.customer.count({ where }),
  ]);

  return NextResponse.json({ success: true, data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(user.role, "customer:create")) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const parsed = customerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.issues[0].message, errors: parsed.error.issues }, { status: 400 });
  }

  const { nik, name, placeOfBirth, dateOfBirth, maritalStatus, spouseName, address, phone, email } = parsed.data;

  const existing = await prisma.customer.findUnique({ where: { nik } });
  if (existing) return NextResponse.json({ success: false, error: "NIK sudah terdaftar" }, { status: 409 });

  const customer = await prisma.customer.create({
    data: { nik, name, placeOfBirth, dateOfBirth: new Date(dateOfBirth), maritalStatus, spouseName: spouseName || null, address, phone, email: email || null },
  });

  return NextResponse.json({ success: true, data: customer }, { status: 201 });
}
