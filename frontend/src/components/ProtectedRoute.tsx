import { Navigate, Outlet } from "react-router-dom";
import { getCurrentUser } from "../auth";
import type { Role } from "../types";

interface Props { allowedRoles?: Role[] }

export default function ProtectedRoute({ allowedRoles }: Props) {
  const user = getCurrentUser();
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
