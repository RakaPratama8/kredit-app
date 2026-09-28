import { prisma } from "./prisma";

export async function generateApplicationNumber(): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");

  const count = await prisma.creditApplication.count({
    where: {
      createdAt: {
        gte: new Date(year, now.getMonth(), 1),
        lt: new Date(year, now.getMonth() + 1, 1),
      },
    },
  });

  const seq = String(count + 1).padStart(4, "0");
  return `APP-${year}${month}-${seq}`;
}

export async function generateContractNumber(applicationNumber: string): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const seq = applicationNumber.split("-").pop() || "0001";
  return `CTR-${year}${month}-${seq}`;
}
