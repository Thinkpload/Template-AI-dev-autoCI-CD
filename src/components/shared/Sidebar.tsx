'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main navigation"
      className="flex flex-col h-full bg-[#0f0a1a] border-r border-purple-900/30 px-3 py-4"
    >
      {/* Logo */}
      <div className="px-3 mb-6">
        <span className="text-lg font-bold text-purple-300">YourApp</span>
      </div>
      <ul className="space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive =
            pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-purple-900/40 text-purple-300'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                )}
              >
                <Icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
