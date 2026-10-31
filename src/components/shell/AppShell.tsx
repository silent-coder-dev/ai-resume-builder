'use client';

import React, { useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ClipboardCheck,
  FilePenLine,
  Files,
  FolderGit2,
  Gauge,
  Menu as MenuIcon,
  MessagesSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
} from 'lucide-react';
import { usePreferences } from '@/store/usePreferences';
import { Dialog } from '@/components/ui/Dialog';
import { WorkspaceLifecycle } from '@/components/shell/WorkspaceLifecycle';
import { WorkspaceBanners } from '@/components/shell/WorkspaceBanners';

const PRIMARY_NAV = [
  { href: '/builder', label: 'Resume Builder', icon: FilePenLine },
  { href: '/resumes', label: 'My Resumes', icon: Files },
  { href: '/analyzer', label: 'Resume Analyzer', icon: Gauge },
  { href: '/job-match', label: 'Job Matcher', icon: Target },
  { href: '/github', label: 'GitHub Projects', icon: FolderGit2 },
  { href: '/interview', label: 'AI Interview', icon: MessagesSquare },
  { href: '/assessment', label: 'Assessment Center', icon: ClipboardCheck },
];

const SECONDARY_NAV = [
  { href: '/settings', label: 'Settings', icon: Settings },
  { href: '/privacy', label: 'Privacy & Data', icon: ShieldCheck },
];

const subscribeToResize = (onChange: () => void) => {
  window.addEventListener('resize', onChange);
  return () => window.removeEventListener('resize', onChange);
};

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex min-w-0 items-center gap-2.5 rounded-lg" aria-label="AI Resume Studio home">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-white">
        <Sparkles className="h-4 w-4" aria-hidden="true" />
      </span>
      {!compact && <span className="truncate text-body font-semibold text-ink">AI Resume Studio</span>}
    </Link>
  );
}

function NavLinks({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  const renderLink = ({ href, label, icon: Icon }: (typeof PRIMARY_NAV)[number]) => {
    const active = pathname === href || pathname.startsWith(`${href}/`);
    return (
      <li key={href}>
        <Link
          href={href}
          onClick={onNavigate}
          aria-current={active ? 'page' : undefined}
          title={collapsed ? label : undefined}
          className={`flex h-10 items-center gap-3 rounded-lg px-3 text-body font-medium transition-colors duration-200 ${
            active ? 'bg-primary-light text-primary' : 'text-ink-2 hover:bg-surface-2 hover:text-ink'
          } ${collapsed ? 'justify-center px-0' : ''}`}
        >
          <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
          <span className={collapsed ? 'sr-only' : 'truncate'}>{label}</span>
        </Link>
      </li>
    );
  };

  return (
    <nav aria-label="Studio" className="flex flex-1 flex-col justify-between gap-6">
      <ul className="space-y-1">{PRIMARY_NAV.map(renderLink)}</ul>
      <ul className="space-y-1 border-t border-line pt-3">{SECONDARY_NAV.map(renderLink)}</ul>
    </nav>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const storedCollapsed = usePreferences((state) => state.sidebarCollapsed);
  const setPreference = usePreferences((state) => state.setPreference);
  const narrowScreen = useSyncExternalStore(subscribeToResize, () => window.innerWidth < 1280, () => false);
  // Automatic mode: icons only on narrower screens and in the builder, which
  // needs the room for its own section list, form, and preview.
  const collapsed = storedCollapsed ?? (narrowScreen || pathname.startsWith('/builder'));
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-canvas md:flex">
      <a
        href="#main-content"
        className="sr-only z-[100] rounded-lg bg-primary px-4 py-2 text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <WorkspaceLifecycle />

      {/* Desktop and tablet: persistent sidebar that can collapse to icons */}
      <aside
        className={`no-print sticky top-0 hidden h-dvh shrink-0 flex-col gap-6 border-r border-line bg-surface px-3 py-4 transition-[width] duration-200 md:flex ${
          collapsed ? 'w-16' : 'w-60'
        }`}
      >
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between gap-2 px-1'}`}>
          <Logo compact={collapsed} />
          {!collapsed && (
            <button
              type="button"
              onClick={() => setPreference('sidebarCollapsed', true)}
              aria-label="Collapse sidebar"
              className="rounded-lg p-1.5 text-ink-2 hover:bg-surface-2 hover:text-ink"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          )}
        </div>
        {collapsed && (
          <button
            type="button"
            onClick={() => setPreference('sidebarCollapsed', false)}
            aria-label="Expand sidebar"
            className="mx-auto -mt-3 rounded-lg p-1.5 text-ink-2 hover:bg-surface-2 hover:text-ink"
          >
            <PanelLeftOpen className="h-4 w-4" />
          </button>
        )}
        <NavLinks collapsed={collapsed} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Phones: compact top bar with a menu */}
        <header className="no-print sticky top-0 z-40 flex h-14 items-center justify-between border-b border-line bg-surface px-4 md:hidden">
          <Logo />
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open menu"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-ink hover:bg-surface-2"
          >
            <MenuIcon className="h-5 w-5" />
          </button>
        </header>
        <Dialog open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} title="Menu" size="sm">
          <NavLinks collapsed={false} onNavigate={() => setMobileMenuOpen(false)} />
        </Dialog>

        <WorkspaceBanners />
        <main id="main-content" className="print-shell flex min-w-0 flex-1 flex-col">
          {children}
        </main>
      </div>
    </div>
  );
}
