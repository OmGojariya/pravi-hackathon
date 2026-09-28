import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { QRScannerModal } from '../components/common/QRScannerModal';
import api from '../api/client';
import {
  LayoutDashboard,
  Layers,
  MapPin,
  FolderTree,
  Repeat,
  CalendarCheck,
  ClipboardList,
  AlertTriangle,
  Wrench,
  FileSpreadsheet,
  Briefcase,
  Truck,
  ShoppingCart,
  BarChart3,
  Users,
  ShieldAlert,
  Settings,
  Bell,
  Search,
  Plus,
  QrCode,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Building,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

export const DashboardLayout = ({ children }) => {
  const { user, logout, loginDemo, hasRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const res = await api.get('/notifications');
        if (res.success) {
          setNotifications(res.data || []);
          setUnreadCount(res.unreadCount || 0);
        }
      } catch (err) {
        // Non-critical
      }
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 45000);
    return () => clearInterval(interval);
  }, []);

  const handleGlobalSearch = (e) => {
    e.preventDefault();
    if (!globalSearch.trim()) return;
    navigate(`/assets?search=${encodeURIComponent(globalSearch.trim())}`);
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (e) {}
  };

  const navSections = [
    {
      title: null,
      items: [
        { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      ],
    },
    {
      title: 'Asset Management',
      items: [
        { label: 'All Assets', path: '/assets', icon: Layers },
        { label: 'Add Asset', path: '/assets/new', icon: Plus, permission: ['SUPER_ADMIN', 'ADMIN', 'ASSET_MANAGER', 'PROJECT_MANAGER'] },
        { label: 'Asset Map', path: '/assets/map', icon: MapPin },
        { label: 'Categories', path: '/categories', icon: FolderTree },
      ],
    },
    {
      title: 'Lifecycle',
      items: [
        { label: 'Lifecycle Tracking', path: '/lifecycle', icon: Repeat },
        { label: 'Replacement Planning', path: '/replacement-planning', icon: CalendarCheck },
      ],
    },
    {
      title: 'Inspections',
      items: [
        { label: 'All Inspections', path: '/inspections', icon: ClipboardList },
        { label: 'Due Inspections', path: '/inspections?due=true', icon: AlertTriangle },
      ],
    },
    {
      title: 'Maintenance',
      items: [
        { label: 'Requests', path: '/maintenance', icon: Wrench },
        { label: 'Work Orders', path: '/work-orders', icon: FileSpreadsheet },
        { label: 'Preventive Schedules', path: '/maintenance/schedules', icon: Repeat },
      ],
    },
    {
      title: 'Projects & Procurement',
      items: [
        { label: 'Projects', path: '/projects', icon: Briefcase },
        { label: 'Vendors & Contractors', path: '/vendors', icon: Truck },
        { label: 'Procurement', path: '/procurement', icon: ShoppingCart },
      ],
    },
    {
      title: 'Reports & Analytics',
      items: [
        { label: 'Reports & Exports', path: '/reports', icon: BarChart3 },
      ],
    },
    {
      title: 'Administration',
      items: [
        { label: 'User Directory', path: '/users', icon: Users, permission: ['SUPER_ADMIN', 'ADMIN'] },
        { label: 'Audit Logs', path: '/audit-logs', icon: ShieldAlert, permission: ['SUPER_ADMIN', 'ADMIN'] },
        { label: 'Settings', path: '/settings', icon: Settings },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-slate-900 text-white border-b border-slate-800 shadow-md">
        <div className="px-4 sm:px-6 flex items-center justify-between h-16">
          {/* Left: Mobile Toggle & Brand */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link to="/dashboard" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-brand-600 to-sky-400 flex items-center justify-center shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform">
                <Building className="w-5 h-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-lg tracking-tight text-white font-['Outfit']">InfraTrack</span>
                  <span className="text-[10px] font-semibold bg-brand-500/20 text-brand-300 border border-brand-500/30 px-1.5 py-0.5 rounded">v2.0</span>
                </div>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-medium">Asset Lifecycle System</p>
              </div>
            </Link>
          </div>

          {/* Center: Global Asset Search */}
          <div className="flex-1 max-w-md mx-4 hidden md:block">
            <form onSubmit={handleGlobalSearch} className="relative">
              <input
                type="text"
                placeholder="Global search by Asset Code, Name, District..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="w-full bg-slate-800/90 text-sm text-slate-100 placeholder-slate-400 pl-10 pr-4 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </form>
          </div>

          {/* Right: Quick actions, Notifications, Demo role switcher & User */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Scan QR */}
            <button
              onClick={() => setQrModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-lg border border-slate-700 transition-colors"
              title="Scan QR Code from Device Camera"
            >
              <QrCode className="w-3.5 h-3.5 text-brand-400" />
              <span className="hidden sm:inline">Scan Tag</span>
            </button>

            {/* Quick Add Asset */}
            {hasRole('SUPER_ADMIN', 'ADMIN', 'ASSET_MANAGER', 'PROJECT_MANAGER') && (
              <Link
                to="/assets/new"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500 rounded-lg shadow-sm transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">New Asset</span>
              </Link>
            )}

            {/* Notification Menu */}
            <div className="relative">
              <button
                onClick={() => setShowNotifMenu(!showNotifMenu)}
                className="relative p-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifMenu && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white text-slate-900 rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50">
                  <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <span className="font-semibold text-sm">Notifications ({unreadCount})</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="text-xs text-brand-600 hover:text-brand-700 font-medium"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400">
                        No notifications currently.
                      </div>
                    ) : (
                      notifications.slice(0, 6).map((n) => (
                        <div
                          key={n._id}
                          className={`p-3.5 hover:bg-slate-50 transition-colors ${
                            !n.isRead ? 'bg-blue-50/50' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-semibold text-slate-900">
                              {n.title}
                            </span>
                            <span className="text-[10px] text-slate-400 whitespace-nowrap">
                              {new Date(n.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                            {n.message}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-2 border-t border-slate-100 bg-slate-50/50 text-center">
                    <Link
                      to="/notifications"
                      onClick={() => setShowNotifMenu(false)}
                      className="text-xs text-brand-600 hover:text-brand-800 font-semibold"
                    >
                      View all system notifications
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Demo Role Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="hidden md:flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-800 rounded-lg border border-slate-700"
                title="Switch demo persona for grading"
              >
                <span className="text-slate-400">Role:</span>
                <span className="text-brand-400 font-semibold">{user?.role?.replace('_', ' ') || 'VIEWER'}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white text-slate-900 rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50">
                  <div className="p-2.5 bg-slate-50 border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Switch Demo Persona
                  </div>
                  <div className="p-1 space-y-0.5 text-xs">
                    {[
                      { role: 'admin', label: 'Admin (Full Controls)', email: 'admin@infratrack.com' },
                      { role: 'assetmanager', label: 'Asset Manager', email: 'assetmanager@infratrack.com' },
                      { role: 'engineer', label: 'Field Engineer', email: 'engineer@infratrack.com' },
                      { role: 'viewer', label: 'Public Viewer (Read-only)', email: 'viewer@infratrack.com' },
                    ].map((item) => (
                      <button
                        key={item.role}
                        onClick={async () => {
                          setShowRoleMenu(false);
                          await loginDemo(item.role);
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-brand-50 hover:text-brand-700 flex flex-col transition-colors"
                      >
                        <span className="font-semibold">{item.label}</span>
                        <span className="text-[10px] text-slate-400">{item.email}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile / Logout */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="w-8 h-8 rounded-full bg-brand-700 flex items-center justify-center text-white font-bold text-xs ring-2 ring-brand-500/30">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="hidden xl:block text-left text-xs">
                <div className="font-medium text-slate-200 leading-none truncate max-w-[110px]">{user?.name}</div>
                <div className="text-[10px] text-slate-400 leading-tight truncate max-w-[110px]">{user?.employeeId}</div>
              </div>
              <button
                onClick={logout}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform transform lg:translate-x-0 lg:static lg:z-auto ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Sidebar Nav Items */}
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-800">
            {navSections.map((section, idx) => {
              // Filter items by permission if required
              const visibleItems = section.items.filter(
                (item) => !item.permission || hasRole(...item.permission)
              );
              if (visibleItems.length === 0) return null;

              return (
                <div key={idx}>
                  {section.title && (
                    <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {section.title}
                    </div>
                  )}
                  <nav className="space-y-1">
                    {visibleItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.path;

                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setSidebarOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                            isActive
                              ? 'bg-brand-600 text-white shadow-sm'
                              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                          }`}
                        >
                          <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </nav>
                </div>
              );
            })}
          </div>

          {/* Sidebar Footer info */}
          <div className="p-3 border-t border-slate-800 bg-slate-950/60 text-[11px] text-slate-400 flex items-center justify-between">
            <div>
              <p className="font-semibold text-slate-300">InfraTrack System</p>
              <p className="text-[10px] text-slate-500">Government of Gujarat</p>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="System Operational" />
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50/80">
          {children || <Outlet />}
        </main>
      </div>

      {/* QR Scanner Modal for Field Mode */}
      <QRScannerModal isOpen={qrModalOpen} onClose={() => setQrModalOpen(false)} />
    </div>
  );
};
