import { DashboardRepository } from '../repositories/dashboard.repository';

export class DashboardService {
  static async getStats() {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const validStatus = ['COMPLETED', 'SHIPPED', 'APPROVED', 'PENDING', 'PENDING_APPROVAL'];

    const [todayTx, monthTx, yearTx, totalProducts, totalCategories, recentActivities] = 
      await DashboardRepository.getDashboardData(startOfToday, startOfMonth, startOfYear, validStatus);

    const todayRevenue = Number(todayTx._sum.totalAmount || 0);
    const monthRevenue = monthTx.reduce((sum, tx) => sum + Number(tx.totalAmount), 0);
    const yearRevenue = yearTx.reduce((sum, tx) => sum + Number(tx.totalAmount), 0);
    const newTransactions = monthTx.length;

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const chartData = monthNames.map((name, index) => {
      const monthSum = yearTx
        .filter(tx => tx.createdAt.getMonth() === index)
        .reduce((sum, tx) => sum + Number(tx.totalAmount), 0);
      return { name, total: monthSum };
    });

    const serializedActivities = recentActivities.map(act => ({
      ...act,
      totalAmount: Number(act.totalAmount),
      shippingCost: act.shippingCost ? Number(act.shippingCost) : null,
      paidAmount: Number(act.paidAmount)
    }));

    return {
      todayRevenue,
      monthRevenue,
      yearRevenue,
      totalProducts,
      totalCategories,
      newTransactions,
      recentActivities: serializedActivities,
      chartData
    };
  }
}
