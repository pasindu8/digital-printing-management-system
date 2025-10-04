// Notification Service for Real-time Business Alerts
export class NotificationService {
  static generateBusinessNotifications(dashboardData) {
    const notifications = [];
    const currentDate = new Date();

    // 1. Critical Inventory Alerts
    if (dashboardData.lowStockItems?.length > 0) {
      dashboardData.lowStockItems.forEach(item => {
        notifications.push({
          id: `inventory-${item.material_id || item._id}`,
          type: 'inventory',
          priority: item.current_stock === 0 ? 'critical' : 'warning',
          title: item.current_stock === 0 ? 'Out of Stock' : 'Low Stock Alert',
          message: `${item.material_name}: ${item.current_stock} units remaining (min: ${item.minimum_stock_level})`,
          timestamp: currentDate,
          actionRequired: true,
          actionText: 'Order Now',
          icon: 'package-x'
        });
      });
    }

    // 2. Order Management Alerts
    const pendingOrders = dashboardData.orders?.filter(order => 
      order.status === 'Pending' || order.status === 'pending'
    ) || [];
    
    const overdueOrders = dashboardData.orders?.filter(order => {
      const expectedDate = new Date(order.expected_completion_date || order.delivery_date);
      return expectedDate < currentDate && order.status !== 'Completed';
    }) || [];

    if (pendingOrders.length > 5) {
      notifications.push({
        id: 'orders-pending',
        type: 'orders',
        priority: pendingOrders.length > 10 ? 'critical' : 'warning',
        title: 'Pending Orders Alert',
        message: `${pendingOrders.length} orders awaiting processing`,
        timestamp: currentDate,
        actionRequired: true,
        actionText: 'Review Orders',
        icon: 'clipboard-list'
      });
    }

    if (overdueOrders.length > 0) {
      notifications.push({
        id: 'orders-overdue',
        type: 'orders',
        priority: 'critical',
        title: 'Overdue Orders',
        message: `${overdueOrders.length} orders past expected completion date`,
        timestamp: currentDate,
        actionRequired: true,
        actionText: 'Update Status',
        icon: 'clock-alert'
      });
    }

    // 3. Financial Alerts
    const profitMargin = dashboardData.financialMetrics?.revenue > 0 
      ? (dashboardData.financialMetrics.profit / dashboardData.financialMetrics.revenue) * 100 
      : 0;

    if (profitMargin < 10 && dashboardData.financialMetrics?.revenue > 0) {
      notifications.push({
        id: 'finance-margin',
        type: 'finance',
        priority: profitMargin < 5 ? 'critical' : 'warning',
        title: 'Low Profit Margin',
        message: `Current profit margin: ${profitMargin.toFixed(1)}%`,
        timestamp: currentDate,
        actionRequired: true,
        actionText: 'Review Costs',
        icon: 'trending-down'
      });
    }

    // Outstanding invoices alert
    const overdueInvoices = dashboardData.invoices?.filter(invoice => {
      const dueDate = new Date(invoice.dueDate);
      return dueDate < currentDate && invoice.status !== 'Paid';
    }) || [];

    if (overdueInvoices.length > 0) {
      const totalOverdue = overdueInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
      notifications.push({
        id: 'finance-overdue',
        type: 'finance',
        priority: 'warning',
        title: 'Overdue Invoices',
        message: `${overdueInvoices.length} invoices overdue (Rs. ${totalOverdue.toFixed(2)})`,
        timestamp: currentDate,
        actionRequired: true,
        actionText: 'Follow Up',
        icon: 'file-text'
      });
    }

    // 4. HR & Attendance Alerts
    const attendanceRate = dashboardData.hrMetrics?.attendanceRate || 100;
    
    if (attendanceRate < 85) {
      notifications.push({
        id: 'hr-attendance',
        type: 'hr',
        priority: attendanceRate < 70 ? 'critical' : 'warning',
        title: 'Low Attendance',
        message: `Today's attendance: ${attendanceRate.toFixed(1)}% (${dashboardData.hrMetrics?.todayAttendance}/${dashboardData.hrMetrics?.totalEmployees})`,
        timestamp: currentDate,
        actionRequired: attendanceRate < 70,
        actionText: 'Check Staff',
        icon: 'users'
      });
    }

    // 5. Delivery Alerts
    const todayDeliveries = dashboardData.deliveries?.filter(delivery => {
      const deliveryDate = new Date(delivery.scheduledDate || delivery.planned_delivery_date);
      return deliveryDate.toDateString() === currentDate.toDateString();
    }) || [];

    const overdueDeliveries = dashboardData.deliveries?.filter(delivery => {
      const deliveryDate = new Date(delivery.scheduledDate || delivery.planned_delivery_date);
      return deliveryDate < currentDate && 
             delivery.status !== 'Delivered' && 
             delivery.status !== 'delivered';
    }) || [];

    if (todayDeliveries.length > 0) {
      notifications.push({
        id: 'delivery-today',
        type: 'delivery',
        priority: 'info',
        title: 'Today\'s Deliveries',
        message: `${todayDeliveries.length} deliveries scheduled for today`,
        timestamp: currentDate,
        actionRequired: false,
        actionText: 'View Schedule',
        icon: 'truck'
      });
    }

    if (overdueDeliveries.length > 0) {
      notifications.push({
        id: 'delivery-overdue',
        type: 'delivery',
        priority: 'critical',
        title: 'Overdue Deliveries',
        message: `${overdueDeliveries.length} deliveries past scheduled date`,
        timestamp: currentDate,
        actionRequired: true,
        actionText: 'Reschedule',
        icon: 'truck-x'
      });
    }

    // 6. Production Alerts
    const inProductionOrders = dashboardData.orders?.filter(order => 
      order.status === 'In_Production' || order.status === 'in_production'
    ) || [];

    if (inProductionOrders.length > 15) {
      notifications.push({
        id: 'production-capacity',
        type: 'production',
        priority: 'warning',
        title: 'High Production Load',
        message: `${inProductionOrders.length} orders currently in production`,
        timestamp: currentDate,
        actionRequired: false,
        actionText: 'Check Capacity',
        icon: 'factory'
      });
    }

    // 7. Material Order Alerts
    const pendingMaterialOrders = dashboardData.materialOrders?.filter(order => 
      order.status === 'Pending' || order.status === 'Ordered'
    ) || [];

    const overdueMaterialOrders = dashboardData.materialOrders?.filter(order => {
      const expectedDate = new Date(order.delivery_date);
      return expectedDate < currentDate && order.status !== 'Delivered';
    }) || [];

    if (overdueMaterialOrders.length > 0) {
      notifications.push({
        id: 'materials-overdue',
        type: 'materials',
        priority: 'warning',
        title: 'Overdue Material Orders',
        message: `${overdueMaterialOrders.length} material deliveries are overdue`,
        timestamp: currentDate,
        actionRequired: true,
        actionText: 'Contact Suppliers',
        icon: 'package-check'
      });
    }

    // 8. Customer Alerts
    const recentCustomers = dashboardData.customers?.filter(customer => {
      const createdDate = new Date(customer.createdAt || customer.dateJoined);
      const weekAgo = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000);
      return createdDate > weekAgo;
    }) || [];

