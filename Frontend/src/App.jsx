import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AppProvider, useApp } from "./context/AppContext";
import { AdminProvider } from "./context/AdminContext";
import Toast from "./components/Toast";
import Landing from "./pages/Landing";
import OurStory from "./pages/OurStory";
import AuthPage from "./pages/AuthPage";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import UserLayout from "./components/dashboard/UserLayout";
import AdminLayout from "./pages/admin/AdminLayout";

function Loading() {
  return (
    <div className="loadingScreen">
      <div className="spinner" />
    </div>
  );
}

function RequireUser({ children }) {
  const { user } = useApp();
  const location = useLocation();
  if (!user) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }
  if (user.role === "superadmin") return <Navigate to="/admin" replace />;
  return children;
}

function RequireAdmin({ children }) {
  const { user } = useApp();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "superadmin") return <Navigate to="/" replace />;
  return children;
}

function AppShell() {
  const { authChecked, user, initialized } = useApp();

  if (!authChecked || (user && !initialized)) {
    return <Loading />;
  }

  return (
    <>
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/" element={<Landing />} />
        <Route path="/our-story" element={<OurStory />} />
        <Route
          path="/admin/*"
          element={
            <RequireAdmin>
              <AdminLayout />
            </RequireAdmin>
          }
        />
        <Route
          path="/*"
          element={
            <RequireUser>
              <UserLayout />
            </RequireUser>
          }
        />
      </Routes>
      <Toast />
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AdminProvider>
        <AppShell />
      </AdminProvider>
    </AppProvider>
  );
}
