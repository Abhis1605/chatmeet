"use client";

import { ChevronDown } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { HoverCard } from "@/components/ui/hover-card";

const PROBLEMS = [
  {
    question: "Why do I need a different app just to hop on a call?",
    answer:
      "You don't. Every chat — direct, group, or room — can start a video or voice call in the same thread, with call history kept right there in the conversation.",
  },
  {
    question: "How do people join without waiting on an invite?",
    answer:
      "Rooms are open, code-based spaces — share a code and up to 100 people can drop in instantly. No approval step, and the owner can regenerate or deactivate the code anytime.",
  },
  {
    question: "How do I stop a group chat from turning into noise?",
    answer:
      "Groups support Creator/Admin/Member roles, including announcement-only mode — admins decide who can post, so updates stay visible without getting buried.",
  },
  {
    question: "How much of my activity is actually visible to others?",
    answer:
      "As much or as little as you choose. Toggle online status, last-seen, typing indicators, and read receipts independently — or go fully Invisible.",
  },
];

export default function Problem() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.section
      initial={prefersReducedMotion ? false : { opacity: 0, y: 32 }}
      whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="px-4 py-20 md:px-8 lg:py-28"
      aria-labelledby="problem-heading"
      id="problems"
    >
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-start gap-10 min-[860px]:grid-cols-[45fr_55fr] min-[860px]:gap-14">
        <div className="min-w-0">
          <p className="text-lg font-semibold text-primary">The problem</p>
          <h2 id="problem-heading" className="mt-4 max-w-xl font-heading text-2xl font-bold leading-tight tracking-tight md:text-6xl">
            What juggling three <span className="text-primary">apps</span> actually costs you.
          </h2>
          <p className="mt-5 max-w-100 text-sm leading-relaxed text-muted md:text-xl">
            These are the moments ChatMeet was built to remove — the small frictions that add up every time a conversation needs more than just chat.
          </p>
        </div>

        <div className="flex w-full min-w-0 flex-col gap-2.5">
          {PROBLEMS.map((problem, index) => {
            const open = openIndex === index;
            const questionId = `problem-question-${index}`;
            const answerId = `problem-answer-${index}`;

            return (
              <HoverCard
                key={problem.question}
                active={open}
              >
                <button
                  type="button"
                  id={questionId}
                  aria-expanded={open}
                  aria-controls={answerId}
                  onClick={() => setOpenIndex(open ? null : index)}
                  className="flex w-full cursor-pointer items-center justify-between gap-4 px-4 py-4 text-left text-sm font-semibold text-foreground"
                >
                  <span className="min-w-0">{problem.question}</span>
                  <motion.span
                    aria-hidden="true"
                    animate={prefersReducedMotion ? undefined : { rotate: open ? 180 : 0 }}
                    transition={{ duration: 0.25 }}
                    className="flex size-6.5 shrink-0 items-center justify-center rounded-full bg-muted/40"
                  >
                    <ChevronDown size={15} />
                  </motion.span>
                </button>

                {prefersReducedMotion ? (
                  open && (
                    <div id={answerId} role="region" aria-labelledby={questionId} className="px-4 pb-4">
                      <p className="max-w-[46ch] text-sm leading-relaxed text-muted">{problem.answer}</p>
                    </div>
                  )
                ) : (
                  <motion.div
                    id={answerId}
                    role="region"
                    aria-labelledby={questionId}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    style={{ overflow: "hidden" }}
                  >
                    <p className="max-w-[46ch] px-4 pb-4 text-sm leading-relaxed text-muted">{problem.answer}</p>
                  </motion.div>
                )}
              </HoverCard>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
}