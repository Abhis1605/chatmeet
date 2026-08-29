"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const NAV_LINKS = [
  { label: "Problems", href: "#problems" },
  {label: "Features", href: "#features"},
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    // Check initial theme
    const savedTheme = localStorage.getItem("theme");
    const isDark = savedTheme === "dark" || (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches);
    
    setIsDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 0);

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    if (newTheme) {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
      localStorage.setItem("theme", "light");
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-500 flex justify-center p-4">
      <nav className={`w-full ${isScrolled ? "max-w-5xl" : "max-w-7xl"} transition-[max-width] duration-300 ease-out bg-(--surface)/80 backdrop-blur-md border border-border rounded-full px-3 py-2 flex items-center justify-between shadow-sm`}>
        {/* Logo */}
        <Link href="/" className="flex items-center group">
          <Image
            src={isDarkMode ? "/chatmeet-logo-dark.png" : "/chatmeet-logo.png"}
            alt="ChatMeet"
            width={120} 
            height={32} 
            className="h-8 w-auto object-contain transition-transform group-hover:scale-105" 
            priority
          />
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <Link key={link.label} href={link.href} className="text-sm font-medium text-muted hover:text-foreground transition-colors">
              {link.label}
            </Link>
          ))}
        </div>

        {/* Actions */}
        <div className="hidden md:flex items-center gap-4">
          <button 
            onClick={toggleTheme}
            className="p-2 text-muted hover:text-foreground transition-colors rounded-full hover:bg-surface-soft"
            aria-label="Toggle theme"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <Link href="/chat" className="rounded-full text-on-primary cursor-pointer text-sm bg-primary hover:bg-primary-hover px-4 font-medium py-2 transition-colors duration-150 ease-out">
            Start Chatting
          </Link>
        </div>

        {/* Mobile Actions */}
        <div className="flex md:hidden items-center gap-2">
          <button 
            onClick={toggleTheme}
            className="p-2 text-muted hover:text-foreground transition-colors rounded-full"
            aria-label="Toggle theme"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button 
            className="p-2 text-foreground"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0, transition: { staggerChildren: 0.1 } }}
            exit={{ opacity: 0, y: -20, transition: { staggerChildren: 0.05, staggerDirection: -1, delay: 0.2 } }}
            className="absolute top-20 left-4 right-4 bg-surface border border-border rounded-2xl p-4 shadow-xl md:hidden flex flex-col gap-2"
          >
            {NAV_LINKS.map((link) => (
              <motion.div 
                key={link.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <Link href={link.href} onClick={() => setIsOpen(false)} className="block px-4 py-3 text-foreground hover:bg-surface-soft rounded-lg font-medium">
                  {link.label}
                </Link>
              </motion.div>
            ))}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-px bg-border my-2" 
            />
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
            >
              <Link href="/chat" onClick={() => setIsOpen(false)} className="btn-primary flex justify-center w-full py-3">
                Start Chatting
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
