"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export const FloatingRefreshButton: React.FC = () => {
  const router = useRouter();
  const [isRotating, setIsRotating] = useState(false);

  const handleRefresh = () => {
    setIsRotating(true);
    router.refresh();
    setTimeout(() => {
      setIsRotating(false);
    }, 700);
  };

  return (
    <div className="fixed top-20 right-4 sm:right-6 z-50">
      <button
        type="button"
        onClick={handleRefresh}
        title="Refresh Page Data"
        aria-label="Refresh Page Data"
        className="group flex items-center gap-1.5 px-3 py-2 bg-white/90 hover:bg-white text-slate-700 hover:text-indigo-600 border border-slate-200/80 hover:border-indigo-300 rounded-full shadow-lg hover:shadow-xl backdrop-blur-md transition-all duration-200 cursor-pointer text-xs font-semibold"
      >
        <svg
          className={`w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-600 transition-transform duration-700 ${
            isRotating ? "rotate-180 text-indigo-600" : "group-hover:rotate-45"
          }`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        <span className="hidden sm:inline font-medium text-[11px]">
          {isRotating ? "Refreshing..." : "Refresh"}
        </span>
      </button>
    </div>
  );
};
