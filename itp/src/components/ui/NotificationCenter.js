'use client';

import { useState } from 'react';
import { Bell, X, ExternalLink, AlertTriangle, Package, ShoppingCart, DollarSign, Users, Truck, Factory, Box, UserCheck, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/currency';

const NotificationCenter = ({ notifications = [], onMarkAsRead, onAction }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const criticalCount = notifications.filter(n => n.priority === 'critical').length;
  const warningCount = notifications.filter(n => n.priority === 'warning').length;
  const totalCount = notifications.length;

  const getIcon = (type) => {
    const iconMap = {
      inventory: Package,
      orders: ShoppingCart,
      finance: DollarSign,
      hr: Users,
      delivery: Truck,
      production: Factory,
      materials: Box,
      customers: UserCheck,
      system: Settings
    };
    const IconComponent = iconMap[type] || Bell;
    return <IconComponent className="h-4 w-4" />;
  };

  const getPriorityColor = (priority) => {
    const colorMap = {
      critical: 'text-red-600 bg-red-50 border-red-200',
      warning: 'text-orange-600 bg-orange-50 border-orange-200',
      info: 'text-blue-600 bg-blue-50 border-blue-200'
    };
    return colorMap[priority] || 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const getBadgeVariant = (priority) => {
    const variantMap = {
      critical: 'destructive',
      warning: 'secondary',
      info: 'outline'
    };
    return variantMap[priority] || 'outline';
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return time.toLocaleDateString();
  };

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="h-4 w-4" />
        {totalCount > 0 && (
          <Badge 
            variant={criticalCount > 0 ? "destructive" : "secondary"} 
            className="absolute -top-2 -right-2 px-1 min-w-[1.2rem] h-5 text-xs"
          >
            {totalCount > 99 ? '99+' : totalCount}
          </Badge>
        )}
      </Button>

      {/* Notification Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40 bg-black/20" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Notification Panel */}
          <div className="absolute right-0 top-full mt-2 w-96 z-50">
            <Card className="max-h-96 shadow-lg border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">Notifications</CardTitle>
                    {totalCount > 0 && (
                      <div className="flex gap-1">
                        {criticalCount > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {criticalCount} Critical
                          </Badge>
                        )}
                        {warningCount > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {warningCount} Warning
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0 max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No notifications</p>
                    <p className="text-sm">All systems running smoothly!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-3 rounded-lg border ${getPriorityColor(notification.priority)}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-0.5">
                            {getIcon(notification.type)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-sm truncate">
                                {notification.title}
                              </h4>
                              <Badge 
                                variant={getBadgeVariant(notification.priority)} 
                                className="text-xs"
                              >
                                {notification.priority}
                              </Badge>
                            </div>
                            
                            <p className="text-sm opacity-90 mb-2">
                              {notification.message}
                            </p>
                            
                            <div className="flex items-center justify-between">
                              <span className="text-xs opacity-75">
                                {formatTime(notification.timestamp)}
                              </span>
                              
                              {notification.actionRequired && (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="h-6 px-2 text-xs"
                                  onClick={() => {
                                    if (onAction) onAction(notification);
                                    setIsOpen(false);
                                  }}
                                >
                                  {notification.actionText}
                                  <ExternalLink className="h-3 w-3 ml-1" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationCenter;