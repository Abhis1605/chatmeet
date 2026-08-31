"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { LucideIcon } from "lucide-react";
import {
  Code2,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  Users,
  Video,
} from "lucide-react";
import { useEffect, useState } from "react";

const transition = { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const };

interface FeatureCardData {
  title: string;
  description: string;
  icon: LucideIcon;
}

const FEATURES: FeatureCardData[] = [
  {
    title: "Direct Messages",
    description: "Private conversations that feel instant, focused, and easy to revisit later.",
    icon: MessageSquareText,
  },
  {
    title: "Group Chats",
    description: "Keep the room together with shared updates, organized threads, and real-time replies.",
    icon: Users,
  },
  {
    title: "Code-Based Rooms",
    description: "Drop into invite-only spaces with a short code and start collaborating in seconds.",
    icon: Code2,
  },
  {
    title: "Video Calls",
    description: "Jump from chat to video call without losing context, history, or momentum.",
    icon: Video,
  },
  {
    title: "Privacy Controls",
    description: "Choose what stays visible and keep the right level of control in every conversation.",
    icon: ShieldCheck,
  },
  {
    title: "Personalization",
    description: "Tailor chat mood, visibility, and interaction patterns to match your workflow.",
    icon: Sparkles,
  },
];

interface CardFaceProps {
  feature: FeatureCardData;
  descriptionVisible: boolean;
  className?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  iconClassName?: string;
  compact?: boolean;
}

function CardFace({
  feature,
  descriptionVisible,
  className = "",
  titleClassName = "",
  descriptionClassName = "",
  iconClassName = "",
  compact = false,
}: CardFaceProps) {
  const prefersReducedMotion = useReducedMotion();
  const Icon = feature.icon;

  return (
    <div
      className={[
        "relative flex h-full w-full flex-col overflow-hidden rounded-3xl border border-white/8 bg-[#0b0c0d] shadow-[0_22px_70px_rgba(0,0,0,0.38)]",
        "bg-[linear-gradient(180deg,rgba(255,255,255,0.05),transparent_45%)]",
        "before:absolute before:inset-0 before:bg-[repeating-linear-gradient(to_bottom,rgba(255,255,255,0.025)_0,rgba(255,255,255,0.025)_1px,transparent_1px,transparent_22px),repeating-linear-gradient(to_right,rgba(255,255,255,0.025)_0,rgba(255,255,255,0.025)_1px,transparent_1px,transparent_22px)] before:content-['']",
        className,
      ].join(" ")}
      style={{
        backgroundColor: "#0b0c0d",
      }}
    >
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-5 text-center">
        <div
          className={[
            "mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/4 text-[#cfeae0] shadow-sm",
            iconClassName,
          ].join(" ")}
        >
          <Icon className={compact ? "h-6 w-6" : "h-7 w-7"} strokeWidth={1.9} />
        </div>

        <h3
          className={[
            "tracking-[-0.03em] text-[#f4f4f3]",
            compact ? "text-base" : "text-lg",
            titleClassName,
          ].join(" ")}
        >
          {feature.title}
        </h3>

        <motion.p
          aria-hidden={!descriptionVisible}
          animate={
            prefersReducedMotion
              ? { opacity: descriptionVisible ? 1 : 0 }
              : { opacity: descriptionVisible ? 1 : 0, y: descriptionVisible ? 0 : 8 }
          }
          transition={{
            duration: prefersReducedMotion ? 0.12 : 0.5,
            ease: [0.16, 1, 0.3, 1],
            delay: prefersReducedMotion ? 0 : 0.05,
          }}
          className={[
            "pointer-events-none absolute inset-x-5 bottom-6 text-sm leading-relaxed text-[#e7e7e7]",
            descriptionClassName,
          ].join(" ")}
        >
          {feature.description}
        </motion.p>
      </div>
    </div>
  );
}

