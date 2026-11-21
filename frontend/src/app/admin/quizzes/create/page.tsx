"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { authService } from "@/services/authService";
import { quizService } from "@/services/quizService";
import type { AdminQuestion, Quiz } from "@/types/quiz";

export default function CreateQuizPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const quizId = searchParams.get("quizId");

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<AdminQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Question Form State (4 Choices + Radio for Correct Choice + Reference/Explanation)
  const [questionText, setQuestionText] = useState("");
  const [choiceA, setChoiceA] = useState("");
  const [choiceB, setChoiceB] = useState("");
  const [choiceC, setChoiceC] = useState("");
  const [choiceD, setChoiceD] = useState("");
  const [selectedCorrectIndex, setSelectedCorrectIndex] = useState<number>(0);
  const [reference, setReference] = useState(""); // Scripture reference / explanation
  const [points, setPoints] = useState<number>(1);
  const [timeLimit, setTimeLimit] = useState<number>(30); // Seconds per question

  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    if (!quizId) {
      router.replace("/admin/quizzes");
      return;
    }

    let isMounted = true;
    authService
      .getCurrentUser()
      .then(() => Promise.all([quizService.getQuiz(quizId), quizService.getAdminQuestions(quizId)]))
      .then(([quizData, questionsData]) => {
        if (!isMounted) return;
        setQuiz(quizData);
        setQuestions(questionsData);
        if (quizData.time_limit_seconds) {
          setTimeLimit(quizData.time_limit_seconds);
        }
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load quiz creator data:", err);
        if (isMounted) {
          router.replace("/admin/quizzes");
        }
      });

    return () => {
      isMounted = false;
    };
  }, [quizId, router]);

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quiz) return;

    const trimmedQ = questionText.trim();
    const cA = choiceA.trim();
    const cB = choiceB.trim();
    const cC = choiceC.trim();
    const cD = choiceD.trim();

    if (!trimmedQ) {
      setFormError("Question text is required.");
      return;
    }

    if (!cA || !cB || !cC || !cD) {
      setFormError("All 4 choices must be filled out.");
      return;
    }

    const options = [cA, cB, cC, cD];
    // Check for duplicate options
    if (new Set(options).size !== options.length) {
      setFormError("All 4 choices must be unique.");
      return;
    }

    const correctAnswer = options[selectedCorrectIndex];

    setIsAddingQuestion(true);
    setFormError(null);

    try {
      const added = await quizService.addQuestion(quiz.id, {
        quiz_id: quiz.id,
        question_text: trimmedQ,
        question_type: "single_choice",
        options,
        correct_answer: correctAnswer,
        explanation: reference.trim() || undefined,
        points: points > 0 ? Number(points) : 1,
        order_index: questions.length + 1,
      });

      setQuestions((prev) => [...prev, added]);

      // Reset question builder inputs for next question
      setQuestionText("");
      setChoiceA("");
      setChoiceB("");
      setChoiceC("");
      setChoiceD("");
      setSelectedCorrectIndex(0);
      setReference("");
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to add question");
    } finally {
      setIsAddingQuestion(false);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!quiz) return;
    try {
      await quizService.deleteQuestion(quiz.id, questionId);
      setQuestions((prev) => prev.filter((q) => q.id !== questionId));
    } catch (err) {
      console.error("Failed to delete question:", err);
    }
  };

  // Generate public participant share URL
  const publicShareUrl =
    typeof window !== "undefined" && quiz
      ? `${window.location.origin}/quiz?code=${quiz.join_code}`
      : "";

  const handleCopyLink = () => {
    if (publicShareUrl) {
      navigator.clipboard.writeText(publicShareUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2500);
    }
  };

  if (isLoading || !quiz) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Preparing Quiz Creator...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Quiz Identity & Public Link Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link
                href="/admin/quizzes"
                className="text-xs font-semibold text-slate-400 hover:text-indigo-600"
              >
                ← Back to Quizzes
              </Link>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {quiz.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500">
              <span>Quiz ID: <code className="bg-slate-100 px-2 py-0.5 rounded font-mono text-slate-700">{quiz.id}</code></span>
              <span>Join Code: <strong className="text-indigo-600 font-mono text-sm">{quiz.join_code}</strong></span>
              <span>Questions: <strong>{questions.length}</strong></span>
              <span>Timer: <strong>{timeLimit}s / question</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/admin/dashboard?quizId=${quiz.id}`}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
            >
              View Leaderboard
            </Link>
          </div>
        </div>

        {/* Public Share Link Generator Box */}
        <div className="mt-6 p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
              Public Quiz Link for Participants
            </span>
            <p className="text-xs text-slate-600 mt-0.5">
              Share this link with anyone. When they open it, they enter their name and take the quiz!
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={publicShareUrl}
              className="w-full sm:w-80 px-3 py-2 bg-white border border-indigo-200 rounded-xl text-xs font-mono text-indigo-900 select-all"
            />
            <button
              onClick={handleCopyLink}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm transition whitespace-nowrap"
            >
              {copySuccess ? "✓ Copied!" : "Copy Link"}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Add Question Form */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="pb-4 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900">Add New Question</h2>
            <p className="text-xs text-slate-500">
              Enter question prompt, 4 choices, select the radio button for the correct choice, and provide a Scripture reference.
            </p>
          </div>

          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-medium">
              {formError}
            </div>
          )}

          <form onSubmit={handleAddQuestion} className="space-y-5">
            {/* Question Text */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Question Text *
              </label>
              <textarea
                rows={3}
                required
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="e.g. How many days and nights did rain fall during Noah's flood?"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* 4 Choices with Radio Selection for Correct Choice */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                4 Choices (Select the radio button for the correct answer) *
              </label>
              <div className="space-y-3">
                {[
                  { label: "A", value: choiceA, setter: setChoiceA, index: 0 },
                  { label: "B", value: choiceB, setter: setChoiceB, index: 1 },
                  { label: "C", value: choiceC, setter: setChoiceC, index: 2 },
                  { label: "D", value: choiceD, setter: setChoiceD, index: 3 },
                ].map((item) => (
                  <div
                    key={item.label}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition ${
                      selectedCorrectIndex === item.index
                        ? "border-emerald-300 bg-emerald-50/40"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <input
                      type="radio"
                      name="correctChoice"
                      id={`choice-${item.label}`}
                      checked={selectedCorrectIndex === item.index}
                      onChange={() => setSelectedCorrectIndex(item.index)}
                      className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <span className="font-bold text-xs text-slate-500 w-4">{item.label}.</span>
                    <input
                      type="text"
                      required
                      value={item.value}
                      onChange={(e) => item.setter(e.target.value)}
                      placeholder={`Enter choice ${item.label}...`}
                      className="flex-1 px-3 py-1.5 bg-transparent border-0 text-sm focus:outline-none text-slate-800 placeholder:text-slate-400"
                    />
                    {selectedCorrectIndex === item.index && (
                      <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                        Correct Answer
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Scripture Reference / Explanation */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Scripture Reference / Explanation (Displayed to user after answering)
              </label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g. Genesis 7:12 - 'And rain fell on the earth forty days and forty nights.'"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Points & Order */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Points for Question
                </label>
                <input
                  type="number"
                  min={1}
                  value={points}
                  onChange={(e) => setPoints(Number(e.target.value))}
                  className="w-full px-4 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Timer (Seconds)
                </label>
                <input
                  type="number"
                  min={5}
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(Number(e.target.value))}
                  className="w-full px-4 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isAddingQuestion}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md transition disabled:opacity-50 text-sm"
              >
                {isAddingQuestion ? "Saving Question..." : "+ Add Question to Quiz"}
              </button>
            </div>
          </form>
        </div>

        {/* RIGHT COLUMN: Questions Added Roster */}
        <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">
              Questions Added ({questions.length})
            </h2>
            <span className="text-xs text-slate-500">
              Total Points: {questions.reduce((acc, q) => acc + q.points, 0)}
            </span>
          </div>

          {questions.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No questions added yet. Use the form on the left to add your questions.
            </div>
          ) : (
            <div className="space-y-4 max-h-[650px] overflow-y-auto pr-1">
              {questions.map((q, idx) => (
                <div
                  key={q.id}
                  className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-2 relative group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-bold text-indigo-600">Q{idx + 1}.</span>
                    <button
                      onClick={() => handleDeleteQuestion(q.id)}
                      className="text-slate-400 hover:text-rose-600 text-xs font-bold p-1"
                      title="Delete question"
                    >
                      ✕
                    </button>
                  </div>
                  <p className="text-sm font-semibold text-slate-900 leading-snug">
                    {q.question_text}
                  </p>

                  <div className="grid grid-cols-2 gap-1.5 text-xs pt-1">
                    {q.options.map((opt, oIdx) => (
                      <span
                        key={oIdx}
                        className={`px-2 py-1 rounded-lg border text-[11px] truncate ${
                          opt === q.correct_answer
                            ? "bg-emerald-100 border-emerald-300 text-emerald-900 font-semibold"
                            : "bg-white border-slate-200 text-slate-600"
                        }`}
                      >
                        {String.fromCharCode(65 + oIdx)}. {opt}
                      </span>
                    ))}
                  </div>

                  {q.explanation && (
                    <div className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-200/60">
                      Ref: {q.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
