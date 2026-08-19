import React, { useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Warehouse,
  ShoppingBag,
  BarChart3,
  Settings as SettingsIcon,
  LogOut,
  Store,
  Calendar,
  UserCheck
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useSettingsStore } from '../../stores/settingsStore';
import Toast from '../ui/Toast';
import { formatDate } from '../../lib/format';

export default function AppShell() {
  const { username, logout } = useAuthStore();
  const { settings, fetchSettings } = useSettingsStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, desc: 'Al Harmain Foam Center business overview & performance analytics' },
    { to: '/products', label: 'Products', icon: Package, desc: 'Manage products, cost prices, selling prices, and stock thresholds' },
    { to: '/inventory', label: 'Inventory', icon: Warehouse, desc: 'Track stock quantities, view Inventory Cost & Retail Valuations, and adjust stock' },
    { to: '/sales', label: 'Sales', icon: ShoppingBag, desc: 'Record customer sales, deduct stock automatically, and view historical sales' },
    { to: '/reports', label: 'Reports', icon: BarChart3, desc: 'Monthly, Quarterly, and Yearly financial summary reports' },
    { to: '/settings', label: 'Settings', icon: SettingsIcon, desc: 'Manage business profile, master password, and database backup/restore' },
  ];

  const currentNav = navItems.find((n) => location.pathname.startsWith(n.to)) || navItems[0];

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
      {/* Toast Notification Container */}
      <Toast />

      {/* Persistent Left Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 select-none text-slate-300">
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-md">
            <Store className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="font-bold text-base tracking-tight text-white font-heading leading-none">
              FoamWalay
            </h1>
            <p className="text-[11px] text-slate-400 font-medium truncate max-w-[140px] mt-1">
              {settings?.businessName || 'Al Harmain Foam Center'}
            </p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm font-bold'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-emerald-400">
              A
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-slate-200 capitalize truncate">{username || 'Admin'}</p>
              <p className="text-[10px] text-slate-400 font-medium">Single Admin</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50">
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 shadow-xs">
          <div>
            <h2 className="text-base font-bold text-slate-900 font-heading tracking-tight">
              {currentNav.label}
            </h2>
            <p className="text-xs text-slate-500 font-normal">
              {currentNav.desc}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              <span>{formatDate(new Date())}</span>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl">
              <UserCheck className="w-3.5 h-3.5 text-blue-600" />
              <span className="capitalize">{username || 'Admin'}</span>
            </div>
          </div>
        </header>

        {/* View Content Body */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
