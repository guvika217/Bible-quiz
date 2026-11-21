"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authService } from "@/services/authService";
import type { User } from "@/types/auth";

export default function SuperAdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    let isMounted = true;
    authService
      .getCurrentUser()
      .then((data) => {
        if (!isMounted) return;
        setUser(data);
        if (data.role === "SUPER_ADMIN") {
          setIsAuthorized(true);
        } else {
          // Block regular ADMIN from superadmin route
          setIsAuthorized(false);
        }
        setIsLoading(false);
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

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Verifying SUPER_ADMIN permissions...</p>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white border border-rose-200 rounded-2xl shadow-sm text-center">
        <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-xl">
          ✕
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Access Denied (403)</h2>
        <p className="text-sm text-slate-600 mb-6">
          Your current account role is <span className="font-semibold text-slate-800">{user?.role}</span>.
          This console requires elevated <span className="font-semibold text-rose-600">SUPER_ADMIN</span> privileges.
        </p>
        <Link
          href="/admin/dashboard"
          className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition"
        >
          Return to Admin Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between pb-6 border-b border-slate-100">
          <div>
            <span className="px-3 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-900 border border-amber-200">
              Role: SUPER_ADMIN
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
              Super Administrator Control Center
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Active Session: {user?.name} ({user?.email})
            </p>
          </div>
          <Link
            href="/admin/dashboard"
            className="text-sm text-indigo-600 hover:text-indigo-700 font-semibold"
          >
            ← Admin Dashboard
          </Link>
        </div>

        <div className="py-8">
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-sm text-slate-700 space-y-2">
            <h3 className="font-semibold text-base text-slate-900">Elevated Permissions Confirmed</h3>
            <p>
              Your JWT token passed backend cryptographic signature verification and role claims validation.
              Standard ADMIN accounts are strictly blocked at both the Next.js edge routing layer and FastAPI API level.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
