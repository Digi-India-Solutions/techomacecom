import React, { useEffect, useState } from 'react';
import { Link, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Activity,
  Award,
  Bell,
  Boxes,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  FileSpreadsheet,
  FileText,
  FolderTree,
  HelpCircle,
  KeyRound,
  LayoutDashboard,
  LayoutTemplate,
  LogOut,
  Megaphone,
  Menu,
  MessageSquareMore,
  Newspaper,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  RotateCcw,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Stethoscope,
  Tag,
  UserCog,
  Users,
  Warehouse,
  X,
} from 'lucide-react';
import type { AdminNotification, AdminPermission, GlobalSearchResult } from '@/types/admin';
import { useAuth } from './AuthContext';
import {
  getNotifications,
  globalSearchAdmin,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/lib/api/admin/dashboard';
import { Avatar } from './Avatar';

interface NavItem {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  permission: AdminPermission | string;
  exact?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', to: '/admin', icon: LayoutDashboard, permission: 'dashboard.view', exact: true },
    ],
  },
  {
    label: 'Catalog',
    items: [
      { label: 'Products', to: '/admin/products', icon: Package, permission: 'products.view' },
      { label: 'Categories', to: '/admin/categories', icon: FolderTree, permission: 'categories.manage' },
      { label: 'Brands', to: '/admin/brands', icon: Award, permission: 'brands.manage' },
      { label: 'Bulk Import', to: '/admin/bulk-import', icon: FileSpreadsheet, permission: 'bulk_import.run' },
    ],
  },
  {
    label: 'Inventory',
    items: [
      { label: 'Stock', to: '/admin/inventory', icon: Warehouse, permission: 'inventory.view' },
      { label: 'Rental Units', to: '/admin/rental-units', icon: Stethoscope, permission: 'rental_units.view' },
    ],
  },
  {
    label: 'Sales',
    items: [
      { label: 'Orders', to: '/admin/orders', icon: ShoppingBag, permission: 'orders.view' },
      { label: 'Returns & Refunds', to: '/admin/returns', icon: RotateCcw, permission: 'returns.view' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Rentals', to: '/admin/rentals', icon: ClipboardList, permission: 'rentals.view' },
      { label: 'Enquiries', to: '/admin/enquiries', icon: MessageSquareMore, permission: 'enquiries.view' },
      { label: 'Reviews', to: '/admin/reviews', icon: Star, permission: 'reviews.view' },
      { label: 'Customers', to: '/admin/customers', icon: Users, permission: 'customers.view' },
    ],
  },
  {
    label: 'Marketing',
    items: [
      { label: 'Hero Banners', to: '/admin/banners/hero', icon: LayoutTemplate, permission: 'marketing.manage' },
      { label: 'Page Banners', to: '/admin/banners/pages', icon: Megaphone, permission: 'marketing.manage' },
      { label: 'Homepage Sections', to: '/admin/homepage', icon: Boxes, permission: 'marketing.manage' },
      { label: 'Coupons', to: '/admin/coupons', icon: Tag, permission: 'marketing.manage' },
      { label: 'Deal of the Day', to: '/admin/deals', icon: Sparkles, permission: 'marketing.manage' },
    ],
  },
  {
    label: 'Content',
    items: [
      { label: 'Pages', to: '/admin/pages', icon: FileText, permission: 'content.manage' },
      { label: 'FAQs', to: '/admin/faqs', icon: HelpCircle, permission: 'content.manage' },
      { label: 'Blog', to: '/admin/blog', icon: Newspaper, permission: 'content.manage' },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'Settings', to: '/admin/settings', icon: Settings, permission: 'settings.manage' },
      { label: 'Staff & Roles', to: '/admin/staff', icon: ShieldCheck, permission: 'staff.manage' },
      { label: 'Activity Log', to: '/admin/activity', icon: Activity, permission: 'activity_log.view' },
    ],
  },
];

