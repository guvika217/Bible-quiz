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

  // Quick Create Form State
  const [quizName, setQuizName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal State for Editing Quiz Settings (Title, Status, Time Limit)
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editStatus, setEditStatus] = useState<string>("active");
  const [editTimeLimit, setEditTimeLimit] = useState<number>(30);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete Action State
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [copiedCode, setCopiedCode] = useState<string | null>(null);

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
    const title = quizName.trim();
    if (!title) {
      setError("Please enter a name for the quiz.");
      return;
    }

    if (quizzes.some((q) => q.title.trim().toLowerCase() === title.toLowerCase())) {
      setError(`A quiz named "${title}" already exists. Please choose a different title.`);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const newQuiz = await quizService.createQuiz({
        title,
        time_limit_seconds: 30, // Default 30s per question
      });

      // Clear input and immediately route to creator for the new quiz
      setQuizName("");
      router.push(`/admin/quizzes/create?quizId=${newQuiz.id}`);
    } catch (err: unknown) {
      console.error("Quiz creation error:", err);
      setError(err instanceof Error ? err.message : "Failed to create quiz");
      setIsSubmitting(false);
    }
  };

  // Toggle Quiz Status Quickly (Active / Draft / Completed)
  const handleToggleStatus = async (quiz: Quiz, newStatus: string) => {
    try {
      const updated = await quizService.updateQuiz(quiz.id, { status: newStatus });
      setQuizzes((prev) => prev.map((q) => (q.id === quiz.id ? updated : q)));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to update status");
    }
  };

  // Open Edit Modal
  const handleOpenEditModal = (quiz: Quiz) => {
    setEditingQuiz(quiz);
    setEditTitle(quiz.title);
    setEditStatus(quiz.status);
    setEditTimeLimit(quiz.time_limit_seconds || 30);
    setEditError(null);
  };

  // Save Quiz Edits
  const handleSaveQuizEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuiz) return;

    const trimmed = editTitle.trim();
    if (!trimmed) {
      setEditError("Quiz title cannot be empty");
      return;
    }

    setIsSavingEdit(true);
    setEditError(null);

    try {
      const updated = await quizService.updateQuiz(editingQuiz.id, {
        title: trimmed,
        status: editStatus,
        time_limit_seconds: Number(editTimeLimit),
      });

      setQuizzes((prev) => prev.map((q) => (q.id === editingQuiz.id ? updated : q)));
      setEditingQuiz(null);
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : "Failed to save changes");
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Delete Quiz
  const handleDeleteQuiz = async (quizId: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this quiz and all its question data?")) {
      return;
    }

    setDeletingId(quizId);
    try {
      await quizService.deleteQuiz(quizId);
      setQuizzes((prev) => prev.filter((q) => q.id !== quizId));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete quiz");
    } finally {
      setDeletingId(null);
    }
  };

  const handleShareQuiz = (joinCode: string) => {
    if (typeof window !== "undefined") {
      const publicLink = `${window.location.origin}/quiz?code=${joinCode}`;
      navigator.clipboard.writeText(publicLink);
      setCopiedCode(joinCode);
      setTimeout(() => setCopiedCode(null), 2500);
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
            Bible Quizzes Manager
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Create, edit, toggle active status, manage questions, and share public links.
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
            {quizzes.map((quiz) => {
              const isActive = quiz.status === "active";

              return (
                <div
                  key={quiz.id}
                  className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    {/* Top Row: Code + Status Badge Toggle */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                        Code: {quiz.join_code}
                      </span>
                      {/* Active Status Dropdown Toggle */}
                      <select
                        value={quiz.status}
                        onChange={(e) => handleToggleStatus(quiz, e.target.value)}
                        className={`text-xs font-bold rounded-lg px-2.5 py-1 border transition-colors cursor-pointer ${
                          isActive
                            ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                            : quiz.status === "completed"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                      >
                        <option value="active">● Active</option>
                        <option value="draft">○ Draft</option>
                        <option value="completed">✓ Completed</option>
                        <option value="archived">📦 Archived</option>
                      </select>
                    </div>

                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-lg font-bold text-slate-900 leading-snug">
                        {quiz.title}
                      </h3>
                      {/* Edit Quiz Details Button */}
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(quiz)}
                        title="Edit Quiz Settings"
                        className="p-1 text-slate-400 hover:text-indigo-600 transition"
                      >
                        ✏️
                      </button>
                    </div>

                    <p className="text-xs text-slate-400 mt-1 font-mono">
                      ID: {quiz.id.slice(0, 8)}... • {quiz.question_count} questions • {quiz.time_limit_seconds || 30}s
                    </p>
                  </div>

                  {/* Actions Row */}
                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Link
                        href={`/admin/quizzes/create?quizId=${quiz.id}`}
                        className="font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2.5 py-1.5 rounded-lg border border-indigo-100 transition-colors"
                      >
                        Questions ✎
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleShareQuiz(quiz.join_code)}
                        className={`font-semibold px-2.5 py-1.5 rounded-lg border transition-all flex items-center gap-1 ${
                          copiedCode === quiz.join_code
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-50 text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 border-slate-200"
                        }`}
                      >
                        <span>{copiedCode === quiz.join_code ? "✓" : "🔗"}</span>
                        <span>{copiedCode === quiz.join_code ? "Copied" : "Share"}</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/dashboard?quizId=${quiz.id}`}
                        className="font-semibold text-slate-600 hover:text-slate-900 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 transition-colors"
                      >
                        Stats →
                      </Link>
                      {/* Delete Quiz Button */}
                      <button
                        type="button"
                        disabled={deletingId === quiz.id}
                        onClick={() => handleDeleteQuiz(quiz.id)}
                        title="Delete Quiz"
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                      >
                        {deletingId === quiz.id ? "⏳" : "🗑️"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Quiz Modal */}
      {editingQuiz && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Edit Quiz Settings</h3>
              <button
                type="button"
                onClick={() => setEditingQuiz(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {editError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-medium">
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveQuizEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Quiz Title *
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Lifecycle Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="active">Active (Open for plays)</option>
                    <option value="draft">Draft (Hidden)</option>
                    <option value="completed">Completed</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Time Limit (Sec / Question)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="300"
                    value={editTimeLimit}
                    onChange={(e) => setEditTimeLimit(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingQuiz(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {isSavingEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
