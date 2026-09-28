import { Route } from "react-router-dom";
import Login from "@/templates/auth/Login";

export const authRoutes = (
  <>
    <Route path="/login" element={<Login />} />
  </>
);
