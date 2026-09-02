import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Shield,
  ShoppingCart,
  LayoutDashboard,
  Wallet,
  Users,
  Server,
  LogOut,
  Zap,
  Menu,
  X,
  UserCheck,
  Sun,
  Moon
} from "lucide-react";

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  const toggleDarkMode = () => {
    setIsDark((prev) => !prev);
  };

  const navItems = [
    { label: "Dashboard", path: "/", icon: LayoutDashboard },
    { label: "Beli Akun", path: "/buy", icon: ShoppingCart },
    { label: "Trial Gratis", path: "/trial", icon: Zap },
    { label: "Akunku", path: "/my-accounts", icon: Shield },
    { label: "Top Up Saldo", path: "/topup", icon: Wallet },
    ...(user && (user.role === "reseller" || user.role === "admin")
      ? [{ label: "Panel Reseller", path: "/reseller", icon: Users, highlight: "bg-kawaii-yellow text-kawaii-ink" }]
      : []),
    ...(user && user.role === "admin"
      ? [
          { label: "Kelola Server", path: "/admin/servers", icon: Server, highlight: "bg-kawaii-pink text-white" },
          { label: "Kelola Pengguna", path: "/admin/users", icon: UserCheck, highlight: "bg-kawaii-pink text-white" }
        ]
      : [])
  ];

  return (
    <div className="flex min-h-screen bg-[#faede2] dark:bg-[#121214] text-kawaii-ink dark:text-neutral-100 flex-col md:flex-row font-sans transition-colors">
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-kawaii-card dark:bg-kawaii-darkCard border-b-4 border-kawaii-ink dark:border-white">
        <div className="flex items-center space-x-2 text-kawaii-ink dark:text-white font-heading font-black text-xl">
          <span className="inline-flex p-1.5 bg-kawaii-yellow rounded-xl border-3 border-kawaii-ink dark:border-white shadow-kawaii-sm dark:shadow-kawaii-dark-sm">
            <Shield className="h-5 w-5 text-kawaii-ink" />
          </span>
          <span>VPN Portal</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-2xl bg-kawaii-yellow border-3 border-kawaii-ink dark:border-white shadow-kawaii-sm dark:shadow-kawaii-dark-sm text-kawaii-ink active:translate-x-0.5 active:translate-y-0.5"
            aria-label="Ganti Tema"
          >
            {isDark ? <Sun className="h-5 w-5 stroke-[2.5]" /> : <Moon className="h-5 w-5 stroke-[2.5]" />}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-2xl bg-kawaii-peach border-3 border-kawaii-ink dark:border-white shadow-kawaii-sm dark:shadow-kawaii-dark-sm text-kawaii-ink active:translate-x-0.5 active:translate-y-0.5"
            aria-label="Buka Menu Navigasi"
          >
            {mobileMenuOpen ? <X className="h-6 w-6 stroke-[2.5]" /> : <Menu className="h-6 w-6 stroke-[2.5]" />}
          </button>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`${
          mobileMenuOpen ? "block" : "hidden"
        } md:flex w-full md:w-64 border-r-4 border-kawaii-ink dark:border-white bg-kawaii-card dark:bg-kawaii-darkCard p-4 flex-col justify-between shrink-0 shadow-kawaii dark:shadow-kawaii-dark md:shadow-none z-20`}
      >
        <div className="space-y-6">
          <div className="hidden md:flex items-center justify-between px-2">
            <div className="flex items-center space-x-2.5 text-kawaii-ink dark:text-white font-heading font-black text-2xl tracking-tight">
              <span className="inline-flex p-2 bg-kawaii-yellow rounded-2xl border-3 border-kawaii-ink dark:border-white shadow-kawaii-sm dark:shadow-kawaii-dark-sm">
                <Shield className="h-6 w-6 text-kawaii-ink" />
              </span>
              <span>VPN Pop</span>
            </div>
          </div>

          {/* User Status Box */}
          {user ? (
            <div className="bg-kawaii-subtle dark:bg-kawaii-darkSubtle p-4 rounded-3xl border-3 border-kawaii-ink dark:border-white shadow-kawaii dark:shadow-kawaii-dark space-y-2">
              <div className="text-xs font-black uppercase tracking-wider text-neutral-700 dark:text-neutral-300 font-heading">
                Saldo Dompet
              </div>
              <div className="text-2xl font-black font-heading text-kawaii-ink dark:text-white">
                Rp {user.saldo.toLocaleString("id-ID")}
              </div>
              <div className="flex items-center justify-between text-xs font-bold pt-2 border-t-2 border-kawaii-ink/20 dark:border-white/20">
                <span className="bg-kawaii-card dark:bg-kawaii-darkCard dark:text-white px-2.5 py-0.5 rounded-full border-2 border-kawaii-ink dark:border-white">
                  @{user.username}
                </span>
                <span className="uppercase text-[11px] px-2.5 py-0.5 rounded-full bg-kawaii-blue text-kawaii-ink border-2 border-kawaii-ink dark:border-white font-black">
                  {user.role}
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-kawaii-subtle dark:bg-kawaii-darkSubtle p-3.5 rounded-3xl border-3 border-kawaii-ink dark:border-white shadow-kawaii dark:shadow-kawaii-dark text-center">
              <Link
                to="/login"
                className="block w-full py-2.5 bg-kawaii-peach hover:bg-kawaii-peachDark rounded-2xl text-sm font-black text-kawaii-ink border-3 border-kawaii-ink dark:border-white shadow-kawaii-sm dark:shadow-kawaii-dark-sm active:translate-x-0.5 active:translate-y-0.5 transition-all"
              >
                Masuk / Daftar
              </Link>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-2xl text-sm font-black border-3 transition-all ${
                    isActive
                      ? "bg-kawaii-peach border-kawaii-ink dark:border-white shadow-kawaii dark:shadow-kawaii-dark text-kawaii-ink translate-x-1"
                      : `border-transparent hover:border-kawaii-ink dark:hover:border-white hover:bg-kawaii-subtle dark:hover:bg-kawaii-darkSubtle text-neutral-800 dark:text-neutral-200 ${
                          item.highlight ? item.highlight + " border-kawaii-ink dark:border-white shadow-kawaii-sm" : ""
                        }`
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0 stroke-[2.5]" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="space-y-3 pt-4 border-t-2 border-kawaii-ink/20 dark:border-white/20">
          {/* Darkmode Toggle Button */}
          <button
            onClick={toggleDarkMode}
            className="flex w-full items-center justify-center space-x-2 px-3.5 py-2.5 rounded-2xl text-sm font-black bg-kawaii-yellow hover:bg-kawaii-yellowDark text-kawaii-ink border-3 border-kawaii-ink dark:border-white shadow-kawaii-sm dark:shadow-kawaii-dark-sm active:translate-x-0.5 active:translate-y-0.5 transition-all"
          >
            {isDark ? (
              <>
                <Sun className="h-4 w-4 stroke-[2.5]" />
                <span>Mode Terang</span>
              </>
            ) : (
              <>
                <Moon className="h-4 w-4 stroke-[2.5]" />
                <span>Mode Gelap</span>
              </>
            )}
          </button>

          {user && (
            <button
              onClick={async () => {
                await logout();
                navigate("/login");
              }}
              className="flex w-full items-center justify-center space-x-2 px-3.5 py-2.5 rounded-2xl text-sm font-black bg-kawaii-pink/20 hover:bg-kawaii-pink text-kawaii-ink dark:text-white border-3 border-kawaii-ink dark:border-white shadow-kawaii-sm dark:shadow-kawaii-dark-sm active:translate-x-0.5 active:translate-y-0.5 transition-all"
            >
              <LogOut className="h-4 w-4 stroke-[2.5]" />
              <span>Keluar</span>
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Viewport */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
};
