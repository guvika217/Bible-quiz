import React from "react";

interface StatusBadgeProps {
  status: "healthy" | "ready" | "loading" | "error" | "offline";
  label?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label }) => {
  const configs = {
    healthy: "bg-emerald-50 text-emerald-700 border-emerald-200",
    ready: "bg-blue-50 text-blue-700 border-blue-200",
    loading: "bg-amber-50 text-amber-700 border-amber-200 animate-pulse",
    error: "bg-rose-50 text-rose-700 border-rose-200",
    offline: "bg-slate-100 text-slate-700 border-slate-200",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${configs[status]}`}
    >
      <span className="w-2 h-2 rounded-full bg-current" />
      {label || status.toUpperCase()}
    </span>
  );
};
