import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const linkClass = ({ isActive }) => (isActive ? "active" : "");
  return (
    <header className="site-header">
      <nav className="navbar container">
        <NavLink
          to={user ? (user.role === "admin" ? "/admin" : "/dashboard") : "/"}
          className="brand"
        >
          ParkEase
        </NavLink>
        <div className="nav-links">
          {!user && (
            <>
              <NavLink to="/" className={linkClass}>
                Home
              </NavLink>
              <NavLink to="/login" className={linkClass}>
                Login
              </NavLink>
              <NavLink to="/register" className="nav-register">
                Register
              </NavLink>
            </>
          )}
          {user?.role === "user" && (
            <>
              <NavLink to="/dashboard" className={linkClass}>
                Dashboard
              </NavLink>
              <NavLink to="/book-slot" className={linkClass}>
                Book Slot
              </NavLink>
              <NavLink to="/my-bookings" className={linkClass}>
                My Bookings
              </NavLink>
              <button className="link-button" onClick={handleLogout}>
                Logout
              </button>
            </>
          )}
          {user?.role === "admin" && (
            <>
              <NavLink to="/admin" end className={linkClass}>
                Dashboard
              </NavLink>
              <NavLink to="/admin/slots" className={linkClass}>
                Manage Slots
              </NavLink>
              <NavLink to="/admin/slots/new" className={linkClass}>
                Add Slot
              </NavLink>
              <NavLink to="/admin/bookings" className={linkClass}>
                Bookings/Search
              </NavLink>
              <button className="link-button" onClick={handleLogout}>
                Logout
              </button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
