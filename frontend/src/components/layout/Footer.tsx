import React from "react";

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-200 bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <p>© 2026 Bible Quiz Platform. All rights reserved.</p>
        <p>Interactive Scripture Knowledge & Live Competition Platform</p>
      </div>
    </footer>
  );
};
