"use client";

import { Minus, Plus } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { FAQ_ITEMS } from "@/data/faq";

export default function FAQSection() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.section
      id="faq"
      aria-labelledby="faq-heading"
      initial={prefersReducedMotion ? false : { opacity: 0, y: 32 }}
      whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="relative overflow-hidden bg-section-background px-4 py-20 md:px-8 lg:py-28"
    >
      <div className="relative mx-auto max-w-7xl">
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-lg font-semibold text-primary">FAQ</p>
          <h2 id="faq-heading" className="mt-4 font-heading text-xl font-bold leading-tight tracking-tight md:text-6xl">
            Answers for <span className="text-primary">getting started</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-muted md:text-base">
            Quick answers to common questions about conversations, rooms, groups, and calls.
          </p>
        </div>

        <div className="mx-auto mt-10 grid max-w-5xl items-start gap-3 md:grid-cols-2">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = activeIndex === index;
            const answerId = `faq-answer-${index}`;

            return (
              <div key={item.question} className="overflow-hidden rounded-(--radius) border border-border transition-colors hover:border-primary">
                <button
                  type="button"
                  id={`faq-question-${index}`}
                  aria-expanded={isOpen}
                  aria-controls={answerId}
                  onClick={() => setActiveIndex(isOpen ? null : index)}
                  className="flex w-full cursor-pointer items-center justify-between gap-4 px-4 py-4 text-left text-sm font-semibold text-foreground md:px-5 md:py-5 md:text-base"
                >
                  <span>{item.question}</span>
                  <motion.span
                    animate={{ rotate: 0 }}
                    transition={{ duration: 0.28, ease: "easeOut" }}
                    className="shrink-0 text-primary"
                  >
                    {isOpen ? <Minus size={18} aria-hidden="true" /> : <Plus size={18} aria-hidden="true" />}
                  </motion.span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={answerId}
                      role="region"
                      aria-labelledby={`faq-question-${index}`}
                      initial={prefersReducedMotion ? false : { height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={prefersReducedMotion ? undefined : { height: 0, opacity: 0 }}
                      transition={{ duration: 0.28, ease: "easeOut" }}
                      className="overflow-hidden"
                    >
                      <p className="border-t border-border px-4 py-4 text-sm leading-relaxed text-muted md:px-5">
                        {item.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
}