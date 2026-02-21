// ============================================================================
// Landing Page — Hero Scroll Animation Section
// ============================================================================

"use client";

import React from "react";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";

export default function HeroScrollSection() {
  return (
    <div className="flex flex-col overflow-hidden bg-white">
      <ContainerScroll
        titleComponent={
          <>
            <h2 className="text-4xl font-semibold text-[#0a1128]">
              Experience the future of <br />
              <span className="text-4xl md:text-[6rem] font-bold mt-1 leading-none">
                Mental Wellness
              </span>
            </h2>
          </>
        }
      >
        <video
          src="/dashboard-demo.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full rounded-2xl object-cover object-left-top"
        />
      </ContainerScroll>
    </div>
  );
}

