import prisma from '@/lib/prisma';

export class SettingRepository {
  static async getSettings() {
    let setting = await prisma.setting.findUnique({ where: { id: "1" } });
    if (!setting) {
      setting = await prisma.setting.create({ data: { id: "1" } });
    }
    return setting;
  }

  static async updateSettings(data: any) {
    return prisma.setting.update({
      where: { id: "1" },
      data
    });
  }
}
