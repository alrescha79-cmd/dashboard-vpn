import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { BuyAccount } from "./pages/BuyAccount";
import { Trial } from "./pages/Trial";
import { MyAccounts } from "./pages/MyAccounts";
import { TopUp } from "./pages/TopUp";
import { Reseller } from "./pages/Reseller";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { AdminServers } from "./pages/admin/Servers";
import { AdminUsers } from "./pages/admin/Users";
import { AdminSettings } from "./pages/admin/Settings";
import { SetupAdmin } from "./pages/SetupAdmin";

const ProtectedRoute: React.FC<{ children: React.ReactNode; requireAdmin?: boolean }> = ({
  children,
  requireAdmin
}) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
        Memuat sesi...
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "admin" && user.needs_setup) return <Navigate to="/setup" replace />;
  if (requireAdmin && user.role !== "admin") return <Navigate to="/" replace />;
  return <>{children}</>;
};

const AdminSetupRoute: React.FC = () => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
        Memuat sesi...
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/" replace />;
  return <SetupAdmin />;
};

const AppRoutes: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faede2] dark:bg-[#121214] flex items-center justify-center text-kawaii-ink dark:text-neutral-200 text-sm font-bold">
        Memuat sesi...
      </div>
    );
  }

  // Jika admin belum menyelesaikan setup kredensial, kunci akses ke halaman /setup
  if (user && user.role === "admin" && user.needs_setup) {
    return (
      <Routes>
        <Route path="/setup" element={<AdminSetupRoute />} />
        <Route path="*" element={<Navigate to="/setup" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/setup" element={<AdminSetupRoute />} />
      <Route
        path="/"
        element={
          <Layout>
            <Dashboard />
          </Layout>
        }
      />
      <Route
        path="/buy"
        element={
          <Layout>
            <BuyAccount />
          </Layout>
        }
      />
      <Route
        path="/trial"
        element={
          <Layout>
            <Trial />
          </Layout>
        }
      />
      <Route
        path="/my-accounts"
        element={
          <ProtectedRoute>
            <Layout>
              <MyAccounts />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/topup"
        element={
          <ProtectedRoute>
            <Layout>
              <TopUp />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/reseller"
        element={
          <ProtectedRoute>
            <Layout>
              <Reseller />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/servers"
        element={
          <ProtectedRoute requireAdmin>
            <Layout>
              <AdminServers />
            </Layout>
          </ProtectedRoute>
        }
      />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute requireAdmin>
              <Layout>
                <AdminUsers />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute requireAdmin>
              <Layout>
                <AdminSettings />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