export function AdminLayout() {
  const { user, isAuthenticated, status, can, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Global search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GlobalSearchResult[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);

  // Notifications
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);

  // Profile menu
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    getNotifications().then(setNotifications).catch(() => {});
  }, [isAuthenticated]);

  useEffect(() => {
    setMobileMenuOpen(false);
    setProfileOpen(false);
    setNotifOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = window.setTimeout(() => {
      globalSearchAdmin(searchQuery)
        .then((res) => {
          setSearchResults(res);
          setSearchOpen(true);
        })
        .catch(() => {});
    }, 140);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  if (status === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F6F9FD]" role="status" aria-live="polite">
        <div className="flex items-center gap-3 text-sm text-[#5B6B82]">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#DCE6F2] border-t-[#1D5FAF]" />
          Checking your session…
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  const isActiveLink = (item: NavItem) => {
    if (item.exact) return location.pathname === item.to;
    return location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);
  };

  const handleMarkRead = async (n: AdminNotification) => {
    const next = await markNotificationRead(n.id);
    setNotifications(next);
    setNotifOpen(false);
    navigate(n.href);
  };

  const handleMarkAllRead = async () => {
    const next = await markAllNotificationsRead();
    setNotifications(next);
  };

  const sidebarContent = (isMobile = false) => (
    <div className="flex h-full flex-col bg-[#0B2545] text-white select-none">
      {/* Brand header */}
      <div className="flex h-16 items-center justify-between gap-2 border-b border-white/10 px-4">
        <Link to="/admin" className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#1D5FAF] font-bold text-white shadow-sm">
            BD
          </div>
          {(!collapsed || isMobile) && (
            <div className="min-w-0">
              <span className="block text-sm font-semibold tracking-tight text-white truncate">
                Buy Denmed
              </span>
              <span className="block text-[11px] text-white/60 truncate">
                Operations Console
              </span>
            </div>
          )}
        </Link>
        {isMobile ? (
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="rounded-lg p-1.5 text-white/70 hover:bg-white/10 hover:text-white"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="hidden lg:flex rounded-lg p-1.5 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      {/* Navigation groups */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-4 space-y-5">
        {NAV_GROUPS.map((group) => {
          const visibleItems = group.items.filter((item) => can(item.permission));
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.label}>
              {(!collapsed || isMobile) && (
                <p className="px-3 mb-1.5 text-[11px] font-semibold tracking-wider text-white/45 uppercase">
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActiveLink(item);
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      title={collapsed && !isMobile ? item.label : undefined}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                        active
                          ? 'bg-[#1D5FAF] text-white shadow-sm'
                          : 'text-white/75 hover:bg-white/10 hover:text-white'
                      } ${collapsed && !isMobile ? 'justify-center px-2' : ''}`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {(!collapsed || isMobile) && (
                        <span className="truncate">{item.label}</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Role indicator footer */}
      <div className="border-t border-white/10 p-3">
        {!collapsed || isMobile ? (
          <Link to="/admin/profile" className="flex items-center gap-2.5 rounded-lg bg-white/8 px-3 py-2 hover:bg-white/12 transition-colors">
            <Avatar name={user.name} initials={user.avatarInitials} url={user.avatarUrl} className="h-8 w-8 text-xs bg-white/10" rounded="rounded-lg" />
            <span className="min-w-0">
              <span className="block text-xs font-medium text-white truncate">{user.name}</span>
              <span className="block text-[11px] text-white/65 truncate">{user.roleLabel}</span>
            </span>
          </Link>
        ) : (
          <Link to="/admin/profile" className="mx-auto block w-fit" title={`${user.name} (${user.roleLabel})`}>
            <Avatar name={user.name} initials={user.avatarInitials} url={user.avatarUrl} className="h-8 w-8 text-xs bg-white/10" rounded="rounded-lg" />
          </Link>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#F6F9FD] text-[#12263F]">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:block shrink-0 border-r border-[#0B2545] transition-all duration-200 ${
          collapsed ? 'w-[72px]' : 'w-[252px]'
        }`}
      >
        <div className="sticky top-0 h-screen">{sidebarContent(false)}</div>
      </aside>

      {/* Mobile / Tablet Drawer Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-[#0B2545]/50 backdrop-blur-[1px]"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative z-10 w-64 max-w-[82vw] h-full shadow-2xl">
            {sidebarContent(true)}
          </aside>
        </div>
      )}

      {/* Main Content Shell */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-[#DCE6F2] bg-white px-4 lg:px-6">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-lg border border-[#DCE6F2] p-2 text-[#12263F] hover:bg-[#EAF2FC] lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4" />
            </button>

            {/* Global Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5B6B82]" />
              <input
                type="text"
                value={searchQuery}
                onFocus={() => searchQuery.trim() && setSearchOpen(true)}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products, SKU, orders, customers..."
                className="w-full rounded-lg border border-[#DCE6F2] bg-[#F6F9FD] pl-9 pr-8 py-2 text-sm text-[#12263F] placeholder-[#5B6B82]/70 focus:border-[#1D5FAF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1D5FAF]/20"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                    setSearchOpen(false);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5B6B82] hover:text-[#12263F]"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}

              {searchOpen && searchQuery.trim() && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setSearchOpen(false)}
                  />
                  <div className="absolute left-0 right-0 z-30 mt-1.5 rounded-xl border border-[#DCE6F2] bg-white shadow-xl overflow-hidden">
                    {searchResults.length === 0 ? (
                      <div className="px-4 py-6 text-center text-xs text-[#5B6B82]">
                        No products, orders, or customers matched &ldquo;{searchQuery}&rdquo;.
                      </div>
                    ) : (
                      <div className="max-h-80 overflow-y-auto divide-y divide-[#DCE6F2]">
                        {searchResults.map((res) => (
                          <button
                            key={`${res.type}-${res.id}`}
                            type="button"
                            onClick={() => {
                              setSearchOpen(false);
                              setSearchQuery('');
                              navigate(res.href);
                            }}
                            className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left hover:bg-[#EAF2FC] transition-colors"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="rounded bg-[#EAF2FC] px-1.5 py-0.5 text-[10px] font-semibold uppercase text-[#1D5FAF]">
                                  {res.type}
                                </span>
                                <span className="text-sm font-medium text-[#12263F] truncate">
                                  {res.title}
                                </span>
                              </div>
                              <p className="mt-0.5 text-xs text-[#5B6B82] truncate">
                                {res.subtitle}
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-xs font-semibold text-[#12263F] tabular-nums">
                                {res.meta}
                              </span>
                              <ChevronRight className="h-4 w-4 text-[#5B6B82]" />
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Notification Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setNotifOpen((o) => !o);
                  setProfileOpen(false);
                }}
                className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-[#DCE6F2] bg-white text-[#12263F] hover:bg-[#EAF2FC] transition-colors"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#F28C38] px-1 text-[10px] font-bold text-white tabular-nums">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setNotifOpen(false)}
                  />
                  <div className="absolute right-0 z-30 mt-2 w-80 sm:w-96 rounded-xl border border-[#DCE6F2] bg-white shadow-xl overflow-hidden">
                    <div className="flex items-center justify-between border-b border-[#DCE6F2] px-4 py-3">
                      <h3 className="text-sm font-semibold text-[#12263F]">
                        Operational Alerts
                      </h3>
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={handleMarkAllRead}
                          className="text-xs font-medium text-[#1D5FAF] hover:underline"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto divide-y divide-[#DCE6F2]">
                      {notifications.map((n) => (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => handleMarkRead(n)}
                          className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[#F6F9FD] ${
                            !n.read ? 'bg-[#EAF2FC]/50' : ''
                          }`}
                        >
                          <span
                            className={`mt-1 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase shrink-0 ${
                              n.severity === 'urgent'
                                ? 'bg-[#F28C38]/15 text-[#B85A0E]'
                                : n.severity === 'warning'
                                  ? 'bg-[#F28C38]/10 text-[#B85A0E]'
                                  : 'bg-[#EAF2FC] text-[#1D5FAF]'
                            }`}
                          >
                            {n.severity}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-[#12263F]">{n.title}</p>
                            <p className="mt-0.5 text-xs text-[#5B6B82]">{n.message}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setProfileOpen((o) => !o);
                  setNotifOpen(false);
                }}
                className="flex items-center gap-2.5 rounded-lg border border-[#DCE6F2] bg-white px-2.5 py-1.5 hover:bg-[#EAF2FC] transition-colors"
              >
                <Avatar name={user.name} initials={user.avatarInitials} url={user.avatarUrl} className="h-7 w-7 text-xs" />
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-semibold text-[#12263F] leading-tight whitespace-nowrap">
                    {user.name}
                  </p>
                  <p className="text-[11px] text-[#5B6B82] leading-tight whitespace-nowrap">
                    {user.roleLabel}
                  </p>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-[#5B6B82]" />
              </button>

              {profileOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setProfileOpen(false)}
                  />
                  <div className="absolute right-0 z-30 mt-2 w-64 rounded-xl border border-[#DCE6F2] bg-white shadow-xl overflow-hidden">
                    <div className="flex items-center gap-3 border-b border-[#DCE6F2] px-4 py-3 bg-[#F6F9FD]">
                      <Avatar name={user.name} initials={user.avatarInitials} url={user.avatarUrl} className="h-9 w-9 text-xs" rounded="rounded-lg" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[#12263F] truncate">{user.name}</p>
                        <p className="text-[11px] text-[#5B6B82] truncate">{user.email}</p>
                      </div>
                    </div>

                    <div className="p-1.5 space-y-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          setProfileOpen(false);
                          navigate('/admin/profile');
                        }}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-[#12263F] hover:bg-[#EAF2FC]"
                      >
                        <UserCog className="h-4 w-4 text-[#5B6B82]" />
                        My Profile
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setProfileOpen(false);
                          navigate('/admin/profile?tab=security');
                        }}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-[#12263F] hover:bg-[#EAF2FC]"
                      >
                        <KeyRound className="h-4 w-4 text-[#5B6B82]" />
                        Password &amp; Devices
                      </button>
                    </div>

                    <div className="border-t border-[#DCE6F2] p-1.5">
                      <button
                        type="button"
                        onClick={async () => {
                          await logout();
                          navigate('/admin/login');
                        }}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Viewport */}
        <main className="flex-1 p-4 lg:p-6 max-w-[1600px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
