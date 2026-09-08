"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";

export default function FinalCTA() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.section
      id="final-cta"
      aria-labelledby="final-cta-heading"
      initial={prefersReducedMotion ? false : { opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="relative isolate overflow-hidden bg-[linear-gradient(115deg,var(--section-background)_0%,color-mix(in_srgb,var(--section-background)_78%,var(--primary-soft))_46%,var(--background)_100%)] px-4 py-24 md:px-8 md:py-36"
    >
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-x-1/4 -top-1/2 -z-10 h-[170%] rotate-[-14deg] bg-[linear-gradient(112deg,transparent_12%,color-mix(in_srgb,var(--primary-soft)_68%,var(--section-background))_39%,color-mix(in_srgb,var(--primary)_24%,transparent)_58%,transparent_79%)] blur-3xl"
        initial={prefersReducedMotion ? false : { opacity: 0, y: 28 }}
        whileInView={{ opacity: 0.9, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -right-1/3 -top-1/4 -z-10 h-[145%] w-[105%] rotate-17 bg-[linear-gradient(123deg,transparent_18%,color-mix(in_srgb,var(--primary)_22%,var(--background))_43%,color-mix(in_srgb,var(--primary-soft)_42%,transparent)_67%,transparent_88%)] blur-2xl"
        initial={prefersReducedMotion ? false : { opacity: 0, y: 36 }}
        whileInView={{ opacity: 0.72, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 1.3, delay: prefersReducedMotion ? 0 : 0.08, ease: "easeOut" }}
      />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-2/3 left-[-16%] -z-10 h-[125%] w-[88%] rotate-25 bg-[linear-gradient(104deg,transparent_24%,color-mix(in_srgb,var(--foreground)_8%,var(--primary-soft))_52%,color-mix(in_srgb,var(--primary)_18%,transparent)_72%,transparent_91%)] blur-3xl dark:opacity-75"
        initial={prefersReducedMotion ? false : { opacity: 0, y: 42 }}
        whileInView={{ opacity: 0.56, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 1.1, delay: prefersReducedMotion ? 0 : 0.16, ease: "easeOut" }}
      />

      <div className="relative mx-auto max-w-7xl text-center">
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mx-auto max-w-3xl"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Ready to connect?</p>
          <h2 id="final-cta-heading" className="mt-5 font-heading text-3xl font-bold leading-tight tracking-tight text-foreground md:text-6xl">
            Start the conversation.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-muted md:text-base">
            Create a space, invite the right people, and stay connected through conversations and calls.
          </p>
        </motion.div>

        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.5, delay: prefersReducedMotion ? 0 : 0.16, ease: "easeOut" }}
          className="relative mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Link href="/register" className="btn-primary flex w-full items-center justify-center px-6 py-3 text-sm sm:w-auto">
            Get started
          </Link>
          <Link href="/chat" className="btn-secondary flex w-full items-center justify-center px-6 py-3 text-sm sm:w-auto">
            Explore the platform
          </Link>
        </motion.div>
      </div>
    </motion.section>
  );
}
