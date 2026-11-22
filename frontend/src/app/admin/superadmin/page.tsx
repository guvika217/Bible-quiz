"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authService } from "@/services/authService";
import { superAdminService, type SystemStats } from "@/services/superAdminService";
import type { User } from "@/types/auth";

export default function SuperAdminDashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    authService
      .getCurrentUser()
      .then((user) => {
        if (!isMounted) return;
        setCurrentUser(user);

        if (user.role !== "SUPER_ADMIN") {
          setIsAuthorized(false);
          setIsLoading(false);
          return null;
        }

        setIsAuthorized(true);
        return Promise.all([
          superAdminService.getSystemStats(),
          superAdminService.listUsers(),
        ]);
      })
      .then((results) => {
        if (!isMounted || !results) return;
        const [statsData, usersData] = results;
        setStats(statsData);
        setUsersList(usersData);
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

  const handleRoleToggle = async (targetUser: User) => {
    const newRole = targetUser.role === "SUPER_ADMIN" ? "ADMIN" : "SUPER_ADMIN";
    setUpdatingId(targetUser.id);
    setActionMessage(null);

    try {
      await superAdminService.updateUserRole(targetUser.id, newRole);
      setUsersList((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, role: newRole } : u))
      );
      setActionMessage(`Updated ${targetUser.name}'s role to ${newRole}`);
    } catch {
      setActionMessage("Failed to update user role");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleStatusChange = async (targetUser: User, newStatus: "ACTIVE" | "INACTIVE" | "SUSPENDED") => {
    setUpdatingId(targetUser.id);
    setActionMessage(null);

    try {
      await superAdminService.updateAccountStatus(targetUser.id, newStatus);
      setUsersList((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, account_status: newStatus } : u))
      );
      setActionMessage(`Updated ${targetUser.name}'s status to ${newStatus}`);
    } catch {
      setActionMessage("Failed to update user status");
    } finally {
      setUpdatingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-4 border-amber-300 border-t-amber-600 rounded-full animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Validating SuperAdmin credentials...</p>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white border border-rose-200 rounded-3xl shadow-sm text-center">
        <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-xl">
          ✕
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Access Denied (403)</h2>
        <p className="text-sm text-slate-600 mb-6">
          Your role is <span className="font-semibold text-slate-800">{currentUser?.role}</span>.
          Access to the SuperAdmin Control Center is restricted.
        </p>
        <Link
          href="/admin/dashboard"
          className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition"
        >
          Return to Admin Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
        <div>
          <div className="inline-flex items-center gap-2 mb-1">
            <span className="px-3 py-0.5 text-xs font-black rounded-full bg-amber-100 text-amber-900 border border-amber-300 tracking-wide uppercase">
              ⚡ Role: SUPER_ADMIN
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Super Admin Control Center
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Active Administrator: <span className="font-semibold text-slate-800">{currentUser?.name}</span> ({currentUser?.email})
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/quizzes"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition shadow-sm"
          >
            Manage Quizzes
          </Link>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs font-medium animate-in fade-in">
          {actionMessage}
        </div>
      )}

      {/* Global Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Admins</span>
            <p className="text-2xl font-black text-slate-900 mt-1">{stats.total_admins}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Super Admins</span>
            <p className="text-2xl font-black text-amber-600 mt-1">{stats.total_super_admins}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Quizzes</span>
            <p className="text-2xl font-black text-indigo-600 mt-1">{stats.total_quizzes}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Questions Bank</span>
            <p className="text-2xl font-black text-emerald-600 mt-1">{stats.total_questions}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Attempts</span>
            <p className="text-2xl font-black text-slate-800 mt-1">{stats.total_attempts}</p>
          </div>
        </div>
      )}

      {/* Admin User Management Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 sm:p-8 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Administrator Roster & Roles</h2>
            <p className="text-xs text-slate-500">Manage administrator privileges and account lifecycle</p>
          </div>
          <span className="text-xs font-semibold bg-amber-50 text-amber-800 px-3 py-1 rounded-full border border-amber-200">
            {usersList.length} Accounts
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-6">Administrator</th>
                <th className="py-3.5 px-6">Current Role</th>
                <th className="py-3.5 px-6">Account Status</th>
                <th className="py-3.5 px-6">Verified</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {usersList.map((u) => {
                const isSelf = u.id === currentUser?.id;
                const isUpdating = updatingId === u.id;

                return (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900">{u.name}</div>
                      <div className="text-slate-400 text-xs">{u.email}</div>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          u.role === "SUPER_ADMIN"
                            ? "bg-amber-100 text-amber-900 border border-amber-300"
                            : "bg-indigo-50 text-indigo-700 border border-indigo-100"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <select
                        disabled={isSelf || isUpdating}
                        value={u.account_status}
                        onChange={(e) =>
                          handleStatusChange(
                            u,
                            e.target.value as "ACTIVE" | "INACTIVE" | "SUSPENDED"
                          )
                        }
                        className="px-2 py-1 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:opacity-50"
                      >
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="INACTIVE">INACTIVE</option>
                        <option value="SUSPENDED">SUSPENDED</option>
                      </select>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center gap-1 font-semibold ${
                          u.email_verified ? "text-emerald-600" : "text-slate-400"
                        }`}
                      >
                        {u.email_verified ? "✓ Verified" : "Unverified"}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      {isSelf ? (
                        <span className="text-xs text-slate-400 italic">Current Session</span>
                      ) : (
                        <button
                          disabled={isUpdating}
                          onClick={() => handleRoleToggle(u)}
                          className="px-3 py-1.5 rounded-lg border text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border-slate-200 transition disabled:opacity-50"
                        >
                          {isUpdating
                            ? "Updating..."
                            : u.role === "SUPER_ADMIN"
                            ? "Demote to ADMIN"
                            : "Promote to SUPER_ADMIN"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
