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
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-indigo-100">
            ✝
          </div>
          <span className="font-extrabold text-xl text-slate-900 tracking-tight">
            Bible Quiz
          </span>
        </Link>

        {/* Navigation Section */}
        <nav className="flex items-center gap-3 sm:gap-5">
          {/* Active Quiz Focus View (No Distractions) */}
          {isQuizPage ? (
            <div className="flex items-center gap-2">
              <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-2 shadow-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Quiz Session
              </span>
            </div>
          ) : (
            <>
              {/* Primary Direct Links */}
              <Link
                href="/leaderboard"
                className={`text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg ${
                  pathname === "/leaderboard"
                    ? "text-indigo-600 bg-indigo-50"
                    : "text-slate-600 hover:text-indigo-600 hover:bg-slate-50"
                }`}
              >
                <span>🏆</span>
                <span>Leaderboard</span>
              </Link>

              {(isAdmin || isSuperAdmin) && (
                <>
                  <Link
                    href="/admin/quizzes"
                    className={`text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg ${
                      pathname.startsWith("/admin/quizzes")
                        ? "text-indigo-600 bg-indigo-50 font-bold"
                        : "text-slate-600 hover:text-indigo-600 hover:bg-slate-50"
                    }`}
                  >
                    <span>📝</span>
                    <span>Quizzes</span>
                  </Link>

                  <Link
                    href="/admin/dashboard"
                    className={`text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg ${
                      pathname === "/admin/dashboard"
                        ? "text-indigo-600 bg-indigo-50 font-bold"
                        : "text-slate-600 hover:text-indigo-600 hover:bg-slate-50"
                    }`}
                  >
                    <span>📊</span>
                    <span>Dashboard</span>
                  </Link>

                  {isSuperAdmin && (
                    <Link
                      href="/admin/superadmin"
                      className={`text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg ${
                        pathname === "/admin/superadmin"
                          ? "text-indigo-600 bg-indigo-50 font-bold"
                          : "text-slate-600 hover:text-indigo-600 hover:bg-slate-50"
                      }`}
                    >
                      <span>👥</span>
                      <span>Users</span>
                    </Link>
                  )}
                </>
              )}

              {/* User Profile / Role Pill + Account Menu */}
              {user ? (
                <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 border-l border-slate-200">
                  <div className="relative" ref={dropdownRef}>
                    <button
                      type="button"
                      onClick={() => setDropdownOpen((prev) => !prev)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
                        isSuperAdmin
                          ? "bg-amber-500 text-white border-amber-600 hover:bg-amber-600"
                          : "bg-indigo-600 text-white border-indigo-700 hover:bg-indigo-700"
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

                    {/* Clean Dropdown */}
                    {dropdownOpen && (
                      <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                        <div className="px-4 py-2.5 border-b border-slate-100">
                          <p className="text-[11px] font-medium text-slate-400">Signed in as</p>
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
                            href="/admin/quizzes"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                          >
                            <span>📝</span> Manage Quizzes
                          </Link>
                          <Link
                            href="/admin/dashboard"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                          >
                            <span>📊</span> Performance Dashboard
                          </Link>
                          {isSuperAdmin && (
                            <Link
                              href="/admin/superadmin"
                              onClick={() => setDropdownOpen(false)}
                              className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-50 hover:text-amber-800 transition-colors"
                            >
                              <span>⚡</span> Super Admin Users
                            </Link>
                          )}
                        </div>

                        <div className="border-t border-slate-100 pt-1">
                          <button
                            type="button"
                            onClick={handleLogout}
                            disabled={isLoggingOut}
                            className="w-full text-left flex items-center gap-2 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
                          >
                            <span>🚪</span>
                            <span>{isLoggingOut ? "Signing Out..." : "Sign Out"}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Direct Sign Out Button */}
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    onMouseEnter={() => setIsHoveringSignOut(true)}
                    onMouseLeave={() => setIsHoveringSignOut(false)}
                    title="Sign Out"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-lg transition-all shadow-sm"
                  >
                    <span className="text-sm inline-block transition-transform duration-200">
                      {isLoggingOut ? "🚪" : isHoveringSignOut ? "🚪" : "🔒"}
                    </span>
                    <span className="hidden sm:inline">
                      {isLoggingOut ? "Leaving..." : "Sign Out"}
                    </span>
                  </button>
                </div>
              ) : (
                /* Unauthenticated View */
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
            </>
          )}
        </nav>
      </div>
    </header>
  );
};
