import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "./ThemeToggle";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const linkClass = ({ isActive }) => (isActive ? "active" : "");
  if (user?.role === "admin") return null;

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
              <NavLink to="/reviews" className={linkClass}>
                Reviews
              </NavLink>
              <NavLink to="/contact" className={linkClass}>
                Contact
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
              <NavLink to="/reviews" className={linkClass}>
                Reviews
              </NavLink>
              <NavLink to="/contact" className={linkClass}>
                Contact
              </NavLink>
              <button className="link-button" onClick={handleLogout}>
                Logout
              </button>
            </>
          )}
          {user && <ThemeToggle />}
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
