"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { quizService } from "@/services/quizService";
import { ScratchRevealCard } from "@/components/quiz/ScratchRevealCard";
import type {
  AttemptResult,
  ParticipantAttemptSession,
  ParticipantQuestion,
  PublicQuizInfo,
} from "@/types/quiz";

export default function PublicQuizPlayPage() {
  const searchParams = useSearchParams();
  const codeParam = searchParams.get("code") || "";

  // 1. Participant Registration Step
  const [joinCode, setJoinCode] = useState(codeParam.toUpperCase());
  const [participantName, setParticipantName] = useState("");
  const [publicInfo, setPublicInfo] = useState<PublicQuizInfo | null>(null);

  // 2. Active Quiz State
  const [session, setSession] = useState<ParticipantAttemptSession | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [questionResponseTimes, setQuestionResponseTimes] = useState<Record<string, number>>({});
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [questionElapsed, setQuestionElapsed] = useState<number>(0);

  // Engagement Enhancements State
  const [streak, setStreak] = useState<number>(0);
  const [selectedOptionTemp, setSelectedOptionTemp] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);

  // Anti-cheat state
  const [warningCount, setWarningCount] = useState<number>(0);
  const [showWarningModal, setShowWarningModal] = useState<boolean>(false);
  const [warningMessage, setWarningMessage] = useState<string>("");
  const [isDisqualified, setIsDisqualified] = useState<boolean>(false);

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

  // Total timer and current question timer tick
  useEffect(() => {
    if (!session || result || isDisqualified) return;

    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
      setQuestionElapsed((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [session, result, isDisqualified]);

  // Request Fullscreen helper
  const enterFullscreen = () => {
    try {
      const docEl = document.documentElement;
      if (docEl.requestFullscreen) {
        docEl.requestFullscreen().catch(() => {});
      }
    } catch {
      // Ignore fullscreen refusal
    }
  };

  // Auto-submit when disqualified
  const triggerDisqualification = useCallback(async (finalWarningCount: number) => {
    if (!session) return;
    setIsDisqualified(true);
    setIsSubmitting(true);

    const answersList = session.questions.map((q) => ({
      question_id: q.id,
      selected_answer: selectedAnswers[q.id] || "NO_ANSWER",
      response_time_seconds: questionResponseTimes[q.id] || 0,
    }));

    try {
      const res = await quizService.submitQuizAttempt(
        session.attempt.id,
        answersList,
        elapsedSeconds,
        finalWarningCount
      );
      setResult(res);
    } catch (err) {
      console.error("Disqualification submission failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  }, [session, selectedAnswers, questionResponseTimes, elapsedSeconds]);

  // Anti-Cheat: Visibility Change, Window Blur, Fullscreen Exit, and Long Press (Circle-to-Search prevention)
  useEffect(() => {
    if (!session || result || isDisqualified) return;

    let debounceTimer: NodeJS.Timeout | null = null;
    let longPressTimer: NodeJS.Timeout | null = null;

    const handleCheatViolation = (reason: string) => {
      // Debounce slightly to prevent multiple triggers from one event
      if (debounceTimer) return;
      debounceTimer = setTimeout(() => {
        debounceTimer = null;
      }, 700);

      setWarningCount((prev) => {
        const nextCount = prev + 1;
        setWarningMessage(
          `Security Warning #${nextCount} of 3: ${reason}. Tab switching, window blur, long pressing, or exiting fullscreen is strictly prohibited.`
        );
        setShowWarningModal(true);

        if (nextCount >= 3) {
          triggerDisqualification(nextCount);
        }
        return nextCount;
      });
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleCheatViolation("You switched away from the active quiz tab or background task interrupted");
      }
    };

    const handleWindowBlur = () => {
      handleCheatViolation("The quiz window lost focus (background task or application switch detected)");
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        handleCheatViolation("You exited fullscreen mode");
      }
    };

    // Long Press Detection (Threshold: ~2.5 seconds triggers warning to prevent circle to search / AI assistance)
    const handleTouchStart = () => {
      longPressTimer = setTimeout(() => {
        handleCheatViolation("Long pressing on the screen detected (Circle to Search / AI Assistance attempt)");
      }, 2500);
    };

    const handleTouchEnd = () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      // Only check primary left click or long holding
      if (e.button === 0) {
        longPressTimer = setTimeout(() => {
          handleCheatViolation("Long click/hold on screen detected (External search attempt)");
        }, 2500);
      }
    };

    const handleMouseUp = () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      handleCheatViolation("Context menu / right click detected");
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });
    document.addEventListener("touchcancel", handleTouchEnd, { passive: true });
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("contextmenu", handleContextMenu);

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      if (longPressTimer) clearTimeout(longPressTimer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchend", handleTouchEnd);
      document.removeEventListener("touchcancel", handleTouchEnd);
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [session, result, isDisqualified, triggerDisqualification]);

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
      setQuestionElapsed(0);
      enterFullscreen();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to join quiz");
    } finally {
      setIsJoining(false);
    }
  };

  const currentQuestion: ParticipantQuestion | undefined = session?.questions[currentIndex];

  // 1-Click Instant Answer Handler: selects choice, records response time, and advances or auto-submits immediately
  const handleSelectChoice = async (questionId: string, choice: string) => {
    if (!session || isSubmitting || isTransitioning) return;

    const recordedTime = Math.max(1, questionElapsed);

    // Update streak based on answer speed (speedy answers <= 12s increase streak)
    if (recordedTime <= 12) {
      setStreak((prev) => prev + 1);
    } else {
      setStreak(0);
    }

    setSelectedOptionTemp(choice);
    setIsTransitioning(true);

    const updatedAnswers = {
      ...selectedAnswers,
      [questionId]: choice,
    };
    setSelectedAnswers(updatedAnswers);

    const updatedTimes = {
      ...questionResponseTimes,
      [questionId]: recordedTime,
    };
    setQuestionResponseTimes(updatedTimes);

    // If this was the last question, automatically submit immediately without needing any extra submit button!
    if (currentIndex >= session.questions.length - 1) {
      setIsSubmitting(true);
      setError(null);

      const answersList = session.questions.map((q) => ({
        question_id: q.id,
        selected_answer: q.id === questionId ? choice : (updatedAnswers[q.id] || "NO_ANSWER"),
        response_time_seconds: q.id === questionId ? recordedTime : (updatedTimes[q.id] || 0),
      }));

      try {
        const res = await quizService.submitQuizAttempt(
          session.attempt.id,
          answersList,
          elapsedSeconds,
          warningCount
        );
        setResult(res);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to submit answers");
        setIsSubmitting(false);
        setIsTransitioning(false);
      }
    } else {
      // Smooth slide & fade transition to next question (200ms)
      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
        setQuestionElapsed(0);
        setSelectedOptionTemp(null);
        setIsTransitioning(false);
      }, 200);
    }
  };

  // --- VIEW 3: Final Completion & Score Report ---
  if (result) {
    const isDisq = result.completion_status === "disqualified";

    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-xl text-center space-y-6">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto text-3xl font-black ${
              isDisq ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600"
            }`}
          >
            {isDisq ? "✕" : "✓"}
          </div>

          <div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                isDisq ? "bg-rose-100 text-rose-800" : "bg-indigo-50 text-indigo-700"
              }`}
            >
              {isDisq ? "Disqualified for Cheating" : "Quiz Submitted Successfully"}
            </span>
            <h1 className="text-3xl font-black text-slate-900 mt-2">
              {isDisq ? "Attempt Disqualified" : `Thank You, ${result.participant_name}!`}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              {isDisq
                ? "You exceeded the 3 security warning limit due to tab switching or window blur."
                : "Your responses have been recorded. Scratch the card below to pop celebration & reveal your certified score!"}
            </p>
          </div>

          {!isDisq ? (
            /* Interactive Scratch Card with Celebration Confetti Blast */
            <div className="py-2">
              <ScratchRevealCard
                score={result.score}
                maxScore={result.max_score}
                accuracy={
                  result.max_score > 0
                    ? Math.round((result.score / result.max_score) * 100)
                    : 0
                }
                totalTime={result.duration_seconds}
              />
            </div>
          ) : (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center space-y-2">
              <span className="text-2xl">🚫</span>
              <h3 className="text-sm font-bold text-rose-900">Attempt Disqualified</h3>
              <p className="text-xs text-rose-700 max-w-md mx-auto leading-relaxed">
                This attempt recorded 3 security violations and was not graded.
              </p>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 flex justify-center">
            <button
              type="button"
              onClick={() => {
                // Exit fullscreen if active
                if (document.fullscreenElement) {
                  document.exitFullscreen().catch(() => {});
                }
                // Try window.close() first (if opened in popup or direct window)
                window.close();
                // If the browser prevents window.close(), clear state & redirect to a neutral finished screen
                setSession(null);
                setResult(null);
                window.location.href = "about:blank";
              }}
              className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-sm transition shadow-sm flex items-center gap-2"
            >
              <span>✕</span>
              <span>Exit Quiz & Close</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- VIEW 2: Active Quiz Gameplay ---
  if (session && currentQuestion) {
    const answeredCount = Object.keys(selectedAnswers).length;

    // Calculate Speed Multiplier & Flame Bar based on current questionElapsed
    // <= 5s: 1.5x Flame Boost (100% full)
    // <= 10s: 1.2x Flame Boost (65% full)
    // <= 15s: 1.0x Normal (35% full)
    // > 15s: Cooled down (15% bar)
    const flameMultiplier =
      questionElapsed <= 5 ? "1.5x" : questionElapsed <= 10 ? "1.2x" : "1.0x";
    const flamePercentage =
      questionElapsed <= 5
        ? 100
        : questionElapsed <= 10
        ? Math.max(40, 100 - (questionElapsed - 5) * 12)
        : Math.max(10, 40 - (questionElapsed - 10) * 6);
    const isFlameHigh = questionElapsed <= 5;
    const isFlameCooling = questionElapsed > 15;

    return (
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Anti-Cheat Warning Modal */}
        {showWarningModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 text-center space-y-4 border border-rose-200 shadow-2xl animate-in zoom-in-95">
              <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                ⚠️
              </div>
              <h2 className="text-lg font-extrabold text-slate-900">Anti-Cheat Alert</h2>
              <p className="text-xs text-rose-700 font-medium leading-relaxed">
                {warningMessage}
              </p>
              <div className="text-xs text-slate-500 font-semibold">
                Remaining warnings before automatic disqualification:{" "}
                <span className="text-rose-600 font-bold">{Math.max(0, 3 - warningCount)}</span>
              </div>
              <button
                onClick={() => {
                  setShowWarningModal(false);
                  enterFullscreen();
                }}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs transition"
              >
                I Understand, Resume Fullscreen Quiz
              </button>
            </div>
          </div>
        )}

        {/* Game Header Bar */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-base font-bold text-slate-900">{session.quiz.title}</h1>
            <p className="text-xs text-slate-500">Player: {session.attempt.participant_name}</p>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
            {/* Streak Counter Badge */}
            <div
              className={`px-3 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1.5 transition-all shadow-sm ${
                streak >= 3
                  ? "bg-amber-500 text-white border-amber-600 animate-bounce shadow-amber-200"
                  : streak > 0
                  ? "bg-amber-50 text-amber-800 border-amber-300"
                  : "bg-slate-50 text-slate-500 border-slate-200"
              }`}
            >
              <span>🔥</span>
              <span>
                {streak > 0 ? `${streak} In a Row!` : "0 Streak"}
              </span>
            </div>

            {/* Anti-cheat status */}
            <span
              className={`px-3 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1.5 transition-all ${
                warningCount > 0
                  ? "bg-rose-100 text-rose-800 border-rose-300 animate-pulse"
                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
              }`}
            >
              <span>{warningCount > 0 ? "⚠️" : "🛡️"}</span>
              <span>
                {warningCount > 0 ? `${warningCount}/3 Warnings` : "Clean"}
              </span>
            </span>

            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Question</span>
              <span className="text-sm font-bold text-indigo-600">
                {currentIndex + 1} / {session.questions.length}
              </span>
            </div>
            <div className="text-right pl-3 border-l border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Time</span>
              <span className="text-sm font-bold font-mono text-slate-900">{questionElapsed}s</span>
            </div>
          </div>
        </div>

        {/* Live Speed Multiplier Flame / Energy Bar */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <div className="flex items-center gap-1.5">
              <span className={`text-sm ${isFlameHigh ? "animate-pulse" : ""}`}>
                {isFlameCooling ? "❄️" : "⚡"}
              </span>
              <span
                className={
                  isFlameHigh
                    ? "text-amber-600 font-extrabold"
                    : isFlameCooling
                    ? "text-slate-400 font-medium"
                    : "text-indigo-600"
                }
              >
                Speed Energy ({flameMultiplier} Boost)
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-500">
              {isFlameHigh
                ? "⚡ ULTRA FAST (<5s)"
                : isFlameCooling
                ? "❄️ Cooled Down (>15s)"
                : "⚡ Fast Answer"}
            </span>
          </div>

          {/* Meter progress bar */}
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200">
            <div
              className={`h-full transition-all duration-300 ease-out rounded-full ${
                isFlameHigh
                  ? "bg-gradient-to-r from-amber-400 to-rose-500 shadow-lg shadow-amber-300/50"
                  : isFlameCooling
                  ? "bg-slate-300"
                  : "bg-gradient-to-r from-indigo-500 to-amber-400"
              }`}
              style={{ width: `${flamePercentage}%` }}
            />
          </div>
        </div>

        {/* Question Card with Slide & Fade Animation */}
        <div
          key={currentQuestion.id}
          className={`bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-md space-y-6 transition-all duration-200 ${
            isTransitioning
              ? "opacity-60 translate-x-1"
              : "opacity-100 translate-x-0 animate-in fade-in slide-in-from-right-4 duration-300"
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>Points: {currentQuestion.points} pt</span>
            <span>Answered: {answeredCount} / {session.questions.length}</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
            {currentQuestion.question_text}
          </h2>

          {/* 4 Choices Radio Cards with Ripple/Wave Effect on Click */}
          <div className="space-y-3 pt-2">
            {currentQuestion.options.map((opt, idx) => {
              const isSelected = selectedAnswers[currentQuestion.id] === opt;
              const isClickedJustNow = selectedOptionTemp === opt;
              const letter = String.fromCharCode(65 + idx);

              return (
                <button
                  type="button"
                  key={idx}
                  disabled={isTransitioning || isSubmitting}
                  onClick={() => handleSelectChoice(currentQuestion.id, opt)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all duration-150 flex items-center gap-3 relative overflow-hidden group active:scale-[0.99] ${
                    isClickedJustNow
                      ? "border-amber-500 bg-amber-50 shadow-md ring-4 ring-amber-300/60 scale-[1.01]"
                      : isSelected
                      ? "border-indigo-600 bg-indigo-50/70 shadow-sm ring-2 ring-indigo-600"
                      : "border-slate-200 hover:border-indigo-400 hover:bg-slate-50/80 bg-white"
                  }`}
                >
                  {/* Subtle Wave Ripple Effect on Click */}
                  {isClickedJustNow && (
                    <span className="absolute inset-0 bg-amber-400/10 pointer-events-none animate-ping" />
                  )}

                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                      isClickedJustNow
                        ? "bg-amber-500 text-white"
                        : isSelected
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-100 text-slate-600 group-hover:bg-indigo-100 group-hover:text-indigo-700"
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
              Scripture Reference: {currentQuestion.explanation}
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-medium">
              {error}
            </div>
          )}

          {/* Navigation Controls */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium italic">
              ⚡ 1-Click Answer: Instant ripple feedback & slide transition
            </span>

            {isSubmitting && (
              <span className="text-xs font-bold text-indigo-600 animate-pulse flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
                Scoring Attempt...
              </span>
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
            Enter your display name to start the quiz. Scores are determined by both response speed and answer accuracy!
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

          {/* Explicit Security Rules Checklist Cards */}
          <div className="space-y-2.5 pt-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block text-left">
              Official Competition Rules & Anti-Cheat:
            </span>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-left flex items-start gap-3">
              <span className="text-base">🚫</span>
              <div>
                <p className="text-xs font-bold text-slate-800">Rule 1: No Tab Switching</p>
                <p className="text-[11px] text-slate-500">
                  Switching browser tabs or minimizing the window will trigger an instant security violation.
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-left flex items-start gap-3">
              <span className="text-base">🔒</span>
              <div>
                <p className="text-xs font-bold text-slate-800">Rule 2: Strictly 1 Attempt Per Device</p>
                <p className="text-[11px] text-slate-500">
                  Only 1 attempt is permitted from this IP address / device. Multiple attempts are blocked.
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-left flex items-start gap-3">
              <span className="text-base">🛡️</span>
              <div>
                <p className="text-xs font-bold text-slate-800">Rule 3: Background Tasks Blocked</p>
                <p className="text-[11px] text-slate-500">
                  Application notifications or active background apps stealing focus will trigger a warning.
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-left flex items-start gap-3">
              <span className="text-base">👆</span>
              <div>
                <p className="text-xs font-bold text-slate-800">Rule 4: Long-Pressing Screen Prohibited</p>
                <p className="text-[11px] text-slate-500">
                  Holding/long pressing on the screen (&gt;2.5s) for Circle to Search or AI assistance triggers a warning. 3 warnings disqualifies.
                </p>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isJoining}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-md transition disabled:opacity-50"
          >
            {isJoining ? "Entering Quiz..." : "Accept Rules & Enter Quiz in Fullscreen →"}
          </button>
        </form>
      </div>
    </div>
  );
}
