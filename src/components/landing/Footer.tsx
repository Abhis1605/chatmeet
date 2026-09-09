"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Plus } from "lucide-react";
import { useState } from "react";

const FOOTER_COLUMNS = [
  {
    title: "Product",
    links: [
        { label: "Problems", href: "#problems" },
      { label: "Features", href: "#features" },
      { label: "How it works", href: "#how-it-works" },
      { label: "Success stories", href: "#success-stories" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "FAQ", href: "#faq" },
      { label: "Contact us", href: "#" },
      { label: "Help center", href: "#" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms of service", href: "/terms" },
      { label: "Privacy policy", href: "/privacy" },
    ],
  },
];

const SOCIAL_LINKS = [
  { label: "Instagram", src: "/insta-svg.svg", href: "https://www.instagram.com/imabhisolanki/" },
  { label: "LinkedIn", src: "/linkedin-svg.svg", href: "https://www.linkedin.com/in/abhi-solanki-364bb8258/" },
  { label: "GitHub", src: "/github-svg.svg", href: "https://github.com/Abhis1605" },
];

export default function Footer() {
  const [openColumn, setOpenColumn] = useState<string | null>(null);
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.footer
      initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
      whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="relative overflow-hidden bg-background px-4 pt-2 pb-0 leading-none md:px-8 md:pt-4 md:pb-0"
    >
      <div className="relative z-10 mx-auto max-w-7xl">

        <motion.div
          initial={prefersReducedMotion ? false : "hidden"}
          whileInView={prefersReducedMotion ? undefined : "show"}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ staggerChildren: 0.08 }}
          className="mt-12 md:grid md:grid-cols-3 md:gap-8"
        >
          {FOOTER_COLUMNS.map((column) => {
            const isOpen = openColumn === column.title;

            return (
              <motion.section
                key={column.title}
                variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="border-t border-border md:border-0"
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`footer-${column.title.toLowerCase()}`}
                  onClick={() => setOpenColumn(isOpen ? null : column.title)}
                  className="flex w-full items-center justify-between py-5 text-left md:pointer-events-none md:py-0"
                >
                  <span className="text-base font-bold text-primary">{column.title}</span>
                  <Plus
                    aria-hidden="true"
                    size={18}
                    className={`text-muted transition-transform duration-200 md:hidden ${isOpen ? "rotate-45" : ""}`}
                  />
                </button>

                <div id={`footer-${column.title.toLowerCase()}`} className="hidden md:block md:mt-5">
                  <ul className="space-y-3">
                    {column.links.map((link) => (
                      <li key={link.label}>
                        <Link href={link.href} className="text-base text-muted transition-colors hover:text-foreground">
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="overflow-hidden md:hidden"
                    >
                      <ul className="space-y-3 pb-5">
                        {column.links.map((link) => (
                          <li key={link.label}>
                            <Link href={link.href} className="text-base text-muted transition-colors hover:text-foreground">
                              {link.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.section>
            );
          })}
        </motion.div>

        <div className="mt-8 border-t border-border pt-8">
          <p className="text-base font-bold text-primary">Follow</p>
          <div className="mt-2 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-base text-muted">Connect with us on our social channels</p>
            <motion.div
              initial={prefersReducedMotion ? false : "hidden"}
              whileInView={prefersReducedMotion ? undefined : "show"}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ staggerChildren: 0.05 }}
              className="flex items-center gap-2"
            >
              {SOCIAL_LINKS.map(({ label, src, href }) => (
                <motion.a
                  key={label}
                  href={href}
                  aria-label={label}
                  target="_blank"
                  rel="noopener noreferrer"
                  variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
                  whileHover={prefersReducedMotion ? undefined : { scale: 1.1 }}
                  whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
                  className="flex size-9 items-center justify-center rounded-full border border-border text-muted transition-colors hover:border-primary hover:text-primary"
                >
                  <Image src={src} alt="" width={16} height={16} aria-hidden="true" />
                </motion.a>
              ))}
            </motion.div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-border pt-6 text-lg text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© ChatMeet {new Date().getFullYear()}</p>
          <p>
            A weekend project turned real · by{" "}
           <Link href="https://github.com/Abhis1605" target="_blank" className="font-bold text-primary hover:text-muted transition-all">
              Abhis1605
           </Link>
          </p>
        </div>
      </div>

      <Image
        src="/footer-chatmeet-logo.png"
        alt=""
        width={1300}
        height={240}
        aria-hidden="true"
        className="pointer-events-none mx-auto block select-none object-contain object-top"
      />
    </motion.footer>
  );
}