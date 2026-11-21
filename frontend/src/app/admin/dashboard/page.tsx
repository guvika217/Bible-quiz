"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { authService } from "@/services/authService";
import { quizService } from "@/services/quizService";
import type { User } from "@/types/auth";
import type { Quiz, QuizPerformanceAnalytics } from "@/types/quiz";

export default function AdminDashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryQuizId = searchParams.get("quizId");

  const [user, setUser] = useState<User | null>(null);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState<string>("");
  const [analytics, setAnalytics] = useState<QuizPerformanceAnalytics | null>(null);

  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // 1. Authenticate user & load quiz list
  useEffect(() => {
    let isMounted = true;
    authService
      .getCurrentUser()
      .then((userData) => {
        if (!isMounted) return;
        setUser(userData);
        return quizService.listQuizzes();
      })
      .then((quizList) => {
        if (!isMounted || !quizList) return;
        setQuizzes(quizList);
        // If a query parameter was passed or there is at least one quiz, set active quiz
        if (queryQuizId && quizList.some((q) => q.id === queryQuizId)) {
          setSelectedQuizId(queryQuizId);
        } else if (quizList.length > 0) {
          setSelectedQuizId(quizList[0].id);
        }
        setIsLoadingUser(false);
      })
      .catch(() => {
        if (isMounted) {
          router.replace("/admin/login");
        }
      });

    return () => {
      isMounted = false;
    };
  }, [router, queryQuizId]);

  // 2. Fetch Leaderboard and Performance Graph whenever selectedQuizId changes
  useEffect(() => {
    if (!selectedQuizId) {
      return;
    }

    let isMounted = true;
    quizService
      .getPerformanceAnalytics(selectedQuizId)
      .then((data) => {
        if (isMounted) {
          setAnalytics(data);
          setIsLoadingAnalytics(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load analytics:", err);
        if (isMounted) {
          setIsLoadingAnalytics(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedQuizId]);

  const handleSelectQuiz = (quizId: string) => {
    setSelectedQuizId(quizId);
    if (!quizId) {
      setAnalytics(null);
    } else {
      setIsLoadingAnalytics(true);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await authService.logout();
    } finally {
      router.replace("/admin/login");
    }
  };

  if (isLoadingUser) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Loading Administrator Dashboard...</p>
      </div>
    );
  }

  // Calculate maximum count in distribution for graph scaling
  const maxBucketCount = analytics?.score_distribution
    ? Math.max(...analytics.score_distribution.map((b) => b.count), 1)
    : 1;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
        <div>
          <div className="inline-flex items-center gap-2 mb-1">
            <span
              className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${
                user?.role === "SUPER_ADMIN"
                  ? "bg-amber-100 text-amber-900 border border-amber-200"
                  : "bg-indigo-50 text-indigo-700 border border-indigo-100"
              }`}
            >
              Role: {user?.role}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Leaderboard & Performance Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Signed in as <span className="font-semibold text-slate-700">{user?.name}</span> ({user?.email})
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/quizzes"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition shadow-sm"
          >
            Manage Quizzes
          </Link>
          {user?.role === "SUPER_ADMIN" && (
            <Link
              href="/admin/superadmin"
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-xl transition shadow-sm"
            >
              SuperAdmin
            </Link>
          )}
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition disabled:opacity-50"
          >
            {isLoggingOut ? "Signing Out..." : "Sign Out"}
          </button>
        </div>
      </div>

      {/* Quiz Selector Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Select Bible Quiz:
          </span>
          {quizzes.length > 0 ? (
            <select
              value={selectedQuizId}
              onChange={(e) => handleSelectQuiz(e.target.value)}
              className="px-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {quizzes.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.title} ({q.join_code})
                </option>
              ))}
            </select>
          ) : (
            <span className="text-xs text-slate-500 italic">No quizzes available</span>
          )}
        </div>

        {selectedQuizId && (
          <div className="text-xs text-slate-500">
            Join Code:{" "}
            <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
              {quizzes.find((q) => q.id === selectedQuizId)?.join_code}
            </span>
          </div>
        )}
      </div>

      {quizzes.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300 p-8">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 font-bold text-2xl">
            📊
          </div>
          <h2 className="text-lg font-bold text-slate-900">No quizzes available for analytics</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Create a Bible quiz first to start tracking live participants and leaderboard rankings.
          </p>
          <Link
            href="/admin/quizzes"
            className="mt-5 inline-block px-5 py-2.5 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 transition"
          >
            Create Your First Quiz
          </Link>
        </div>
      ) : isLoadingAnalytics ? (
        <div className="py-20 flex flex-col justify-center items-center gap-3">
          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Fetching leaderboard & performance data...</p>
        </div>
      ) : analytics ? (
        <div className="space-y-8">
          {/* Metrics Overview Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Players</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{analytics.total_participants}</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Highest Score</span>
              <p className="text-2xl font-black text-indigo-600 mt-1">{analytics.highest_score} pts</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Avg Accuracy</span>
              <p className="text-2xl font-black text-emerald-600 mt-1">{analytics.average_accuracy}%</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Avg Duration</span>
              <p className="text-2xl font-black text-slate-800 mt-1">
                {Math.round(analytics.average_duration_seconds)}s
              </p>
            </div>
          </div>

          {/* Performance Graph Section */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between pb-6 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Player Score Distribution</h2>
                <p className="text-xs text-slate-500">Histogram of participants by accuracy percentage</p>
              </div>
              <span className="text-xs font-semibold text-slate-400">Accuracy Bands</span>
            </div>

            {/* CSS / SVG Bar Chart */}
            <div className="mt-8">
              <div className="h-52 flex items-end justify-between gap-3 sm:gap-8 pt-6 pb-2 border-b border-slate-200">
                {analytics.score_distribution.map((bucket) => {
                  const barHeight =
                    bucket.count === 0 ? 4 : Math.round((bucket.count / maxBucketCount) * 100);

                  return (
                    <div
                      key={bucket.range_label}
                      className="flex-1 flex flex-col items-center justify-end h-full group"
                    >
                      <span className="text-xs font-bold text-slate-700 mb-2 opacity-90 group-hover:text-indigo-600 transition">
                        {bucket.count}
                      </span>
                      <div className="w-full max-w-[50px] bg-slate-100 rounded-t-xl overflow-hidden flex items-end">
                        <div
                          style={{ height: `${barHeight}%` }}
                          className="w-full bg-gradient-to-t from-indigo-600 to-violet-500 rounded-t-xl transition-all duration-500 group-hover:from-indigo-700 group-hover:to-violet-600 shadow-sm"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* X-Axis Labels */}
              <div className="flex justify-between gap-3 sm:gap-8 pt-3 text-center">
                {analytics.score_distribution.map((bucket) => (
                  <div key={bucket.range_label} className="flex-1">
                    <span className="text-xs font-semibold text-slate-600">{bucket.range_label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Leaderboard Table Section */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 sm:p-8 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Ranked Player Leaderboard</h2>
                <p className="text-xs text-slate-500">Sorted by total points, time taken, and completion timestamp</p>
              </div>
              <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-100">
                {analytics.top_leaderboard.length} Entries
              </span>
            </div>

            {analytics.top_leaderboard.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                No participant attempts recorded yet for this quiz.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="py-3.5 px-6">Rank</th>
                      <th className="py-3.5 px-6">Participant</th>
                      <th className="py-3.5 px-6">Score</th>
                      <th className="py-3.5 px-6">Accuracy</th>
                      <th className="py-3.5 px-6">Correct / Wrong</th>
                      <th className="py-3.5 px-6">Time Taken</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {analytics.top_leaderboard.map((entry) => (
                      <tr key={entry.attempt_id} className="hover:bg-slate-50/70 transition">
                        <td className="py-4 px-6">
                          <span
                            className={`w-6 h-6 rounded-full inline-flex items-center justify-center font-bold text-xs ${
                              entry.rank === 1
                                ? "bg-amber-100 text-amber-800 border border-amber-300"
                                : entry.rank === 2
                                ? "bg-slate-200 text-slate-700"
                                : entry.rank === 3
                                ? "bg-orange-100 text-orange-800"
                                : "text-slate-500"
                            }`}
                          >
                            {entry.rank}
                          </span>
                        </td>
                        <td className="py-4 px-6 font-semibold text-slate-900">
                          {entry.participant_name}
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-bold text-indigo-600 text-sm">{entry.score}</span>{" "}
                          <span className="text-slate-400">/ {entry.max_score}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                              entry.accuracy_percentage >= 80
                                ? "bg-emerald-50 text-emerald-700"
                                : entry.accuracy_percentage >= 50
                                ? "bg-blue-50 text-blue-700"
                                : "bg-rose-50 text-rose-700"
                            }`}
                          >
                            {entry.accuracy_percentage}%
                          </span>
                        </td>
                        <td className="py-4 px-6 text-slate-600">
                          <span className="text-emerald-600 font-semibold">{entry.correct_count}</span>{" "}
                          / <span className="text-rose-500">{entry.incorrect_count}</span>
                        </td>
                        <td className="py-4 px-6 text-slate-500">
                          {entry.duration_seconds !== null ? `${entry.duration_seconds}s` : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
