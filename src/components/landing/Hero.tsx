"use client";

import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from "motion/react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useEffect } from "react";

// Each blob gets its own depth multiplier for a subtle parallax spread.
const BLOB_DEPTH = {
  blob1: { x: 40, y: 24 },
  blob2: { x: -55, y: 30 },
  blob3: { x: 45, y: -35 },
};

export default function Hero() {
  const prefersReducedMotion = useReducedMotion();

  // Cursor offset from viewport center, normalized to [-1, 1].
  const cursorX = useMotionValue(0);
  const cursorY = useMotionValue(0);
  const springConfig = { stiffness: 60, damping: 20, mass: 0.5 };
  const springX = useSpring(cursorX, springConfig);
  const springY = useSpring(cursorY, springConfig);

  const blob1X = useTransform(springX, (v) => v * BLOB_DEPTH.blob1.x);
  const blob1Y = useTransform(springY, (v) => v * BLOB_DEPTH.blob1.y);
  const blob2X = useTransform(springX, (v) => v * BLOB_DEPTH.blob2.x);
  const blob2Y = useTransform(springY, (v) => v * BLOB_DEPTH.blob2.y);
  const blob3X = useTransform(springX, (v) => v * BLOB_DEPTH.blob3.x);
  const blob3Y = useTransform(springY, (v) => v * BLOB_DEPTH.blob3.y);

  useEffect(() => {
    if (prefersReducedMotion) return;

    const handleMouseMove = (e: MouseEvent) => {
      cursorX.set((e.clientX / window.innerWidth - 0.5) * 2);
      cursorY.set((e.clientY / window.innerHeight - 0.5) * 2);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [prefersReducedMotion, cursorX, cursorY]);

  return (
    <section className="relative h-screen flex flex-col justify-center items-center text-center px-4 overflow-hidden pt-20">

      {/* Animated blob-gradient background */}
      <div className="hero-bg">
        <motion.div
          className="hero-blob hero-blob-1"
          style={prefersReducedMotion ? undefined : { x: blob1X, y: blob1Y }}
        />
        <motion.div
          className="hero-blob hero-blob-2"
          style={prefersReducedMotion ? undefined : { x: blob2X, y: blob2Y }}
        />
        <motion.div
          className="hero-blob hero-blob-3"
          style={prefersReducedMotion ? undefined : { x: blob3X, y: blob3Y }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="max-w-4xl space-y-6"
      >
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1]">
          Connect instantly. Call freely.
          <br />
          <span className="text-primary">Own your space.</span>
        </h1>

        <p className="text-lg md:text-xl text-muted max-w-2xl mx-auto leading-relaxed">
          A privacy-first messaging platform built for real-time chats, crystal-clear calls, and open drop-in rooms—no noise, no clutter, just connection that works.
        </p>

        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Link href="/chat" className="btn-primary flex items-center gap-2 px-8 py-4 text-base rounded-full group w-full sm:w-auto justify-center">
            Start chatting free
            <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
          </Link>
          <Link href="#features" className="btn-secondary flex items-center justify-center px-8 py-4 text-base rounded-full w-full sm:w-auto">
            See how it works
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}
