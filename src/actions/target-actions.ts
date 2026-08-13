"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

// Type imports generated from Prisma
import { TargetPeriod } from "@prisma/client";

export async function setSalesTarget(data: {
  userId: string;
  targetAmount: number;
  periodType: TargetPeriod;
  startDate: Date;
  endDate: Date;
  notes?: string;
}) {
  try {
    const session = await auth();
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
      return { success: false, message: "Unauthorized" };
    }

    // Upsert target based on userId, startDate, endDate, and periodType
    // To avoid creating duplicates for the exact same period
    const existingTarget = await prisma.salesTarget.findFirst({
      where: {
        userId: data.userId,
        periodType: data.periodType,
        startDate: data.startDate,
        endDate: data.endDate,
      },
    });

    if (existingTarget) {
      await prisma.salesTarget.update({
        where: { id: existingTarget.id },
        data: {
          targetAmount: data.targetAmount,
          notes: data.notes,
        },
      });
    } else {
      await prisma.salesTarget.create({
        data,
      });
    }

    revalidatePath("/admin/targets");
    revalidatePath("/sales");
    return { success: true, message: "Target berhasil disimpan" };
  } catch (error: any) {
    console.error("Failed to set sales target:", error);
    return { success: false, message: error.message || "Gagal menyimpan target" };
  }
}

export async function getSalesUsers() {
  try {
    const session = await auth();
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
      return [];
    }

    const salesUsers = await prisma.user.findMany({
      where: { role: "SALES" },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    return salesUsers;
  } catch (error) {
    console.error("Failed to fetch sales users:", error);
    return [];
  }
}

export async function getSalesTargets(periodType?: TargetPeriod) {
  try {
    const session = await auth();
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
      return [];
    }

    const where: any = {};
    if (periodType) {
      where.periodType = periodType;
    }

    const targets = await prisma.salesTarget.findMany({
      where,
      include: {
        user: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return targets;
  } catch (error) {
    console.error("Failed to fetch targets:", error);
    return [];
  }
}

export async function getSalesAchievement(userId: string, startDate: Date, endDate: Date) {
  try {
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        status: { not: "CANCELLED" },
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        totalAmount: true,
        shippingCost: true,
      },
    });

    const totalInvoiceAmount = transactions.reduce((sum, trx) => {
      return sum + Number(trx.totalAmount) + Number(trx.shippingCost || 0);
    }, 0);

    return totalInvoiceAmount;
  } catch (error) {
    console.error("Failed to fetch achievement:", error);
    return 0;
  }
}

export async function deleteSalesTarget(id: string) {
  try {
    const session = await auth();
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
      return { success: false, message: "Unauthorized" };
    }

    await prisma.salesTarget.delete({
      where: { id },
    });

    revalidatePath("/admin/targets");
    revalidatePath("/sales");
    return { success: true, message: "Target berhasil dihapus" };
  } catch (error: any) {
    console.error("Failed to delete target:", error);
    return { success: false, message: error.message || "Gagal menghapus target" };
  }
}
