// ============================================================================
// Landing Page — Hero Scroll Animation Section
// ============================================================================

"use client";

import React from "react";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import Image from "next/image";

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
        <Image
          src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1400&q=80"
          alt="Mindfold dashboard preview"
          height={720}
          width={1400}
          className="mx-auto rounded-2xl object-cover h-full object-left-top"
          draggable={false}
        />
      </ContainerScroll>
    </div>
  );
}
