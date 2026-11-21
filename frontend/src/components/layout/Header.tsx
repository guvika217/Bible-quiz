"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "./AuthContext";

export const Header: React.FC = () => {
  const { user } = useAuth();

  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const isAdmin = user?.role === "ADMIN";

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
          {/* Public Leaderboard Shortcut */}
          <Link
            href="/leaderboard"
            className="text-xs sm:text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors flex items-center gap-1"
          >
            <span>🏆</span> Leaderboard
          </Link>

          {/* Quizzes shortcut for logged-in users */}
          {(isAdmin || isSuperAdmin) && (
            <Link
              href="/admin/quizzes"
              className="text-xs sm:text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
            >
              Quizzes
            </Link>
          )}

          {/* Role Pill Display */}
          {isSuperAdmin ? (
            <Link
              href="/admin/superadmin"
              className="text-xs sm:text-sm font-bold px-3.5 py-1.5 rounded-lg border bg-amber-500 text-white border-amber-600 shadow-sm shadow-amber-200 hover:bg-amber-600 transition-all flex items-center gap-1.5"
            >
              <span>⚡</span> Super Admin Panel
            </Link>
          ) : isAdmin ? (
            <Link
              href="/admin/dashboard"
              className="text-xs sm:text-sm font-semibold px-3.5 py-1.5 rounded-lg border bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 transition-colors"
            >
              Admin Panel
            </Link>
          ) : (
            <Link
              href="/admin/login"
              className="text-xs sm:text-sm font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3.5 py-1.5 rounded-lg border border-indigo-100 transition-colors"
            >
              Admin Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
};
