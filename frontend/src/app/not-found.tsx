import React from "react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center text-center px-4">
      <h2 className="text-4xl font-extrabold text-indigo-600 mb-2">404</h2>
      <h3 className="text-xl font-bold text-slate-900 mb-2">Page Not Found</h3>
      <p className="text-sm text-slate-600 max-w-md mb-6">
        The requested resource or page does not exist on this platform.
      </p>
      <Link
        href="/"
        className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition"
      >
        Return to Home
      </Link>
    </div>
  );
}
