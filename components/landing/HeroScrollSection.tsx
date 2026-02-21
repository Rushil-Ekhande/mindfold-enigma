// ============================================================================
// Landing Page — Hero Scroll Animation Section
// ============================================================================

"use client";

import React from "react";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";

export default function HeroScrollSection() {
  return (
    <div
      className="flex flex-col bg-white"
      style={{ overflowX: "hidden" }}
    >
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
        <img
          src="/dashboard-preview.png"
          alt="Mindfold dashboard preview"
          width={1280}
          height={720}
          className="rounded-2xl"
          style={{
            display: "block",
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "left top",
            position: "relative",
            zIndex: 1,
          }}
        />
      </ContainerScroll>

      {/* Static fallback if JS/Framer Motion never initialises */}
      <noscript>
        <div style={{ maxWidth: "80rem", margin: "0 auto", padding: "2rem" }}>
          <img
            src="/dashboard-preview.png"
            alt="Mindfold dashboard preview"
            width={1280}
            height={720}
            style={{ width: "100%", height: "auto", borderRadius: "1rem" }}
          />
        </div>
      </noscript>
    </div>
  );
}
