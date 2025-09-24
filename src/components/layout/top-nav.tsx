import { Bell, Menu, Search, Plus, User, LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEffect, useState } from "react";
import { getCurrentUser, logout } from "../../middleware/auth";
import Link from "next/link";

interface TopNavProps {
  toggleSidebar: () => void;
  onCreateOrder?: () => void;
  showCreateOrderButton?: boolean;
}

export function TopNav({ toggleSidebar, onCreateOrder, showCreateOrderButton = false }: TopNavProps) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
  }, []);

  const handleLogout = () => {
    logout();
  };

  const getRoleDisplayName = (role) => {
    const roleMap = {
      'Admin': 'Administrator',
      'General_Manager': 'General Manager',
      'Order_Manager': 'Order Manager',
      'Stock_Manager': 'Stock Manager',
      'HR_Manager': 'HR Manager',
      'Delivery_Person': 'Delivery Person',
      'Staff': 'Staff',
      'Employee': 'Employee',
      'Customer': 'Customer'
    };
    return roleMap[role] || role;
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="flex h-16 items-center border-b bg-white px-4 gap-4">
      <Button variant="ghost" size="icon" onClick={toggleSidebar}>
        <Menu className="h-5 w-5" />
      </Button>

      <div className="w-full max-w-lg">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            type="search" 
            placeholder="Search orders, customers, products..." 
            className="w-full pl-8 bg-gray-50" 
          />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0">
                3
              </Badge>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium">Order #12345 completed</p>
                <p className="text-xs text-muted-foreground">Ready for delivery</p>
                <p className="text-xs text-muted-foreground">5 minutes ago</p>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium">New order received</p>
                <p className="text-xs text-muted-foreground">Order #12346 from Acme Corp</p>
                <p className="text-xs text-muted-foreground">15 minutes ago</p>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium">Low stock alert</p>
                <p className="text-xs text-muted-foreground">Glossy paper (A4) is low in stock</p>
                <p className="text-xs text-muted-foreground">1 hour ago</p>
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer text-center">
              <p className="text-sm text-blue-600 w-full">View all notifications</p>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {showCreateOrderButton && onCreateOrder && (
          <Button onClick={onCreateOrder} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Create New Order
          </Button>
        )}

        {/* User Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatar} alt={user?.name} />
                <AvatarFallback>{getInitials(user?.name)}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name || 'User'}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
                <p className="text-xs leading-none text-blue-600 font-medium">
                  {getRoleDisplayName(user?.role)}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings" className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer text-red-600" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}