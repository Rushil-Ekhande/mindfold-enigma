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
      className="relative bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all hover-shake"
      style={{ minHeight: "220px" }}
    >
      <style jsx>{`
        @keyframes wave-flow {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        @keyframes shake {
          0%,
          100% {
            transform: translateX(0) rotate(0deg);
          }
          25% {
            transform: translateX(-2px) rotate(-0.5deg);
          }
          75% {
            transform: translateX(2px) rotate(0.5deg);
          }
        }
        .wave-layer {
          animation: wave-flow 10s linear infinite;
          will-change: transform;
        }
        .wave-layer-2 {
          animation: wave-flow 15s linear infinite;
          will-change: transform;
        }
        .hover-shake:hover {
          animation: shake 0.5s ease-in-out infinite;
        }
      `}</style>

      {/* Wave Background Container */}
      <div
        className="absolute inset-x-0 bottom-0 overflow-hidden"
        style={{
          height: `${value}%`,
        }}
      >
        {/* First wave layer */}
        <div className="absolute inset-x-0 bottom-0" style={{ height: "60px" }}>
          <svg
            className="wave-layer absolute"
            style={{
              bottom: 0,
              left: 0,
              width: "200%",
              height: "100%",
            }}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1440 120"
            preserveAspectRatio="none"
          >
            <path
              fill={waveColors.primary}
              fillOpacity="0.5"
              d="M0,60 C240,90 480,30 720,60 C960,90 1200,30 1440,60 L1440,120 L0,120 Z"
            />
            <path
              fill={waveColors.primary}
              fillOpacity="0.5"
              d="M1440,60 C1680,90 1920,30 2160,60 C2400,90 2640,30 2880,60 L2880,120 L1440,120 Z"
            />
          </svg>
        </div>

        {/* Second wave layer */}
        <div className="absolute inset-x-0 bottom-0" style={{ height: "50px" }}>
          <svg
            className="wave-layer-2 absolute"
            style={{
              bottom: 0,
              left: 0,
              width: "200%",
              height: "100%",
            }}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1440 100"
            preserveAspectRatio="none"
          >
            <path
              fill={waveColors.secondary}
              fillOpacity="0.6"
              d="M0,50 C320,70 640,30 960,50 C1280,70 1440,30 1440,50 L1440,100 L0,100 Z"
            />
            <path
              fill={waveColors.secondary}
              fillOpacity="0.6"
              d="M1440,50 C1760,70 2080,30 2400,50 C2720,70 2880,30 2880,50 L2880,100 L1440,100 Z"
            />
          </svg>
        </div>
      </div>

      {/* Content - positioned above waves */}
      <div className="relative z-10 p-5 flex flex-col h-full justify-between">
        <div className="flex items-start justify-between">
          <div className="text-3xl font-bold" style={{ color: textColor }}>
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
