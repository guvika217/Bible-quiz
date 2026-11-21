"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/authService";
import type { User } from "@/types/auth";

export default function AdminDashboardPlaceholder() {
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
        // Unauthenticated access -> Redirect to Login
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
      // Continue cleanup on client
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
                Authenticated Session Active
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Admin Portal
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Signed in as <span className="font-semibold text-slate-800">{user?.name}</span> ({user?.email})
            </p>
          </div>

          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
          >
            {isLoggingOut ? "Signing Out..." : "Sign Out"}
          </button>
        </div>

        <div className="py-8">
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-sm text-slate-600">
            <h2 className="font-semibold text-slate-800 text-base mb-2">Authentication Verification Successful</h2>
            <p>
              You have successfully completed the authentication handshake via secure HttpOnly session cookies.
              Protected dashboard functionalities and quiz management modules will be implemented in subsequent phases.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
