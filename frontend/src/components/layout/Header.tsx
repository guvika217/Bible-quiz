import React from "react";
import Link from "next/link";

export const Header: React.FC = () => {
  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
            ✝
          </div>
          <span className="font-bold text-xl text-slate-900 tracking-tight">
            BibleQuiz<span className="text-indigo-600">.Enterprise</span>
          </span>
        </Link>

        <nav className="flex items-center gap-6">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
            System Online
          </span>
          <a
            href="http://localhost:8000/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors"
          >
            API Docs ↗
          </a>
        </nav>
      </div>
    </header>
  );
};
