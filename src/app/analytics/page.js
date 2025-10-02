'use client';
import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle,} 
from "@/components/ui/card";
import { ArrowUpIcon, ArrowDownIcon } 
from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import api from "../services/api";

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await api.get('/analytics/analytics');
      setAnalyticsData(response.data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading analytics...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !analyticsData) {
    return (
      <MainLayout>
        <div className="text-center py-8">
          <p className="text-red-600">{error || 'No analytics data available'}</p>
          <Button onClick={fetchAnalyticsData} className="mt-4">
            Retry
          </Button>
        </div>
      </MainLayout>
    );
  }

  const { conversions, users, trends, conversionByType, conversionRate, engagementRate } = analyticsData;

  // Format trend data for charts
  const trendData = trends.twentyEightDay.map(item => ({
    date: item.date,
    Web: item.web,
    App: item.app
  }));

  const userTrendData = trends.twentyEightDay.map(item => ({
    date: item.date,
    Web: item.webUsers,
    App: item.appUsers
  }));

  // Event type data for bar chart
  const eventTypeData = [
    {
      name: 'purchase',
      web: Math.floor(conversionByType.purchase * 0.6),
      app: Math.floor(conversionByType.purchase * 0.4)
    },
    {
      name: 'upgrade',
      web: Math.floor(conversionByType.upgrade * 0.65),
      app: Math.floor(conversionByType.upgrade * 0.35)
    },
    {
      name: 'addon',
      web: Math.floor(conversionByType.addon * 0.55),
      app: Math.floor(conversionByType.addon * 0.45)
    }
  ];

  const formatNumber = (num) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  const GrowthIndicator = ({ value }) => {
    const isPositive = parseFloat(value) >= 0;
    return (
      <div className={`flex items-center text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <ArrowUpIcon className="h-3 w-3 mr-1" /> : <ArrowDownIcon className="h-3 w-3 mr-1" />}
        {Math.abs(value)}%
      </div>
    );
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <div className="text-sm text-gray-500">
            Past 28 days
          </div>
        </div>

        {/* Top Row - Main Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Conversions Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Conversions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(conversions.total)}</div>
              <div className="text-xs text-gray-500 mb-3">past 28 days</div>
              <GrowthIndicator value={conversions.growth} />
              
              <div className="mt-4">
                <div className="text-xs font-medium text-gray-600 mb-2">by platform</div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                      Web
                    </span>
                    <span className="font-medium">{formatNumber(conversions.byPlatform.web)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                      App
                    </span>
                    <span className="font-medium">{formatNumber(conversions.byPlatform.app)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Users Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.total}k</div>
              <div className="text-xs text-gray-500 mb-3">past 28 days</div>
              <GrowthIndicator value={users.growth} />
              
              <div className="mt-4">
                <div className="text-xs font-medium text-gray-600 mb-2">by platform</div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                      Web
                    </span>
                    <span className="font-medium">{users.byPlatform.web}k</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                      App
                    </span>
                    <span className="font-medium">{users.byPlatform.app}k</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Conversion Rate Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Conversion rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="text-2xl font-bold">{conversionRate.web}%</div>
                  <div className="text-xs text-gray-500">Web</div>
                  <div className="flex items-center text-xs text-blue-400 mt-1">
                    <ArrowDownIcon className="h-3 w-3 mr-1" />
                    0.01%
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{conversionRate.app}%</div>
                  <div className="text-xs text-gray-500">App</div>
                  <div className="flex items-center text-xs text-blue-400 mt-1">
                    <ArrowUpIcon className="h-3 w-3 mr-1" />
                    0.10%
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Engagement Rate Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Engagement rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="text-2xl font-bold">{engagementRate.web}%</div>
                  <div className="text-xs text-gray-500">Web</div>
                  <div className="flex items-center text-xs text-red-400 mt-1">
                    <ArrowDownIcon className="h-3 w-3 mr-1" />
                    0.01%
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{engagementRate.app}%</div>
                  <div className="text-xs text-gray-500">App</div>
                  <div className="flex items-center text-xs text-red-400 mt-1">
                    <ArrowDownIcon className="h-3 w-3 mr-1" />
                    1%
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Row - Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 28 Day Trend - Conversions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">28 day trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={trendData}>
                  <XAxis 
                    dataKey="date" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis hide />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="Web" 
                    stroke="#f97316" 
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="App" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
              <div className="flex justify-center items-center mt-2 space-x-4 text-xs">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mr-1"></div>
                  Web
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-1"></div>
                  App
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 28 Day Trend - Users */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">28 day trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={userTrendData}>
                  <XAxis 
                    dataKey="date" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis hide />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="Web" 
                    stroke="#f97316" 
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="App" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
              <div className="flex justify-center items-center mt-2 space-x-4 text-xs">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mr-1"></div>
                  Web
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-1"></div>
                  App
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Conversion by Event Type */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Conversion by event type</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={eventTypeData}>
                  <XAxis 
                    dataKey="name" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis hide />
                  <Tooltip />
                  <Bar dataKey="web" fill="#f97316" />
                  <Bar dataKey="app" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex justify-center items-center mt-2 space-x-4 text-xs">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mr-1"></div>
                  web
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-1"></div>
                  app
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}