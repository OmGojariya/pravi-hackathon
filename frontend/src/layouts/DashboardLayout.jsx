import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { QRScannerModal } from '../components/common/QRScannerModal';
import { GovEmblem } from '../components/common/GovEmblem';
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
  ShieldCheck,
  Globe,
  Award,
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
  const [fontSizeClass, setFontSizeClass] = useState('text-base');

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
      title: 'MAIN NAVIGATION',
      items: [
        { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      ],
    },
    {
      title: 'ASSET INVENTORY',
      items: [
        { label: 'All Infrastructure Assets', path: '/assets', icon: Layers },
        { label: 'Register New Asset', path: '/assets/new', icon: Plus, permission: ['SUPER_ADMIN', 'ADMIN', 'ASSET_MANAGER', 'PROJECT_MANAGER'] },
        { label: 'GIS Infrastructure Map', path: '/assets/map', icon: MapPin },
        { label: 'Asset Categories', path: '/categories', icon: FolderTree },
      ],
    },
    {
      title: 'LIFECYCLE & PLANNING',
      items: [
        { label: 'Lifecycle Tracking', path: '/lifecycle', icon: Repeat },
        { label: 'Replacement Planning', path: '/replacement-planning', icon: CalendarCheck },
      ],
    },
    {
      title: 'FIELD INSPECTION',
      items: [
        { label: 'Quality Inspections', path: '/inspections', icon: ClipboardList },
        { label: 'Overdue Inspections', path: '/inspections?due=true', icon: AlertTriangle },
      ],
    },
    {
      title: 'MAINTENANCE OPERATIONS',
      items: [
        { label: 'Maintenance Requests', path: '/maintenance', icon: Wrench },
        { label: 'Work Orders', path: '/work-orders', icon: FileSpreadsheet },
        { label: 'Preventive Schedules', path: '/maintenance/schedules', icon: Repeat },
      ],
    },
    {
      title: 'PROJECTS & PROCUREMENT',
      items: [
        { label: 'Capital Projects', path: '/projects', icon: Briefcase },
        { label: 'Contractors & Vendors', path: '/vendors', icon: Truck },
        { label: 'Procurement & Tenders', path: '/procurement', icon: ShoppingCart },
      ],
    },
    {
      title: 'REPORTS & ANALYTICS',
      items: [
        { label: 'Government Reports & CSV', path: '/reports', icon: BarChart3 },
      ],
    },
    {
      title: 'ADMINISTRATION & SECURITY',
      items: [
        { label: 'Official Directory', path: '/users', icon: Users, permission: ['SUPER_ADMIN', 'ADMIN'] },
        { label: 'Security & Audit Logs', path: '/audit-logs', icon: ShieldAlert, permission: ['SUPER_ADMIN', 'ADMIN'] },
        { label: 'Portal Settings', path: '/settings', icon: Settings },
      ],
    },
  ];

  return (
    <div className={`min-h-screen bg-[#f4f6f9] flex flex-col font-sans ${fontSizeClass}`}>
      {/* 1. Indian National Tricolor Accent Bar */}
      <div className="gov-tricolor-line w-full z-50 fixed top-0 left-0" />

      {/* 2. Official Government of Gujarat Citizen & Accessibility Bar */}
      <div className="bg-[#07192f] text-slate-300 text-[11px] border-b border-slate-800/80 pt-1">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-8 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4 divide-x divide-slate-700">
            <div className="flex items-center gap-1.5 font-semibold text-slate-100">
              <span className="text-sm">🇮🇳</span>
              <span>GOVERNMENT OF GUJARAT</span>
            </div>
            <div className="pl-2 sm:pl-4 hidden md:flex items-center gap-1 text-slate-400">
              <span>Roads & Buildings Department</span>
              <span className="text-slate-600">•</span>
              <span>State Infrastructure Command</span>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {/* CM Dashboard sync badge */}
            <div className="hidden lg:flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 text-[10px] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>CM Dashboard Integrated</span>
            </div>

            {/* Accessibility controls */}
            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
              <button
                onClick={() => setFontSizeClass('text-sm')}
                className="hover:text-amber-400 px-1"
                title="Decrease font size"
              >
                A-
              </button>
              <span className="text-slate-600">|</span>
              <button
                onClick={() => setFontSizeClass('text-base')}
                className="hover:text-amber-400 px-1"
                title="Default font size"
              >
                A
              </button>
              <span className="text-slate-600">|</span>
              <button
                onClick={() => setFontSizeClass('text-lg')}
                className="hover:text-amber-400 px-1"
                title="Increase font size"
              >
                A+
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-1 text-amber-300 font-medium text-[11px]">
              <Globe className="w-3 h-3 text-amber-400" />
              <span>Official Government Portal</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main State Portal Header */}
      <header className="sticky top-1 z-30 bg-[#0a2240] text-white border-b-4 border-amber-600 shadow-lg">
        <div className="px-4 sm:px-6 flex items-center justify-between h-20">
          {/* Left: Mobile Toggle & Government Branding with Ashoka Emblem */}
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-[#143864] focus:outline-none"
              aria-label="Toggle menu"
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            <Link to="/dashboard" className="flex items-center gap-3 group">
              <GovEmblem className="w-9 h-11" variant="gold" />
              
              <div className="border-l border-slate-700 pl-3">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-xl tracking-tight text-white font-['Outfit']">
                    InfraTrack <span className="text-amber-400 font-serif">Gujarat</span>
                  </span>
                  <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded tracking-wide">
                    GUJ-PVI
                  </span>
                </div>
                <p className="text-[11px] text-amber-200/90 font-medium leading-tight">
                  State Infrastructure Asset Lifecycle Management System
                </p>
                <p className="text-[10px] text-slate-300 hidden sm:block uppercase tracking-wider font-semibold">
                  Govt. of Gujarat • Gandhinagar
                </p>
              </div>
            </Link>
          </div>

          {/* Center: Global Asset Search */}
          <div className="flex-1 max-w-md mx-4 hidden md:block">
            <form onSubmit={handleGlobalSearch} className="relative">
              <input
                type="text"
                placeholder="Search Gujarat Assets (e.g. ROAD-2026, Sabarmati, Ring Road)..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="w-full bg-[#07192f] text-sm text-slate-100 placeholder-slate-400 pl-10 pr-4 py-2.5 rounded-lg border border-[#1a4477] focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 shadow-inner"
              />
              <Search className="w-4 h-4 text-amber-400 absolute left-3 top-3" />
            </form>
          </div>

          {/* Right: Actions, Notifications, Role Switcher, Officer Badge */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Scan Tag Button */}
            <button
              onClick={() => setQrModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-amber-200 bg-[#07192f] hover:bg-[#143864] hover:text-white rounded-lg border border-amber-500/50 shadow-sm transition-all"
              title="Scan Infrastructure QR Tag"
            >
              <QrCode className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">QR Scan Tag</span>
            </button>

            {/* Quick Add Asset (Official Saffron button) */}
            {hasRole('SUPER_ADMIN', 'ADMIN', 'ASSET_MANAGER', 'PROJECT_MANAGER') && (
              <Link
                to="/assets/new"
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#e66000] hover:bg-[#cf5600] rounded-lg shadow-md transition-all border border-amber-400/30"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Register Asset</span>
              </Link>
            )}

            {/* Notification Menu */}
            <div className="relative">
              <button
                onClick={() => setShowNotifMenu(!showNotifMenu)}
                className="relative p-2 rounded-lg text-slate-200 hover:bg-[#143864] transition-colors"
                title="System Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center ring-2 ring-[#0a2240]">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifMenu && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white text-slate-900 rounded-xl shadow-2xl border-2 border-slate-200 overflow-hidden z-50">
                  <div className="p-3 bg-[#0a2240] text-white flex items-center justify-between border-b-2 border-amber-500">
                    <span className="font-bold text-sm">Official Notifications ({unreadCount})</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="text-xs text-amber-300 hover:text-amber-100 font-medium underline"
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
                            !n.isRead ? 'bg-amber-50/40 border-l-4 border-amber-500' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-bold text-slate-900">
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
                  <div className="p-2 border-t border-slate-100 bg-slate-50 text-center">
                    <Link
                      to="/notifications"
                      onClick={() => setShowNotifMenu(false)}
                      className="text-xs text-[#0a2240] hover:text-amber-700 font-bold"
                    >
                      View all official alerts →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Demo Persona Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-[#07192f] hover:bg-[#143864] rounded-lg border border-[#1a4477]"
                title="Switch Officer Role"
              >
                <span className="text-slate-400">Officer:</span>
                <span className="text-amber-400 font-bold">{user?.role?.replace('_', ' ') || 'VIEWER'}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white text-slate-900 rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50">
                  <div className="p-2.5 bg-[#0a2240] text-white text-[11px] font-bold uppercase tracking-wider border-b-2 border-amber-500">
                    Switch Government Role (Demo)
                  </div>
                  <div className="p-1 space-y-0.5 text-xs">
                    {[
                      { role: 'admin', label: 'Chief Engineer / Admin (Gandhinagar)', email: 'admin@infratrack.com' },
                      { role: 'assetmanager', label: 'Executive Engineer (R&B)', email: 'assetmanager@infratrack.com' },
                      { role: 'engineer', label: 'Field Quality Inspector', email: 'engineer@infratrack.com' },
                      { role: 'viewer', label: 'Public Citizen / Audit Viewer', email: 'viewer@infratrack.com' },
                    ].map((item) => (
                      <button
                        key={item.role}
                        onClick={async () => {
                          setShowRoleMenu(false);
                          await loginDemo(item.role);
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-amber-50 hover:text-amber-900 flex flex-col transition-colors border-b border-slate-50 last:border-none"
                      >
                        <span className="font-bold text-slate-900">{item.label}</span>
                        <span className="text-[10px] text-slate-500">{item.email}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Officer Profile & Sign out */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-700">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-600 to-amber-500 flex items-center justify-center text-white font-extrabold text-xs shadow-md border border-amber-300">
                {user?.name?.charAt(0) || 'G'}
              </div>
              <div className="hidden xl:block text-left text-xs">
                <div className="font-bold text-slate-100 leading-none truncate max-w-[120px]">{user?.name}</div>
                <div className="text-[10px] text-amber-300/90 font-medium leading-tight truncate max-w-[120px]">
                  {user?.department || 'R&B Department'}
                </div>
              </div>
              <button
                onClick={logout}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-[#143864] rounded-lg transition-colors ml-1"
                title="Secure Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 4. Main Body: Sidebar & Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* State Portal Left Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#07192f] border-r border-[#143054] flex flex-col transition-transform transform lg:translate-x-0 lg:static lg:z-auto ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Official Department Tag */}
          <div className="p-3.5 bg-[#051324] border-b border-[#143054] flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200">
                STATE ASSET REGISTRY
              </span>
              <p className="text-[10px] text-slate-400">State Infrastructure Portal</p>
            </div>
          </div>

          {/* Sidebar Nav Items */}
          <div className="flex-1 overflow-y-auto px-2 py-4 space-y-5 scrollbar-thin scrollbar-thumb-slate-800">
            {navSections.map((section, idx) => {
              const visibleItems = section.items.filter(
                (item) => !item.permission || hasRole(...item.permission)
              );
              if (visibleItems.length === 0) return null;

              return (
                <div key={idx}>
                  {section.title && (
                    <div className="px-3 mb-1.5 text-[10px] font-bold tracking-wider text-amber-400/90 font-mono">
                      {section.title}
                    </div>
                  )}
                  <nav className="space-y-0.5">
                    {visibleItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.path;

                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setSidebarOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg transition-all ${
                            isActive
                              ? 'bg-gradient-to-r from-amber-600/30 to-amber-600/10 text-amber-300 font-bold border-l-4 border-amber-500 shadow-sm'
                              : 'text-slate-300 hover:bg-[#0e2747] hover:text-white'
                          }`}
                        >
                          <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                          <span className="truncate">{item.label}</span>
                        </Link>
                      );
                    })}
                  </nav>
                </div>
              );
            })}
          </div>

          {/* Official Gujarat Government Portal Sidebar Footer */}
          <div className="p-3 border-t border-[#143054] bg-[#051324] text-[10px] text-slate-400">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200">Govt. of Gujarat</span>
              <span className="px-1.5 py-0.5 bg-emerald-950 text-emerald-400 font-mono text-[9px] rounded border border-emerald-800">
                ACTIVE
              </span>
            </div>
            <p className="text-slate-400 text-[10px] mt-0.5">Sachivalaya, Gandhinagar</p>
          </div>
        </aside>

        {/* Content Area */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-[#f4f6f9]">
            {children || <Outlet />}
          </main>

          {/* 5. Official State Government NIC Footer */}
          <footer className="bg-[#0a2240] text-slate-300 border-t-2 border-amber-500 text-xs py-6 px-4 sm:px-8">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              <div>
                <div className="flex items-center gap-2">
                  <GovEmblem className="w-6 h-8" variant="gold" />
                  <div>
                    <p className="font-bold text-white text-sm">InfraTrack Gujarat</p>
                    <p className="text-[11px] text-amber-300">Roads & Buildings Department, Govt. of Gujarat</p>
                  </div>
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  Block No. 14, 2nd Floor, New Sachivalaya, Gandhinagar, Gujarat – 382010
                </p>
              </div>

              <div className="text-center text-[11px] text-slate-400 space-y-1">
                <div className="flex flex-wrap justify-center gap-3 text-slate-300 font-medium">
                  <span className="hover:text-amber-300 cursor-pointer">Accessibility Statement</span>
                  <span>•</span>
                  <span className="hover:text-amber-300 cursor-pointer">Terms & Conditions</span>
                  <span>•</span>
                  <span className="hover:text-amber-300 cursor-pointer">Privacy Policy</span>
                  <span>•</span>
                  <span className="hover:text-amber-300 cursor-pointer">Helpdesk</span>
                </div>
                <p>© {new Date().getFullYear()} Government of Gujarat. All Rights Reserved.</p>
                <p className="text-[10px] text-slate-400">
                  Designed & Developed with National Informatics Standards • ISO 55000:2014 Compliance
                </p>
              </div>

              <div className="flex flex-col md:items-end justify-center text-[11px] text-slate-400">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#07192f] border border-amber-500/30 rounded text-amber-200 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>State Quality Assurance Certified</span>
                </div>
                <p className="mt-1 text-[10px] text-slate-400">NIC Gujarat State Centre</p>
              </div>
            </div>
          </footer>
        </div>
      </div>

      {/* QR Scanner Modal for Field Officers */}
      <QRScannerModal isOpen={qrModalOpen} onClose={() => setQrModalOpen(false)} />
    </div>
  );
};

