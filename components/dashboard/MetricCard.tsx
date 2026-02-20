"use client";

import { Brain, Smile, Target, Flame, AlertTriangle } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: number;
  iconName: string;
  color: string;
  bg: string;
  description: string;
}

export default function MetricCard({
  label,
  value,
  iconName,
  color,
  bg,
  description,
}: MetricCardProps) {
  // Map icon names to components
  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    Brain,
    Smile,
    Target,
    Flame,
    AlertTriangle,
  };

  const Icon = iconMap[iconName] || Brain;
  // Map color classes to hex values
  const colorMap: Record<string, string> = {
    "text-purple-600": "#9333ea",
    "text-green-600": "#16a34a",
    "text-orange-600": "#ea580c",
    "text-blue-600": "#2563eb",
    "text-red-600": "#dc2626",
  };

  // Map background classes to wave colors
  const waveColorMap: Record<string, { primary: string; secondary: string }> = {
    "bg-purple-50": { primary: "#c084fc", secondary: "#a855f7" },
    "bg-green-50": { primary: "#4ade80", secondary: "#22c55e" },
    "bg-orange-50": { primary: "#fb923c", secondary: "#f97316" },
    "bg-blue-50": { primary: "#60a5fa", secondary: "#3b82f6" },
    "bg-red-50": { primary: "#f87171", secondary: "#ef4444" },
  };

  const waveColors = waveColorMap[bg] || {
    primary: "#f3f4f6",
    secondary: "#e5e7eb",
  };
  const textColor = colorMap[color] || "#6b7280";

  return (
    <div
      className="relative bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
      style={{ minHeight: "280px" }}
    >
      <style jsx>{`
        @keyframes wave {
          0% {
            transform: translateX(0) translateZ(0) scaleY(1);
          }
          50% {
            transform: translateX(-25%) translateZ(0) scaleY(0.8);
          }
          100% {
            transform: translateX(-50%) translateZ(0) scaleY(1);
          }
        }
        .wave {
          animation: wave 3s cubic-bezier(0.36, 0.45, 0.63, 0.53) infinite;
          transform: translate3d(0, 0, 0);
        }
        .wave:nth-of-type(2) {
          animation-duration: 4s;
          animation-direction: reverse;
          opacity: 0.6;
        }
      `}</style>

      {/* Wave Background */}
      <div
        className="absolute inset-x-0 bottom-0"
        style={{
          height: `${value}%`,
          background: waveColors.primary,
          opacity: 0.7,
        }}
      >
        {/* Single wave animation at the top edge */}
        <svg
          className="wave absolute"
          style={{
            top: "-50px",
            left: 0,
            width: "200%",
            height: "120px",
          }}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
        >
          <path
            fill={waveColors.primary}
            fillOpacity="1"
            d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,138.7C960,139,1056,117,1152,101.3C1248,85,1344,75,1392,69.3L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          />
        </svg>
      </div>

      {/* Content - positioned above waves */}
      <div className="relative z-10 p-6 flex flex-col h-full justify-between">
        <div className="flex items-start justify-between">
          <div className="text-4xl font-bold" style={{ color: textColor }}>
            {value}%
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-900">{label}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
