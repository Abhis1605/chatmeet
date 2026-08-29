"use client";

import { motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useImagePreview } from "@/components/ui/ImagePreviewModal";

const ease = [0.16, 1, 0.3, 1] as const;

export default function RoomsVsGroups() {
  const prefersReducedMotion = useReducedMotion();
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const { open } = useImagePreview();

  useEffect(() => {
    const syncTheme = () => {
      const root = document.documentElement;
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const darkActive = root.classList.contains("dark") || (!root.classList.contains("light") && prefersDark);
      setIsDarkTheme(darkActive);
    };

    syncTheme();

    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect();
  }, []);

  const groupsMockup = isDarkTheme ? "/group-dark-mockup.png" : "/group-light-mockup.png";
  const roomsMockup = isDarkTheme ? "/room-dark-mockup.png" : "/room-light-mockup.png";

  const revealProps = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 18 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.3 },
        transition: { duration: 0.55, ease },
      };

  return (
    <motion.section
      initial={prefersReducedMotion ? false : { opacity: 0, y: 32 }}
      whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="overflow-hidden px-4 py-20 md:px-8 lg:py-28"
      aria-labelledby="rooms-vs-groups-heading"
      id="rooms-group-section"
    >
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-start gap-4 lg:gap-10 min-[860px]:grid-cols-[45fr_55fr] min-[860px]:gap-48">
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
          className="self-start pt-0 lg:pt-15 text-sm leading-relaxed text-muted md:text-xl"
        >
          One is built for people who belong. The other is built for people who want to drop in.
        </motion.p>
      </div>

      <div className="mx-auto mt-14 max-w-7xl">
        <div className="relative mx-auto grid max-w-[1200px] grid-cols-1 items-start gap-x-16 gap-y-12 md:grid-cols-2">
          <motion.div
            {...revealProps}
            transition={prefersReducedMotion ? undefined : { duration: 0.6, ease, delay: 0.05 }}
            className="w-full md:w-[98%]"
          >
            <button
              type="button"
              onClick={() => open({ src: groupsMockup, alt: "Groups mockup" })}
              className="group block w-full cursor-pointer overflow-hidden rounded-[1.4rem] border border-border shadow-[0_1px_0_rgba(0,0,0,0.05),0_22px_44px_rgba(0,0,0,0.08)] transition-transform duration-200 hover:scale-[1.01]"
              aria-label="Open Groups mockup preview"
            >
              <Image
                src={groupsMockup}
                alt="Groups mockup"
                width={980}
                height={720}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 60vw, 58vw"
                className="h-auto w-full"
              />
            </button>
          </motion.div>

          <motion.div
            {...revealProps}
            transition={prefersReducedMotion ? undefined : { duration: 0.65, ease, delay: 0.15 }}
            className="w-full md:ml-auto md:mt-24 md:w-[98%] lg:mt-28"
          >
            <button
              type="button"
              onClick={() => open({ src: roomsMockup, alt: "Rooms mockup" })}
              className="group block w-full cursor-pointer overflow-hidden rounded-[1.4rem] border border-border shadow-[0_1px_0_rgba(0,0,0,0.05),0_22px_44px_rgba(0,0,0,0.08)] transition-transform duration-200 hover:scale-[1.01]"
              aria-label="Open Rooms mockup preview"
            >
              <Image
                src={roomsMockup}
                alt="Rooms mockup"
                width={1020}
                height={740}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 72vw, 64vw"
                className="h-auto w-full"
              />
            </button>
          </motion.div>

          <motion.div
            {...revealProps}
            transition={prefersReducedMotion ? undefined : { duration: 0.6, ease, delay: 0.18 }}
            className="pointer-events-none absolute left-1/2 top-[38%] z-10 hidden -translate-x-1/2 md:flex"
            aria-label="Versus"
          >
            <motion.div
              animate={
                prefersReducedMotion
                  ? undefined
                  : {
                      scale: [1, 1.08, 1],
                      boxShadow: [
                        "0 0 0 0 rgba(86, 145, 118, 0.25)",
                        "0 0 0 10px rgba(86, 145, 118, 0.08)",
                        "0 0 0 0 rgba(86, 145, 118, 0)"
                      ]
                    }
              }
              transition={
                prefersReducedMotion
                  ? undefined
                  : { duration: 2.2, ease: "easeInOut", repeat: Infinity }
              }
              className="flex h-12 w-12 items-center justify-center rounded-full border border-primary/30 bg-background shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
            >
              <span className="flex items-center justify-center leading-none text-[0.62rem] font-semibold tracking-[0.2em] text-foreground">
                VS
              </span>
            </motion.div>
          </motion.div>
        </div>
      </div>

      <motion.p
        initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
        whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.6, ease, delay: 0.12 }}
        className="mx-auto mt-10 max-w-4xl text-center font-heading text-2xl leading-tight tracking-tight text-foreground md:text-4xl"
      >
        Different spaces. <span className="text-primary">Same conversation experience.</span>
      </motion.p>
    </motion.section>
  );
}
