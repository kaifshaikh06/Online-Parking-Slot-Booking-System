import { useState } from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import ThemeToggle from "./ThemeToggle";

const AdminLayout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="admin-app">
      <AdminSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((current) => !current)}
      />
      <div
        className={`admin-content ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}
      >
        <div className="admin-theme-toggle">
          <ThemeToggle />
        </div>
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;
