'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function getSettings() {
  try {
    let setting = await prisma.setting.findUnique({
      where: { id: "1" }
    });
    
    if (!setting) {
      setting = await prisma.setting.create({
        data: { id: "1" }
      });
    }
    
    return setting;
  } catch (error) {
    console.error("Failed to get settings", error);
    return null;
  }
}

export async function updateSettings(formData: FormData) {
  try {
    const companyName = formData.get('companyName') as string;
    const companyAddress = formData.get('companyAddress') as string;
    const logoFile = formData.get('logoFile') as File | null;
    
    let setting = await getSettings();
    if (!setting) throw new Error("Failed to load settings");
    
    let newLogoUrl = setting.logoUrl;
    let newLogoPublicId = setting.logoPublicId;
    
    if (logoFile && logoFile.size > 0) {
      // If there's an existing logo, delete it first
      if (setting.logoPublicId) {
        try {
          await cloudinary.uploader.destroy(setting.logoPublicId);
        } catch (e) {
          console.error("Failed to destroy old logo", e);
        }
      }
      
      // Convert file to base64 or buffer for upload
      const arrayBuffer = await logoFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream({ folder: 'multazam/settings' }, (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }).end(buffer);
      }) as any;
      
      newLogoUrl = uploadResult.secure_url;
      newLogoPublicId = uploadResult.public_id;
    }
    
    await prisma.setting.update({
      where: { id: "1" },
      data: {
        companyName,
        companyAddress,
        logoUrl: newLogoUrl,
        logoPublicId: newLogoPublicId,
      }
    });
    
    revalidatePath('/print/delivery-order/[id]', 'page');
    revalidatePath('/super-admin/settings');
    
    return { success: true };
  } catch (error: any) {
    console.error('Update settings error:', error);
    return { success: false, error: error.message || "Failed to update settings" };
  }
}

export async function removeLogo() {
  try {
    const setting = await getSettings();
    if (setting && setting.logoPublicId) {
      try {
        await cloudinary.uploader.destroy(setting.logoPublicId);
      } catch (e) {
        console.error("Failed to destroy old logo", e);
      }
    }
    
    await prisma.setting.update({
      where: { id: "1" },
      data: {
        logoUrl: null,
        logoPublicId: null
      }
    });
    
    revalidatePath('/print/delivery-order/[id]', 'page');
    revalidatePath('/super-admin/settings');
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to remove logo" };
  }
}
