"use client";

import { AlertCircle, Info } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { t } from "@/lib/translations";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DisclaimerProps {
  className?: string;
  variant?: "info" | "warning";
}

export function Disclaimer({ className, variant = "info" }: DisclaimerProps) {
  const isWarning = variant === "warning";

  return (
    <div
      className={cn(
        "p-5 rounded-xl border flex items-start gap-3.5 text-sm leading-relaxed",
        isWarning
          ? "bg-rose-50 border-rose-200 text-rose-900"
          : "bg-blue-50 border-blue-200 text-blue-900",
        className
      )}
    >
      {isWarning ? (
        <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
      ) : (
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
      )}
      
      <div>
        <p className="font-semibold mb-1.5 text-xs uppercase tracking-wide">
          {t.legalDisclaimer}
        </p>
        <p className={cn(
          "leading-relaxed",
          isWarning ? "text-rose-800" : "text-blue-800"
        )}>
          {t.disclaimerText}
        </p>
      </div>
    </div>
  );
}