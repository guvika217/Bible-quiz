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
  const [quizSearchInput, setQuizSearchInput] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [analytics, setAnalytics] = useState<QuizPerformanceAnalytics | null>(null);

  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [deletingAttemptId, setDeletingAttemptId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

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

  // 2. Load Analytics whenever selectedQuizId changes
  useEffect(() => {
    if (!selectedQuizId) return;

    let isMounted = true;
    quizService
      .getPerformanceAnalytics(selectedQuizId)
      .then((data) => {
        if (isMounted) {
          setAnalytics(data);
          setIsLoadingAnalytics(false);
        }
      })
      .catch(() => {
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
    if (quizId) {
      setIsLoadingAnalytics(true);
    }
  };

  // Delete participant attempt to give them a second chance / reset IP lock
  const handleDeleteAttempt = async (attemptId: string, participantName: string) => {
    if (!window.confirm(`Delete attempt for "${participantName}"? This will allow them to retake the quiz from their IP.`)) {
      return;
    }

    setDeletingAttemptId(attemptId);
    setActionMessage(null);
    try {
      await quizService.deleteAttempt(attemptId);
      setActionMessage(`Attempt for "${participantName}" deleted. They may now retake the quiz.`);
      // Reload analytics for current quiz
      if (selectedQuizId) {
        const fresh = await quizService.getPerformanceAnalytics(selectedQuizId);
        setAnalytics(fresh);
      }
    } catch {
      setActionMessage("Failed to delete attempt. Please try again.");
    } finally {
      setDeletingAttemptId(null);
    }
  };

  // CSV Export feature for competitions
  const handleExportCSV = () => {
    if (!analytics || analytics.top_leaderboard.length === 0) return;

    const headers = [
      "Rank",
      "Participant Name",
      "Score",
      "Max Score",
      "Accuracy Percentage",
      "Correct Answers",
      "Incorrect Answers",
      "Total Time (Sec)",
      "Avg Time (Sec)",
      "Security Warnings",
      "Completion Status",
      "Submitted At",
    ];

    const rows = analytics.top_leaderboard.map((entry) => [
      entry.rank,
      `"${entry.participant_name.replace(/"/g, '""')}"`,
      entry.score,
      entry.max_score,
      `${entry.accuracy_percentage}%`,
      entry.correct_count,
      entry.incorrect_count,
      entry.total_time_seconds,
      entry.avg_time_seconds,
      entry.warning_count,
      entry.completion_status,
      entry.completed_at || "",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `quiz_${selectedQuizId}_standings.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoadingUser) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Loading Administrator Dashboard...</p>
      </div>
    );
  }

  const selectedQuiz = quizzes.find((q) => q.id === selectedQuizId);

  // Filter leaderboard by search query & security status
  const filteredLeaderboard = analytics?.top_leaderboard.filter((entry) => {
    const matchesSearch = entry.participant_name
      .toLowerCase()
      .includes(searchQuery.toLowerCase().trim());
    const matchesStatus =
      statusFilter === "all"
        ? true
        : statusFilter === "clean"
        ? entry.warning_count === 0 && entry.completion_status !== "disqualified"
        : statusFilter === "flagged"
        ? entry.warning_count > 0 && entry.completion_status !== "disqualified"
        : entry.completion_status === "disqualified";
    return matchesSearch && matchesStatus;
  }) || [];

  const maxBucketCount = analytics?.score_distribution
    ? Math.max(...analytics.score_distribution.map((b) => b.count), 1)
    : 1;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 mb-2">
            <span
              className={`px-3 py-1 text-xs font-bold rounded-full border ${
                user?.role === "SUPER_ADMIN"
                  ? "bg-amber-100 text-amber-900 border-amber-300"
                  : "bg-indigo-50 text-indigo-700 border-indigo-200"
              }`}
            >
              Role: {user?.role}
            </span>
            <span className="text-xs text-slate-400">• Cloudflare D1 Live Sync</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Analytics & Operations Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time speed scores, anti-cheat surveillance, and contestant breakdown.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Link
            href="/admin/quizzes"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-1.5"
          >
            <span>📝</span> Manage Quizzes
          </Link>
          <Link
            href="/leaderboard"
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
          >
            <span>🏆</span> Public Hall
          </Link>
          {user?.role === "SUPER_ADMIN" && (
            <Link
              href="/admin/superadmin"
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-1.5"
            >
              <span>⚡</span> Super Admin Users
            </Link>
          )}
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={!analytics || analytics.top_leaderboard.length === 0}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
          >
            <span>📥</span> Export CSV
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 text-xs font-semibold flex items-center justify-between animate-in fade-in">
          <span>✓ {actionMessage}</span>
          <button
            onClick={() => setActionMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Quiz Selector & Quick Details Banner with Name / ID Search */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap flex-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
            Select Competition:
          </span>

          {/* Quick Search Quiz by Name or ID */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-xs">
              🔍
            </span>
            <input
              type="text"
              value={quizSearchInput}
              onChange={(e) => setQuizSearchInput(e.target.value)}
              placeholder="Search quiz name, ID, or code..."
              className="pl-8 pr-4 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 w-52 sm:w-64"
            />
            {quizSearchInput && (
              <button
                onClick={() => setQuizSearchInput("")}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>

          {quizzes.length > 0 ? (
            <select
              value={selectedQuizId}
              onChange={(e) => handleSelectQuiz(e.target.value)}
              className="px-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 max-w-xs truncate"
            >
              {quizzes
                .filter((q) => {
                  const s = quizSearchInput.toLowerCase().trim();
                  if (!s) return true;
                  return (
                    q.title.toLowerCase().includes(s) ||
                    q.id.toLowerCase().includes(s) ||
                    q.join_code.toLowerCase().includes(s)
                  );
                })
                .map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.title} ({q.join_code}) • {q.status.toUpperCase()}
                  </option>
                ))}
            </select>
          ) : (
            <span className="text-xs text-slate-500 italic">No quizzes available</span>
          )}
        </div>

        {selectedQuiz && (
          <div className="flex items-center gap-3 text-xs font-semibold flex-wrap">
            <span className="text-slate-500">
              Join Code:{" "}
              <strong className="font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                {selectedQuiz.join_code}
              </strong>
            </span>
            <span className="text-slate-400 hidden sm:inline">|</span>
            <span className="text-slate-500 font-mono text-[11px] truncate max-w-[120px]" title={selectedQuiz.id}>
              ID: {selectedQuiz.id.slice(0, 8)}...
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full uppercase text-[11px] font-bold ${
                selectedQuiz.status === "active"
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              ● {selectedQuiz.status}
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
          <p className="text-xs text-slate-500 font-medium">Fetching real-time analytics...</p>
        </div>
      ) : analytics ? (
        <div className="space-y-8">
          {/* 4 Metric KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Contestants</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-black text-slate-900">{analytics.total_participants}</span>
                <span className="text-xs text-slate-400 font-semibold">players</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">All submitted attempts</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Highest Score</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-black text-indigo-600">{analytics.highest_score}</span>
                <span className="text-xs text-indigo-400 font-semibold">pts</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">Speed-weighted champion</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Average Accuracy</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-black text-emerald-600">{analytics.average_accuracy}%</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">Overall question correctness</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Average Duration</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-black text-slate-800">
                  {Math.round(analytics.average_duration_seconds)}s
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">Mean response pace</p>
            </div>
          </div>

          {/* Two-Column Analytics Section: Idea 4 (Olympic Podium) + Idea 7 (Grade Curve Bell) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Widget 1: Top 3 Olympic Podium Spotlight Cards */}
            <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span>🏆</span> Top 3 Champions Podium
                  </h2>
                  <p className="text-xs text-slate-500">
                    Spotlight winners filtered by quiz and verified performance
                  </p>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg border border-amber-200 uppercase tracking-wider">
                  Medalists
                </span>
              </div>

              {filteredLeaderboard.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No verified contestants available for this competition yet.
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:gap-4 items-end pt-4 pb-2">
                  {/* Silver Medalist (2nd Place) */}
                  <div className="flex flex-col items-center">
                    {filteredLeaderboard[1] ? (
                      <div className="w-full flex flex-col items-center">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-200 to-slate-100 border-2 border-slate-300 shadow flex items-center justify-center text-xl mb-2">
                          🥈
                        </div>
                        <p className="text-xs font-bold text-slate-800 text-center truncate max-w-[90px] sm:max-w-[120px]">
                          {filteredLeaderboard[1].participant_name}
                        </p>
                        <p className="text-sm font-extrabold text-slate-700 mt-0.5">
                          {filteredLeaderboard[1].score.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">pts</span>
                        </p>
                        <p className="text-[10px] font-semibold text-emerald-600">
                          {filteredLeaderboard[1].accuracy_percentage}% acc
                        </p>
                        <div className="w-full bg-slate-100 border-t-4 border-slate-300 rounded-t-2xl py-3 mt-3 text-center">
                          <span className="text-xs font-black text-slate-500">2nd Place</span>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full text-center py-6 border border-dashed border-slate-200 rounded-2xl text-[11px] text-slate-400">
                        🥈 Empty
                      </div>
                    )}
                  </div>

                  {/* Gold Medalist (1st Place) */}
                  <div className="flex flex-col items-center -mt-4">
                    {filteredLeaderboard[0] ? (
                      <div className="w-full flex flex-col items-center">
                        <div className="relative">
                          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-300 to-yellow-100 border-2 border-amber-400 shadow-md flex items-center justify-center text-3xl mb-2 animate-bounce">
                            🥇
                          </div>
                          <span className="absolute -top-1 -right-1 text-xs">👑</span>
                        </div>
                        <p className="text-xs font-black text-slate-900 text-center truncate max-w-[100px] sm:max-w-[140px]">
                          {filteredLeaderboard[0].participant_name}
                        </p>
                        <p className="text-base font-black text-indigo-600 mt-0.5">
                          {filteredLeaderboard[0].score.toLocaleString()} <span className="text-[10px] text-indigo-400 font-normal">pts</span>
                        </p>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600">
                          <span>{filteredLeaderboard[0].accuracy_percentage}%</span>
                          <span className="text-slate-300">•</span>
                          <span className="font-mono text-slate-500">{filteredLeaderboard[0].total_time_seconds}s</span>
                        </div>
                        <div className="w-full bg-gradient-to-t from-amber-100 to-amber-50 border-t-4 border-amber-400 rounded-t-2xl py-5 mt-3 text-center shadow-inner">
                          <span className="text-xs font-black text-amber-800 tracking-wider uppercase">1st Champion</span>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full text-center py-8 border border-dashed border-amber-200 rounded-2xl text-[11px] text-amber-500">
                        🥇 No Competitor
                      </div>
                    )}
                  </div>

                  {/* Bronze Medalist (3rd Place) */}
                  <div className="flex flex-col items-center">
                    {filteredLeaderboard[2] ? (
                      <div className="w-full flex flex-col items-center">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-700/20 to-orange-100 border-2 border-amber-600/40 shadow flex items-center justify-center text-xl mb-2">
                          🥉
                        </div>
                        <p className="text-xs font-bold text-slate-800 text-center truncate max-w-[90px] sm:max-w-[120px]">
                          {filteredLeaderboard[2].participant_name}
                        </p>
                        <p className="text-sm font-extrabold text-slate-700 mt-0.5">
                          {filteredLeaderboard[2].score.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">pts</span>
                        </p>
                        <p className="text-[10px] font-semibold text-emerald-600">
                          {filteredLeaderboard[2].accuracy_percentage}% acc
                        </p>
                        <div className="w-full bg-amber-50/60 border-t-4 border-amber-600/40 rounded-t-2xl py-2 mt-3 text-center">
                          <span className="text-xs font-black text-amber-900/70">3rd Place</span>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full text-center py-6 border border-dashed border-slate-200 rounded-2xl text-[11px] text-slate-400">
                        🥉 Empty
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Widget 2: Score Percentile & Grade Curve (A, B, C, D, Fail) */}
            <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span>📊</span> Score Percentile & Grade Curve
                  </h2>
                  <p className="text-xs text-slate-500">
                    Grading distribution curve across all submitted test attempts
                  </p>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-200 uppercase tracking-wider">
                  Academic Standard
                </span>
              </div>

              {(() => {
                // Compute A, B, C, D, Fail breakdown based on leaderboard accuracy
                const grades = {
                  A: { count: 0, label: "Grade A (90-100%)", desc: "Mastery Level", color: "from-emerald-500 to-teal-500", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
                  B: { count: 0, label: "Grade B (75-89%)", desc: "Proficient", color: "from-blue-500 to-indigo-500", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
                  C: { count: 0, label: "Grade C (50-74%)", desc: "Basic Passing", color: "from-amber-400 to-amber-500", bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200" },
                  D: { count: 0, label: "Grade D (35-49%)", desc: "Needs Improvement", color: "from-orange-400 to-orange-500", bg: "bg-orange-50", text: "text-orange-800", border: "border-orange-200" },
                  Fail: { count: 0, label: "Retake Needed (<35%)", desc: "Retake Required", color: "from-rose-500 to-red-600", bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
                };

                const totalEntries = filteredLeaderboard.length;
                filteredLeaderboard.forEach((entry) => {
                  const acc = entry.accuracy_percentage;
                  if (acc >= 90) grades.A.count++;
                  else if (acc >= 75) grades.B.count++;
                  else if (acc >= 50) grades.C.count++;
                  else if (acc >= 35) grades.D.count++;
                  else grades.Fail.count++;
                });

                return (
                  <div className="space-y-3 pt-2">
                    {Object.entries(grades).map(([key, grade]) => {
                      const pct = totalEntries > 0 ? Math.round((grade.count / totalEntries) * 100) : 0;
                      return (
                        <div key={key} className="space-y-1">
                          <div className="flex items-center justify-between text-xs font-semibold">
                            <div className="flex items-center gap-2">
                              <span className={`w-6 h-6 rounded-lg font-black flex items-center justify-center text-[11px] border ${grade.bg} ${grade.text} ${grade.border}`}>
                                {key === "Fail" ? "F" : key}
                              </span>
                              <span className="text-slate-800 font-bold">{grade.label}</span>
                              <span className="text-[10px] text-slate-400 hidden sm:inline">({grade.desc})</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">{grade.count}</span>
                              <span className="text-slate-400 text-[11px]">({pct}%)</span>
                            </div>
                          </div>
                          {/* Progress bar */}
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              style={{ width: `${pct}%` }}
                              className={`h-full rounded-full bg-gradient-to-r ${grade.color} transition-all duration-500`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Leaderboard Table Section */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 sm:p-8 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Ranked Player Standings</h2>
                <p className="text-xs text-slate-500">
                  Ordered by score, total time, and anti-cheat compliance.
                </p>
              </div>

              {/* Search & Status Filters */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-xs">
                    🔍
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search player name..."
                    className="pl-8 pr-4 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 w-44 sm:w-56"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-xs text-slate-400 hover:text-slate-600"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Contestants</option>
                  <option value="clean">Verified Clean (0 Warnings)</option>
                  <option value="flagged">Flagged (1-2 Warnings)</option>
                  <option value="disqualified">Disqualified (Cheating)</option>
                </select>

                <span className="text-xs font-bold bg-indigo-50 text-indigo-700 px-3 py-2 rounded-xl border border-indigo-100 whitespace-nowrap">
                  {filteredLeaderboard.length} Entries
                </span>
              </div>
            </div>

            {filteredLeaderboard.length === 0 ? (
              <div className="p-16 text-center text-slate-400 text-xs">
                No contestants match the current filter criteria.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="py-4 px-6">Rank</th>
                      <th className="py-4 px-6">Participant</th>
                      <th className="py-4 px-6">Speed Score</th>
                      <th className="py-4 px-6">Accuracy</th>
                      <th className="py-4 px-6">Correct / Wrong</th>
                      <th className="py-4 px-6">Time (Avg)</th>
                      <th className="py-4 px-6">Security Check</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {filteredLeaderboard.map((entry) => (
                      <tr key={entry.attempt_id} className="hover:bg-slate-50/70 transition">
                        <td className="py-4 px-6">
                          <span
                            className={`w-7 h-7 rounded-full inline-flex items-center justify-center font-black text-xs ${
                              entry.rank === 1
                                ? "bg-amber-100 text-amber-800 border border-amber-300 shadow-sm"
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
                        <td className="py-4 px-6 font-bold text-slate-900 text-sm">
                          {entry.participant_name}
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-extrabold text-indigo-600 text-sm">
                            {entry.score.toLocaleString()}
                          </span>{" "}
                          <span className="text-slate-400 text-[11px]">/ {entry.max_score}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                              entry.accuracy_percentage >= 80
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : entry.accuracy_percentage >= 50
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : "bg-rose-50 text-rose-700 border border-rose-200"
                            }`}
                          >
                            {entry.accuracy_percentage}%
                          </span>
                        </td>
                        <td className="py-4 px-6 text-slate-600">
                          <span className="text-emerald-600 font-bold">{entry.correct_count}</span>{" "}
                          / <span className="text-rose-500 font-semibold">{entry.incorrect_count}</span>
                        </td>
                        <td className="py-4 px-6 text-slate-600">
                          <span className="font-bold text-slate-800">{entry.total_time_seconds}s</span>{" "}
                          <span className="text-[10px] text-slate-400">({entry.avg_time_seconds}s/q)</span>
                        </td>
                        <td className="py-4 px-6">
                          {entry.completion_status === "disqualified" ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
                              Disqualified
                            </span>
                          ) : entry.warning_count > 0 ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                              ⚠️ {entry.warning_count} Warnings
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              ✓ Verified Clean
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteAttempt(entry.attempt_id, entry.participant_name)}
                            disabled={deletingAttemptId === entry.attempt_id}
                            title="Delete attempt & reset IP check so participant can retry"
                            className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition disabled:opacity-50 inline-flex items-center gap-1"
                          >
                            <span>🗑️</span>
                            <span>{deletingAttemptId === entry.attempt_id ? "Deleting..." : "Allow Retry"}</span>
                          </button>
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