export default function FanFeatureDeck() {
  const prefersReducedMotion = useReducedMotion();
  const [hovered, setHovered] = useState<number | null>(null);
  const [mobileIndex, setMobileIndex] = useState(0);
  const [mobileDirection, setMobileDirection] = useState(1);
  const mid = (FEATURES.length - 1) / 2;

  useEffect(() => {
    if (prefersReducedMotion) return;

    const timer = window.setInterval(() => {
      setMobileDirection(1);
      setMobileIndex((prev) => (prev + 1) % FEATURES.length);
    }, 4000);

    return () => window.clearInterval(timer);
  }, [mobileIndex, prefersReducedMotion]);

  const goToIndex = (nextIndex: number, direction: number) => {
    setMobileDirection(direction);
    setMobileIndex(nextIndex);
  };

  const currentFeature = FEATURES[mobileIndex];

  return (
    <>
      <div
        className="hidden md:flex"
        onMouseLeave={() => setHovered(null)}
      >
        <div className="mx-auto flex h-85 w-full max-w-225 items-end justify-center overflow-visible sm:h-95 md:h-105">
          {FEATURES.map((feature, index) => {
            const baseRotate = (index - mid) * 6;
            const baseY = Math.abs(index - mid) * 14;
            const isHovered = hovered === index;
            const dist = Math.abs(index - (hovered ?? index));
            const isLeft = hovered !== null && index < (hovered ?? index);

            const animate = prefersReducedMotion
              ? {
                  opacity: hovered === null || isHovered ? 1 : 0.55,
                  zIndex: isHovered ? 50 : index + 1,
                }
              : {
                  rotate: isHovered ? 0 : baseRotate,
                  y: isHovered ? -28 : baseY,
                  x:
                    hovered === null
                      ? 0
                      : (isLeft ? -1 : 1) * (60 + dist * 14),
                  scale: isHovered ? 1.08 : hovered === null ? 1 : 0.94,
                  opacity: hovered === null ? 1 : isHovered ? 1 : 0.55,
                  zIndex: isHovered ? 50 : index + 1,
                };

            return (
              <motion.article
                key={feature.title}
                onMouseEnter={() => setHovered(index)}
                initial={false}
                animate={animate}
                transition={transition}
                className="relative shrink-0 overflow-hidden rounded-3xl"
                style={{
                  width: "240px",
                  height: "320px",
                  marginLeft: index === 0 ? 0 : -110,
                  transformOrigin: "center bottom",
                }}
              >
                <CardFace
                  feature={feature}
                  descriptionVisible={isHovered}
                  className="h-full w-full"
                  titleClassName="text-[1.05rem]"
                  descriptionClassName="text-[0.83rem]"
                  compact
                />
              </motion.article>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col items-center md:hidden">
        <div className="relative flex h-77.5 w-75 items-center justify-center overflow-hidden sm:w-[320px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentFeature.title}
              initial={
                prefersReducedMotion
                  ? false
                  : {
                      x: mobileDirection > 0 ? 40 : -40,
                      opacity: 0,
                    }
              }
              animate={prefersReducedMotion ? { opacity: 1 } : { x: 0, opacity: 1 }}
              exit={
                prefersReducedMotion
                  ? { opacity: 0 }
                  : {
                      x: mobileDirection > 0 ? -40 : 40,
                      opacity: 0,
                    }
              }
              transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="h-72.5 w-75 sm:w-[320px]"
            >
              <CardFace
                feature={currentFeature}
                descriptionVisible={true}
                className="h-full w-full"
                titleClassName="text-[1.05rem]"
                descriptionClassName="text-[0.82rem]"
                compact
              />
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-5 flex items-center gap-4">
          <button
            type="button"
            aria-label="Previous feature"
            onClick={() => {
              if (prefersReducedMotion) {
                goToIndex(mobileIndex === 0 ? FEATURES.length - 1 : mobileIndex - 1, -1);
                return;
              }
              goToIndex(mobileIndex === 0 ? FEATURES.length - 1 : mobileIndex - 1, -1);
            }}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/4 text-white/90 transition hover:bg-white/8"
          >
            <span aria-hidden="true">‹</span>
          </button>

          <span className="min-w-14.5 text-center text-sm text-white/70">
            {mobileIndex + 1} / {FEATURES.length}
          </span>

          <button
            type="button"
            aria-label="Next feature"
            onClick={() => goToIndex((mobileIndex + 1) % FEATURES.length, 1)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/4 text-white/90 transition hover:bg-white/8"
          >
            <span aria-hidden="true">›</span>
          </button>
        </div>
      </div>
    </>
  );
}
