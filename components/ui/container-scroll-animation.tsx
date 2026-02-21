"use client";
import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  useScroll,
  useTransform,
  motion,
  MotionValue,
  useReducedMotion,
} from "framer-motion";

export const ContainerScroll = ({
  titleComponent,
  children,
}: {
  titleComponent: string | React.ReactNode;
  children: React.ReactNode;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
  });

  const prefersReducedMotion = useReducedMotion();

  // ---------- Hydration-safe isMobile ----------
  // Start undefined so SSR never picks the wrong branch.
  const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined);

  // ---------- Animation readiness ----------
  // The 3D animation is treated as a progressive enhancement.
  // We render the card fully visible & static first, and only enable the
  // scroll-linked 3D transforms after confirming the client is ready.
  const [animationReady, setAnimationReady] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);

    // Small delay lets the GPU compositor settle before applying 3D transforms.
    // If reducedMotion is preferred we never enable the animation.
    if (!prefersReducedMotion) {
      const timer = setTimeout(() => setAnimationReady(true), 150);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("resize", checkMobile);
      };
    }

    return () => window.removeEventListener("resize", checkMobile);
  }, [prefersReducedMotion]);

  // ---------- Transform values ----------
  // When animation is NOT ready (or reduced-motion), everything stays at
  // the fully-visible "end" state so the card is never hidden.
  const shouldAnimate = animationReady && !prefersReducedMotion;

  const rotate = useTransform(
    scrollYProgress,
    [0, 1],
    shouldAnimate ? [20, 0] : [0, 0]
  );
  const scale = useTransform(
    scrollYProgress,
    [0, 1],
    shouldAnimate
      ? isMobile
        ? [0.7, 0.9]
        : [1.05, 1]
      : [1, 1]
  );
  const translate = useTransform(
    scrollYProgress,
    [0, 1],
    shouldAnimate ? [0, -100] : [0, 0]
  );

  return (
    <div
      className="h-[60rem] md:h-[80rem] flex items-center justify-center relative p-2 md:p-20"
      ref={containerRef}
      style={{ overflowX: "hidden" }}
    >
      <div
        className="py-10 md:py-40 w-full relative"
        style={{
          perspective: shouldAnimate ? "1000px" : "none",
        }}
      >
        <Header translate={translate} titleComponent={titleComponent} />
        <Card
          rotate={rotate}
          translate={translate}
          scale={scale}
          shouldAnimate={shouldAnimate}
        >
          {children}
        </Card>
      </div>
    </div>
  );
};

export const Header = ({
  translate,
  titleComponent,
}: {
  translate: MotionValue<number>;
  titleComponent: string | React.ReactNode;
}) => {
  return (
    <motion.div
      style={{ translateY: translate }}
      className="div max-w-5xl mx-auto text-center"
    >
      {titleComponent}
    </motion.div>
  );
};

export const Card = ({
  rotate,
  scale,
  children,
  shouldAnimate,
}: {
  rotate: MotionValue<number>;
  scale: MotionValue<number>;
  translate: MotionValue<number>;
  children: React.ReactNode;
  shouldAnimate: boolean;
}) => {
  return (
    <motion.div
      style={{
        rotateX: rotate,
        scale,
        boxShadow:
          "0 0 #0000004d, 0 9px 20px #0000004a, 0 37px 37px #00000042, 0 84px 50px #00000026, 0 149px 60px #0000000a, 0 233px 65px #00000003",
        willChange: shouldAnimate ? "transform" : "auto",
        // Force GPU layer creation & ensure card is always painted
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
        transformStyle: "preserve-3d",
      }}
      className="max-w-5xl -mt-12 mx-auto h-[30rem] md:h-[40rem] w-full border-4 border-[#6C6C6C] p-2 md:p-6 bg-[#222222] rounded-[30px] shadow-2xl"
    >
      <div
        className="h-full w-full rounded-2xl bg-gray-100 dark:bg-zinc-900 md:rounded-2xl md:p-4"
        style={{
          // Use 'clip' instead of 'overflow:hidden' to avoid the well-known
          // overflow-hidden + 3D-transform GPU compositing bug that makes
          // children invisible on certain hardware.
          overflow: "clip",
        }}
      >
        {children}
      </div>
    </motion.div>
  );
};
