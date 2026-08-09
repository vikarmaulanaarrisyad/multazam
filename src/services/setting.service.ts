import { SettingRepository } from '../repositories/setting.repository';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export class SettingService {
  static async getSettings() {
    return SettingRepository.getSettings();
  }

  static async updateSettings(companyName: string, companyAddress: string, logoFile: File | null, officeLat?: number | null, officeLng?: number | null) {
    const setting = await SettingRepository.getSettings();
    if (!setting) throw new Error("Failed to load settings");

    let newLogoUrl = setting.logoUrl;
    let newLogoPublicId = setting.logoPublicId;

    if (logoFile && logoFile.size > 0) {
      if (setting.logoPublicId) {
        try {
          await cloudinary.uploader.destroy(setting.logoPublicId);
        } catch (e) {
          console.error("Failed to destroy old logo", e);
        }
      }

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

    return SettingRepository.updateSettings({
      companyName,
      companyAddress,
      logoUrl: newLogoUrl,
      logoPublicId: newLogoPublicId,
      ...(officeLat !== undefined ? { officeLat } : {}),
      ...(officeLng !== undefined ? { officeLng } : {}),
    });
  }

  static async removeLogo() {
    const setting = await SettingRepository.getSettings();
    if (setting && setting.logoPublicId) {
      try {
        await cloudinary.uploader.destroy(setting.logoPublicId);
      } catch (e) {
        console.error("Failed to destroy old logo", e);
      }
    }

    return SettingRepository.updateSettings({
      logoUrl: null,
      logoPublicId: null
    });
  }
}
