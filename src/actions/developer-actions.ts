"use server";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export async function updateDeveloperSettings(formData: FormData) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "DEVELOPER") {
      return { success: false, error: "Unauthorized" };
    }

    const trialActive = formData.get("trialActive") === "on";
    const trialExpiresAtStr = formData.get("trialExpiresAt") as string;
    const showDeveloperModal = formData.get("showDeveloperModal") === "on";
    const developerModalTitle = formData.get("developerModalTitle") as string;
    const developerModalContent = formData.get("developerModalContent") as string;

    const trialExpiresAt = trialExpiresAtStr ? new Date(trialExpiresAtStr) : null;

    let setting = await prisma.setting.findFirst();
    if (!setting) {
      setting = await prisma.setting.create({
        data: {
          trialActive,
          trialExpiresAt,
          showDeveloperModal,
          developerModalTitle,
          developerModalContent
        }
      });
    } else {
      setting = await prisma.setting.update({
        where: { id: setting.id },
        data: {
          trialActive,
          trialExpiresAt,
          showDeveloperModal,
          developerModalTitle,
          developerModalContent
        }
      });
    }

    revalidatePath('/', 'layout');
    return { success: true, setting };
  } catch (error: any) {
    console.error("Failed to update developer settings", error);
    return { success: false, error: error.message || "Something went wrong" };
  }
}
