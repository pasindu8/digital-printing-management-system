// File path: src/components/layout/sidebar.jsx
'use client';

// Next.js components and hooks
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

// Shadcn UI components
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

// Lucide-react icons
import {
  X,
  BarChart3,
  ClipboardList,
  Users,
  Package,
  Printer,
  Truck,
  CreditCard,
  LineChart,
  Settings,
  HardDrive,
  DollarSign,
  UserCheck
} from "lucide-react";


interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

interface SidebarItem {
  icon: React.ReactNode;
  label: string;
  href: string;
  roles?: string[]; // Roles that can access this item
}

export function Sidebar({ isOpen, toggleSidebar }: SidebarProps) {
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<string>('');

  // Get user role from localStorage
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const userData = JSON.parse(user);
        setUserRole(userData.role || '');
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  const mainItems: SidebarItem[] = [
    {
      icon: <BarChart3 className="h-5 w-5" />,
      label: "Dashboard",
      href: "/dashboard",
      roles: ['Admin', 'General_Manager', 'Order_Manager', 'Stock_Manager', 'HR_Manager', 'Staff', 'Employee', 'Customer']
    },
    {
      icon: <ClipboardList className="h-5 w-5" />,
      label: "Orders",
      href: "/orders",
      roles: ['Admin', 'General_Manager', 'Order_Manager', 'Stock_Manager', 'HR_Manager', 'Staff', 'Employee', 'Customer']
    },
    {
      icon: <Users className="h-5 w-5" />,
      label: "Customers",
      href: "/customers",
      roles: ['Admin', 'General_Manager', 'Order_Manager', 'Stock_Manager', 'HR_Manager', 'Staff', 'Employee']
    },
  ];

  const materialItems: SidebarItem[] = [
    {
      icon: <Package className="h-5 w-5" />,
      label: "Raw Materials",
      href: "/raw-materials",
      roles: ['Admin', 'General_Manager', 'Stock_Manager', 'HR_Manager', 'Staff', 'Employee']
    },
    {
      icon: <Users className="h-5 w-5" />,
      label: "Suppliers",
      href: "/suppliers",
      roles: ['Admin', 'General_Manager', 'Stock_Manager', 'HR_Manager', 'Staff', 'Employee']
    },
    {
      icon: <ClipboardList className="h-5 w-5" />,
      label: "Material Orders",
      href: "/material-orders",
      roles: ['Admin', 'General_Manager', 'Stock_Manager', 'HR_Manager', 'Staff', 'Employee']
    },
  ];

  const operationsItems: SidebarItem[] = [
    {
      icon: <Printer className="h-5 w-5" />,
      label: "Production Management",
      href: "/my-tasks",
      roles: ['Admin', 'General_Manager', 'Order_Manager', 'Stock_Manager', 'HR_Manager', 'Staff', 'Employee']
    },
    {
      icon: <Truck className="h-5 w-5" />,
      label: "Delivery",
      href: "/delivery",
      roles: ['Admin', 'General_Manager', 'Order_Manager', 'Stock_Manager', 'HR_Manager', 'Delivery_Person', 'Staff', 'Employee', 'Customer']
    },
  ];

  const financialItems: SidebarItem[] = [
    {
      icon: <DollarSign className="h-5 w-5" />,
      label: "Finance",
      href: "/finance",
      roles: ['Admin', 'General_Manager', 'HR_Manager', 'Staff', 'Employee']
    },
    {
      icon: <CreditCard className="h-5 w-5" />,
      label: "Billing",
      href: "/billing",
      roles: ['Admin', 'General_Manager', 'HR_Manager', 'Staff', 'Employee']
    },
    {
      icon: <LineChart className="h-5 w-5" />,
      label: "Reports",
      href: "/reports",
      roles: ['Admin', 'General_Manager', 'HR_Manager', 'Staff', 'Employee']
    },
  ];

  const hrItems: SidebarItem[] = [
    {
      icon: <UserCheck className="h-5 w-5" />,
      label: "Human Resources",
      href: "/hr",
      roles: ['Admin', 'General_Manager', 'HR_Manager', 'Staff', 'Employee']
    },
    {
      icon: <Users className="h-5 w-5" />,
      label: "Workload Dashboard",
      href: "/workload",
      roles: ['Admin', 'General_Manager', 'HR_Manager', 'Staff', 'Employee']
    },
  ];

  const systemItems: SidebarItem[] = [
    {
      icon: <Settings className="h-5 w-5" />,
      label: "Settings",
      href: "/settings",
      roles: ['Admin', 'General_Manager', 'Order_Manager', 'Stock_Manager', 'HR_Manager', 'Delivery_Person', 'Staff', 'Employee', 'Customer']
    },
  ];

  // Filter items based on user role
  const filterByRole = (items: SidebarItem[]) => {
    if (!userRole) return [];
    return items.filter(item => 
      !item.roles || item.roles.includes(userRole)
    );
  };

  const renderNavItems = (items: SidebarItem[]) => {
    const filteredItems = filterByRole(items);
    return filteredItems.map((item) => (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          "w-full",
          pathname === item.href && "bg-accent"
        )}
      >
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 font-normal"
        >
          {item.icon}
          {item.label}
        </Button>
      </Link>
    ));
  };

  // Don't render sidebar sections if they have no visible items
  const renderSection = (title: string, items: SidebarItem[]) => {
    const filteredItems = filterByRole(items);
    if (filteredItems.length === 0) return null;

    return (
      <>
        <Separator className="mx-3" />
        <div className="px-3">
          <h2 className="mb-2 px-4 text-xs font-semibold tracking-tight text-muted-foreground">
            {title}
          </h2>
          <div className="space-y-1">
            {renderNavItems(items)}
          </div>
        </div>
      </>
    );
  };

  return (
     <div
      className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-50
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
    
      <div className="h-full flex flex-col">
        <div className="px-4 py-2 flex-shrink-0">
          <div className="flex items-center gap-2 px-2">
            <HardDrive className="h-6 w-6" />
            <h2 className="text-lg font-semibold tracking-tight">
              Digital Print

              <Button className="ml-[40px]" variant="ghost" size="icon" onClick={toggleSidebar}>
                <X className="h-5 w-5" />
              </Button>

            </h2>
          </div>
        </div>

        {/* Scrollable navigation content */}
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-4 py-4">
            <div className="px-3">
              <div className="space-y-1">
                {renderNavItems(mainItems)}
              </div>
            </div>
            {renderSection("Operations", operationsItems)}
            {renderSection("Financial", financialItems)}
            {renderSection("Human Resources", hrItems)}
            {renderSection("Materials", materialItems)}
            {renderSection("System", systemItems)}
          </div>
        </div>
      </div>
    </div>
  );
}
