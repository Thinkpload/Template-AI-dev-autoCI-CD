import { Sidebar } from '@/components/shared/Sidebar';
import { DashboardHeader } from '@/components/shared/DashboardHeader';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#0f0a1a]">
      {/* Desktop sidebar — hidden below lg */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <Sidebar />
      </aside>
      {/* Main content — offset by sidebar width on desktop */}
      <div className="flex flex-col flex-1 lg:pl-64">
        <DashboardHeader />
        <main id="main-content" className="flex-1 px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
