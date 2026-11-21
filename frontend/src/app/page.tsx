"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { healthService } from "@/services/healthService";
import { StatusBadge } from "@/components/common/StatusBadge";
import type { HealthCheckResponse } from "@/types/api";

export default function HomePage() {
  const [health, setHealth] = useState<HealthCheckResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    healthService
      .getHealth()
      .then((data) => {
        if (isMounted) {
          setHealth(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || "Failed to reach backend API");
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 mb-6">
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
            Scripture Trivia & Live Competitions
          </span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Interactive <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
            Bible Quiz Platform
          </span>
        </h1>
        <p className="mt-4 text-lg text-slate-600 leading-relaxed">
          Test and grow your scriptural knowledge with timed rounds, live leaderboards,
          and deep player performance analytics across Old and New Testament studies.
        </p>

        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/admin/login"
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md transition"
          >
            Admin Portal & Leaderboards
          </Link>
          <a
            href="http://localhost:8000/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl transition"
          >
            Explore API Docs
          </a>
        </div>
      </div>

      {/* Backend Connection Live Card */}
      <div className="mt-14 max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
          <div>
            <h2 className="text-base font-semibold text-slate-900">System API Connectivity</h2>
            <p className="text-xs text-slate-500">Service: FastAPI & Cloudflare D1</p>
          </div>
          <div>
            {isLoading ? (
              <StatusBadge status="loading" label="CHECKING..." />
            ) : health?.status === "healthy" ? (
              <StatusBadge status="healthy" label="CONNECTED" />
            ) : (
              <StatusBadge status="error" label="UNREACHABLE" />
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="py-8 flex justify-center items-center text-slate-400 text-sm">
            Verifying connection to Python backend...
          </div>
        ) : health ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <span className="text-xs text-slate-500 font-medium">Status</span>
              <p className="text-sm font-semibold text-emerald-600 capitalize">{health.status}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <span className="text-xs text-slate-500 font-medium">Environment</span>
              <p className="text-sm font-semibold text-slate-800 capitalize">{health.environment}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <span className="text-xs text-slate-500 font-medium">API Version</span>
              <p className="text-sm font-semibold text-slate-800">v{health.version}</p>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm">
            <p className="font-semibold">Backend Offline or Blocked:</p>
            <p className="text-xs mt-1 text-rose-700">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
