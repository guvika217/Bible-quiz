"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { quizService } from "@/services/quizService";
import type { Quiz, QuizPerformanceAnalytics } from "@/types/quiz";

export default function PublicLeaderboardPage() {
  const searchParams = useSearchParams();
  const initialQuizId = searchParams.get("quizId") || "";

  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState<string>(initialQuizId);
  const [analytics, setAnalytics] = useState<QuizPerformanceAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);

  useEffect(() => {
    let isMounted = true;
    quizService
      .listQuizzes()
      .then((data) => {
        if (!isMounted) return;
        setQuizzes(data);
        if (initialQuizId && data.some((q) => q.id === initialQuizId)) {
          setSelectedQuizId(initialQuizId);
        } else if (data.length > 0) {
          setSelectedQuizId(data[0].id);
        }
        setIsLoading(false);
      })
      .catch(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [initialQuizId]);

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
        if (isMounted) setIsLoadingAnalytics(false);
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

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Loading Bible Quiz Leaderboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header Banner */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-2 mb-1">
          <span className="px-3 py-0.5 text-xs font-bold rounded-full bg-amber-100 text-amber-900 border border-amber-300">
            🏆 Official Hall of Fame
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Scripture Champions Leaderboard
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Rankings decided by combined speed, answer accuracy, and completion time.
        </p>
      </div>

      {/* Quiz Selector Filter */}
      {quizzes.length > 0 && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 max-w-2xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Select Competition:
          </span>
          <select
            value={selectedQuizId}
            onChange={(e) => handleSelectQuiz(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {quizzes.map((q) => (
              <option key={q.id} value={q.id}>
                {q.title} ({q.join_code})
              </option>
            ))}
          </select>
        </div>
      )}

      {isLoadingAnalytics ? (
        <div className="py-20 flex flex-col justify-center items-center gap-3">
          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Fetching player standings...</p>
        </div>
      ) : analytics && analytics.top_leaderboard.length > 0 ? (
        <div className="space-y-6">
          {/* Top 3 Podium Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {analytics.top_leaderboard.slice(0, 3).map((player, idx) => {
              const medals = ["🥇 1st Place", "🥈 2nd Place", "🥉 3rd Place"];
              const borders = ["border-amber-300 bg-amber-50/50", "border-slate-300 bg-slate-50/50", "border-orange-200 bg-orange-50/40"];
              const texts = ["text-amber-800", "text-slate-700", "text-orange-800"];

              return (
                <div
                  key={player.attempt_id}
                  className={`p-6 rounded-3xl border shadow-sm flex flex-col justify-between text-center ${borders[idx]}`}
                >
                  <div>
                    <span className={`text-xs font-black uppercase tracking-wider ${texts[idx]}`}>
                      {medals[idx]}
                    </span>
                    <h2 className="text-xl font-black text-slate-900 mt-2 truncate">
                      {player.participant_name}
                    </h2>
                    <p className="text-3xl font-black text-indigo-600 mt-2">
                      {player.score.toLocaleString()} <span className="text-xs font-normal text-slate-500">pts</span>
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200/60 grid grid-cols-2 text-xs text-slate-600">
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block font-semibold">Correct</span>
                      <strong className="text-emerald-600">{player.correct_count}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block font-semibold">Avg Speed</span>
                      <strong>{player.avg_time_seconds}s</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Full Ranked Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="py-4 px-6">Rank</th>
                    <th className="py-4 px-6">Participant</th>
                    <th className="py-4 px-6">Combined Score (Speed + Accuracy)</th>
                    <th className="py-4 px-6">Correct Answers</th>
                    <th className="py-4 px-6">Avg Response Time</th>
                    <th className="py-4 px-6">Total Duration</th>
                    <th className="py-4 px-6 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {analytics.top_leaderboard.map((entry) => (
                    <tr
                      key={entry.attempt_id}
                      className={`hover:bg-slate-50/70 transition ${
                        entry.completion_status === "disqualified" ? "bg-rose-50/30 opacity-70" : ""
                      }`}
                    >
                      <td className="py-4 px-6 font-bold text-slate-900">
                        #{entry.rank}
                      </td>
                      <td className="py-4 px-6 font-bold text-slate-900 text-sm">
                        {entry.participant_name}
                      </td>
                      <td className="py-4 px-6 font-mono font-bold text-indigo-600 text-sm">
                        {entry.score.toLocaleString()} pts
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-emerald-600 font-bold">{entry.correct_count}</span>
                        <span className="text-slate-400"> correct ({entry.accuracy_percentage}%)</span>
                      </td>
                      <td className="py-4 px-6 font-mono text-slate-700">
                        {entry.avg_time_seconds}s / q
                      </td>
                      <td className="py-4 px-6 text-slate-500">
                        {entry.total_time_seconds}s
                      </td>
                      <td className="py-4 px-6 text-right">
                        {entry.completion_status === "disqualified" ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            Disqualified (Anti-Cheat)
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                            Verified ✓
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-16 text-center bg-white rounded-3xl border border-dashed border-slate-300 text-slate-500 text-sm">
          No participant scores recorded yet for this quiz.
        </div>
      )}

      <div className="text-center pt-4">
        <Link
          href="/"
          className="text-xs font-semibold text-slate-500 hover:text-indigo-600 transition"
        >
          ← Return to Home
        </Link>
      </div>
    </div>
  );
}
