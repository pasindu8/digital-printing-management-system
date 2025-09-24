'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export function OrderActivityChart({ data = [], type = 'line' }) {
  // If no data provided, create sample data
  const chartData = data.length > 0 ? data : [
    { name: 'Mon', orders: 4, revenue: 2400 },
    { name: 'Tue', orders: 7, revenue: 3400 },
    { name: 'Wed', orders: 3, revenue: 1800 },
    { name: 'Thu', orders: 8, revenue: 4200 },
    { name: 'Fri', orders: 12, revenue: 6800 },
    { name: 'Sat', orders: 6, revenue: 3200 },
    { name: 'Sun', orders: 2, revenue: 1200 }
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{`${label}`}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.dataKey === 'orders' ? 'Orders' : 'Revenue'}: ${entry.dataKey === 'revenue' ? 'Rs. ' : ''}${entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (type === 'bar') {
    return (
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="orders" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip content={<CustomTooltip />} />
        <Line 
          type="monotone" 
          dataKey="orders" 
          stroke="#3b82f6" 
          strokeWidth={2}
          dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function RevenueChart({ data = [] }) {
  const chartData = data.length > 0 ? data : [
    { name: 'Mon', revenue: 2400 },
    { name: 'Tue', revenue: 3400 },
    { name: 'Wed', revenue: 1800 },
    { name: 'Thu', revenue: 4200 },
    { name: 'Fri', revenue: 6800 },
    { name: 'Sat', revenue: 3200 },
    { name: 'Sun', revenue: 1200 }
  ];

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip 
          formatter={(value) => [`Rs. ${value.toLocaleString()}`, 'Revenue']}
          labelStyle={{ color: '#374151' }}
        />
        <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
