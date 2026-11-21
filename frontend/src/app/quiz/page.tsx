"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { quizService } from "@/services/quizService";
import type {
  AttemptResult,
  ParticipantAttemptSession,
  ParticipantQuestion,
  PublicQuizInfo,
} from "@/types/quiz";

export default function PublicQuizPlayPage() {
  const searchParams = useSearchParams();
  const codeParam = searchParams.get("code") || "";

  // 1. Participant Registration / Join Step
  const [joinCode, setJoinCode] = useState(codeParam.toUpperCase());
  const [participantName, setParticipantName] = useState("");
  const [publicInfo, setPublicInfo] = useState<PublicQuizInfo | null>(null);

  // 2. Active Quiz State
  const [session, setSession] = useState<ParticipantAttemptSession | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [questionTimer, setQuestionTimer] = useState<number>(30);

  // 3. Statuses & Final Result
  const [isJoining, setIsJoining] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load public quiz details if code was passed
  useEffect(() => {
    if (codeParam) {
      quizService
        .getPublicQuizInfo(codeParam)
        .then((info) => setPublicInfo(info))
        .catch(() => {});
    }
  }, [codeParam]);

  // Overall and Question Timer
  useEffect(() => {
    if (!session || result) return;

    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
      setQuestionTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [session, result]);

  // Handle participant join
  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim() || !participantName.trim()) {
      setError("Please enter your name and the quiz join code.");
      return;
    }

    setIsJoining(true);
    setError(null);

    try {
      const sess = await quizService.joinQuiz(joinCode.trim().toUpperCase(), participantName.trim());
      if (sess.questions.length === 0) {
        setError("This quiz does not have any questions added yet.");
        setIsJoining(false);
        return;
      }
      setSession(sess);
      setQuestionTimer(sess.quiz.time_limit_seconds || 30);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to join quiz");
    } finally {
      setIsJoining(false);
    }
  };

  const handleSelectChoice = (questionId: string, choice: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: choice,
    }));
  };

  const currentQuestion: ParticipantQuestion | undefined = session?.questions[currentIndex];

  const handleNextQuestion = () => {
    if (!session) return;
    if (currentIndex < session.questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setQuestionTimer(session.quiz.time_limit_seconds || 30);
    }
  };

  const handlePrevQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  // Submit attempt
  const handleSubmitQuiz = async () => {
    if (!session || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    const answersList = Object.entries(selectedAnswers).map(([qId, answer]) => ({
      question_id: qId,
      selected_answer: answer,
    }));

    try {
      const res = await quizService.submitQuizAttempt(
        session.attempt.id,
        answersList,
        elapsedSeconds
      );
      setResult(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit answers");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- VIEW 3: Final Completion & Score Report ---
  if (result) {
    const accuracy =
      result.max_score > 0 ? Math.round((result.score / result.max_score) * 100) : 0;

    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-3xl font-black">
            ✓
          </div>

          <div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700">
              Quiz Completed
            </span>
            <h1 className="text-3xl font-black text-slate-900 mt-2">
              Well Done, {result.participant_name}!
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Your results have been recorded in the platform database.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <span className="text-xs text-slate-500 font-medium">Final Score</span>
              <p className="text-2xl font-black text-indigo-600 mt-1">
                {result.score} <span className="text-xs text-slate-400">/ {result.max_score}</span>
              </p>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <span className="text-xs text-slate-500 font-medium">Accuracy</span>
              <p className="text-2xl font-black text-emerald-600 mt-1">{accuracy}%</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <span className="text-xs text-slate-500 font-medium">Time Taken</span>
              <p className="text-2xl font-black text-slate-800 mt-1">{result.duration_seconds}s</p>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex justify-center gap-4">
            <Link
              href="/"
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition"
            >
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // --- VIEW 2: Active Quiz Gameplay ---
  if (session && currentQuestion) {
    const isLast = currentIndex === session.questions.length - 1;
    const answeredCount = Object.keys(selectedAnswers).length;

    return (
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
        {/* Game Header Bar */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-slate-900">{session.quiz.title}</h1>
            <p className="text-xs text-slate-500">Player: {session.attempt.participant_name}</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Question</span>
              <span className="text-sm font-bold text-indigo-600">
                {currentIndex + 1} / {session.questions.length}
              </span>
            </div>
            <div className="text-right pl-4 border-l border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Timer</span>
              <span className="text-sm font-bold font-mono text-slate-900">{elapsedSeconds}s</span>
            </div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-md space-y-6">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>Points: {currentQuestion.points} pt</span>
            <span>Answered: {answeredCount} / {session.questions.length}</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
            {currentQuestion.question_text}
          </h2>

          {/* 4 Choices Radio Cards */}
          <div className="space-y-3 pt-2">
            {currentQuestion.options.map((opt, idx) => {
              const isSelected = selectedAnswers[currentQuestion.id] === opt;
              const letter = String.fromCharCode(65 + idx);

              return (
                <button
                  type="button"
                  key={idx}
                  onClick={() => handleSelectChoice(currentQuestion.id, opt)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center gap-3 ${
                    isSelected
                      ? "border-indigo-600 bg-indigo-50/70 shadow-sm ring-1 ring-indigo-600"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                      isSelected ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {letter}
                  </span>
                  <span className="text-sm font-medium text-slate-800 flex-1">{opt}</span>
                </button>
              );
            })}
          </div>

          {/* Reference display if provided */}
          {currentQuestion.explanation && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 italic">
              Scripture Context: {currentQuestion.explanation}
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-medium">
              {error}
            </div>
          )}

          {/* Navigation Controls */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={handlePrevQuestion}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              ← Previous
            </button>

            {isLast ? (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmitQuiz}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition disabled:opacity-50"
              >
                {isSubmitting ? "Scoring Quiz..." : "Submit All Answers ✓"}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNextQuestion}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs shadow-md transition"
              >
                Next Question →
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- VIEW 1: Participant Join Form ---
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-3xl shadow-xl border border-slate-200 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center mx-auto text-2xl font-bold shadow-md shadow-indigo-200">
            ✝
          </div>
          <h1 className="text-2xl font-black text-slate-900 pt-1">
            {publicInfo ? publicInfo.title : "Join Bible Quiz"}
          </h1>
          <p className="text-xs text-slate-500">
            Enter your display name to start the quiz. Your results will be saved to the leaderboard.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Your Name *
            </label>
            <input
              type="text"
              required
              value={participantName}
              onChange={(e) => setParticipantName(e.target.value)}
              placeholder="e.g. John Doe, Sarah..."
              className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Quiz Join Code *
            </label>
            <input
              type="text"
              required
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="e.g. BQ78A1"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase font-mono font-bold"
            />
          </div>

          <button
            type="submit"
            disabled={isJoining}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-md transition disabled:opacity-50"
          >
            {isJoining ? "Connecting..." : "Start Quiz Now →"}
          </button>
        </form>
      </div>
    </div>
  );
}
