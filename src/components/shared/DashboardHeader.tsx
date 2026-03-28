'use client';

import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Sidebar } from './Sidebar';
import { DashboardBreadcrumb } from './Breadcrumb';
import { useSidebar } from '@/hooks/useSidebar';

export function DashboardHeader() {
  const { open, setOpen, triggerRef } = useSidebar();

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-purple-900/30 bg-[#0f0a1a]/90 backdrop-blur px-4 sm:px-6">
      {/* Mobile hamburger — hidden on desktop */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          ref={triggerRef}
          className="lg:hidden"
          aria-label="Open navigation menu"
          render={
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" aria-hidden="true" />
            </Button>
          }
        />
        <SheetContent side="left" className="w-64 p-0 bg-[#0f0a1a]">
          <Sidebar />
        </SheetContent>
      </Sheet>

      <DashboardBreadcrumb />
    </header>
  );
}
