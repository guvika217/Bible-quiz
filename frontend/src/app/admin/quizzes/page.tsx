"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authService } from "@/services/authService";
import { quizService } from "@/services/quizService";
import type { Quiz } from "@/types/quiz";

export default function QuizzesPage() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Simple Initial Create Form State
  const [quizName, setQuizName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // Step 1: Create Quiz with name -> auto-generates ID & join code -> redirects to Quiz Question Builder
  const handleQuickCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quizName.trim()) {
      setError("Please enter a name for the quiz.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const newQuiz = await quizService.createQuiz({
        title: quizName.trim(),
        time_limit_seconds: 30, // Default 30s per question
      });

      // Redirect immediately to /admin/quizzes/create?quizId=... to add questions & configure
      router.push(`/admin/quizzes/create?quizId=${newQuiz.id}`);
    } catch (err: unknown) {
      console.error("Quiz creation error:", err);
      setError(err instanceof Error ? err.message : "Failed to create quiz");
    } finally {
      setIsSubmitting(false);
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Top Header */}
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
            Create new Scripture quizzes, manage questions, and share public links.
          </p>
        </div>
      </div>

      {/* STEP 1: Quick Create Card */}
      <div className="bg-gradient-to-r from-indigo-50 to-violet-50 rounded-3xl p-6 sm:p-8 border border-indigo-100 shadow-sm">
        <div className="max-w-2xl">
          <span className="px-3 py-1 text-xs font-bold rounded-full bg-indigo-600 text-white tracking-wide uppercase">
            Step 1: Start New Quiz
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-3">
            What is the name of your Bible quiz?
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Enter the title below. A unique Quiz ID and Join Code will be automatically generated, and you will proceed to the question builder.
          </p>

          {error && (
            <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleQuickCreate} className="mt-5 flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              required
              disabled={isSubmitting}
              value={quizName}
              onChange={(e) => setQuizName(e.target.value)}
              placeholder="e.g. Life of David & 1 Samuel, Gospels Trivia..."
              className="flex-1 px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md transition disabled:opacity-50 whitespace-nowrap"
            >
              {isSubmitting ? "Generating Quiz..." : "Create Quiz →"}
            </button>
          </form>
        </div>
      </div>

      {/* Existing Quizzes Roster */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-slate-900">Your Created Quizzes</h2>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            {quizzes.length} Quizzes
          </span>
        </div>

        {quizzes.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-300 p-8">
            <p className="text-sm text-slate-500">No quizzes yet. Enter a title above to create your first one!</p>
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
                    <span className="text-xs font-medium text-slate-500">
                      {quiz.question_count} questions
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 leading-snug">
                    {quiz.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 font-mono">
                    ID: {quiz.id.slice(0, 8)}...
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <Link
                    href={`/admin/quizzes/create?quizId=${quiz.id}`}
                    className="font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 transition-colors"
                  >
                    Edit Questions ✎
                  </Link>
                  <Link
                    href={`/admin/dashboard?quizId=${quiz.id}`}
                    className="font-semibold text-slate-600 hover:text-slate-900 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors"
                  >
                    Leaderboard →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
