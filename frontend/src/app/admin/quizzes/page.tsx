"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authService } from "@/services/authService";
import { quizService } from "@/services/quizService";
import type { Quiz, QuizCreateInput } from "@/types/quiz";

export default function QuizzesManagementPage() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal / Form state
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [timeLimit, setTimeLimit] = useState<number>(300);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    authService
      .getCurrentUser()
      .then(() => quizService.listQuizzes())
      .then((data) => {
        if (isMounted) {
          setQuizzes(data);
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

  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setCreateError("Quiz title is required");
      return;
    }

    setIsCreating(true);
    setCreateError(null);

    const input: QuizCreateInput = {
      title: title.trim(),
      description: description.trim() || undefined,
      join_code: joinCode.trim() ? joinCode.trim().toUpperCase() : undefined,
      time_limit_seconds: timeLimit > 0 ? Number(timeLimit) : undefined,
    };

    try {
      const created = await quizService.createQuiz(input);
      setQuizzes((prev) => [created, ...prev]);
      setShowModal(false);
      setTitle("");
      setDescription("");
      setJoinCode("");
      setTimeLimit(300);
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : "Failed to create quiz");
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Loading Bible quizzes...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/admin/dashboard"
              className="text-xs font-semibold text-slate-400 hover:text-indigo-600"
            >
              ← Admin Dashboard
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Bible Quizzes
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Create, manage, and inspect live quizzes and player performance.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md transition flex items-center gap-2"
        >
          <span>+</span> Create New Quiz
        </button>
      </div>

      {/* Quizzes List */}
      <div className="mt-8">
        {quizzes.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-300 p-8">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3 font-bold text-xl">
              📖
            </div>
            <h3 className="text-base font-semibold text-slate-900">No quizzes created yet</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Get started by creating your first Scripture trivia or Bible study quiz.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-5 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 transition"
            >
              Create Quiz
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                      Code: {quiz.join_code}
                    </span>
                    <span className="text-xs font-medium text-slate-500 capitalize">
                      {quiz.status}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 leading-snug">
                    {quiz.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {quiz.description || "No description provided."}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Timer: {quiz.time_limit_seconds ? `${quiz.time_limit_seconds}s` : "Untimed"}</span>
                  <Link
                    href={`/admin/dashboard?quizId=${quiz.id}`}
                    className="font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    View Leaderboard →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Quiz Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Create New Bible Quiz</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {createError && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-medium">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateQuiz} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Quiz Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Genesis & The Patriarchs"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Summary of chapters, topics, or study material..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Join Code (Optional)
                  </label>
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    placeholder="e.g. GENESIS1"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Time Limit (Seconds)
                  </label>
                  <input
                    type="number"
                    min={10}
                    value={timeLimit}
                    onChange={(e) => setTimeLimit(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm transition disabled:opacity-50"
                >
                  {isCreating ? "Saving..." : "Create Quiz"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
