"use client";

import { motion, useReducedMotion } from "motion/react";

const ease = [0.16, 1, 0.3, 1] as const;

export default function RoomsVsGroups() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.section
      initial={prefersReducedMotion ? false : { opacity: 0, y: 32 }}
      whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="px-4 py-20 md:px-8 lg:py-28"
      aria-labelledby="rooms-vs-groups-heading"
    >
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-start gap-10 min-[860px]:grid-cols-[45fr_55fr] min-[860px]:gap-48">
        <div className="min-w-0">
          <motion.p
            initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
            whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.5, ease }}
            className="text-lg font-semibold text-primary"
          >
            Rooms vs Groups
          </motion.p>

          <motion.h2
            id="rooms-vs-groups-heading"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
            whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.5, delay: 0.1, ease }}
            className="mt-4 max-w-xl font-heading text-2xl font-bold leading-tight tracking-tight md:text-6xl"
          >
            Two ways to bring <span className="text-primary">people together</span>
          </motion.h2>
        </div>

        <motion.p
          initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
          whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.5, delay: 0.2, ease }}
          className="self-start pt-15 text-sm leading-relaxed text-muted md:text-xl"
        >
          One is built for people who belong. The other is built for people who want to drop in.
        </motion.p>
      </div>

      <div className="mx-auto mt-12 grid max-w-7xl grid-cols-1 gap-4 md:grid-cols-2">{/* TODO: Rooms and Groups mockups go here */}</div>
    </motion.section>
  );
}
