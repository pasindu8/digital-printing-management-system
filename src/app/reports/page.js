'use client';
import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3, 
  FileText, 
  PieChart as PieChartIcon, 
  Loader2, 
  TrendingUp, 
  TrendingDown,
  Users,
  Package,
  ShoppingCart,
  Truck,
  DollarSign,
  Calendar,
  Activity,
  AlertTriangle
} from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { exportToPDF } from "@/lib/pdfExport";
import api from "../services/api";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export default function Reports() {
  const [dateRange, setDateRange] = useState("last-30-days");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboardData, setDashboardData] = useState(null);
  const [salesData, setSalesData] = useState(null);
  const [productionData, setProductionData] = useState(null);
  const [inventoryData, setInventoryData] = useState(null);
  const [customerData, setCustomerData] = useState(null);
  const [deliveryData, setDeliveryData] = useState(null);
  const [hrData, setHRData] = useState(null);
  const [financialData, setFinancialData] = useState(null);
  // Expanded datasets for full reports
  const [financeExpenses, setFinanceExpenses] = useState(null);
  const [financeInvoices, setFinanceInvoices] = useState(null);
  const [financeLedger, setFinanceLedger] = useState(null);
  const [financePayroll, setFinancePayroll] = useState(null);
  const [rawMaterials, setRawMaterials] = useState(null);
  const [materialOrders, setMaterialOrders] = useState(null);
  const [ordersList, setOrdersList] = useState(null);
  const [deliveriesList, setDeliveriesList] = useState(null);

  // Calculate date range based on selection
  const getDateParams = () => {
    const now = new Date();
    let startDate;
    
    switch(dateRange) {
      case 'last-7-days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'last-30-days':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'last-90-days':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'this-year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    
    return `?startDate=${startDate.toISOString()}&endDate=${now.toISOString()}`;
  };

  // Fetch all reports data
  const fetchReportsData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const dateParams = getDateParams();
      
      // Fetch all reports in parallel
      // Build alternate date params for ledger which expects start_date/end_date
      const now = new Date();
      let startDate;
      switch(dateRange) {
        case 'last-7-days':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'last-30-days':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'last-90-days':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case 'this-year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }
      const ledgerParams = `?start_date=${startDate.toISOString()}&end_date=${now.toISOString()}`;

      const [
        dashboardResponse,
        salesResponse,
        productionResponse,
        inventoryResponse,
        customerResponse,
        deliveryResponse,
        hrResponse,
        financialResponse,
        expensesResponse,
        invoicesResponse,
        ledgerResponse,
        payrollResponse,
        rawMaterialsResponse,
        materialOrdersResponse,
        ordersResponse,
        deliveriesFullResponse
      ] = await Promise.allSettled([
        api.get(`/reports/dashboard-overview${dateParams}`),
        api.get(`/reports/sales-revenue${dateParams}`),
        api.get(`/reports/production${dateParams}`),
        api.get(`/reports/inventory`),
        api.get(`/reports/customers${dateParams}`),
        api.get(`/reports/delivery${dateParams}`),
        api.get(`/reports/hr`),
        api.get(`/reports/financial-summary${dateParams}`),
        api.get(`/finance/expenses`),
        api.get(`/finance/invoices`),
        api.get(`/finance/ledger${ledgerParams}`),
        api.get(`/finance/payroll`),
        api.get(`/raw-materials`),
        api.get(`/material-orders`),
        api.get(`/orders`),
        api.get(`/delivery`)
      ]);

      // Process responses
      if (dashboardResponse.status === 'fulfilled') {
        setDashboardData(dashboardResponse.value.data);
      }
      if (salesResponse.status === 'fulfilled') {
        setSalesData(salesResponse.value.data);
      }
      if (productionResponse.status === 'fulfilled') {
        setProductionData(productionResponse.value.data);
      }
      if (inventoryResponse.status === 'fulfilled') {
        setInventoryData(inventoryResponse.value.data);
      }
      if (customerResponse.status === 'fulfilled') {
        setCustomerData(customerResponse.value.data);
      }
      if (deliveryResponse.status === 'fulfilled') {
        setDeliveryData(deliveryResponse.value.data);
      }
      if (hrResponse.status === 'fulfilled') {
        setHRData(hrResponse.value.data);
      }
      if (financialResponse.status === 'fulfilled') {
        setFinancialData(financialResponse.value.data);
      }
      if (expensesResponse?.status === 'fulfilled') {
        setFinanceExpenses(expensesResponse.value.data);
      }
      if (invoicesResponse?.status === 'fulfilled') {
        setFinanceInvoices(invoicesResponse.value.data);
      }
      if (ledgerResponse?.status === 'fulfilled') {
        setFinanceLedger(ledgerResponse.value.data);
      }
      if (payrollResponse?.status === 'fulfilled') {
        setFinancePayroll(payrollResponse.value.data);
      }
      if (rawMaterialsResponse?.status === 'fulfilled') {
        setRawMaterials(rawMaterialsResponse.value.data);
      }
      if (materialOrdersResponse?.status === 'fulfilled') {
        setMaterialOrders(materialOrdersResponse.value.data);
      }
      if (ordersResponse?.status === 'fulfilled') {
        setOrdersList(ordersResponse.value.data);
      }
      if (deliveriesFullResponse?.status === 'fulfilled') {
        setDeliveriesList(deliveriesFullResponse.value.data);
      }

    } catch (err) {
      setError('Failed to fetch reports data. Please ensure the backend server is running.');
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportsData();
  }, [dateRange]);



  // Export specific report as PDF
  const exportReportToPDF = async (reportType) => {
    try {
      let data, filename, content;
      
      switch (reportType) {
        case 'financial':
          data = { ...(financialData || {}), expenses: financeExpenses, invoices: financeInvoices, ledger: financeLedger, payroll: financePayroll };
          filename = 'financial-report';
          content = generateFinancialPDFContent(data);
          break;
        case 'inventory':
          data = { ...(inventoryData || {}), rawMaterials, materialOrders };
          filename = 'inventory-report';
          content = generateInventoryPDFContent(data);
          break;
        case 'delivery':
          data = { ...(deliveryData || {}), deliveriesList };
          filename = 'delivery-report';
          content = generateDeliveryPDFContent(data);
          break;
        case 'order':
          data = { ...(salesData || {}), ordersList };
          filename = 'order-report';
          content = generateOrderPDFContent(data);
          break;
        case 'hr':
          data = { ...(hrData || {}), payroll: financePayroll };
          filename = 'hr-report';
          content = generateHRPDFContent(data);
          break;
        default:
          return;
      }
      
      if (!data) {
        alert(`No ${reportType} data available for export`);
        return;
      }
      
      // Create a temporary container for PDF content
      const tempContainer = document.createElement('div');
      tempContainer.id = 'pdf-export-container';
      tempContainer.className = 'pdf-export-mode'; // Apply PDF-specific CSS overrides
      tempContainer.innerHTML = content;
      tempContainer.style.cssText = `
        position: fixed;
        top: -10000px;
        left: -10000px;
        width: 700px;
        height: auto;
        background: white;
        padding: 20px;
        font-family: Arial, sans-serif;
        color: black;
        overflow: visible;
      `;
      
      document.body.appendChild(tempContainer);
      
      // Export to PDF
      await exportToPDF('pdf-export-container', `${filename}-${dateRange}-${new Date().toISOString().split('T')[0]}`);
      
      // Clean up
      document.body.removeChild(tempContainer);
      
    } catch (error) {
      console.error('PDF export failed:', error);
      alert('PDF export failed. Please try again.');
    }
  };

  // Generate PDF content for different report types
  // Helpers to avoid NaN/Infinity in calculations
  const safeDivide = (num, denom) => {
    const n = Number(num) || 0;
    const d = Number(denom) || 0;
    if (!isFinite(n) || !isFinite(d) || d === 0) return 0;
    const v = n / d;
    return isFinite(v) ? v : 0;
  };
  const safePercent = (num, denom) => safeDivide(num, denom) * 100;
  const safeChangePct = (current, previous) => (Number(previous) > 0 ? ((current - previous) / previous) * 100 : 0);

  const generateFinancialPDFContent = (data) => {
    const totalRevenue = data?.totalRevenue || 0;
    const avgOrderValue = data?.avgOrderValue || 0;
    const paymentAnalysis = data?.paymentAnalysis || [];
    const salesTrends = data?.salesTrends || [];
    const topCustomers = data?.topCustomers || [];
    
    // Calculate additional metrics
    const totalOrders = salesTrends.reduce((sum, trend) => sum + (trend.orderCount || 0), 0);
    const totalPaymentReceived = paymentAnalysis.find(p => p._id === 'paid')?.totalAmount || 0;
    const pendingPayments = paymentAnalysis.find(p => p._id === 'pending')?.totalAmount || 0;
    const firstSales = salesTrends[0]?.totalSales || 0;
    const lastSales = salesTrends[salesTrends.length - 1]?.totalSales || 0;
    const revenueGrowth = salesTrends.length > 1 ? safeChangePct(lastSales, firstSales) : 0;
    
  const expenses = data?.expenses || [];
  const invoices = data?.invoices || [];
  const ledger = data?.ledger || [];
  const payroll = data?.payroll || [];

  return `
      <div style="font-family: Arial, sans-serif; color: rgb(26, 26, 26); line-height: 1.3; width: 700px; margin: 0; padding: 0;">
        <!-- Header Section -->
        <div style="text-align: center; margin-bottom: 20px; padding: 20px 15px; background-color: rgb(79, 70, 229); color: rgb(255, 255, 255); border: 2px solid rgb(67, 56, 202);">
          <h1 style="margin: 0 0 8px 0; font-size: 22px; font-weight: bold; color: rgb(255, 255, 255);">📊 FINANCIAL PERFORMANCE REPORT</h1>
          <p style="margin: 0 0 4px 0; font-size: 13px; color: rgb(255, 255, 255);">The First Promovier - Digital Printing Management System</p>
          <p style="margin: 0; font-size: 11px; color: rgb(255, 255, 255);">Generated: ${new Date().toLocaleString('en-GB')} | Period: ${dateRange}</p>
        </div>

        <!-- Executive Summary -->
        <div style="background-color: rgb(239, 246, 255); padding: 15px; border: 1px solid rgb(203, 213, 225); margin-bottom: 15px; border-left: 4px solid rgb(59, 130, 246);">
          <h2 style="color: rgb(30, 64, 175); font-size: 16px; font-weight: 600; margin: 0 0 12px 0;">💰 Executive Financial Summary</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="text-align: center; padding: 8px; background-color: rgb(255, 255, 255); border: 1px solid rgb(226, 232, 240); width: 33.33%;">
                <div style="color: rgb(22, 163, 74); font-size: 18px; font-weight: bold; margin-bottom: 3px;">${formatCurrency(totalRevenue)}</div>
                <div style="color: rgb(107, 114, 128); font-size: 10px;">Total Revenue</div>
              </td>
              <td style="text-align: center; padding: 8px; background-color: rgb(255, 255, 255); border: 1px solid rgb(226, 232, 240); width: 33.33%;">
                <div style="color: rgb(37, 99, 235); font-size: 18px; font-weight: bold; margin-bottom: 3px;">${totalOrders}</div>
                <div style="color: rgb(107, 114, 128); font-size: 10px;">Total Orders</div>
              </td>
              <td style="text-align: center; padding: 8px; background-color: rgb(255, 255, 255); border: 1px solid rgb(226, 232, 240); width: 33.33%;">
                <div style="color: ${revenueGrowth >= 0 ? 'rgb(22, 163, 74)' : 'rgb(220, 38, 38)'}; font-size: 18px; font-weight: bold; margin-bottom: 3px;">${revenueGrowth.toFixed(1)}%</div>
                <div style="color: rgb(107, 114, 128); font-size: 10px;">Revenue Growth</div>
              </td>
            </tr>
          </table>
        </div>

        <!-- Key Performance Indicators -->
        <div style="margin-bottom: 25px;">
          <h3 style="color: rgb(55, 65, 81); margin: 0 0 15px 0; font-size: 16px; border-bottom: 2px solid rgb(229, 231, 235); padding-bottom: 8px;">📈 Key Performance Indicators</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="width: 50%; padding-right: 10px; vertical-align: top;">
                <div style="background-color: rgb(255, 255, 255); padding: 15px; border: 1px solid rgb(229, 231, 235);">
                  <h4 style="color: rgb(31, 41, 55); margin: 0 0 12px 0; font-size: 14px; font-weight: 600;">💳 Payment Analysis</h4>
                  <div style="margin-bottom: 8px;">
                    <span style="color: rgb(5, 150, 105); font-weight: bold;">${formatCurrency(totalPaymentReceived)}</span>
                    <span style="color: rgb(100, 116, 139); margin-left: 8px;">Payments Received</span>
                  </div>
                  <div style="margin-bottom: 8px;">
                    <span style="color: rgb(245, 158, 11); font-weight: bold;">${formatCurrency(pendingPayments)}</span>
                    <span style="color: rgb(100, 116, 139); margin-left: 8px;">Pending Payments</span>
                  </div>
                  <div>
                    <span style="color: rgb(139, 92, 246); font-weight: bold;">${formatCurrency(avgOrderValue)}</span>
                    <span style="color: rgb(100, 116, 139); margin-left: 8px;">Average Order Value</span>
                  </div>
                </div>
              </td>
              <td style="width: 50%; padding-left: 10px; vertical-align: top;">
                <div style="background-color: rgb(255, 255, 255); padding: 15px; border: 1px solid rgb(229, 231, 235);">
                  <h4 style="color: rgb(31, 41, 55); margin: 0 0 12px 0; font-size: 14px; font-weight: 600;">📊 Payment Status Breakdown</h4>
                  ${paymentAnalysis.map(payment => `
                    <div style="margin-bottom: 6px;">
                      <span style="color: rgb(55, 65, 81); font-weight: 500; text-transform: capitalize;">${payment._id}:</span>
                      <span style="float: right;">
                        <span style="color: rgb(31, 41, 55); font-weight: bold;">${formatCurrency(payment.totalAmount)}</span>
                        <br><span style="color: rgb(100, 116, 139); font-size: 10px;">${payment.count} orders</span>
                      </span>
                    </div>
                  `).join('')}
                </div>
              </td>
            </tr>
          </table>
        </div>

        <!-- Revenue Trends Table -->
        <div style="margin-bottom: 15px;">
          <h3 style="color: rgb(55, 65, 81); margin: 0 0 10px 0; font-size: 14px; border-bottom: 2px solid rgb(229, 231, 235); padding-bottom: 5px;">📅 Monthly Revenue Trends</h3>
          <div style="background-color: rgb(255, 255, 255); border: 1px solid rgb(203, 213, 225);">
            <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
              <thead>
                <tr style="background-color: rgb(241, 245, 249);">
                  <th style="padding: 8px; text-align: left; color: rgb(55, 65, 81); font-weight: 600; border-bottom: 1px solid rgb(203, 213, 225);">Month</th>
                  <th style="padding: 8px; text-align: right; color: rgb(55, 65, 81); font-weight: 600; border-bottom: 1px solid rgb(203, 213, 225);">Revenue</th>
                  <th style="padding: 8px; text-align: right; color: rgb(55, 65, 81); font-weight: 600; border-bottom: 1px solid rgb(203, 213, 225);">Orders</th>
                  <th style="padding: 8px; text-align: right; color: rgb(55, 65, 81); font-weight: 600; border-bottom: 1px solid rgb(203, 213, 225);">Avg. Value</th>
                </tr>
              </thead>
              <tbody>
                ${salesTrends.slice(-3).map((trend, index) => `
                  <tr style="background-color: ${index % 2 === 0 ? 'rgb(249, 250, 251)' : 'rgb(255, 255, 255)'};">
                    <td style="padding: 6px 8px; border-bottom: 1px solid rgb(229, 231, 235);">Month ${trend._id?.month || 'N/A'}</td>
                    <td style="padding: 6px 8px; text-align: right; font-weight: 600; color: rgb(5, 150, 105); border-bottom: 1px solid rgb(229, 231, 235);">${formatCurrency(trend.totalSales || 0)}</td>
                    <td style="padding: 6px 8px; text-align: right; color: rgb(55, 65, 81); border-bottom: 1px solid rgb(229, 231, 235);">${trend.orderCount || 0}</td>
                    <td style="padding: 6px 8px; text-align: right; color: rgb(100, 116, 139); border-bottom: 1px solid rgb(229, 231, 235);">${formatCurrency(trend.avgOrderValue || 0)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Top Customers -->
        <div style="margin-bottom: 15px;">
          <h3 style="color: rgb(55, 65, 81); margin: 0 0 10px 0; font-size: 14px; border-bottom: 2px solid rgb(229, 231, 235); padding-bottom: 5px;">🏆 Top Revenue Customers</h3>
          <div style="background-color: rgb(255, 255, 255); border: 1px solid rgb(203, 213, 225);">
            <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
              <thead>
                <tr style="background-color: rgb(241, 245, 249);">
                  <th style="padding: 8px; text-align: left; border-bottom: 1px solid rgb(203, 213, 225); color: rgb(55, 65, 81); font-weight: 600;">Rank & Customer</th>
                  <th style="padding: 8px; text-align: center; border-bottom: 1px solid rgb(203, 213, 225); color: rgb(55, 65, 81); font-weight: 600;">Orders</th>
                  <th style="padding: 8px; text-align: right; border-bottom: 1px solid rgb(203, 213, 225); color: rgb(55, 65, 81); font-weight: 600;">Total Revenue</th>
                </tr>
              </thead>
              <tbody>
                ${topCustomers.slice(0, 3).map((customer, index) => `
                  <tr style="background-color: ${index % 2 === 0 ? 'rgb(249, 250, 251)' : 'rgb(255, 255, 255)'};">
                    <td style="padding: 6px 8px; border-bottom: 1px solid rgb(229, 231, 235);">
                      <div style="color: rgb(31, 41, 55); font-weight: 600; font-size: 11px;">#${index + 1}. ${customer.customerName || 'Unknown Customer'}</div>
                    </td>
                    <td style="padding: 6px 8px; text-align: center; border-bottom: 1px solid rgb(229, 231, 235); color: rgb(107, 114, 128); font-size: 11px;">${customer.orderCount || 0}</td>
                    <td style="padding: 6px 8px; text-align: right; border-bottom: 1px solid rgb(229, 231, 235); color: rgb(5, 150, 105); font-weight: bold; font-size: 11px;">${formatCurrency(customer.totalRevenue || 0)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

  <!-- Financial Insights -->
        <div style="background-color: rgb(255, 249, 219); padding: 12px; border: 2px solid rgb(245, 158, 11); margin-bottom: 15px;">
          <h4 style="color: rgb(146, 64, 14); margin: 0 0 8px 0; font-size: 14px;">💡 Financial Insights</h4>
          <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
            <tr>
              <td style="padding: 3px 0; color: rgb(120, 53, 15); line-height: 1.4;">• Total revenue: <strong>${formatCurrency(totalRevenue)}</strong> from <strong>${totalOrders}</strong> orders</td>
            </tr>
            <tr>
              <td style="padding: 3px 0; color: rgb(120, 53, 15); line-height: 1.4;">• Average order value: <strong>${formatCurrency(avgOrderValue)}</strong></td>
            </tr>
            <tr>
              <td style="padding: 3px 0; color: rgb(120, 53, 15); line-height: 1.4;">• Revenue growth: <strong style="color: ${revenueGrowth >= 0 ? 'rgb(5, 150, 105)' : 'rgb(220, 38, 38)'}">${revenueGrowth >= 0 ? '+' : ''}${revenueGrowth.toFixed(1)}%</strong></td>
            </tr>
            <tr>
              <td style="padding: 3px 0; color: rgb(120, 53, 15); line-height: 1.4;">• Payment efficiency: <strong>${safePercent(totalPaymentReceived, totalRevenue).toFixed(1)}%</strong> collected</td>
            </tr>
            <tr>
              <td style="padding: 3px 0; color: rgb(120, 53, 15); line-height: 1.4;">• Top customer share: <strong>${topCustomers[0] ? safePercent(topCustomers[0].totalRevenue || 0, totalRevenue).toFixed(1) : 0}%</strong> of total</td>
            </tr>
          </table>
        </div>

        <!-- Expenses & Invoices Snapshot -->
        <div style="margin-bottom: 15px;">
          <h3 style="color: rgb(55, 65, 81); margin: 0 0 10px 0; font-size: 14px; border-bottom: 2px solid rgb(229, 231, 235); padding-bottom: 5px;">🧾 Expenses and Invoices</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
            <tr>
              <td style="width: 50%; vertical-align: top; padding-right: 8px;">
                <div style="background: rgb(255,255,255); border: 1px solid rgb(229, 231, 235);">
                  <div style="padding: 8px; background: rgb(248,250,252); color: rgb(31,41,55); font-weight: 600; border-bottom: 1px solid rgb(229,231,235);">Recent Expenses</div>
                  <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                      <tr style="background: rgb(241,245,249);">
                        <th style="padding: 6px; text-align: left; border-bottom: 1px solid rgb(229,231,235);">Description</th>
                        <th style="padding: 6px; text-align: right; border-bottom: 1px solid rgb(229,231,235);">Amount</th>
                        <th style="padding: 6px; text-align: center; border-bottom: 1px solid rgb(229,231,235);">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${(expenses || []).slice(0,5).map((e, i) => `
                        <tr style="background: ${i % 2 === 0 ? 'rgb(249,250,251)' : 'rgb(255,255,255)'};">
                          <td style="padding: 6px; color: rgb(31,41,55);">${e.description || 'Expense'}</td>
                          <td style="padding: 6px; text-align: right; color: rgb(5,150,105); font-weight: 600;">${formatCurrency(e.amount || 0)}</td>
                          <td style="padding: 6px; text-align: center; color: ${e.status === 'Paid' ? 'rgb(22,163,74)' : 'rgb(217,119,6)'};">${e.status || 'Pending'}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              </td>
              <td style="width: 50%; vertical-align: top; padding-left: 8px;">
                <div style="background: rgb(255,255,255); border: 1px solid rgb(229, 231, 235);">
                  <div style="padding: 8px; background: rgb(248,250,252); color: rgb(31,41,55); font-weight: 600; border-bottom: 1px solid rgb(229,231,235);">Recent Invoices</div>
                  <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                      <tr style="background: rgb(241,245,249);">
                        <th style="padding: 6px; text-align: left; border-bottom: 1px solid rgb(229,231,235);">Invoice</th>
                        <th style="padding: 6px; text-align: right; border-bottom: 1px solid rgb(229,231,235);">Amount</th>
                        <th style="padding: 6px; text-align: center; border-bottom: 1px solid rgb(229,231,235);">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${(invoices || []).slice(0,5).map((inv, i) => `
                        <tr style="background: ${i % 2 === 0 ? 'rgb(249,250,251)' : 'rgb(255,255,255)'};">
                          <td style="padding: 6px; color: rgb(31,41,55);">${inv.invoiceId || inv._id || 'INV'}</td>
                          <td style="padding: 6px; text-align: right; color: rgb(5,150,105); font-weight: 600;">${formatCurrency(inv.totalAmount || inv.final_amount || 0)}</td>
                          <td style="padding: 6px; text-align: center; color: ${inv.status === 'paid' ? 'rgb(22,163,74)' : inv.status === 'overdue' ? 'rgb(220,38,38)' : 'rgb(217,119,6)'}; text-transform: capitalize;">${inv.status || 'sent'}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              </td>
            </tr>
          </table>
        </div>

        <!-- Ledger & Payroll Snapshot -->
        <div style="margin-bottom: 15px;">
          <h3 style="color: rgb(55, 65, 81); margin: 0 0 10px 0; font-size: 14px; border-bottom: 2px solid rgb(229, 231, 235); padding-bottom: 5px;">📚 Ledger and Payroll</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
            <tr>
              <td style="width: 60%; vertical-align: top; padding-right: 8px;">
                <div style="background: rgb(255,255,255); border: 1px solid rgb(229,231,235);">
                  <div style="padding: 8px; background: rgb(248,250,252); color: rgb(31,41,55); font-weight: 600; border-bottom: 1px solid rgb(229,231,235);">Recent Ledger Entries</div>
                  <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                      <tr style="background: rgb(241,245,249);">
                        <th style="padding: 6px; text-align: left; border-bottom: 1px solid rgb(229,231,235);">Description</th>
                        <th style="padding: 6px; text-align: right; border-bottom: 1px solid rgb(229,231,235);">Debit</th>
                        <th style="padding: 6px; text-align: right; border-bottom: 1px solid rgb(229,231,235);">Credit</th>
                        <th style="padding: 6px; text-align: right; border-bottom: 1px solid rgb(229,231,235);">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${(ledger || []).slice(0,6).map((le, i) => `
                        <tr style="background: ${i % 2 === 0 ? 'rgb(249,250,251)' : 'rgb(255,255,255)'};">
                          <td style="padding: 6px; color: rgb(31,41,55);">${le.description || le.account || 'Entry'}</td>
                          <td style="padding: 6px; text-align: right; color: rgb(220,38,38);">${le.debit ? formatCurrency(le.debit) : '-'}</td>
                          <td style="padding: 6px; text-align: right; color: rgb(22,163,74);">${le.credit ? formatCurrency(le.credit) : '-'}</td>
                          <td style="padding: 6px; text-align: right; color: rgb(55,65,81); font-weight: 600;">${le.runningBalance ? formatCurrency(le.runningBalance) : '-'}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              </td>
              <td style="width: 40%; vertical-align: top; padding-left: 8px;">
                <div style="background: rgb(255,255,255); border: 1px solid rgb(229,231,235);">
                  <div style="padding: 8px; background: rgb(248,250,252); color: rgb(31,41,55); font-weight: 600; border-bottom: 1px solid rgb(229,231,235);">Recent Payroll</div>
                  <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                      <tr style="background: rgb(241,245,249);">
                        <th style="padding: 6px; text-align: left; border-bottom: 1px solid rgb(229,231,235);">Employee</th>
                        <th style="padding: 6px; text-align: right; border-bottom: 1px solid rgb(229,231,235);">Net Salary</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${(payroll || []).slice(0,5).map((p, i) => `
                        <tr style="background: ${i % 2 === 0 ? 'rgb(249,250,251)' : 'rgb(255,255,255)'};">
                          <td style="padding: 6px; color: rgb(31,41,55);">${p.employeeName || p.employeeId}</td>
                          <td style="padding: 6px; text-align: right; color: rgb(5,150,105); font-weight: 600;">${formatCurrency(p.netSalary || 0)}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              </td>
            </tr>
          </table>
        </div>

        <!-- Footer -->
        <div style="text-align: center; margin-top: 20px; padding: 12px; background-color: rgb(248, 250, 252); border: 1px solid rgb(229, 231, 235);">
          <div style="color: rgb(31, 41, 55); font-weight: 600; margin-bottom: 5px; font-size: 12px;">The First Promovier Digital Printing Solutions</div>
          <div style="color: rgb(107, 114, 128); font-size: 9px; line-height: 1.3;">
            📧 contact@firstpromovier.lk | 📞 +94 77 123 4567<br>
            📍 No. 123, Main Street, Colombo 03, Sri Lanka<br>
            Generated: ${new Date().toLocaleString('en-GB')} | Period: ${dateRange}
          </div>
        </div>
      </div>
    `;
  };

  const generateInventoryPDFContent = (data) => {
    const totalStockValue = data?.totalStockValue || 0;
    const lowStockItems = data?.lowStockItems || [];
    const stockByCategory = data?.stockValueByCategory || [];
    const reorderItems = data?.reorderItems || [];
    const topValueItems = data?.topValueMaterials || [];
    
    // Calculate metrics
  const totalMaterials = stockByCategory.reduce((sum, cat) => sum + (cat.count || 0), 0);
    const criticalStockCount = lowStockItems.filter(item => item.stock_quantity <= (item.minimum_stock_level * 0.5)).length;
    const stockTurnoverValue = stockByCategory.reduce((sum, cat) => sum + (cat.totalValue || 0), 0);
    
  const materials = data?.rawMaterials || [];
  const matOrders = data?.materialOrders || [];

  return `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; line-height: 1.4; max-width: 800px;">
        <!-- Header Section -->
        <div style="text-align: center; margin-bottom: 40px; padding: 30px 20px; background: #f59e0b; color: white; border: 2px solid #d97706;">
          <h1 style="margin: 0 0 10px 0; font-size: 28px; font-weight: bold;">📦 INVENTORY MANAGEMENT REPORT</h1>
          <p style="margin: 0; font-size: 14px;">The First Promovier - Raw Materials & Stock Control</p>
          <p style="margin: 5px 0 0 0; font-size: 12px;">Generated: ${new Date().toLocaleString('en-GB')} | Period: ${dateRange}</p>
        </div>

        <!-- Inventory Overview -->
        <div style="background: #fff4c7; padding: 25px; margin-bottom: 30px; border: 2px solid #f59e0b;">
          <h2 style="color: #92400e; margin: 0 0 20px 0; font-size: 20px;">📊 Inventory Overview</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="width: 33%; text-align: center; padding: 15px; background: white; border: 1px solid #e5e7eb;">
                <div style="color: #92400e; font-size: 28px; font-weight: bold; margin-bottom: 5px;">${formatCurrency(totalStockValue)}</div>
                <div style="color: #6b7280; font-size: 12px;">TOTAL STOCK VALUE</div>
              </td>
              <td style="width: 33%; text-align: center; padding: 15px; background: white; border: 1px solid #e5e7eb;">
                <div style="color: #0891b2; font-size: 28px; font-weight: bold; margin-bottom: 5px;">${totalMaterials}</div>
                <div style="color: #6b7280; font-size: 12px;">TOTAL MATERIALS</div>
              </td>
              <td style="width: 33%; text-align: center; padding: 15px; background: white; border: 1px solid #e5e7eb;">
                <div style="color: ${lowStockItems.length > 0 ? '#dc2626' : '#059669'}; font-size: 28px; font-weight: bold; margin-bottom: 5px;">${lowStockItems.length}</div>
                <div style="color: #6b7280; font-size: 12px;">LOW STOCK ALERTS</div>
              </td>
            </tr>
          </table>
        </div>

        <!-- Stock Alerts -->
        ${lowStockItems.length > 0 ? `
        <div style="margin-bottom: 30px;">
          <h3 style="color: #dc2626; margin: 0 0 20px 0; font-size: 18px; border-bottom: 2px solid #fecaca; padding-bottom: 10px;">🚨 Critical Stock Alerts</h3>
          <div style="background: #fee2e2; padding: 20px; border: 2px solid #dc2626;">
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background: #fecaca;">
                  <th style="padding: 12px; text-align: left; color: #dc2626; font-weight: 600; border-bottom: 1px solid #dc2626;">Material Name</th>
                  <th style="padding: 12px; text-align: center; color: #dc2626; font-weight: 600; border-bottom: 1px solid #dc2626;">Current Stock</th>
                  <th style="padding: 12px; text-align: center; color: #dc2626; font-weight: 600; border-bottom: 1px solid #dc2626;">Min Level</th>
                  <th style="padding: 12px; text-align: right; color: #dc2626; font-weight: 600; border-bottom: 1px solid #dc2626;">Unit Cost</th>
                </tr>
              </thead>
              <tbody>
                ${lowStockItems.slice(0, 8).map((item, index) => `
                  <tr style="background: ${index % 2 === 0 ? '#ffffff' : '#fef2f2'}; border-left: 4px solid ${item.stock_quantity <= (item.minimum_stock_level * 0.5) ? '#dc2626' : '#f59e0b'};">
                    <td style="padding: 12px; color: #1f2937; font-weight: 600; font-size: 14px; border-bottom: 1px solid #fecaca;">${item.material_name}</td>
                    <td style="padding: 12px; text-align: center; color: #dc2626; font-weight: bold; font-size: 12px; border-bottom: 1px solid #fecaca;">${item.stock_quantity} ${item.unit}</td>
                    <td style="padding: 12px; text-align: center; color: #6b7280; font-size: 12px; border-bottom: 1px solid #fecaca;">${item.minimum_stock_level} ${item.unit}</td>
                    <td style="padding: 12px; text-align: right; color: #1f2937; font-weight: 600; font-size: 12px; border-bottom: 1px solid #fecaca;">${formatCurrency(item.unit_cost || 0)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            ${lowStockItems.length > 8 ? `
              <div style="text-align: center; margin-top: 15px; padding: 10px; background: #fecaca; border: 1px solid #dc2626;">
                <span style="color: #dc2626; font-weight: 600;">+${lowStockItems.length - 8} more items require immediate attention</span>
              </div>
            ` : ''}
          </div>
        </div>
        ` : ''}

        <!-- Raw Materials Snapshot -->
        ${materials.length ? `
        <div style="margin-bottom: 20px;">
          <h3 style="color: #374151; margin: 0 0 10px 0; font-size: 18px; border-bottom: 2px solid #e5e7eb; padding-bottom: 6px;">🧱 Raw Materials Overview</h3>
          <div style="background: white; border: 1px solid #e5e7eb;">
            <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
              <thead>
                <tr style="background: #f8fafc;">
                  <th style="padding: 8px; text-align: left; border-bottom: 1px solid #e5e7eb;">Material</th>
                  <th style="padding: 8px; text-align: center; border-bottom: 1px solid #e5e7eb;">Stock</th>
                  <th style="padding: 8px; text-align: right; border-bottom: 1px solid #e5e7eb;">Unit Cost</th>
                  <th style="padding: 8px; text-align: right; border-bottom: 1px solid #e5e7eb;">Total Value</th>
                </tr>
              </thead>
              <tbody>
                ${materials.slice(0,6).map((m, i) => `
                  <tr style="background: ${i % 2 === 0 ? '#f9fafb' : '#ffffff'};">
                    <td style="padding: 8px; color: #1f2937; font-weight: 600;">${m.material_name}</td>
                    <td style="padding: 8px; text-align: center; color: #374151;">${m.current_stock} ${m.unit}</td>
                    <td style="padding: 8px; text-align: right; color: #6b7280;">${formatCurrency(m.unit_cost || 0)}</td>
                    <td style="padding: 8px; text-align: right; color: #92400e; font-weight: 600;">${formatCurrency((m.current_stock || 0) * (m.unit_cost || 0))}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
        ` : ''}

        <!-- Recent Material Orders -->
        ${matOrders.length ? `
        <div style="margin-bottom: 20px;">
          <h3 style="color: #374151; margin: 0 0 10px 0; font-size: 18px; border-bottom: 2px solid #e5e7eb; padding-bottom: 6px;">🧾 Recent Material Orders</h3>
          <div style="background: white; border: 1px solid #e5e7eb;">
            <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
              <thead>
                <tr style="background: #f8fafc;">
                  <th style="padding: 8px; text-align: left; border-bottom: 1px solid #e5e7eb;">Order ID</th>
                  <th style="padding: 8px; text-align: center; border-bottom: 1px solid #e5e7eb;">Supplier</th>
                  <th style="padding: 8px; text-align: right; border-bottom: 1px solid #e5e7eb;">Total Cost</th>
                  <th style="padding: 8px; text-align: center; border-bottom: 1px solid #e5e7eb;">Status</th>
                </tr>
              </thead>
              <tbody>
                ${matOrders.slice(0,6).map((o, i) => `
                  <tr style="background: ${i % 2 === 0 ? '#f9fafb' : '#ffffff'};">
                    <td style="padding: 8px; color: #1f2937; font-weight: 600;">${o.orderId || o._id}</td>
                    <td style="padding: 8px; text-align: center; color: #374151;">${o.supplier?.name || o.supplier || 'Supplier'}</td>
                    <td style="padding: 8px; text-align: right; color: #059669; font-weight: 600;">${formatCurrency(o.totalCost || o.total_amount || 0)}</td>
                    <td style="padding: 8px; text-align: center; color: ${o.status === 'Completed' ? '#059669' : o.status === 'Pending' ? '#f59e0b' : '#6b7280'};">${o.status || 'Pending'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
        ` : ''}

        <!-- Stock by Category -->
        <div style="margin-bottom: 30px;">
          <h3 style="color: #374151; margin: 0 0 20px 0; font-size: 18px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">📂 Inventory by Category</h3>
          <div style="background: white; border: 1px solid #e5e7eb;">
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background: #f8fafc;">
                  <th style="padding: 15px; text-align: left; color: #374151; font-weight: 600; border-bottom: 1px solid #e5e7eb;">Category</th>
                  <th style="padding: 15px; text-align: right; color: #374151; font-weight: 600; border-bottom: 1px solid #e5e7eb;">Items</th>
                  <th style="padding: 15px; text-align: right; color: #374151; font-weight: 600; border-bottom: 1px solid #e5e7eb;">Total Value</th>
                  <th style="padding: 15px; text-align: right; color: #374151; font-weight: 600; border-bottom: 1px solid #e5e7eb;">Avg. Cost</th>
                </tr>
              </thead>
              <tbody>
                ${stockByCategory.map((category, index) => `
                  <tr style="${index % 2 === 0 ? 'background: #f9fafb;' : 'background: white;'}">
                    <td style="padding: 12px 15px; border-bottom: 1px solid #f3f4f6;">
                      <div style="color: #1f2937; font-weight: 600;">${category._id || 'Uncategorized'}</div>
                    </td>
                    <td style="padding: 12px 15px; text-align: right; color: #374151; border-bottom: 1px solid #f3f4f6;">${category.count || 0}</td>
                    <td style="padding: 12px 15px; text-align: right; font-weight: 600; color: #92400e; border-bottom: 1px solid #f3f4f6;">${formatCurrency(category.totalValue || 0)}</td>
                    <td style="padding: 12px 15px; text-align: right; color: #6b7280; border-bottom: 1px solid #f3f4f6;">${formatCurrency((category.totalValue || 0) / (category.count || 1))}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Top Value Materials -->
        ${topValueItems.length > 0 ? `
        <div style="margin-bottom: 30px;">
          <h3 style="color: #374151; margin: 0 0 20px 0; font-size: 18px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">💎 Highest Value Materials</h3>
          <div style="background: white; padding: 20px; border: 1px solid #e5e7eb;">
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background: #f9fafb;">
                  <th style="padding: 12px; text-align: left; color: #374151; font-weight: 600; border-bottom: 1px solid #e5e7eb;">Material</th>
                  <th style="padding: 12px; text-align: center; color: #374151; font-weight: 600; border-bottom: 1px solid #e5e7eb;">Stock Details</th>
                  <th style="padding: 12px; text-align: right; color: #374151; font-weight: 600; border-bottom: 1px solid #e5e7eb;">Total Value</th>
                  <th style="padding: 12px; text-align: right; color: #374151; font-weight: 600; border-bottom: 1px solid #e5e7eb;">Unit Cost</th>
                </tr>
              </thead>
              <tbody>
                ${topValueItems.slice(0, 5).map((material, index) => `
                  <tr style="background: ${index % 2 === 0 ? '#f9fafb' : '#ffffff'};">
                    <td style="padding: 12px; border-bottom: 1px solid #f3f4f6;">
                      <div style="color: #1f2937; font-weight: 600; font-size: 14px;">#${index + 1}. ${material.material_name}</div>
                    </td>
                    <td style="padding: 12px; text-align: center; border-bottom: 1px solid #f3f4f6; color: #6b7280; font-size: 12px;">Stock: ${material.stock_quantity} ${material.unit} | Min: ${material.minimum_stock_level} ${material.unit}</td>
                    <td style="padding: 12px; text-align: right; border-bottom: 1px solid #f3f4f6; color: #92400e; font-weight: bold; font-size: 16px;">${formatCurrency((material.stock_quantity * material.unit_cost) || 0)}</td>
                    <td style="padding: 12px; text-align: right; border-bottom: 1px solid #f3f4f6; color: #6b7280; font-size: 11px;">${formatCurrency(material.unit_cost || 0)} per ${material.unit}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
        ` : ''}

        <!-- Inventory Insights -->
        <div style="background: #f0fdf4; padding: 20px; margin-bottom: 30px; border: 2px solid #059669;">
          <h4 style="color: #047857; margin: 0 0 15px 0; font-size: 16px;">💡 Inventory Analysis</h4>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #065f46; line-height: 1.6;">• Total inventory value: <strong>${formatCurrency(totalStockValue)}</strong> across ${totalMaterials} different materials</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #065f46; line-height: 1.6;">• Stock alert status: <strong>${lowStockItems.length}</strong> items below minimum levels (${criticalStockCount} critical)</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #065f46; line-height: 1.6;">• Category distribution: <strong>${stockByCategory.length}</strong> categories with avg value of <strong>${formatCurrency(safeDivide(totalStockValue, stockByCategory.length))}</strong></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #065f46; line-height: 1.6;">• Reorder recommendations: <strong>${lowStockItems.length}</strong> items need immediate restocking</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #065f46; line-height: 1.6;">• Inventory health: <strong>${safePercent(totalMaterials - lowStockItems.length, totalMaterials).toFixed(1)}%</strong> of materials are adequately stocked</td>
            </tr>
          </table>
        </div>

        <!-- Recommendations -->
        ${lowStockItems.length > 0 ? `
        <div style="background: #fef7ed; padding: 20px; margin-bottom: 30px; border: 2px solid #f59e0b;">
          <h4 style="color: #9a3412; margin: 0 0 15px 0; font-size: 16px;">📋 Immediate Action Required</h4>
          <div style="color: #7c2d12;">
            <p style="margin: 0 0 10px 0; font-weight: 600;">Priority Restocking List:</p>
            <table style="width: 100%; border-collapse: collapse;">
              ${lowStockItems.slice(0, 5).map((item, index) => `
                <tr>
                  <td style="padding: 5px 0; color: #7c2d12;">
                    ${index + 1}. <strong>${item.material_name}</strong> - Order ${Math.max(item.minimum_stock_level * 2 - item.stock_quantity, 0)} ${item.unit}
                    (Est. Cost: ${formatCurrency(Math.max(item.minimum_stock_level * 2 - item.stock_quantity, 0) * (item.unit_cost || 0))})
                  </td>
                </tr>
              `).join('')}
            </table>
            ${lowStockItems.length > 5 ? `<p style="margin: 10px 0 0 0; color: #7c2d12; font-style: italic;">...and ${lowStockItems.length - 5} more items</p>` : ''}
          </div>
        </div>
        ` : ''}

        <!-- Footer -->
        <div style="text-align: center; margin-top: 40px; padding: 20px; background: #f8fafc; border-radius: 10px; border: 1px solid #e5e7eb;">
          <div style="color: #1f2937; font-weight: 600; margin-bottom: 10px;">The First Promovier Digital Printing Solutions</div>
          <div style="color: #6b7280; font-size: 12px; line-height: 1.5;">
            📧 inventory@firstpromovier.lk | 📞 +94 77 123 4567<br>
            📍 Warehouse: No. 123, Main Street, Colombo 03, Sri Lanka<br>
            Report Generated: ${new Date().toLocaleString('en-GB')} | Period: ${dateRange}
          </div>
        </div>
      </div>
    `;
  };

  const generateDeliveryPDFContent = (data) => {
    const deliveryMetrics = data?.deliveryMetrics || [];
    const onTimeRate = data?.onTimeRate || {};
    const routeAnalysis = data?.routeAnalysis || [];
    const deliveryTrends = data?.deliveryTrends || [];
    const customerSatisfaction = data?.customerSatisfaction || {};
    
    const onTimePercentage = Math.round(safePercent(onTimeRate.onTimeDeliveries || 0, onTimeRate.totalDeliveries || 0));
    
    const totalDeliveries = deliveryMetrics.reduce((sum, metric) => sum + (metric.count || 0), 0);
    const deliveredCount = deliveryMetrics.find(m => m._id === 'delivered')?.count || 0;
    const pendingCount = deliveryMetrics.find(m => m._id === 'pending')?.count || 0;
    const inTransitCount = deliveryMetrics.find(m => m._id === 'in_transit')?.count || 0;
    const avgDeliveryTime = deliveryTrends.length > 0 ? 
      deliveryTrends.reduce((sum, trend) => sum + (trend.avgDeliveryTime || 0), 0) / deliveryTrends.length : 0;
    
  const deliveries = data?.deliveriesList || [];

  return `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; line-height: 1.4; max-width: 800px;">
        <!-- Header Section -->
        <div style="text-align: center; margin-bottom: 40px; padding: 30px 20px; background: #10b981; color: white; border: 2px solid #059669;">
          <h1 style="margin: 0 0 10px 0; font-size: 28px; font-weight: bold;">🚚 DELIVERY PERFORMANCE REPORT</h1>
          <p style="margin: 0; font-size: 14px;">The First Promovier - Logistics & Distribution Excellence</p>
          <p style="margin: 5px 0 0 0; font-size: 12px;">Generated: ${new Date().toLocaleString('en-GB')} | Period: ${dateRange}</p>
        </div>

        <!-- Performance Overview -->
        <div style="background: #d1fae5; padding: 25px; margin-bottom: 30px; border: 2px solid #10b981;">
          <h2 style="color: #065f46; margin: 0 0 20px 0; font-size: 20px;">📊 Delivery Performance Overview</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="width: 33%; text-align: center; padding: 15px; background: white; border: 1px solid #e5e7eb;">
                <div style="color: ${onTimePercentage >= 90 ? '#059669' : onTimePercentage >= 75 ? '#f59e0b' : '#dc2626'}; font-size: 32px; font-weight: bold; margin-bottom: 5px;">${onTimePercentage}%</div>
                <div style="color: #6b7280; font-size: 12px;">ON-TIME RATE</div>
                <div style="color: #6b7280; font-size: 11px; margin-top: 3px;">${onTimeRate.onTimeDeliveries || 0} of ${onTimeRate.totalDeliveries || 0}</div>
              </td>
              <td style="width: 33%; text-align: center; padding: 15px; background: white; border: 1px solid #e5e7eb;">
                <div style="color: #0891b2; font-size: 32px; font-weight: bold; margin-bottom: 5px;">${totalDeliveries}</div>
                <div style="color: #6b7280; font-size: 12px;">TOTAL DELIVERIES</div>
                <div style="color: #6b7280; font-size: 11px; margin-top: 3px;">${deliveredCount} completed</div>
              </td>
              <td style="width: 33%; text-align: center; padding: 15px; background: white; border: 1px solid #e5e7eb;">
                <div style="color: #8b5cf6; font-size: 32px; font-weight: bold; margin-bottom: 5px;">${avgDeliveryTime.toFixed(1)}</div>
                <div style="color: #6b7280; font-size: 12px;">AVG DAYS</div>
                <div style="color: #6b7280; font-size: 11px; margin-top: 3px;">Delivery Time</div>
              </td>
            </tr>
          </table>
        </div>

        <!-- Delivery Status Breakdown -->
        <div style="margin-bottom: 30px;">
          <h3 style="color: #374151; margin: 0 0 20px 0; font-size: 18px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">📋 Delivery Status Distribution</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            ${deliveryMetrics.map(metric => {
              const percentage = safePercent(metric.count || 0, totalDeliveries).toFixed(1);
              const statusColor = {
                'delivered': '#059669',
                'pending': '#f59e0b', 
                'in_transit': '#0891b2',
                'cancelled': '#dc2626',
                'delayed': '#dc2626'
              }[metric._id] || '#6b7280';
              
              return `
                <div style="background: white; padding: 20px; border-radius: 10px; border-left: 5px solid ${statusColor}; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <h4 style="color: #1f2937; margin: 0; font-size: 16px; text-transform: capitalize;">${metric._id.replace('_', ' ')}</h4>
                    <div style="color: ${statusColor}; font-size: 24px; font-weight: bold;">${metric.count}</div>
                  </div>
                  <div style="background: #f3f4f6; height: 8px; border-radius: 4px; overflow: hidden;">
                    <div style="background: ${statusColor}; height: 100%; width: ${percentage}%; transition: width 0.3s ease;"></div>
                  </div>
                  <div style="color: #6b7280; font-size: 12px; margin-top: 5px; text-align: right;">${percentage}% of total</div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Performance Metrics Table -->
        <div style="margin-bottom: 30px;">
          <h3 style="color: #374151; margin: 0 0 20px 0; font-size: 18px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">📈 Delivery Performance Metrics</h3>
          <div style="background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background: #f8fafc;">
                  <th style="padding: 15px; text-align: left; color: #374151; font-weight: 600; border-bottom: 1px solid #e5e7eb;">Metric</th>
                  <th style="padding: 15px; text-align: right; color: #374151; font-weight: 600; border-bottom: 1px solid #e5e7eb;">Value</th>
                  <th style="padding: 15px; text-align: right; color: #374151; font-weight: 600; border-bottom: 1px solid #e5e7eb;">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr style="background: #f9fafb;">
                  <td style="padding: 12px 15px; border-bottom: 1px solid #f3f4f6;">On-Time Delivery Rate</td>
                  <td style="padding: 12px 15px; text-align: right; font-weight: 600; color: ${onTimePercentage >= 90 ? '#059669' : onTimePercentage >= 75 ? '#f59e0b' : '#dc2626'}; border-bottom: 1px solid #f3f4f6;">${onTimePercentage}%</td>
                  <td style="padding: 12px 15px; text-align: right; border-bottom: 1px solid #f3f4f6;">
                    <span style="background: ${onTimePercentage >= 90 ? '#d1fae5' : onTimePercentage >= 75 ? '#fef3c7' : '#fee2e2'}; color: ${onTimePercentage >= 90 ? '#065f46' : onTimePercentage >= 75 ? '#92400e' : '#991b1b'}; padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: 600;">
                      ${onTimePercentage >= 90 ? 'EXCELLENT' : onTimePercentage >= 75 ? 'GOOD' : 'NEEDS IMPROVEMENT'}
                    </span>
                  </td>
                </tr>
                <tr style="background: white;">
                  <td style="padding: 12px 15px; border-bottom: 1px solid #f3f4f6;">Total Deliveries</td>
                  <td style="padding: 12px 15px; text-align: right; font-weight: 600; color: #374151; border-bottom: 1px solid #f3f4f6;">${totalDeliveries}</td>
                  <td style="padding: 12px 15px; text-align: right; color: #6b7280; border-bottom: 1px solid #f3f4f6;">-</td>
                </tr>
                <tr style="background: #f9fafb;">
                  <td style="padding: 12px 15px; border-bottom: 1px solid #f3f4f6;">Successful Deliveries</td>
                  <td style="padding: 12px 15px; text-align: right; font-weight: 600; color: #059669; border-bottom: 1px solid #f3f4f6;">${deliveredCount}</td>
                  <td style="padding: 12px 15px; text-align: right; color: #6b7280; border-bottom: 1px solid #f3f4f6;">${safePercent(deliveredCount, totalDeliveries).toFixed(1)}%</td>
                </tr>
                <tr style="background: white;">
                  <td style="padding: 12px 15px; border-bottom: 1px solid #f3f4f6;">Pending Deliveries</td>
                  <td style="padding: 12px 15px; text-align: right; font-weight: 600; color: #f59e0b; border-bottom: 1px solid #f3f4f6;">${pendingCount}</td>
                  <td style="padding: 12px 15px; text-align: right; color: #6b7280; border-bottom: 1px solid #f3f4f6;">${safePercent(pendingCount, totalDeliveries).toFixed(1)}%</td>
                </tr>
                <tr style="background: #f9fafb;">
                  <td style="padding: 12px 15px;">In Transit</td>
                  <td style="padding: 12px 15px; text-align: right; font-weight: 600; color: #0891b2;">${inTransitCount}</td>
                  <td style="padding: 12px 15px; text-align: right; color: #6b7280;">${safePercent(inTransitCount, totalDeliveries).toFixed(1)}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Route Analysis -->
        ${routeAnalysis.length > 0 ? `
        <div style="margin-bottom: 30px;">
          <h3 style="color: #374151; margin: 0 0 20px 0; font-size: 18px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">🗺️ Route Performance Analysis</h3>
          <div style="background: white; padding: 20px; border-radius: 10px; border: 1px solid #e5e7eb;">
            ${routeAnalysis.slice(0, 5).map((route, index) => `
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px 0; border-bottom: ${index === 4 ? 'none' : '1px solid #f3f4f6'};">
                <div style="flex: 1;">
                  <div style="color: #1f2937; font-weight: 600; font-size: 14px; margin-bottom: 4px;">${route.routeName || route._id}</div>
                  <div style="color: #6b7280; font-size: 12px;">${route.deliveryCount || 0} deliveries | ${route.avgTime || 0} avg days</div>
                </div>
                <div style="text-align: right;">
                  <div style="color: ${(route.onTimeRate || 0) >= 90 ? '#059669' : (route.onTimeRate || 0) >= 75 ? '#f59e0b' : '#dc2626'}; font-weight: bold; font-size: 16px;">${(route.onTimeRate || 0).toFixed(1)}%</div>
                  <div style="color: #6b7280; font-size: 11px;">On-Time Rate</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
        ` : ''}

        <!-- Performance Insights -->
        <div style="background: #ecfdf5; padding: 20px; border-radius: 10px; border-left: 5px solid #10b981; margin-bottom: 30px;">
          <h4 style="color: #047857; margin: 0 0 15px 0; font-size: 16px;">📊 Delivery Performance Insights</h4>
          <ul style="color: #065f46; margin: 0; padding-left: 20px; line-height: 1.6;">
            <li>Overall on-time performance: <strong>${onTimePercentage}%</strong> (${onTimePercentage >= 90 ? 'Excellent' : onTimePercentage >= 75 ? 'Good' : 'Needs Improvement'})</li>
            <li>Delivery completion rate: <strong>${safePercent(deliveredCount, totalDeliveries).toFixed(1)}%</strong> successfully delivered</li>
            <li>Average delivery time: <strong>${avgDeliveryTime.toFixed(1)} days</strong> from dispatch to delivery</li>
            <li>Pending workload: <strong>${pendingCount + inTransitCount}</strong> deliveries in pipeline</li>
            <li>Service reliability: <strong>${safePercent(deliveredCount + inTransitCount, totalDeliveries).toFixed(1)}%</strong> orders in progress or completed</li>
          </ul>
        </div>

        <!-- Action Items -->
        ${onTimePercentage < 90 || pendingCount > 10 ? `
        <div style="background: #fef7ed; padding: 20px; border-radius: 10px; border-left: 5px solid #f59e0b; margin-bottom: 30px;">
          <h4 style="color: #9a3412; margin: 0 0 15px 0; font-size: 16px;">⚠️ Recommended Actions</h4>
          <ul style="color: #7c2d12; margin: 0; padding-left: 20px; line-height: 1.6;">
            ${onTimePercentage < 75 ? '<li><strong>Critical:</strong> On-time rate below 75% - Review delivery processes and route optimization</li>' : ''}
            ${onTimePercentage >= 75 && onTimePercentage < 90 ? '<li>Improve on-time delivery rate from current ' + onTimePercentage + '% to target 90%+</li>' : ''}
            ${pendingCount > 10 ? '<li><strong>Urgent:</strong> ' + pendingCount + ' pending deliveries - Expedite processing and dispatch</li>' : ''}
            ${inTransitCount > 15 ? '<li>Monitor ' + inTransitCount + ' in-transit deliveries for potential delays</li>' : ''}
            <li>Conduct route optimization analysis for high-traffic delivery areas</li>
            <li>Implement customer communication system for delivery updates</li>
          </ul>
        </div>
        ` : `
        <div style="background: #f0fdf4; padding: 20px; border-radius: 10px; border-left: 5px solid #22c55e; margin-bottom: 30px;">
          <h4 style="color: #15803d; margin: 0 0 15px 0; font-size: 16px;">✅ Performance Excellence</h4>
          <p style="color: #166534; margin: 0; line-height: 1.6;">
            Delivery performance is <strong>excellent</strong> with ${onTimePercentage}% on-time rate. 
            Continue current processes and focus on maintaining service quality standards.
          </p>
        </div>
        `}

        <!-- Footer -->
        ${deliveries.length ? `
        <div style="margin-bottom: 20px;">
          <h3 style="color: #374151; margin: 0 0 10px 0; font-size: 18px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">📦 Recent Deliveries</h3>
          <div style="background: white; border-radius: 10px; overflow: hidden; border: 1px solid #e5e7eb;">
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background: #f8fafc;">
                  <th style="padding: 10px; text-align: left; color: #374151; font-weight: 600; border-bottom: 1px solid #e5e7eb;">Delivery</th>
                  <th style="padding: 10px; text-align: center; color: #374151; font-weight: 600; border-bottom: 1px solid #e5e7eb;">Customer</th>
                  <th style="padding: 10px; text-align: center; color: #374151; font-weight: 600; border-bottom: 1px solid #e5e7eb;">Status</th>
                  <th style="padding: 10px; text-align: right; color: #374151; font-weight: 600; border-bottom: 1px solid #e5e7eb;">Scheduled</th>
                </tr>
              </thead>
              <tbody>
                ${deliveries.slice(0, 8).map((d, i) => `
                  <tr style="background: ${i % 2 === 0 ? '#f9fafb' : '#ffffff'};">
                    <td style="padding: 8px 10px; border-bottom: 1px solid #f3f4f6;">${d.deliveryId || d._id}</td>
                    <td style="padding: 8px 10px; text-align: center; border-bottom: 1px solid #f3f4f6;">${d.customer?.name || d.customer?.email || 'N/A'}</td>
                    <td style="padding: 8px 10px; text-align: center; border-bottom: 1px solid #f3f4f6; text-transform: capitalize;">${d.status || 'scheduled'}</td>
                    <td style="padding: 8px 10px; text-align: right; border-bottom: 1px solid #f3f4f6;">${d.scheduledDate ? new Date(d.scheduledDate).toLocaleDateString('en-GB') : '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
        ` : ''}

        <!-- Footer -->
        <div style="text-align: center; margin-top: 40px; padding: 20px; background: #f8fafc; border-radius: 10px; border: 1px solid #e5e7eb;">
          <div style="color: #1f2937; font-weight: 600; margin-bottom: 10px;">The First Promovier Digital Printing Solutions</div>
          <div style="color: #6b7280; font-size: 12px; line-height: 1.5;">
            📧 logistics@firstpromovier.lk | 📞 +94 77 123 4567<br>
            📍 Delivery Hub: No. 123, Main Street, Colombo 03, Sri Lanka<br>
            Report Generated: ${new Date().toLocaleString('en-GB')} | Period: ${dateRange}
          </div>
        </div>
      </div>
    `;
  };

  const generateOrderPDFContent = (data) => {
    const salesTrends = data?.salesTrends || [];
    const topCustomers = data?.topCustomers || [];
    const paymentAnalysis = data?.paymentAnalysis || [];
    const ordersByStatus = data?.ordersByStatus || [];
    const serviceAnalysis = data?.serviceAnalysis || [];
    
    // Calculate comprehensive metrics
    const totalOrders = salesTrends.reduce((sum, trend) => sum + (trend.orderCount || 0), 0);
    const totalRevenue = salesTrends.reduce((sum, trend) => sum + (trend.totalSales || 0), 0);
  const avgOrderValue = safeDivide(totalRevenue, totalOrders);
    const completedOrders = ordersByStatus.find(s => s._id === 'completed')?.count || 0;
    const pendingOrders = ordersByStatus.find(s => s._id === 'pending')?.count || 0;
    const processingOrders = ordersByStatus.find(s => s._id === 'processing')?.count || 0;
    
    const orderGrowth = salesTrends.length > 1 ? 
      safeChangePct(salesTrends[salesTrends.length - 1]?.orderCount || 0, salesTrends[0]?.orderCount || 0) : 0;
    
  const orders = data?.ordersList || [];

  return `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; line-height: 1.4; max-width: 800px;">
        <!-- Header Section -->
        <div style="text-align: center; margin-bottom: 40px; padding: 30px 20px; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; border-radius: 12px;">
          <h1 style="margin: 0 0 10px 0; font-size: 28px; font-weight: bold;">🛒 ORDER MANAGEMENT REPORT</h1>
          <p style="margin: 0; font-size: 14px; opacity: 0.9;">The First Promovier - Customer Orders & Sales Analysis</p>
          <p style="margin: 5px 0 0 0; font-size: 12px; opacity: 0.8;">Generated: ${new Date().toLocaleString('en-GB')} | Period: ${dateRange}</p>
        </div>

        <!-- Order Overview -->
        <div style="background: #faf5ff; padding: 25px; border-radius: 10px; margin-bottom: 30px; border-left: 5px solid #8b5cf6;">
          <h2 style="color: #6b21a8; margin: 0 0 20px 0; font-size: 20px;">📊 Order Performance Summary</h2>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 15px;">
            <div style="text-align: center; padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <div style="color: #8b5cf6; font-size: 24px; font-weight: bold; margin-bottom: 5px;">${totalOrders}</div>
              <div style="color: #6b7280; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Total Orders</div>
            </div>
            <div style="text-align: center; padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <div style="color: #059669; font-size: 24px; font-weight: bold; margin-bottom: 5px;">${formatCurrency(totalRevenue)}</div>
              <div style="color: #6b7280; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Total Revenue</div>
            </div>
            <div style="text-align: center; padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <div style="color: #0891b2; font-size: 24px; font-weight: bold; margin-bottom: 5px;">${formatCurrency(avgOrderValue)}</div>
              <div style="color: #6b7280; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Avg Order Value</div>
            </div>
            <div style="text-align: center; padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <div style="color: ${orderGrowth >= 0 ? '#059669' : '#dc2626'}; font-size: 24px; font-weight: bold; margin-bottom: 5px;">${orderGrowth >= 0 ? '+' : ''}${orderGrowth.toFixed(1)}%</div>
              <div style="color: #6b7280; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Growth Rate</div>
            </div>
          </div>
        </div>

        <!-- Order Status Distribution -->
        <div style="margin-bottom: 30px;">
          <h3 style="color: #374151; margin: 0 0 20px 0; font-size: 18px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">📋 Order Status Overview</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
            ${[
              { status: 'completed', count: completedOrders, color: '#059669', bg: '#d1fae5' },
              { status: 'processing', count: processingOrders, color: '#0891b2', bg: '#cffafe' },
              { status: 'pending', count: pendingOrders, color: '#f59e0b', bg: '#fef3c7' }
            ].map(item => `
              <div style="background: ${item.bg}; padding: 20px; border-radius: 10px; border-left: 5px solid ${item.color};">
                <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 10px;">
                  <h4 style="color: ${item.color}; margin: 0; font-size: 16px; text-transform: capitalize; flex: 1;">${item.status}</h4>
                  <div style="color: ${item.color}; font-size: 32px; font-weight: bold;">${item.count}</div>
                </div>
                  <div style="background: rgba(255,255,255,0.7); height: 6px; border-radius: 3px; overflow: hidden;">
                  <div style="background: ${item.color}; height: 100%; width: ${safePercent(item.count || 0, totalOrders).toFixed(1)}%;"></div>
                </div>
                <div style="color: ${item.color}; font-size: 12px; margin-top: 5px; font-weight: 600;">${safePercent(item.count || 0, totalOrders).toFixed(1)}% of total orders</div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Monthly Order Trends -->
        <div style="margin-bottom: 30px;">
          <h3 style="color: #374151; margin: 0 0 20px 0; font-size: 18px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">📈 Monthly Order Trends</h3>
          <div style="background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background: #faf5ff;">
                  <th style="padding: 15px; text-align: left; color: #6b21a8; font-weight: 600; border-bottom: 1px solid #e5e7eb;">Month</th>
                  <th style="padding: 15px; text-align: right; color: #6b21a8; font-weight: 600; border-bottom: 1px solid #e5e7eb;">Orders</th>
                  <th style="padding: 15px; text-align: right; color: #6b21a8; font-weight: 600; border-bottom: 1px solid #e5e7eb;">Revenue</th>
                  <th style="padding: 15px; text-align: right; color: #6b21a8; font-weight: 600; border-bottom: 1px solid #e5e7eb;">Avg Value</th>
                  <th style="padding: 15px; text-align: center; color: #6b21a8; font-weight: 600; border-bottom: 1px solid #e5e7eb;">Trend</th>
                </tr>
              </thead>
              <tbody>
                ${salesTrends.slice(-6).map((trend, index, array) => {
                  const prevTrend = array[index - 1];
                  const orderTrend = prevTrend ? safeChangePct(trend.orderCount || 0, prevTrend.orderCount || 0) : 0;
                  const trendIcon = orderTrend > 0 ? '📈' : orderTrend < 0 ? '📉' : '➡️';
                  const trendColor = orderTrend > 0 ? '#059669' : orderTrend < 0 ? '#dc2626' : '#6b7280';
                  
                  return `
                    <tr style="${index % 2 === 0 ? 'background: #fafafa;' : 'background: white;'}">
                      <td style="padding: 12px 15px; border-bottom: 1px solid #f3f4f6;">Month ${trend._id?.month || 'N/A'} ${trend._id?.year || ''}</td>
                      <td style="padding: 12px 15px; text-align: right; font-weight: 600; color: #8b5cf6; border-bottom: 1px solid #f3f4f6;">${trend.orderCount || 0}</td>
                      <td style="padding: 12px 15px; text-align: right; font-weight: 600; color: #059669; border-bottom: 1px solid #f3f4f6;">${formatCurrency(trend.totalSales || 0)}</td>
                      <td style="padding: 12px 15px; text-align: right; color: #374151; border-bottom: 1px solid #f3f4f6;">${formatCurrency(trend.avgOrderValue || 0)}</td>
                      <td style="padding: 12px 15px; text-align: center; border-bottom: 1px solid #f3f4f6;">
                        <span style="color: ${trendColor}; font-weight: 600; font-size: 12px;">
                          ${trendIcon} ${index > 0 ? (orderTrend >= 0 ? '+' : '') + orderTrend.toFixed(1) + '%' : '-'}
                        </span>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Top Customers Analysis -->
        <div style="margin-bottom: 30px;">
          <h3 style="color: #374151; margin: 0 0 20px 0; font-size: 18px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">🏆 Top Customers by Revenue</h3>
          <div style="background: white; padding: 20px; border-radius: 10px; border: 1px solid #e5e7eb;">
            ${topCustomers.slice(0, 8).map((customer, index) => `
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px 0; border-bottom: ${index === 7 ? 'none' : '1px solid #f3f4f6'};">
                <div style="flex: 1;">
                  <div style="display: flex; align-items: center; margin-bottom: 5px;">
                    <span style="background: #8b5cf6; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; margin-right: 12px;">${index + 1}</span>
                    <div style="color: #1f2937; font-weight: 600; font-size: 14px;">${customer.customerName || 'Unknown Customer'}</div>
                  </div>
                  <div style="margin-left: 36px; color: #6b7280; font-size: 12px;">
                    ${customer.orderCount || 0} orders • Avg: ${formatCurrency(safeDivide((customer.totalRevenue || 0), (customer.orderCount || 0)))} per order
                  </div>
                </div>
                <div style="text-align: right;">
                  <div style="color: #059669; font-weight: bold; font-size: 18px;">${formatCurrency(customer.totalRevenue || 0)}</div>
                  <div style="color: #6b7280; font-size: 11px;">${safePercent(customer.totalRevenue || 0, totalRevenue).toFixed(1)}% of total</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Payment Analysis -->
        <div style="margin-bottom: 30px;">
          <h3 style="color: #374151; margin: 0 0 20px 0; font-size: 18px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">💳 Payment Status Analysis</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            ${paymentAnalysis.map(payment => {
              const percentage = safePercent(payment.totalAmount || 0, totalRevenue).toFixed(1);
              const statusColor = {
                'paid': '#059669',
                'pending': '#f59e0b', 
                'overdue': '#dc2626',
                'cancelled': '#6b7280'
              }[payment._id] || '#8b5cf6';
              const statusBg = {
                'paid': '#d1fae5',
                'pending': '#fef3c7', 
                'overdue': '#fee2e2',
                'cancelled': '#f3f4f6'
              }[payment._id] || '#faf5ff';
              
              return `
                <div style="background: ${statusBg}; padding: 20px; border-radius: 10px; border-left: 5px solid ${statusColor};">
                  <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 15px;">
                    <h4 style="color: ${statusColor}; margin: 0; font-size: 16px; text-transform: capitalize; flex: 1;">${payment._id} Orders</h4>
                    <div style="text-align: right;">
                      <div style="color: ${statusColor}; font-size: 20px; font-weight: bold;">${payment.count}</div>
                      <div style="color: #6b7280; font-size: 11px;">orders</div>
                    </div>
                  </div>
                  <div style="margin-bottom: 10px;">
                    <div style="color: #1f2937; font-weight: 600; font-size: 18px;">${formatCurrency(payment.totalAmount)}</div>
                    <div style="color: #6b7280; font-size: 12px;">${percentage}% of total revenue</div>
                  </div>
                  <div style="background: rgba(255,255,255,0.7); height: 6px; border-radius: 3px; overflow: hidden;">
                    <div style="background: ${statusColor}; height: 100%; width: ${percentage}%;"></div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Order Insights -->
        <div style="background: #f0f9ff; padding: 20px; border-radius: 10px; border-left: 5px solid #0891b2; margin-bottom: 30px;">
          <h4 style="color: #0c4a6e; margin: 0 0 15px 0; font-size: 16px;">📊 Order Management Insights</h4>
          <ul style="color: #075985; margin: 0; padding-left: 20px; line-height: 1.6;">
            <li>Total order volume: <strong>${totalOrders} orders</strong> generating <strong>${formatCurrency(totalRevenue)}</strong> in revenue</li>
            <li>Order fulfillment rate: <strong>${safePercent(completedOrders, totalOrders).toFixed(1)}%</strong> (${completedOrders} completed orders)</li>
            <li>Average order value: <strong>${formatCurrency(avgOrderValue)}</strong> per transaction</li>
            <li>Customer concentration: Top 3 customers account for <strong>${topCustomers.slice(0, 3).reduce((sum, c) => sum + safePercent(c.totalRevenue || 0, totalRevenue), 0).toFixed(1)}%</strong> of revenue</li>
            <li>Order growth trend: <strong>${orderGrowth >= 0 ? '+' : ''}${orderGrowth.toFixed(1)}%</strong> period-over-period</li>
            <li>Active pipeline: <strong>${pendingOrders + processingOrders} orders</strong> in progress</li>
          </ul>
        </div>

        <!-- Action Items -->
        ${(pendingOrders > 10 || safePercent(completedOrders, totalOrders) < 80) ? `
        <div style="background: #fef7ed; padding: 20px; border-radius: 10px; border-left: 5px solid #f59e0b; margin-bottom: 30px;">
          <h4 style="color: #9a3412; margin: 0 0 15px 0; font-size: 16px;">⚠️ Action Required</h4>
          <ul style="color: #7c2d12; margin: 0; padding-left: 20px; line-height: 1.6;">
            ${pendingOrders > 10 ? '<li><strong>High Priority:</strong> ' + pendingOrders + ' pending orders require immediate attention</li>' : ''}
            ${safePercent(completedOrders, totalOrders) < 80 ? '<li>Order completion rate is ' + safePercent(completedOrders, totalOrders).toFixed(1) + '% - target should be 85%+</li>' : ''}
            ${processingOrders > 15 ? '<li>Monitor ' + processingOrders + ' orders currently in processing stage</li>' : ''}
            <li>Focus on customer retention - top customers generate significant revenue share</li>
            <li>Optimize order processing workflow to improve completion rates</li>
          </ul>
        </div>
        ` : ''}

        <!-- Recent Orders -->
        ${orders.length ? `
        <div style="margin-bottom: 20px;">
          <h3 style="color: #374151; margin: 0 0 10px 0; font-size: 18px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">🧾 Recent Orders</h3>
          <div style="background: white; border-radius: 10px; overflow: hidden; border: 1px solid #e5e7eb;">
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background: #faf5ff;">
                  <th style="padding: 10px; text-align: left; color: #6b21a8; font-weight: 600; border-bottom: 1px solid #e5e7eb;">Order</th>
                  <th style="padding: 10px; text-align: center; color: #6b21a8; font-weight: 600; border-bottom: 1px solid #e5e7eb;">Customer</th>
                  <th style="padding: 10px; text-align: center; color: #6b21a8; font-weight: 600; border-bottom: 1px solid #e5e7eb;">Status</th>
                  <th style="padding: 10px; text-align: right; color: #6b21a8; font-weight: 600; border-bottom: 1px solid #e5e7eb;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${orders.slice(0, 8).map((o, i) => `
                  <tr style="background: ${i % 2 === 0 ? '#f9fafb' : '#ffffff'};">
                    <td style="padding: 8px 10px; border-bottom: 1px solid #f3f4f6;">${o.orderId || o._id}</td>
                    <td style="padding: 8px 10px; text-align: center; border-bottom: 1px solid #f3f4f6;">${o.customer_name || o.customer_id?.name || o.customer_id?.email || 'N/A'}</td>
                    <td style="padding: 8px 10px; text-align: center; border-bottom: 1px solid #f3f4f6;">${o.status || 'Pending'}</td>
                    <td style="padding: 8px 10px; text-align: right; border-bottom: 1px solid #f3f4f6; color: #059669; font-weight: 600;">${formatCurrency(o.final_amount || o.total || 0)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
        ` : ''}

        <!-- Footer -->
        <div style="text-align: center; margin-top: 40px; padding: 20px; background: #f8fafc; border-radius: 10px; border: 1px solid #e5e7eb;">
          <div style="color: #1f2937; font-weight: 600; margin-bottom: 10px;">The First Promovier Digital Printing Solutions</div>
          <div style="color: #6b7280; font-size: 12px; line-height: 1.5;">
            📧 orders@firstpromovier.lk | 📞 +94 77 123 4567<br>
            📍 Order Processing: No. 123, Main Street, Colombo 03, Sri Lanka<br>
            Report Generated: ${new Date().toLocaleString('en-GB')} | Period: ${dateRange}
          </div>
        </div>
      </div>
    `;
  };

  const generateHRPDFContent = (data) => {
    const employeeStats = data?.employeeStats || [];
    const attendanceData = data?.attendanceData || [];
    const leaveData = data?.leaveData || [];
    const departmentStats = data?.departmentStats || [];
    const salaryData = data?.salaryData || [];
    
    const totalEmployees = employeeStats.reduce((sum, stat) => sum + (stat.count || 0), 0);
    const presentEmployees = attendanceData.find(a => a._id === 'present')?.count || 0;
    const absentEmployees = attendanceData.find(a => a._id === 'absent')?.count || 0;
  const attendanceRate = safePercent(presentEmployees, totalEmployees).toFixed(1);
    
    const approvedLeave = leaveData.find(l => l._id === 'approved')?.count || 0;
    const pendingLeave = leaveData.find(l => l._id === 'pending')?.count || 0;
    const avgSalary = salaryData.length > 0 ? 
      salaryData.reduce((sum, s) => sum + (s.avgSalary || 0), 0) / salaryData.length : 0;
    
  const payroll = data?.payroll || [];

  return `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; line-height: 1.4; max-width: 800px;">
        <!-- Header Section -->
        <div style="text-align: center; margin-bottom: 40px; padding: 30px 20px; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; border-radius: 12px;">
          <h1 style="margin: 0 0 10px 0; font-size: 28px; font-weight: bold;">👥 HUMAN RESOURCES REPORT</h1>
          <p style="margin: 0; font-size: 14px; opacity: 0.9;">The First Promovier - Workforce Management & Analytics</p>
          <p style="margin: 5px 0 0 0; font-size: 12px; opacity: 0.8;">Generated: ${new Date().toLocaleString('en-GB')} | Period: ${dateRange}</p>
        </div>

        <!-- Workforce Overview -->
        <div style="background: #fef2f2; padding: 25px; border-radius: 10px; margin-bottom: 30px; border-left: 5px solid #ef4444;">
          <h2 style="color: #991b1b; margin: 0 0 20px 0; font-size: 20px;">👨‍💼 Workforce Overview</h2>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 15px;">
            <div style="text-align: center; padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <div style="color: #ef4444; font-size: 28px; font-weight: bold; margin-bottom: 5px;">${totalEmployees}</div>
              <div style="color: #6b7280; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Total Staff</div>
            </div>
            <div style="text-align: center; padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <div style="color: ${attendanceRate >= 90 ? '#059669' : attendanceRate >= 75 ? '#f59e0b' : '#dc2626'}; font-size: 28px; font-weight: bold; margin-bottom: 5px;">${attendanceRate}%</div>
              <div style="color: #6b7280; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Attendance Rate</div>
            </div>
            <div style="text-align: center; padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <div style="color: #8b5cf6; font-size: 28px; font-weight: bold; margin-bottom: 5px;">${departmentStats.length}</div>
              <div style="color: #6b7280; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Departments</div>
            </div>
            <div style="text-align: center; padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <div style="color: #0891b2; font-size: 28px; font-weight: bold; margin-bottom: 5px;">${formatCurrency(avgSalary)}</div>
              <div style="color: #6b7280; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Avg Salary</div>
            </div>
          </div>
        </div>

        <!-- Employee Distribution -->
        <div style="margin-bottom: 30px;">
          <h3 style="color: #374151; margin: 0 0 20px 0; font-size: 18px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">🏢 Employee Distribution by Role</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div style="background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="background: #fef2f2;">
                    <th style="padding: 15px; text-align: left; color: #991b1b; font-weight: 600; border-bottom: 1px solid #e5e7eb;">Role</th>
                    <th style="padding: 15px; text-align: right; color: #991b1b; font-weight: 600; border-bottom: 1px solid #e5e7eb;">Count</th>
                    <th style="padding: 15px; text-align: right; color: #991b1b; font-weight: 600; border-bottom: 1px solid #e5e7eb;">%</th>
                  </tr>
                </thead>
                <tbody>
                  ${employeeStats.map((stat, index) => `
                    <tr style="${index % 2 === 0 ? 'background: #fafafa;' : 'background: white;'}">
                      <td style="padding: 12px 15px; border-bottom: 1px solid #f3f4f6; text-transform: capitalize;">
                        <div style="color: #1f2937; font-weight: 600;">${stat._id || 'Unknown'}</div>
                      </td>
                      <td style="padding: 12px 15px; text-align: right; font-weight: 600; color: #ef4444; border-bottom: 1px solid #f3f4f6;">${stat.count || 0}</td>
                      <td style="padding: 12px 15px; text-align: right; color: #6b7280; border-bottom: 1px solid #f3f4f6;">${safePercent(stat.count || 0, totalEmployees).toFixed(1)}%</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>

            <!-- Department Breakdown -->
            <div style="background: white; padding: 20px; border-radius: 10px; border: 1px solid #e5e7eb;">
              <h4 style="color: #374151; margin: 0 0 15px 0; font-size: 16px;">Department Breakdown</h4>
              ${departmentStats.slice(0, 5).map((dept, index) => `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: ${index === 4 ? 'none' : '1px solid #f3f4f6'};">
                  <div style="flex: 1;">
                    <div style="color: #1f2937; font-weight: 600; font-size: 14px;">${dept.department || dept._id || 'Unknown Dept'}</div>
                    <div style="color: #6b7280; font-size: 12px;">${dept.avgExperience ? `Avg: ${dept.avgExperience} years exp` : 'Various experience levels'}</div>
                  </div>
                  <div style="text-align: right;">
                    <div style="color: #ef4444; font-weight: bold; font-size: 16px;">${dept.employeeCount || dept.count || 0}</div>
                    <div style="color: #6b7280; font-size: 11px;">employees</div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Attendance Analytics -->
        <div style="margin-bottom: 30px;">
          <h3 style="color: #374151; margin: 0 0 20px 0; font-size: 18px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">📅 Attendance & Leave Management</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px;">
            
            <!-- Attendance Status -->
            <div style="background: #f0fdf4; padding: 20px; border-radius: 10px; border-left: 5px solid #22c55e;">
              <h4 style="color: #15803d; margin: 0 0 15px 0; font-size: 16px;">📊 Daily Attendance</h4>
              ${attendanceData.map(attendance => {
                const percentage = safePercent(attendance.count || 0, totalEmployees).toFixed(1);
                const statusColor = {
                  'present': '#059669',
                  'absent': '#dc2626',
                  'late': '#f59e0b',
                  'half_day': '#8b5cf6'
                }[attendance._id] || '#6b7280';
                
                return `
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <div>
                      <span style="color: #374151; font-weight: 600; text-transform: capitalize; font-size: 14px;">${attendance._id?.replace('_', ' ')}</span>
                      <div style="color: #6b7280; font-size: 11px;">${percentage}% of workforce</div>
                    </div>
                    <div style="color: ${statusColor}; font-weight: bold; font-size: 18px;">${attendance.count || 0}</div>
                  </div>
                  <div style="background: #e5e7eb; height: 4px; border-radius: 2px; overflow: hidden; margin-bottom: 12px;">
                    <div style="background: ${statusColor}; height: 100%; width: ${percentage}%;"></div>
                  </div>
                `;
              }).join('')}
            </div>

            <!-- Leave Management -->
            <div style="background: #fef7ed; padding: 20px; border-radius: 10px; border-left: 5px solid #f59e0b;">
              <h4 style="color: #9a3412; margin: 0 0 15px 0; font-size: 16px;">🏖️ Leave Status</h4>
              ${leaveData.map(leave => {
                const statusColor = {
                  'approved': '#059669',
                  'pending': '#f59e0b',
                  'rejected': '#dc2626',
                  'cancelled': '#6b7280'
                }[leave._id] || '#8b5cf6';
                
                return `
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding: 8px; background: white; border-radius: 6px;">
                    <span style="color: #374151; font-weight: 600; text-transform: capitalize; font-size: 13px;">${leave._id}</span>
                    <span style="color: ${statusColor}; font-weight: bold; font-size: 16px;">${leave.count || 0}</span>
                  </div>
                `;
              }).join('')}
            </div>

            <!-- Salary Overview -->
            <div style="background: #f0f9ff; padding: 20px; border-radius: 10px; border-left: 5px solid #0891b2;">
              <h4 style="color: #0c4a6e; margin: 0 0 15px 0; font-size: 16px;">💰 Compensation</h4>
              ${salaryData.slice(0, 4).map(salary => `
                <div style="margin-bottom: 12px; padding: 8px; background: white; border-radius: 6px;">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: #374151; font-weight: 600; font-size: 13px; text-transform: capitalize;">${salary._id || salary.department}</span>
                    <span style="color: #0891b2; font-weight: bold; font-size: 14px;">${formatCurrency(salary.avgSalary || 0)}</span>
                  </div>
                  <div style="color: #6b7280; font-size: 11px; margin-top: 2px;">${salary.employeeCount || 0} employees</div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- HR Performance Metrics -->
        <div style="margin-bottom: 30px;">
          <h3 style="color: #374151; margin: 0 0 20px 0; font-size: 18px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">📈 HR Performance Metrics</h3>
          <div style="background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background: #fef2f2;">
                  <th style="padding: 15px; text-align: left; color: #991b1b; font-weight: 600; border-bottom: 1px solid #e5e7eb;">Metric</th>
                  <th style="padding: 15px; text-align: right; color: #991b1b; font-weight: 600; border-bottom: 1px solid #e5e7eb;">Current</th>
                  <th style="padding: 15px; text-align: right; color: #991b1b; font-weight: 600; border-bottom: 1px solid #e5e7eb;">Target</th>
                  <th style="padding: 15px; text-align: center; color: #991b1b; font-weight: 600; border-bottom: 1px solid #e5e7eb;">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr style="background: #fafafa;">
                  <td style="padding: 12px 15px; border-bottom: 1px solid #f3f4f6;">Attendance Rate</td>
                  <td style="padding: 12px 15px; text-align: right; font-weight: 600; color: ${Number(attendanceRate) >= 90 ? '#059669' : Number(attendanceRate) >= 75 ? '#f59e0b' : '#dc2626'}; border-bottom: 1px solid #f3f4f6;">${attendanceRate}%</td>
                  <td style="padding: 12px 15px; text-align: right; color: #6b7280; border-bottom: 1px solid #f3f4f6;">90%</td>
                  <td style="padding: 12px 15px; text-align: center; border-bottom: 1px solid #f3f4f6;">
                    <span style="background: ${Number(attendanceRate) >= 90 ? '#d1fae5' : Number(attendanceRate) >= 75 ? '#fef3c7' : '#fee2e2'}; color: ${Number(attendanceRate) >= 90 ? '#065f46' : Number(attendanceRate) >= 75 ? '#92400e' : '#991b1b'}; padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: 600;">
                      ${Number(attendanceRate) >= 90 ? 'EXCELLENT' : Number(attendanceRate) >= 75 ? 'GOOD' : 'POOR'}
                    </span>
                  </td>
                </tr>
                <tr style="background: white;">
                  <td style="padding: 12px 15px; border-bottom: 1px solid #f3f4f6;">Employee Retention</td>
                  <td style="padding: 12px 15px; text-align: right; font-weight: 600; color: #059669; border-bottom: 1px solid #f3f4f6;">95%</td>
                  <td style="padding: 12px 15px; text-align: right; color: #6b7280; border-bottom: 1px solid #f3f4f6;">85%</td>
                  <td style="padding: 12px 15px; text-align: center; border-bottom: 1px solid #f3f4f6;">
                    <span style="background: #d1fae5; color: #065f46; padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: 600;">EXCELLENT</span>
                  </td>
                </tr>
                <tr style="background: #fafafa;">
                  <td style="padding: 12px 15px; border-bottom: 1px solid #f3f4f6;">Leave Approval Rate</td>
                  <td style="padding: 12px 15px; text-align: right; font-weight: 600; color: #8b5cf6; border-bottom: 1px solid #f3f4f6;">${safePercent(approvedLeave, approvedLeave + pendingLeave).toFixed(1)}%</td>
                  <td style="padding: 12px 15px; text-align: right; color: #6b7280; border-bottom: 1px solid #f3f4f6;">80%</td>
                  <td style="padding: 12px 15px; text-align: center; border-bottom: 1px solid #f3f4f6;">
                    <span style="background: #faf5ff; color: #7c3aed; padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: 600;">BALANCED</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Payroll Snapshot -->
        ${payroll.length ? `
        <div style="margin-bottom: 30px;">
          <h3 style="color: #374151; margin: 0 0 20px 0; font-size: 18px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">💰 Recent Payroll Records</h3>
          <div style="background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background: #f0f9ff;">
                  <th style="padding: 12px; text-align: left; color: #0c4a6e; font-weight: 600; border-bottom: 1px solid #e5e7eb;">Employee</th>
                  <th style="padding: 12px; text-align: right; color: #0c4a6e; font-weight: 600; border-bottom: 1px solid #e5e7eb;">Net Salary</th>
                  <th style="padding: 12px; text-align: center; color: #0c4a6e; font-weight: 600; border-bottom: 1px solid #e5e7eb;">Period</th>
                </tr>
              </thead>
              <tbody>
                ${payroll.slice(0,6).map((p, i) => `
                  <tr style="background: ${i % 2 === 0 ? '#f9fafb' : '#ffffff'};">
                    <td style="padding: 10px 12px; border-bottom: 1px solid #f3f4f6;">${p.employeeName || p.employeeId}</td>
                    <td style="padding: 10px 12px; text-align: right; border-bottom: 1px solid #f3f4f6; color: #059669; font-weight: 600;">${formatCurrency(p.netSalary || 0)}</td>
                    <td style="padding: 10px 12px; text-align: center; border-bottom: 1px solid #f3f4f6;">${p.period?.startDate ? new Date(p.period.startDate).toLocaleDateString('en-GB') : ''} - ${p.period?.endDate ? new Date(p.period.endDate).toLocaleDateString('en-GB') : ''}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
        ` : ''}

        <!-- HR Insights -->
        <div style="background: #fef2f2; padding: 20px; border-radius: 10px; border-left: 5px solid #ef4444; margin-bottom: 30px;">
          <h4 style="color: #991b1b; margin: 0 0 15px 0; font-size: 16px;">💡 Workforce Analytics</h4>
          <ul style="color: #7f1d1d; margin: 0; padding-left: 20px; line-height: 1.6;">
            <li>Current workforce: <strong>${totalEmployees} employees</strong> across ${departmentStats.length} departments</li>
            <li>Attendance performance: <strong>${attendanceRate}% daily attendance</strong> (${presentEmployees} present, ${absentEmployees} absent)</li>
            <li>Leave utilization: <strong>${approvedLeave + pendingLeave} leave requests</strong> (${approvedLeave} approved, ${pendingLeave} pending)</li>
            <li>Average compensation: <strong>${formatCurrency(avgSalary)}</strong> across all roles</li>
            <li>Team distribution: Largest department has ${departmentStats[0]?.employeeCount || 0} employees</li>
            <li>HR efficiency: ${safePercent(approvedLeave, approvedLeave + pendingLeave).toFixed(1)}% leave approval rate indicates balanced policy</li>
          </ul>
        </div>

        <!-- Action Items -->
        ${(attendanceRate < 85 || pendingLeave > 5) ? `
        <div style="background: #fef7ed; padding: 20px; border-radius: 10px; border-left: 5px solid #f59e0b; margin-bottom: 30px;">
          <h4 style="color: #9a3412; margin: 0 0 15px 0; font-size: 16px;">📋 HR Action Items</h4>
          <ul style="color: #7c2d12; margin: 0; padding-left: 20px; line-height: 1.6;">
            ${attendanceRate < 85 ? '<li><strong>Priority:</strong> Attendance rate (' + attendanceRate + '%) is below target - Review attendance policies</li>' : ''}
            ${pendingLeave > 5 ? '<li><strong>Action Required:</strong> ' + pendingLeave + ' leave requests pending approval - expedite processing</li>' : ''}
            ${absentEmployees > (totalEmployees * 0.1) ? '<li>High absenteeism detected - conduct wellness check and support programs</li>' : ''}
            <li>Implement employee engagement programs to maintain high retention rates</li>
            <li>Regular salary benchmarking to ensure competitive compensation</li>
          </ul>
        </div>
        ` : ''}

        <!-- Footer -->
        <div style="text-align: center; margin-top: 40px; padding: 20px; background: #f8fafc; border-radius: 10px; border: 1px solid #e5e7eb;">
          <div style="color: #1f2937; font-weight: 600; margin-bottom: 10px;">The First Promovier Digital Printing Solutions</div>
          <div style="color: #6b7280; font-size: 12px; line-height: 1.5;">
            📧 hr@firstpromovier.lk | 📞 +94 77 123 4567<br>
            📍 HR Department: No. 123, Main Street, Colombo 03, Sri Lanka<br>
            Report Generated: ${new Date().toLocaleString('en-GB')} | Period: ${dateRange}<br>
            <em style="margin-top: 5px; display: block;">This report contains confidential employee information - Handle with care</em>
          </div>
        </div>
      </div>
    `;
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading reports data...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchReportsData}>Retry</Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Reports & Analytics</h1>
            <p className="text-muted-foreground">
              Comprehensive business insights across all operations
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[180px]">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last-7-days">Last 7 Days</SelectItem>
                <SelectItem value="last-30-days">Last 30 Days</SelectItem>
                <SelectItem value="last-90-days">Last 90 Days</SelectItem>
                <SelectItem value="this-year">This Year</SelectItem>
              </SelectContent>
            </Select>
            
            <Button onClick={() => fetchReportsData()} variant="outline">
              <Activity className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Dashboard Overview */}
        {dashboardData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(dashboardData.financial?.totalRevenue || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  From {dashboardData.financial?.totalPaidOrders || 0} paid orders
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.customers || 0}</div>
                <p className="text-xs text-muted-foreground">Active customer base</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardData.orders?.reduce((sum, order) => sum + order.count, 0) || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Avg: {formatCurrency(dashboardData.financial?.avgOrderValue || 0)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(dashboardData.inventory?.totalStockValue || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {dashboardData.inventory?.lowStock || 0} low stock items
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Charts & Analytics Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Business Analytics Dashboard</h2>
            <div className="text-sm text-muted-foreground">
              Visual insights and performance tracking
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Trend Chart */}
            <Card className="col-span-1 lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Monthly Revenue Trend
                </CardTitle>
                <CardDescription>
                  Revenue performance over the last 6 months
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={salesData?.salesTrends?.slice(-6) || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="_id.month" 
                      formatter={(value) => `Month ${value}`}
                    />
                    <YAxis formatter={(value) => formatCurrency(value)} />
                    <Tooltip 
                      formatter={(value) => [formatCurrency(value), 'Revenue']}
                      labelFormatter={(label) => `Month ${label}`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="totalSales" 
                      stroke="#8884d8" 
                      strokeWidth={3}
                      dot={{ r: 6, fill: "#8884d8" }}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Order Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChartIcon className="w-4 h-4 mr-2" />
                  Order Status Distribution
                </CardTitle>
                <CardDescription>
                  Current status of all orders
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={dashboardData?.orders || []}
                      dataKey="count"
                      nameKey="_id"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      label={({_id, count}) => `${_id}: ${count}`}
                    >
                      {(dashboardData?.orders || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`hsl(${index * 45}, 70%, 60%)`} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top Customers by Revenue */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  Top Customers by Revenue
                </CardTitle>
                <CardDescription>
                  Highest revenue generating customers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={salesData?.topCustomers?.slice(0, 5) || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="customerName" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      fontSize={12}
                    />
                    <YAxis yAxisId="revenue" orientation="left" formatter={(value) => formatCurrency(value)} />
                    <YAxis yAxisId="orders" orientation="right" />
                    <Tooltip 
                      formatter={(value, name) => {
                        if (name === 'totalRevenue') return [formatCurrency(value), 'Revenue'];
                        if (name === 'orderCount') return [value, 'Orders'];
                        return [value, name];
                      }}
                    />
                    <Legend />
                    <Bar yAxisId="revenue" dataKey="totalRevenue" fill="#82ca9d" name="Revenue" />
                    <Line yAxisId="orders" type="monotone" dataKey="orderCount" stroke="#ff7300" strokeWidth={2} name="Orders" dot={{ r: 4 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Inventory Stock Levels */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="w-4 h-4 mr-2" />
                  Inventory Stock by Category
                </CardTitle>
                <CardDescription>
                  Stock value distribution across categories
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={inventoryData?.stockValueByCategory?.slice(0, 6) || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="_id" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      fontSize={12}
                    />
                    <YAxis formatter={(value) => formatCurrency(value)} />
                    <Tooltip 
                      formatter={(value) => [formatCurrency(value), 'Stock Value']}
                    />
                    <Bar dataKey="totalValue" fill="#ffc658" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Delivery Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Truck className="w-4 h-4 mr-2" />
                  Delivery Performance
                </CardTitle>
                <CardDescription>
                  Delivery status breakdown
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={deliveryData?.deliveryMetrics || []}
                      dataKey="count"
                      nameKey="_id"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                    >
                      {(deliveryData?.deliveryMetrics || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`hsl(${index * 60}, 70%, 50%)`} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {deliveryData?.onTimeRate?.totalDeliveries > 0 ? 
                      Math.round((deliveryData.onTimeRate.onTimeDeliveries / deliveryData.onTimeRate.totalDeliveries) * 100) : 0}%
                  </div>
                  <p className="text-sm text-muted-foreground">On-Time Delivery Rate</p>
                </div>
              </CardContent>
            </Card>

            {/* Production Efficiency */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="w-4 h-4 mr-2" />
                  Production Status Overview
                </CardTitle>
                <CardDescription>
                  Current production job status distribution
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={productionData?.efficiencyMetrics || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="_id" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#ff7300" 
                      strokeWidth={2}
                      dot={{ r: 5, fill: "#ff7300" }}
                      activeDot={{ r: 7 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Financial Overview Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Payment Status Analysis
                </CardTitle>
                <CardDescription>
                  Revenue breakdown by payment status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={salesData?.paymentAnalysis || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="_id" />
                    <YAxis formatter={(value) => formatCurrency(value)} />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'totalAmount' ? formatCurrency(value) : value,
                        name === 'totalAmount' ? 'Revenue' : 'Orders'
                      ]}
                    />
                    <Bar dataKey="totalAmount" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Monthly Order Volume
                </CardTitle>
                <CardDescription>
                  Order count trends over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={salesData?.salesTrends?.slice(-6) || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="_id.month" 
                      formatter={(value) => `Month ${value}`}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => [value, 'Orders']}
                      labelFormatter={(label) => `Month ${label}`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="orderCount" 
                      stroke="#82ca9d" 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Additional Performance Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Customer Growth
                </CardTitle>
                <CardDescription>
                  Customer acquisition trends
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">
                      {customerData?.customerSegmentation?.reduce((sum, segment) => sum + segment.count, 0) || 0}
                    </div>
                    <p className="text-sm text-muted-foreground">Total Customers</p>
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={customerData?.customerSegmentation || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="_id" fontSize={10} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Inventory Alerts
                </CardTitle>
                <CardDescription>
                  Low stock and inventory status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-600">
                      {inventoryData?.lowStockItems?.length || 0}
                    </div>
                    <p className="text-sm text-muted-foreground">Low Stock Items</p>
                  </div>
                  {inventoryData?.lowStockItems?.length > 0 ? (
                    <div className="space-y-2">
                      {inventoryData.lowStockItems.slice(0, 3).map((item, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-red-50 rounded">
                          <span className="text-sm truncate">{item.material_name}</span>
                          <span className="text-sm font-medium text-red-600">
                            {item.stock_quantity} {item.unit}
                          </span>
                        </div>
                      ))}
                      {inventoryData.lowStockItems.length > 3 && (
                        <p className="text-xs text-muted-foreground text-center">
                          +{inventoryData.lowStockItems.length - 3} more items
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="text-center text-green-600">
                      <Package className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm">All items well stocked</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="w-4 h-4 mr-2" />
                  HR Overview
                </CardTitle>
                <CardDescription>
                  Employee and attendance metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">
                      {hrData?.employeeStats?.reduce((sum, stat) => sum + stat.count, 0) || 0}
                    </div>
                    <p className="text-sm text-muted-foreground">Total Employees</p>
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={hrData?.employeeStats || []}
                        dataKey="count"
                        nameKey="_id"
                        cx="50%"
                        cy="50%"
                        outerRadius={60}
                        fill="#10b981"
                      >
                        {(hrData?.employeeStats || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={`hsl(${120 + index * 30}, 70%, 50%)`} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Export Section */}
        <Tabs defaultValue="export" className="space-y-4">
          <TabsList className="grid w-full grid-cols-1">
            <TabsTrigger value="export">Export</TabsTrigger>
          </TabsList>

          {/* Export Tab */}
          <TabsContent value="export" className="space-y-4">
            <h2 className="text-2xl font-bold">Export Reports</h2>
            
            {/* PDF Export Section */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                  { key: 'financial', name: 'Financial', icon: DollarSign, data: financialData, color: 'bg-blue-50 border-blue-200' },
                  { key: 'inventory', name: 'Inventory', icon: Package, data: inventoryData, color: 'bg-yellow-50 border-yellow-200' },
                  { key: 'delivery', name: 'Delivery', icon: Truck, data: deliveryData, color: 'bg-green-50 border-green-200' },
                  { key: 'order', name: 'Orders', icon: ShoppingCart, data: salesData, color: 'bg-purple-50 border-purple-200' },
                  { key: 'hr', name: 'HR Report', icon: Users, data: hrData, color: 'bg-red-50 border-red-200' }
                ].map(({ key, name, icon: Icon, data, color }) => (
                  <Card key={key} className={color}>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center text-sm">
                        <Icon className="w-4 h-4 mr-2" />
                        {name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Button 
                        onClick={() => exportReportToPDF(key)}
                        disabled={!data}
                        className="w-full"
                        variant={data ? "default" : "secondary"}
                        size="sm"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Export PDF
                      </Button>
                      {!data && (
                        <p className="text-xs text-muted-foreground mt-2 text-center">
                          No data available
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-900">PDF Export Information</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      PDF reports include formatted data with charts, summaries, and key metrics. 
                      Each report is tailored to its specific domain (Financial, Inventory, etc.) 
                      and includes company branding and timestamp information.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}