'use server';

import { revalidatePath } from 'next/cache';
import { SettingService } from '@/services/setting.service';
import { auth } from '@/auth';

export async function getSettings() {
  try {
    const session = await auth();
    if (!session?.user) return null;
    return await SettingService.getSettings();
  } catch (error) {
    console.error("Failed to get settings", error);
    return null;
  }
}

export async function getPublicSettings() {
  try {
    const setting = await SettingService.getSettings();
    return {
      companyName: setting?.companyName || 'DIA MAKMUR ABADI',
      companyAddress: setting?.companyAddress || '',
      logoUrl: setting?.logoUrl || null,
    };
  } catch (error) {
    return {
      companyName: 'DIA MAKMUR ABADI',
      companyAddress: '',
      logoUrl: null,
    };
  }
}

export async function updateSettings(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return { success: false, error: 'Unauthorized / Akses Ditolak' };
    }
    const companyName = formData.get('companyName') as string;
    const companyAddress = formData.get('companyAddress') as string;
    const logoFile = formData.get('logoFile') as File | null;
    
    const latRaw = formData.get('officeLat');
    const lngRaw = formData.get('officeLng');
    const officeLat = latRaw ? parseFloat(latRaw as string) : null;
    const officeLng = lngRaw ? parseFloat(lngRaw as string) : null;
    
    await SettingService.updateSettings(companyName, companyAddress, logoFile, officeLat, officeLng);
    
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
    const session = await auth();
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return { success: false, error: 'Unauthorized / Akses Ditolak' };
    }
    await SettingService.removeLogo();
    
    revalidatePath('/print/delivery-order/[id]', 'page');
    revalidatePath('/super-admin/settings');
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to remove logo" };
  }
}
