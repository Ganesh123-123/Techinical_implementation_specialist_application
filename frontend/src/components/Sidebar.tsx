import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  UserPlus,
  CheckSquare,
  Truck,
  Users,
  Workflow,
  Sparkles,
  BookOpen,
  Settings,
  Compass,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Client Projects', href: '/projects', icon: FolderKanban },
  { name: 'Leads', href: '/leads', icon: UserPlus },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare },
  { name: 'Vendors & Procurement', href: '/vendors', icon: Truck },
  { name: 'Design Team', href: '/team', icon: Users },
  { name: 'Automation Workflow', href: '/automation-workflow', icon: Workflow },
  { name: 'Lead Data Cleaning', href: '/data-cleaning', icon: Sparkles },
  { name: 'ClickUp Setup Guide', href: '/clickup-guide', icon: BookOpen },
  { name: 'Settings & Rules', href: '/settings', icon: Settings },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const content = (isMobile = false) => (
    <>
      {/* Brand Header */}
      <div className="p-5 sm:p-6 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20 shrink-0">
            <Compass className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="font-bold text-white text-base leading-tight tracking-tight">
              Sunrise Interiors
            </h1>
            <p className="text-[11px] text-amber-400 font-medium tracking-wide uppercase mt-0.5">
              Bengaluru Studio
            </p>
          </div>
        </div>

        {isMobile && (
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            aria-label="Close menu"
          >
            <span className="text-xl font-bold leading-none">&times;</span>
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
          Studio Operations
        </div>
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={() => {
                if (isMobile && onClose) onClose();
              }}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-semibold shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
              <span className="truncate">{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* System Status Footer */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 m-3 rounded-2xl">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-medium text-slate-300">Live System Online</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          FastAPI + SQLite Active
          <br />
          Bengaluru Studio Operations
        </p>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex w-64 bg-slate-900 text-slate-300 flex-col shrink-0 min-h-screen border-r border-slate-800 select-none sticky top-0 h-screen">
        {content(false)}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Mobile Slide-over Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 select-none shadow-2xl transition-transform duration-300 ease-in-out lg:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'
        }`}
      >
        {content(true)}
      </aside>
    </>
  );
};
