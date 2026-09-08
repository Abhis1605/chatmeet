"use client";

import { ArrowLeft, ArrowRight, Star } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { TESTIMONIALS, type Testimonial } from "@/data/testimonials";
import { HoverCard } from "@/components/ui/hover-card";

const wrapIndex = (index: number) => (index + TESTIMONIALS.length) % TESTIMONIALS.length;

export default function SuccessStories() {
  const [activeIndex, setActiveIndex] = useState(0);
  const prefersReducedMotion = useReducedMotion();
  const active = TESTIMONIALS[activeIndex];
  const previous = TESTIMONIALS[wrapIndex(activeIndex - 1)];
  const next = TESTIMONIALS[wrapIndex(activeIndex + 1)];

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveIndex((index) => wrapIndex(index + 1));
    }, 5000);

    return () => window.clearInterval(interval);
  }, []);

  const move = (direction: number) => setActiveIndex((index) => wrapIndex(index + direction));

  return (
    <motion.section
      id="success-stories"
      aria-labelledby="success-stories-heading"
      initial={prefersReducedMotion ? false : { opacity: 0, y: 32 }}
      whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="overflow-hidden bg-section-alt px-4 py-20 md:px-8 lg:py-28"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-lg font-semibold text-primary">Success stories</p>
          <h2 id="success-stories-heading" className="mt-4 font-heading text-xl font-bold leading-tight tracking-tight md:text-6xl">
            Conversations that <span className="text-primary">keep moving</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-muted md:text-base">
            A few ways people are using ChatMeet to bring their communities, teams, and ideas closer together.
          </p>
        </div>

        <div className="mt-10 flex justify-center gap-3" aria-label="Choose a testimonial">
          {TESTIMONIALS.map((testimonial, index) => (
            <button
              key={testimonial.name}
              type="button"
              aria-label={`Show testimonial from ${testimonial.name}`}
              aria-pressed={activeIndex === index}
              onClick={() => setActiveIndex(index)}
              className={`relative size-11 overflow-hidden rounded-full border-2 p-0.5 transition duration-200 ${
                activeIndex === index
                  ? "scale-110 border-primary shadow-[0_0_0_4px_color-mix(in_srgb,var(--primary)_16%,transparent)]"
                  : "border-transparent opacity-45 hover:scale-105 hover:opacity-80"
              }`}
            >
              <img src={testimonial.avatar} alt="" className="size-full rounded-full object-cover" />
            </button>
          ))}
        </div>

        <div className="relative mx-auto mt-10 max-w-6xl">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/2 z-0 size-[min(44rem,90vw)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,var(--primary)_0%,var(--primary-hover)_28%,transparent_70%)] opacity-25 blur-3xl"
          />
          <div className="pointer-events-none absolute inset-y-0 -left-32 hidden w-80 items-center lg:flex">
            <TestimonialCard testimonial={previous} preview />
          </div>
          <div className="pointer-events-none absolute inset-y-0 -right-32 hidden w-80 items-center lg:flex">
            <TestimonialCard testimonial={next} preview />
          </div>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={active.name}
              initial={prefersReducedMotion ? false : { opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={prefersReducedMotion ? undefined : { opacity: 0, x: -20 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              className="relative z-10 mx-auto max-w-3xl"
            >
              <TestimonialCard testimonial={active} />
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-8 flex justify-center gap-3">
          <button
            type="button"
            onClick={() => move(-1)}
            aria-label="Previous testimonial"
            className="flex size-11 items-center justify-center rounded-(--radius) border border-border bg-surface text-foreground transition hover:border-primary hover:text-primary"
          >
            <ArrowLeft size={18} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => move(1)}
            aria-label="Next testimonial"
            className="flex size-11 items-center justify-center rounded-(--radius) border border-border bg-surface text-foreground transition hover:border-primary hover:text-primary"
          >
            <ArrowRight size={18} aria-hidden="true" />
          </button>
        </div>
      </div>
    </motion.section>
  );
}

function TestimonialCard({
  testimonial,
  preview = false,
}: {
  testimonial: Testimonial;
  preview?: boolean;
}) {
  return (
    <div className={`w-full ${preview ? "opacity-20 blur-[2px] pointer-events-none" : ""}`}>
      <HoverCard
        active={!preview}
        autoGlow={!preview}
        className={`bg-surface p-5 md:p-7 ${preview ? "border-transparent" : "shadow-[0_18px_45px_color-mix(in_srgb,var(--foreground)_14%,transparent)]"}`}
      >
      <div className="flex items-center gap-3">
        <img src={testimonial.avatar} alt="" className="size-11 rounded-full object-cover" />
        <div className="min-w-0">
          <h3 className="truncate font-heading text-base font-bold text-foreground">{testimonial.name}</h3>
          <p className="truncate text-xs text-muted">{testimonial.role}</p>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-1 text-primary" aria-label="5 out of 5 stars">
        {Array.from({ length: 5 }, (_, index) => <Star key={index} size={16} className="fill-primary text-primary" aria-hidden="true" />)}
        <span className="ml-1 text-xs font-medium text-muted">5.0</span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {testimonial.tags.map((tag) => (
          <span key={tag} className="rounded-full bg-primary-soft px-2.5 py-1 text-[0.68rem] font-medium text-primary">
            {tag}
          </span>
        ))}
      </div>

      <p className="mt-5 max-w-2xl text-sm leading-relaxed text-foreground md:text-base">“{testimonial.quote}”</p>
      </HoverCard>
    </div>
  );
}