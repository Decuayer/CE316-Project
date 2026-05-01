import React from 'react';
import { BarChart3, CircleHelp, FolderKanban, GraduationCap, Settings2 } from 'lucide-react';
import { NavLink } from 'react-router-dom';

import { cn } from '@/lib/utils';

const navigationItems = [
  { label: 'Dashboard', path: '/', icon: BarChart3, end: true },
  { label: 'Projects', path: '/projects', icon: FolderKanban },
  { label: 'Configurations', path: '/configurations', icon: Settings2 },
  { label: 'Help', path: '/help', icon: CircleHelp },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <aside className="flex w-72 shrink-0 flex-col border-r border-border bg-card/70">
        <div className="drag-region flex h-20 items-center gap-3 border-b border-border px-5">
          <div className="flex size-11 items-center justify-center rounded-lg border border-cyan-400/20 bg-cyan-400/10 text-cyan-200">
            <GraduationCap className="size-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-5">CE316 IAE</p>
            <p className="truncate text-xs text-muted-foreground">Assignment evaluation</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-3" aria-label="Main navigation">
          {navigationItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'hover:bg-secondary hover:text-foreground',
                  )
                }
              >
                <Icon className="size-4" aria-hidden="true" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t border-border p-4">
          <div className="rounded-lg border border-border bg-background/40 p-3">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Workspace</p>
            <p className="mt-2 text-sm font-medium">Local desktop mode</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">Project files and results stay on this machine.</p>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="mx-auto min-h-full w-full max-w-7xl px-6 py-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