    if (recentCustomers.length > 5) {
      notifications.push({
        id: 'customers-new',
        type: 'customers',
        priority: 'info',
        title: 'New Customer Growth',
        message: `${recentCustomers.length} new customers this week`,
        timestamp: currentDate,
        actionRequired: false,
        actionText: 'Welcome Them',
        icon: 'user-plus'
      });
    }

    // 9. System Performance Alerts
    const totalSystemLoad = notifications.filter(n => n.priority === 'critical').length;
    
    if (totalSystemLoad > 5) {
      notifications.push({
        id: 'system-overload',
        type: 'system',
        priority: 'critical',
        title: 'Multiple Critical Issues',
        message: `${totalSystemLoad} critical issues require immediate attention`,
        timestamp: currentDate,
        actionRequired: true,
        actionText: 'Review All',
        icon: 'alert-triangle'
      });
    }

    // Sort by priority and timestamp
    return notifications
      .sort((a, b) => {
        const priorityOrder = { critical: 3, warning: 2, info: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return new Date(b.timestamp) - new Date(a.timestamp);
      })
      .slice(0, 10); // Limit to 10 most important notifications
  }

  static getNotificationIcon(type) {
    const iconMap = {
      inventory: 'package',
      orders: 'shopping-cart',
      finance: 'dollar-sign',
      hr: 'users',
      delivery: 'truck',
      production: 'factory',
      materials: 'box',
      customers: 'user-check',
      system: 'settings'
    };
    return iconMap[type] || 'bell';
  }

  static getPriorityColor(priority) {
    const colorMap = {
      critical: 'destructive',
      warning: 'secondary',
      info: 'outline'
    };
    return colorMap[priority] || 'outline';
  }

  static getPriorityBgColor(priority) {
    const bgColorMap = {
      critical: 'bg-red-50 border-red-200',
      warning: 'bg-orange-50 border-orange-200',
      info: 'bg-blue-50 border-blue-200'
    };
    return bgColorMap[priority] || 'bg-gray-50 border-gray-200';
  }
}