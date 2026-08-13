import { DashboardRepository } from '../repositories/dashboard.repository';

export class DashboardService {
  static async getStats() {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const validStatus = ['COMPLETED', 'SHIPPED', 'APPROVED', 'PENDING', 'PENDING_APPROVAL'];

    const [
      todayTx, monthTx, yearTx, totalProducts, totalCategories, recentActivities,
      pendingShipmentCount, pendingApprovalCount, pendingReturnCount,
      lowStockProducts, pendingDeliveries
    ] = await DashboardRepository.getDashboardData(startOfToday, startOfMonth, startOfYear, validStatus);

    const todayRevenue = Number(todayTx._sum.totalAmount || 0);
    const monthRevenue = monthTx.reduce((sum, tx) => sum + Number(tx.totalAmount), 0);
    const yearRevenue = yearTx.reduce((sum, tx) => sum + Number(tx.totalAmount), 0);
    
    // Calculate month profit
    const monthProfit = monthTx.reduce((sum, tx) => {
      const cogs = tx.items.reduce((itemSum, item) => {
        const cost = Number(item.purchasePrice || item.product?.purchasePrice || 0);
        return itemSum + (cost * item.quantity);
      }, 0);
      return sum + (Number(tx.totalAmount) - cogs);
    }, 0);

    const newTransactions = monthTx.length;

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const chartData = monthNames.map((name, index) => {
      const txInMonth = yearTx.filter(tx => tx.createdAt.getMonth() === index);
      const monthSum = txInMonth.reduce((sum, tx) => sum + Number(tx.totalAmount), 0);
      
      const profitSum = txInMonth.reduce((sum, tx) => {
        const cogs = tx.items.reduce((itemSum, item) => {
          const cost = Number(item.purchasePrice || item.product?.purchasePrice || 0);
          return itemSum + (cost * item.quantity);
        }, 0);
        return sum + (Number(tx.totalAmount) - cogs);
      }, 0);

      return { name, total: monthSum, profit: profitSum };
    });

    const serializedActivities = recentActivities.map(act => ({
      ...act,
      totalAmount: Number(act.totalAmount),
      shippingCost: act.shippingCost ? Number(act.shippingCost) : null,
      paidAmount: Number(act.paidAmount)
    }));
    
    const serializedPendingDeliveries = pendingDeliveries.map(p => ({
      ...p,
      totalAmount: Number(p.totalAmount)
    }));

    return {
      todayRevenue,
      monthRevenue,
      monthProfit,
      yearRevenue,
      totalProducts,
      totalCategories,
      newTransactions,
      recentActivities: serializedActivities,
      chartData,
      pendingActions: {
        shipment: pendingShipmentCount,
        approval: pendingApprovalCount,
        returns: pendingReturnCount
      },
      lowStockProducts,
      pendingDeliveries: serializedPendingDeliveries
    };
  }
}
