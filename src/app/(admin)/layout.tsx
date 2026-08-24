"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAdminAuth } from "@/lib/convex";
import { 
  Shield, 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  Layers, 
  Briefcase, 
  TrendingUp, 
  Zap, 
  Wallet, 
  MessageSquare, 
  Settings, 
  FileText, 
  LogOut, 
  Menu, 
  X,
  Lock
} from "lucide-react";

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { adminUser, token, isLoading, logout } = useAdminAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && (!token || !adminUser)) {
      router.push("/login");
    }
  }, [isLoading, token, adminUser, router]);

  if (isLoading || !adminUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bgWarm">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-brand-600 border-t-transparent animate-spin"></div>
          <p className="text-xs text-textMuted font-medium">Verifying administrator session...</p>
        </div>
      </div>
    );
  }

  const navItems = [
    { name: "Overview", href: "/", icon: LayoutDashboard },
    { name: "Users Management", href: "/users", icon: Users },
    { name: "Programs & Courses", href: "/programs", icon: BookOpen },{ name: "Plans & Bundles", href: "/plans", icon: Layers },
    { name: "Work Marketplace", href: "/work", icon: Briefcase },
    { name: "Affiliate & Sales", href: "/affiliate", icon: TrendingUp },
    { name: "Achievements Builder", href: "/achievements", icon: Zap },
    { name: "Finance & Withdrawals", href: "/finance", icon: Wallet },
    { name: "Communications", href: "/communications", icon: MessageSquare },
    { name: "Platform Settings", href: "/settings", icon: Settings },
    { name: "Audit Trail", href: "/audit-logs", icon: FileText },
  ];

  const isActive = (href: string) => {
    if (href === "/" && pathname === "/") return true;
    if (href !== "/" && pathname.startsWith(href)) return true;
    return false;
  };

  return (
    <div className="min-h-screen flex bg-bgWarm">
      {/* Admin Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#141A17] text-neutral-300 shrink-0 fixed inset-y-0 z-30 border-r border-neutral-800">
        {/* Sidebar Brand */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold text-xs">
              <Shield className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-white leading-none">
                ZetaGrow
              </span>
              <span className="text-[9px] text-brand-400 font-bold uppercase tracking-wider mt-0.5">
                Admin Panel
              </span>
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  active
                    ? "bg-brand-600 text-white font-semibold shadow-sm"
                    : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
                }`}
              >
                <item.icon className={`w-4 h-4 ${active ? "text-white" : "text-neutral-400"}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>

        {/* Sign Out */}
        <div className="p-3 border-t border-neutral-800">
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-red-400 hover:bg-red-950/40 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-borderSubtle sticky top-0 z-20 px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg text-textMuted hover:bg-neutral-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-xs font-semibold text-textMuted hidden sm:inline">
              Administration / <span className="text-textMain">{adminUser.name}</span>
            </span>
          </div>

          <div className="relative">
            <button
              onClick={() => setAdminMenuOpen((o) => !o)}
              onMouseEnter={() => setAdminMenuOpen(true)}
              className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full bg-brand-50 text-brand-700 border border-brand-200 hover:bg-brand-100 transition-colors"
              aria-label="Admin account menu"
            >
              <span className="w-6 h-6 rounded-full bg-brand-700 text-white font-bold flex items-center justify-center text-[11px] shrink-0">
                {adminUser.name.charAt(0).toUpperCase()}
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider">
                {adminUser.role.replace(/_/g, " ")}
              </span>
            </button>

            {adminMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setAdminMenuOpen(false)}
                ></div>
                <div
                  onMouseLeave={() => setAdminMenuOpen(false)}
                  className="absolute right-0 top-full mt-2 w-72 z-40 bg-white rounded-xl shadow-xl border border-borderSubtle p-4"
                >
                  <div className="flex items-center gap-3 pb-3 border-b border-borderSubtle">
                    <div className="w-10 h-10 rounded-full bg-brand-700 text-white font-bold flex items-center justify-center text-sm shrink-0">
                      {adminUser.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-textMain truncate">{adminUser.name}</p>
                      <p className="text-xs text-textMuted truncate">{adminUser.email}</p>
                    </div>
                  </div>
                  <div className="py-3 border-b border-borderSubtle space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-textMuted">Role</span>
                      <span className="font-bold text-brand-700 uppercase tracking-wider">
                        {adminUser.role.replace(/_/g, " ")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-textMuted">Email</span>
                      <span className="font-semibold text-textMain truncate ml-3">
                        {adminUser.email}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={logout}
                    className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          ></div>
          <div className="relative w-64 bg-[#141A17] text-neutral-300 flex flex-col h-full shadow-2xl">
            <div className="h-16 px-6 flex items-center justify-between border-b border-neutral-800">
              <span className="font-bold text-white text-base">ZetaGrow Admin</span>
              <button onClick={() => setMobileMenuOpen(false)} className="p-1 text-neutral-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium ${
                    isActive(item.href)
                      ? "bg-brand-600 text-white font-semibold"
                      : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
