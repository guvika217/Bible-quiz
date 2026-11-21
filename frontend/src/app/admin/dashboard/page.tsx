"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authService } from "@/services/authService";
import type { User } from "@/types/auth";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    let isMounted = true;
    authService
      .getCurrentUser()
      .then((data) => {
        if (isMounted) {
          setUser(data);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          router.replace("/admin/login");
        }
      });

    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await authService.logout();
    } catch {
      // client-side redirect fallback
    } finally {
      router.replace("/admin/login");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Validating administrator session...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">
                JWT Session Active
              </span>
              <span
                className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${
                  user?.role === "SUPER_ADMIN"
                    ? "bg-amber-100 text-amber-900 border border-amber-200"
                    : "bg-blue-100 text-blue-800 border border-blue-200"
                }`}
              >
                Role: {user?.role}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Admin Portal
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Signed in as <span className="font-semibold text-slate-800">{user?.name}</span> ({user?.email})
            </p>
          </div>

          <div className="flex items-center gap-3">
            {user?.role === "SUPER_ADMIN" && (
              <Link
                href="/admin/superadmin"
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
              >
                SuperAdmin Console ↗
              </Link>
            )}
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
            >
              {isLoggingOut ? "Signing Out..." : "Sign Out"}
            </button>
          </div>
        </div>

        <div className="py-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-sm text-slate-600">
            <h2 className="font-semibold text-slate-800 text-base mb-2">URL Route Protection Active</h2>
            <p className="text-xs leading-relaxed text-slate-500">
              Direct access via browser URL address bar to <code>/admin/dashboard</code> or any protected route is automatically blocked at the Next.js Edge Middleware layer if the valid HttpOnly JWT token is missing.
            </p>
          </div>

          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-sm text-slate-600">
            <h2 className="font-semibold text-slate-800 text-base mb-2">Role-Based Access Control (RBAC)</h2>
            <p className="text-xs leading-relaxed text-slate-500">
              Your session holds role claim: <strong className="text-slate-800">{user?.role}</strong>. Endpoints strictly enforce permissions using FastAPI <code>require_role()</code> and block unauthorized access with HTTP 403 Forbidden.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
