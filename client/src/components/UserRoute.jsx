import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const UserRoute = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return user.role === "user" ? <Outlet /> : <Navigate to="/admin" replace />;
};

export default UserRoute;
