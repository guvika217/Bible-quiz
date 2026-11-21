"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "./AuthContext";

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isHoveringSignOut, setIsHoveringSignOut] = useState(false);
  const [isHoveringLogin, setIsHoveringLogin] = useState(false);

  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const isAdmin = user?.role === "ADMIN";
  const isQuizPage = pathname === "/quiz" || pathname.startsWith("/quiz/");

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setDropdownOpen(false);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
      router.replace("/admin/login");
    }
  };

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
          {/* Public Leaderboard Shortcut - hidden on quiz gameplay */}
          {!isQuizPage && (
            <Link
              href="/leaderboard"
              className="text-xs sm:text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors flex items-center gap-1"
            >
              <span>🏆</span> Leaderboard
            </Link>
          )}

          {/* Quizzes shortcut for logged-in users - hidden on quiz gameplay */}
          {!isQuizPage && (isAdmin || isSuperAdmin) && (
            <Link
              href="/admin/quizzes"
              className="text-xs sm:text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
            >
              Quizzes
            </Link>
          )}

          {/* On Quiz Page: Clean focused participant mode without admin login/controls */}
          {isQuizPage ? (
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Quiz Session
              </span>
            </div>
          ) : user ? (
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Role Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setDropdownOpen((prev) => !prev)}
                  className={`text-xs sm:text-sm font-bold px-3.5 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
                    isSuperAdmin
                      ? "bg-amber-500 text-white border-amber-600 hover:bg-amber-600 shadow-amber-200"
                      : "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
                  }`}
                >
                  <span>{isSuperAdmin ? "⚡ Super Admin" : "🛡️ Admin"}</span>
                  <svg
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      dropdownOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs font-medium text-slate-400">Signed in as</p>
                      <p className="text-xs font-bold text-slate-800 truncate">{user.name || user.email}</p>
                      <span
                        className={`inline-block mt-1 px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider ${
                          isSuperAdmin
                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                            : "bg-indigo-50 text-indigo-700 border border-indigo-100"
                        }`}
                      >
                        {user.role}
                      </span>
                    </div>

                    <div className="py-1">
                      <Link
                        href="/admin/dashboard"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                      >
                        <span>📊</span> Admin Dashboard
                      </Link>

                      <Link
                        href="/admin/quizzes"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                      >
                        <span>📝</span> Manage Quizzes
                      </Link>

                      {isSuperAdmin && (
                        <Link
                          href="/admin/superadmin"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-50 transition-colors"
                        >
                          <span>⚡</span> SuperAdmin Console
                        </Link>
                      )}
                    </div>

                    <div className="border-t border-slate-100 pt-1">
                      <button
                        type="button"
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        onMouseEnter={() => setIsHoveringSignOut(true)}
                        onMouseLeave={() => setIsHoveringSignOut(false)}
                        className="w-full text-left flex items-center justify-between px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm inline-block transition-transform duration-200">
                            {isLoggingOut ? "🚪" : isHoveringSignOut ? "🚪" : "🚪"}
                          </span>
                          <span>{isLoggingOut ? "Signing Out..." : "Sign Out"}</span>
                        </div>
                        <span className="text-xs text-rose-400">
                          {isHoveringSignOut ? "👋" : "➔"}
                        </span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Navbar Sign Out with Animated Opening/Closing Door Emoji */}
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                onMouseEnter={() => setIsHoveringSignOut(true)}
                onMouseLeave={() => setIsHoveringSignOut(false)}
                title="Sign out"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-lg transition-all shadow-sm"
              >
                <span className="text-sm inline-block transition-transform duration-200">
                  {isLoggingOut ? "🚪" : isHoveringSignOut ? "🚪" : "🚪"}
                </span>
                <span className="hidden sm:inline">
                  {isLoggingOut ? "Leaving..." : "Sign Out"}
                </span>
              </button>
            </div>
          ) : (
            /* Sign In Link with Animated Lock/Unlock Emoji */
            <Link
              href="/admin/login"
              onMouseEnter={() => setIsHoveringLogin(true)}
              onMouseLeave={() => setIsHoveringLogin(false)}
              className="text-xs sm:text-sm font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3.5 py-1.5 rounded-lg border border-indigo-200 transition-all flex items-center gap-1.5 shadow-sm"
            >
              <span className="text-sm inline-block transition-transform duration-200">
                {isHoveringLogin ? "🔓" : "🔐"}
              </span>
              <span>Admin Login</span>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
};
