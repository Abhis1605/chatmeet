"use client";

import { useRef, useState, type HTMLAttributes, type MouseEvent } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/cn";

type HoverCardProps = HTMLAttributes<HTMLDivElement> & {
  active?: boolean;
};

export function HoverCard({ active = false, children, className, ...props }: HoverCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [pointerPosition, setPointerPosition] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion || !cardRef.current) return;

    const bounds = cardRef.current.getBoundingClientRect();
    setPointerPosition({
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    });
  };

  return (
    <div
      {...props}
      ref={cardRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseMove={handleMouseMove}
      className="relative overflow-hidden rounded-xl border border-border bg-surface p-px"
    >
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute z-0 size-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,var(--primary),var(--primary-hover)_35%,transparent_70%)] blur-2xl"
        animate={{
          left: pointerPosition.x,
          top: pointerPosition.y,
          opacity: isHovered && !prefersReducedMotion ? 0.8 : 0,
        }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      />
      <div className={cn("relative z-10 h-full overflow-hidden rounded-[11px] bg-surface", active && "border border-primary/35", className)}>
        {children}
      </div>
    </div>
  );
}