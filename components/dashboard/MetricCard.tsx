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
        {/* First wave layer - fills entire container */}
        <div className="absolute inset-0">
          <svg
            className="wave-layer absolute"
            style={{
              top: 0,
              left: 0,
              width: "200%",
              height: "100%",
            }}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1440 320"
            preserveAspectRatio="none"
          >
            <path
              fill={waveColors.primary}
              fillOpacity="0.8"
              d="M0,80 C240,120 480,40 720,80 C960,120 1200,40 1440,80 L1440,320 L0,320 Z"
            />
            <path
              fill={waveColors.primary}
              fillOpacity="0.8"
              d="M1440,80 C1680,120 1920,40 2160,80 C2400,120 2640,40 2880,80 L2880,320 L1440,320 Z"
            />
          </svg>
        </div>

        {/* Second wave layer - fills entire container */}
        <div className="absolute inset-0">
          <svg
            className="wave-layer-2 absolute"
            style={{
              top: 0,
              left: 0,
              width: "200%",
              height: "100%",
            }}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1440 320"
            preserveAspectRatio="none"
          >
            <path
              fill={waveColors.secondary}
              fillOpacity="0.7"
              d="M0,70 C320,100 640,40 960,70 C1280,100 1440,40 1440,70 L1440,320 L0,320 Z"
            />
            <path
              fill={waveColors.secondary}
              fillOpacity="0.7"
              d="M1440,70 C1760,100 2080,40 2400,70 C2720,100 2880,40 2880,70 L2880,320 L1440,320 Z"
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
