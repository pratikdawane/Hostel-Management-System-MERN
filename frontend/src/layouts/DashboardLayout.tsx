import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Building2,
  LayoutDashboard,
  Users,
  BedDouble,
  Wallet,
  MessageSquareWarning,
  KeyRound,
  LogOut,
  Menu,
  Search,
  UserRound,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { ROLE_LABELS, type Role } from '@/types/auth';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/cn';
import { getErrorMessage } from '@/utils/errors';
import { getInitials } from '@/utils/format';
import { NEU_RAISED, NEU_PRESSED, NEU_PRESS_ON_ACTIVE } from '@/styles/neumorphism';

interface NavItem {
  label: string;
  to: string;
  icon: typeof LayoutDashboard;
  roles: Role[];
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    to: '/dashboard',
    icon: LayoutDashboard,
    roles: ['admin', 'manager', 'resident'],
  },
  { label: 'Manage Users', to: '/admin/users', icon: Users, roles: ['admin'] },
  { label: 'Residents', to: '/residents', icon: UserRound, roles: ['admin', 'manager'] },
];

const UPCOMING_MODULES = [
  { label: 'Rooms & Beds', icon: BedDouble },
  { label: 'Rent & Payments', icon: Wallet },
  { label: 'Complaints', icon: MessageSquareWarning },
];

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user) return null;

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to log out'));
    }
  };

  const visibleNavItems = NAV_ITEMS.filter((item) => item.roles.includes(user.role));

  return (
    <div className="min-h-screen bg-[var(--color-neu-surface)]">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-gray-900/30 backdrop-blur-[2px] lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-3 left-3 z-40 flex w-72 flex-col rounded-[28px] bg-[var(--color-neu-surface)] p-4 transition-transform duration-300 ease-out lg:translate-x-0',
          NEU_RAISED,
          sidebarOpen ? 'translate-x-0' : '-translate-x-[120%]',
        )}
      >
        <div className="flex items-center gap-2.5 px-2 pb-5">
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-600 text-white',
              NEU_RAISED,
            )}
          >
            <Building2 className="h-5 w-5" strokeWidth={1.8} />
          </div>
          <span className="text-sm font-semibold text-gray-800">Hostel Manager</span>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="ml-auto cursor-pointer rounded-full p-1.5 text-gray-500 transition-colors duration-150 hover:bg-black/5 lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" strokeWidth={1.8} />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-2 overflow-y-auto px-1 py-1">
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200',
                  isActive
                    ? cn('text-primary-700', NEU_PRESSED)
                    : 'text-gray-600 hover:-translate-y-0.5 hover:text-gray-900',
                )
              }
            >
              <item.icon className="h-4.5 w-4.5" strokeWidth={1.8} />
              {item.label}
            </NavLink>
          ))}

          <p className="mb-1 mt-5 px-4 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Coming soon
          </p>
          {UPCOMING_MODULES.map((item) => (
            <div
              key={item.label}
              className="flex cursor-not-allowed items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-gray-400"
            >
              <item.icon className="h-4.5 w-4.5" strokeWidth={1.8} />
              {item.label}
              <Badge variant="neutral" className="ml-auto">
                Soon
              </Badge>
            </div>
          ))}
        </nav>
      </aside>

      <div className="lg:pl-80">
        <header className="sticky top-3 z-20 mx-3 mb-3 flex h-16 items-center gap-3 px-1 sm:px-2 lg:mx-4">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className={cn(
              'flex h-10 w-10 flex-shrink-0 cursor-pointer items-center justify-center rounded-full text-gray-600 transition-all duration-200 lg:hidden',
              NEU_RAISED,
              NEU_PRESS_ON_ACTIVE,
            )}
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" strokeWidth={1.8} />
          </button>

          <label
            className={cn(
              'hidden h-11 w-full max-w-sm items-center gap-2.5 rounded-full px-4 text-gray-500 sm:flex',
              NEU_PRESSED,
            )}
          >
            <Search className="h-4.5 w-4.5 flex-shrink-0" strokeWidth={1.8} />
            <input
              type="search"
              placeholder="Search..."
              className="h-full w-full bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
            />
          </label>

          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-gray-900">{user.name}</p>
              <p className="text-xs text-gray-500">{ROLE_LABELS[user.role]}</p>
            </div>

            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-full bg-primary-600 text-xs font-semibold text-white',
                NEU_RAISED,
              )}
              aria-hidden="true"
            >
              {getInitials(user.name)}
            </div>

            <NavLink
              to="/change-password"
              className={cn(
                'flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-gray-500 transition-all duration-200 hover:-translate-y-0.5 hover:text-primary-600',
                NEU_RAISED,
                NEU_PRESS_ON_ACTIVE,
              )}
              aria-label="Change password"
              title="Change password"
            >
              <KeyRound className="h-4.5 w-4.5" strokeWidth={1.8} />
            </NavLink>
            <button
              type="button"
              onClick={handleLogout}
              className={cn(
                'flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-gray-500 transition-all duration-200 hover:-translate-y-0.5 hover:text-red-600',
                NEU_RAISED,
                NEU_PRESS_ON_ACTIVE,
              )}
              aria-label="Log out"
              title="Log out"
            >
              <LogOut className="h-4.5 w-4.5" strokeWidth={1.8} />
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 pb-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
