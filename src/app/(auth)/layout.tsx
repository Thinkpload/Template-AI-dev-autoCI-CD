export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f0a1a]">
      <div className="w-full max-w-sm px-4">
        {/* Logo centered — no Navbar in auth pages */}
        <div className="text-center mb-8">
          <span className="text-xl font-bold text-purple-300">YourApp</span>
        </div>
        {children}
      </div>
    </div>
  );
}
