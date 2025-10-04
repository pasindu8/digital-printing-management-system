'use client';

import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { formatCurrency } from "@/lib/currency";
import api from "@/app/services/api";

export default function CustomerDashboard() {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [dashboardData, setDashboardData] = useState({
        totalOrders: 0,
        activeOrders: 0,
        totalSpent: 0,
        deliveriesInTransit: 0,
        recentOrders: []
    });
    const [error, setError] = useState(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                const userData = JSON.parse(storedUser);
                setUser(userData);
                fetchCustomerData(userData);
            } catch (error) {
                console.error('Error parsing user data:', error);
                setLoading(false);
            }
        } else {
            setLoading(false);
        }
    }, []);

    const fetchCustomerData = async (userData) => {
        try {
            setError(null);
            // Fetch customer's orders
            const ordersResponse = await api.get('/orders', {
                params: { customer_id: userData.id || userData._id }
            });
            
            const orders = ordersResponse.data || [];
            
            // Calculate dashboard statistics
            const totalOrders = orders.length;
            const activeOrders = orders.filter(order => 
                ['Pending', 'Confirmed', 'In_Production', 'Ready_for_Delivery'].includes(order.status)
            ).length;
            const deliveriesInTransit = orders.filter(order => 
                order.status === 'In_Transit'
            ).length;
            const totalSpent = orders.reduce((sum, order) => sum + (order.total || 0), 0);
            
            // Get recent orders (last 5)
            const recentOrders = orders
                .sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate))
                .slice(0, 5);

            setDashboardData({
                totalOrders,
                activeOrders,
                totalSpent,
                deliveriesInTransit,
                recentOrders
            });
        } catch (error) {
            console.error('Error fetching customer data:', error);
            setError('Unable to load dashboard data. Please try again later.');
            
            // Set default values in case of error
            setDashboardData({
                totalOrders: 0,
                activeOrders: 0,
                totalSpent: 0,
                deliveriesInTransit: 0,
                recentOrders: []
            });
        } finally {
            setLoading(false);
        }
    };

    // Helper functions for status display
    const getStatusStyle = (status) => {
        switch (status) {
            case 'Pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'Confirmed':
                return 'bg-blue-100 text-blue-800';
            case 'In_Production':
                return 'bg-purple-100 text-purple-800';
            case 'Ready_for_Delivery':
                return 'bg-indigo-100 text-indigo-800';
            case 'In_Transit':
                return 'bg-orange-100 text-orange-800';
            case 'Delivered':
                return 'bg-green-100 text-green-800';
            case 'Completed':
                return 'bg-green-100 text-green-800';
            case 'Cancelled':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusDisplay = (status) => {
        switch (status) {
            case 'In_Production':
                return 'In Production';
            case 'Ready_for_Delivery':
                return 'Ready for Delivery';
            case 'In_Transit':
                return 'In Transit';
            default:
                return status;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <MainLayout>
            <div className="space-y-6">
                {/* Welcome Header */}
                <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-8 text-white shadow-2xl">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-bold mb-2">Welcome back, {user?.name?.split(' ')[0] || 'Customer'}!</h1>
                            <p className="text-blue-100 text-lg">Here's your printing dashboard overview</p>
                        </div>
                        <div className="hidden md:block">
                            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                                <span className="text-3xl">📋</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Cards - Real Data */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <div className="flex items-center">
                            <span className="text-red-500 mr-2">⚠️</span>
                            <p className="text-red-700">{error}</p>
                        </div>
                    </div>
                )}
                
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white border-0 shadow-lg rounded-xl p-6 hover:shadow-xl transition-all duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-medium text-gray-600">Total Orders</h3>
                            <div className="p-2 bg-blue-100 rounded-full">
                                <span className="text-blue-600">📦</span>
                            </div>
                        </div>
                        <div className="text-3xl font-bold text-gray-900 mb-1">
                            {dashboardData.totalOrders}
                        </div>
                        <p className="text-xs text-blue-600 font-medium">
                            All time orders
                        </p>
                    </div>

                    <div className="bg-white border-0 shadow-lg rounded-xl p-6 hover:shadow-xl transition-all duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-medium text-gray-600">Active Orders</h3>
                            <div className="p-2 bg-orange-100 rounded-full">
                                <span className="text-orange-600">⏰</span>
                            </div>
                        </div>
                        <div className="text-3xl font-bold text-gray-900 mb-1">{dashboardData.activeOrders}</div>
                        <p className="text-xs text-orange-600 font-medium">Currently processing</p>
                    </div>

                    <div className="bg-white border-0 shadow-lg rounded-xl p-6 hover:shadow-xl transition-all duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-medium text-gray-600">Total Spent</h3>
                            <div className="p-2 bg-green-100 rounded-full">
                                <span className="text-green-600">💳</span>
                            </div>
                        </div>
                        <div className="text-3xl font-bold text-gray-900 mb-1">{formatCurrency(dashboardData.totalSpent)}</div>
                        <p className="text-xs text-green-600 font-medium">All time total</p>
                    </div>

                    <div className="bg-white border-0 shadow-lg rounded-xl p-6 hover:shadow-xl transition-all duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-medium text-gray-600">Deliveries</h3>
                            <div className="p-2 bg-purple-100 rounded-full">
                                <span className="text-purple-600">🚚</span>
                            </div>
                        </div>
                        <div className="text-3xl font-bold text-gray-900 mb-1">{dashboardData.deliveriesInTransit}</div>
                        <p className="text-xs text-purple-600 font-medium">In transit</p>
                    </div>
                </div>

                {/* Content Cards */}
                <div className="grid md:grid-cols-2 gap-8">
                    {/* Recent Orders - Real Data */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            📋 Recent Orders
                        </h2>
                        <div className="space-y-4">
                            {dashboardData.recentOrders.length > 0 ? (
                                dashboardData.recentOrders.map((order, index) => (
                                    <div key={order._id || index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors">
                                        <div>
                                            <p className="font-semibold text-gray-900">{order.orderId}</p>
                                            <p className="text-sm text-gray-500">
                                                {order.items && order.items.length > 0 
                                                    ? `${order.items[0].serviceName || order.items[0].name || 'Print Job'} - ${order.items.length} item${order.items.length > 1 ? 's' : ''}`
                                                    : 'Print Order'
                                                }
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                {new Date(order.orderDate).toLocaleDateString('en-LK')}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <span className={`px-2 py-1 rounded text-sm font-medium ${getStatusStyle(order.status)}`}>
                                                {getStatusDisplay(order.status)}
                                            </span>
                                            <p className="text-sm font-semibold text-gray-700 mt-1">{formatCurrency(order.total)}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <p className="text-lg">📦</p>
                                    <p className="mt-2">No orders yet</p>
                                    <p className="text-sm">Place your first order to see it here!</p>
                                </div>
                            )}
                        </div>
                        {dashboardData.recentOrders.length > 0 && (
                            <div className="mt-4 pt-4 border-t">
                                <button 
                                    onClick={() => window.location.href = '/orders'}
                                    className="w-full text-center py-2 text-blue-600 hover:text-blue-800 font-medium transition-colors"
                                >
                                    View All Orders →
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            ⚡ Quick Actions
                        </h2>
                        <div className="space-y-4">
                            <button 
                                onClick={() => window.location.href = '/orders'} 
                                className="w-full text-left p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-xl">➕</span>
                                    <div>
                                        <div className="font-semibold">Place New Order</div>
                                        <div className="text-xs text-blue-100">Start a new printing order</div>
                                    </div>
                                </div>
                            </button>
                            
                            <button 
                                onClick={() => window.location.href = '/orders'}
                                className="w-full text-left p-4 border-2 border-blue-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-xl text-blue-600">👁️</span>
                                    <div className="font-medium text-gray-700">View All Orders</div>
                                </div>
                            </button>
                            
                            <button 
                                onClick={() => window.location.href = '/billing'}
                                className="w-full text-left p-4 border-2 border-green-200 rounded-lg hover:bg-green-50 hover:border-green-300 transition-all"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-xl text-green-600">�</span>
                                    <div className="font-medium text-gray-700">View Invoices & Billing</div>
                                </div>
                            </button>

                            <button 
                                onClick={() => fetchCustomerData(user)}
                                className="w-full text-left p-4 border-2 border-purple-200 rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-all"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-xl text-purple-600">🔄</span>
                                    <div className="font-medium text-gray-700">Refresh Dashboard</div>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </MainLayout>
    );
}

