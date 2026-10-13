import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navigationItems = [
  { to: "/admin", label: "Dashboard", icon: "▦", end: true },
  { to: "/admin/slots", label: "Manage Slots", icon: "▤" },
  { to: "/admin/slots/new", label: "Add Parking Slot", icon: "+" },
  { to: "/admin/bookings", label: "Bookings & Search", icon: "⌕" },
  { to: "/admin/reviews", label: "Customer Reviews", icon: "★" },
];

const AdminSidebar = ({ collapsed, onToggle }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const linkClass = ({ isActive }) => (isActive ? "active" : "");

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <aside className={`admin-sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="admin-sidebar-header">
        <NavLink to="/admin" end className="admin-brand" title="ParkEase Admin">
          <span className="admin-brand-mark" aria-hidden="true">
            P
          </span>
          <span className="admin-brand-text">
            ParkEase
            <small>Administration</small>
          </span>
        </NavLink>
        <button
          type="button"
          className="sidebar-toggle"
          onClick={onToggle}
          aria-label={collapsed ? "Open admin sidebar" : "Close admin sidebar"}
          title={collapsed ? "Open sidebar" : "Close sidebar"}
        >
          <span aria-hidden="true">{collapsed ? "»" : "«"}</span>
        </button>
      </div>
      <nav className="admin-nav" aria-label="Admin navigation">
        {navigationItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={linkClass}
            title={collapsed ? item.label : undefined}
          >
            <span className="admin-nav-icon" aria-hidden="true">
              {item.icon}
            </span>
            <span className="admin-nav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <button
        className="admin-logout"
        onClick={handleLogout}
        title={collapsed ? "Logout" : undefined}
      >
        <span className="admin-nav-icon" aria-hidden="true">
          ↪
        </span>
        <span className="admin-nav-label">Logout</span>
      </button>
    </aside>
  );
};

export default AdminSidebar;
