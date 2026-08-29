"use client";

import { motion, useReducedMotion } from "motion/react";
import FanFeatureDeck from "@/components/landing/FanFeatureDeck";

export default function FeaturesSection() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.section
      id="features"
      aria-labelledby="features-heading"
      initial={prefersReducedMotion ? false : { opacity: 0, y: 32 }}
      whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="overflow-hidden bg-[#0b110f] px-4 py-20 text-white md:px-8 lg:py-20"
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 items-start gap-6 lg:gap-40 min-[860px]:grid-cols-[45fr_55fr] min-[860px]:gap-14">
          <h2 id="features-heading" className="max-w-xl font-heading text-2xl font-bold leading-tight tracking-tight text-white md:text-6xl">
            Everything you need to <span className="text-primary">stay connected</span>
          </h2>
          <p className="max-w-xl text-base leading-relaxed text-white/70 md:text-xl">
            Everything you need for meaningful conversations, from private chats and open rooms to real-time calls, sharing, and privacy controls that stay in your hands.
          </p>
        </div>

        <div className="mx-auto flex w-full justify-center pt-8 lg:pt-0">
          <FanFeatureDeck />
        </div>
      </div>
    </motion.section>
  );
}
