"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthContext";

export const Header: React.FC = () => {
  const pathname = usePathname();
  const { user } = useAuth();

  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const isAdmin = user?.role === "ADMIN" || isSuperAdmin;
  const isSuperAdminRoute = pathname.startsWith("/admin/superadmin");

  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
            ✝
          </div>
          <span className="font-bold text-xl text-slate-900 tracking-tight">
            BibleQuiz<span className="text-indigo-600">.Platform</span>
          </span>
        </Link>

        <nav className="flex items-center gap-4 sm:gap-6">
          {isAdmin && (
            <Link
              href="/admin/quizzes"
              className="text-xs sm:text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
            >
              Quizzes
            </Link>
          )}

          {/* Conditional Navbar Pill based on Role & Active Route */}
          {isSuperAdmin ? (
            <div className="flex items-center gap-2">
              <Link
                href="/admin/dashboard"
                className={`text-xs sm:text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                  !isSuperAdminRoute
                    ? "bg-slate-100 text-slate-800"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Admin Panel
              </Link>
              <Link
                href="/admin/superadmin"
                className={`text-xs sm:text-sm font-bold px-3 py-1.5 rounded-lg border shadow-sm transition-all flex items-center gap-1.5 ${
                  isSuperAdminRoute
                    ? "bg-amber-500 text-white border-amber-600 shadow-amber-100"
                    : "bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100"
                }`}
              >
                <span className="text-xs">⚡</span> Super Admin Panel
              </Link>
            </div>
          ) : (
            <Link
              href="/admin/login"
              className="text-xs sm:text-sm font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3.5 py-1.5 rounded-lg border border-indigo-100 transition-colors"
            >
              Admin Portal
            </Link>
          )}

          <a
            href="http://localhost:8000/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs sm:text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors hidden sm:inline"
          >
            API Docs ↗
          </a>
        </nav>
      </div>
    </header>
  );
};
