"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  MessageSquare,
  FolderOpen,
  Video,
  Phone,
  Users,
  KeyRound,
  Zap,
  Circle,
  Moon,
  Lock,
  Image as ImageIcon,
  Mic,
  EyeOff,
  PhoneCall,
  CheckCheck,
  BellOff,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/* ── Feature items ────────────────────────────────────────────────────── */

interface FeatureItem {
  icon: LucideIcon;
  label: string;
}

const FEATURES: FeatureItem[] = [
  { icon: MessageSquare, label: "Direct Messages" },
  { icon: FolderOpen, label: "File Sharing" },
  { icon: Video, label: "Video Calls" },
  { icon: Users, label: "Group Chats" },
  { icon: KeyRound, label: "Code-Based Rooms" },
  { icon: Zap, label: "Real-Time Delivery" },
  { icon: Circle, label: "Live Presence" },
  { icon: Moon, label: "Dark Mode" },
  { icon: Lock, label: "Privacy Controls" },
  { icon: ImageIcon, label: "Image Sharing" },
  { icon: EyeOff, label: "Invisible Mode" },
  { icon: PhoneCall, label: "Group Calls" },
  { icon: CheckCheck, label: "Read Receipts" },
  { icon: BellOff, label: "Global Mute" },
];

/* ── Pill chip ────────────────────────────────────────────────────────── */

function Pill({ icon: Icon, label }: FeatureItem) {
  return (
    <span className="flex items-center gap-2 whitespace-nowrap rounded-full border border-border bg-muted/50 px-4 py-2 text-sm font-medium text-foreground/80">
      <Icon className="h-4 w-4 opacity-80" strokeWidth={1.75} />
      {label}
    </span>
  );
}

/* ── FeatureMarquee ───────────────────────────────────────────────────── */

export default function FeatureMarquee() {
  const prefersReducedMotion = useReducedMotion();
  const disabled = !!prefersReducedMotion;

  const trackRef = useRef<HTMLDivElement>(null);
  const firstSetRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<Animation | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (disabled || !trackRef.current || !firstSetRef.current) return;

    const track = trackRef.current;
    const firstSet = firstSetRef.current;

    const startAnimation = () => {
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      const dist = firstSet.offsetWidth + gap;

      if (dist <= 0) return;

      const anim = track.animate(
        [
          { transform: "translateX(0px)" },
          { transform: `translateX(-${dist}px)` },
        ],
        {
          duration: 40000,
          iterations: Infinity,
          easing: "linear",
        },
      );

      animRef.current = anim;
    };

    if (document.fonts?.ready) {
      document.fonts.ready.then(() => requestAnimationFrame(startAnimation));
    } else {
      requestAnimationFrame(startAnimation);
    }

    return () => {
      animRef.current?.cancel();
      animRef.current = null;
    };
  }, [disabled]);

  useEffect(() => {
    const anim = animRef.current;
    if (!anim) return;
    if (isPaused) anim.pause();
    else anim.play();
  }, [isPaused]);

  const handleMouseEnter = useCallback(() => setIsPaused(true), []);
  const handleMouseLeave = useCallback(() => setIsPaused(false), []);

  return (
    <motion.section
      aria-label="Feature highlights"
      initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
      animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.45, ease: "easeOut" }}
      className="py-10"
    >
      <div
        className="relative overflow-hidden"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          WebkitMaskImage: "linear-gradient(to right, transparent, black 4rem, black calc(100% - 4rem), transparent)",
          maskImage: "linear-gradient(to right, transparent, black 4rem, black calc(100% - 4rem), transparent)",
        }}
      >
        {/* Track: two identical copies for seamless loop */}
        <div ref={trackRef} className="flex w-max gap-3">
          <div ref={firstSetRef} className="flex shrink-0 gap-3">
            {FEATURES.map((item, i) => (
              <Pill key={`a-${i}`} {...item} />
            ))}
          </div>
          <div className="flex shrink-0 gap-3">
            {FEATURES.map((item, i) => (
              <Pill key={`b-${i}`} {...item} />
            ))}
          </div>
        </div>
      </div>
    </motion.section>
  );
}
