'use client';

import Link from 'next/link';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';

const NAV_LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#docs', label: 'Docs' },
  { href: '#changelog', label: 'Changelog' },
];

const GITHUB_URL = 'https://github.com/mad-one/template-bmad-auto-cicd';

export function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-purple-900/30 bg-[#0f0a1a]/80 backdrop-blur-md">
      <nav
        className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"
        aria-label="Main navigation"
      >
        {/* Logo */}
        <Link
          href="/"
          aria-label="Template BMAD home"
          className="flex items-center gap-2 text-lg font-bold text-purple-100"
        >
          <span className="text-2xl">🚀</span>
          <span className="hidden sm:inline">Template BMAD</span>
        </Link>

        {/* Desktop nav links */}
        <ul className="hidden items-center gap-8 lg:flex" role="list">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="text-sm text-purple-300 transition-colors hover:text-purple-100"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Desktop CTA */}
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-500 lg:inline-flex"
        >
          Use this template
        </a>

        {/* Mobile hamburger */}
        <Sheet>
          <SheetTrigger
            aria-label="Open navigation menu"
            className="flex h-10 w-10 items-center justify-center rounded-md border border-purple-900/50 text-purple-300 hover:bg-purple-950/40 lg:hidden"
          >
            <svg
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </SheetTrigger>
          <SheetContent side="left" className="bg-[#0f0a1a] border-purple-900/50 w-72">
            <SheetHeader>
              <SheetTitle className="text-purple-100">Navigation</SheetTitle>
            </SheetHeader>
            <ul className="mt-6 flex flex-col gap-4 px-4" role="list">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="block text-base text-purple-300 transition-colors hover:text-purple-100"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
              <li className="mt-4">
                <a
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 px-4 py-2 text-center text-sm font-semibold text-white"
                >
                  Use this template
                </a>
              </li>
            </ul>
          </SheetContent>
        </Sheet>
      </nav>
    </header>
  );
}
