
import { useState, type ReactNode } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

interface DashboardLayoutProps {
  children: ReactNode;
  isConnected: boolean;
  onLogout: () => void;
}

const DashboardLayout = ({
  children,
  isConnected,
  onLogout,
}: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
   
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="min-h-screen lg:ml-64">
        <Header
          isConnected={isConnected}
          onMenuClick={() => setSidebarOpen(true)}
          onLogout={onLogout}
        />

        <div className="space-y-8 p-5 sm:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
