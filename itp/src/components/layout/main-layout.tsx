import { useState } from "react";
import { Sidebar } from "./sidebar";
import { TopNav } from "./top-nav";
import { useRouteProtection } from "../ProtectedRoute";

interface MainLayoutProps {
  children: React.ReactNode;
  onCreateOrder?: () => void;
  showCreateOrderButton?: boolean;
}

// Loading component for main layout
function MainLayoutLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

export function MainLayout({ children, onCreateOrder, showCreateOrderButton }: MainLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { loading, user } = useRouteProtection();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Show loading screen while checking authentication and permissions
  if (loading) {
    return <MainLayoutLoading />;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopNav 
          toggleSidebar={toggleSidebar} 
          onCreateOrder={onCreateOrder}
          showCreateOrderButton={showCreateOrderButton}
        />
        {/* Main content area */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4">
          {children}
        </main>
      </div>
    </div>
  );
}
