"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import confetti from "canvas-confetti";

interface ScratchRevealCardProps {
  score: number;
  maxScore: number;
  accuracy: number;
  totalTime: number;
}

export const ScratchRevealCard: React.FC<ScratchRevealCardProps> = ({
  score,
  maxScore,
  accuracy,
  totalTime,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const isDrawingRef = useRef(false);
  const scratchedPixelsRef = useRef(0);
  const totalPixelsRef = useRef(0);

  // Trigger celebration confetti
  const triggerConfetti = useCallback(() => {
    // Left & Right celebratory cannons
    const count = 200;
    const defaults = {
      origin: { y: 0.7 },
      zIndex: 9999,
    };

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    fire(0.25, {
      spread: 26,
      startVelocity: 55,
      colors: ["#6366f1", "#a855f7", "#ec4899"],
    });
    fire(0.2, {
      spread: 60,
      colors: ["#eab308", "#22c55e", "#3b82f6"],
    });
    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8,
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      colors: ["#ffd700", "#ff69b4"],
      scalar: 1.2,
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 45,
    });
  }, []);

  // Initialize scratch foil canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    totalPixelsRef.current = width * height;

    // Draw shimmering metallic foil
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#4f46e5");
    gradient.addColorStop(0.3, "#7c3aed");
    gradient.addColorStop(0.6, "#c084fc");
    gradient.addColorStop(1, "#4338ca");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Decorative pattern & prompt
    ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
    for (let i = 0; i < width; i += 24) {
      for (let j = 0; j < height; j += 24) {
        ctx.fillRect(i, j, 12, 12);
      }
    }

    // Text on scratch card
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 15px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("✨ SCRATCH HERE TO REVEAL ✨", width / 2, height / 2 - 10);
    ctx.font = "11px sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    ctx.fillText("Rub or swipe across the card", width / 2, height / 2 + 14);
  }, []);

  const scratch = useCallback((x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas || isRevealed) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.fill();

    scratchedPixelsRef.current += 1;

    // After ~25 scratches or 45% cleared, automatically unveil and blast confetti
    if (scratchedPixelsRef.current > 20 && !isRevealed) {
      setIsRevealed(true);
      triggerConfetti();
    }
  }, [isRevealed, triggerConfetti]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDrawingRef.current = true;
    const rect = e.currentTarget.getBoundingClientRect();
    scratch(e.clientX - rect.left, e.clientY - rect.top);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    scratch(e.clientX - rect.left, e.clientY - rect.top);
  };

  const handlePointerUp = () => {
    isDrawingRef.current = false;
  };

  const handleDirectReveal = () => {
    if (!isRevealed) {
      setIsRevealed(true);
      triggerConfetti();
    }
  };

  return (
    <div className="relative max-w-sm mx-auto select-none">
      {/* Scratch Container Card */}
      <div className="relative w-full h-44 rounded-3xl overflow-hidden border-2 border-indigo-200 shadow-xl bg-gradient-to-br from-indigo-50 via-white to-violet-50 flex flex-col items-center justify-center p-4">
        {/* Hidden Result Underneath (Revealed on scratch) */}
        <div className="text-center space-y-1.5 w-full">
          <span className="text-2xl animate-bounce inline-block">🎉</span>
          <p className="text-[11px] font-black uppercase tracking-wider text-indigo-600">
            Certified Scripture Score
          </p>
          <div className="flex items-center justify-center gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {score.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-slate-400">/ {maxScore} pts</span>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2 text-xs font-semibold text-slate-600">
            <span className="bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Accuracy: {accuracy}%
            </span>
            <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full">
              Time: {totalTime}s
            </span>
          </div>
        </div>

        {/* Scratchable Canvas Overlay */}
        {!isRevealed && (
          <canvas
            ref={canvasRef}
            width={340}
            height={176}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            className="absolute inset-0 w-full h-full cursor-pointer touch-none z-10 transition-opacity duration-300"
          />
        )}
      </div>

      {/* Instant Reveal Fallback */}
      {!isRevealed && (
        <button
          type="button"
          onClick={handleDirectReveal}
          className="mt-3 text-xs font-semibold text-indigo-600 hover:text-indigo-800 underline transition cursor-pointer"
        >
          Or click here to instantly reveal results 🎊
        </button>
      )}
    </div>
  );
};
