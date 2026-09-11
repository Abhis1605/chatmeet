"use client";

import Link from "next/link";
import { Mail } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { FormEvent, useState } from "react";
import { HoverCard } from "@/components/ui/hover-card";
import Footer from "@/components/landing/Footer";
import Navbar from "@/components/landing/Navbar";

type FormValues = {
  firstName: string;
  lastName: string;
  email: string;
  topic: string;
  message: string;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

const INITIAL_VALUES: FormValues = {
  firstName: "",
  lastName: "",
  email: "",
  topic: "General",
  message: "",
};

const CONTACT_CATEGORIES = [
  {
    title: "Support",
    description: "Having trouble with a room, group, or call? Our team can help you sort it out.",
  },
  {
    title: "Feedback & suggestions",
    description: "Got an idea to make ChatMeet better? We read every message.",
  },
  {
    title: "Press & partnerships",
    description: "For media or collaboration inquiries, reach out here.",
  },
];

const inputClassName = "mt-2 w-full rounded-(--radius) border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted/70 focus:border-primary focus:ring-2 focus:ring-primary/20";

export default function ContactPage() {
  const prefersReducedMotion = useReducedMotion();
  const [values, setValues] = useState<FormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<FormErrors>({});

  const updateValue = (field: keyof FormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const validate = () => {
    const nextErrors: FormErrors = {};
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!values.firstName.trim()) nextErrors.firstName = "First name is required.";
    if (!values.lastName.trim()) nextErrors.lastName = "Last name is required.";
    if (!values.email.trim()) nextErrors.email = "Email is required.";
    else if (!emailPattern.test(values.email.trim())) nextErrors.email = "Enter a valid email address.";
    if (!values.message.trim()) nextErrors.message = "Message is required.";

    return nextErrors;
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    // TODO: wire to backend endpoint
  };

  return (
    <>
      <Navbar />
      <main className="relative isolate min-h-screen overflow-hidden bg-background">
        <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-24 -z-10 size-[min(48rem,100vw)] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,var(--primary)_0%,var(--primary-hover)_24%,transparent_68%)] opacity-10 blur-3xl" />

        <div className="mx-auto max-w-7xl px-4 pb-20 pt-28 md:px-8 md:pb-28 lg:pt-28">
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
          whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(27rem,0.88fr)] lg:gap-16"
        >
          <motion.section
            initial={prefersReducedMotion ? false : { opacity: 0, x: -18 }}
            whileInView={prefersReducedMotion ? undefined : { opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            aria-labelledby="contact-heading"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">We&apos;re listening</p>
            <h1 id="contact-heading" className="mt-4 font-heading text-4xl font-bold leading-tight tracking-tight text-primary md:text-6xl">Contact us</h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted md:text-lg">
              Have a question, feedback, or need help? Reach out and we&apos;ll get back to you.
            </p>

            <a href="mailto:support@chatmeet.app" className="mt-7 inline-flex items-center gap-2 text-sm font-medium text-primary underline decoration-primary/30 underline-offset-4 transition-colors hover:text-primary-hover">
              <Mail size={17} aria-hidden="true" />
              support@chatmeet.app
            </a>

            <div className="mt-12 space-y-8 border-t border-border pt-8">
              {CONTACT_CATEGORIES.map((category) => (
                <div key={category.title}>
                  <h2 className="font-heading text-base font-semibold text-foreground">{category.title}</h2>
                  <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">{category.description}</p>
                </div>
              ))}
            </div>
          </motion.section>

          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
            whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.65, delay: prefersReducedMotion ? 0 : 0.12, ease: "easeOut" }}
          >
            <HoverCard autoGlow className="p-6 sm:p-7">
              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="First name" htmlFor="first-name" error={errors.firstName}>
                    <input id="first-name" name="firstName" value={values.firstName} onChange={(event) => updateValue("firstName", event.target.value)} className={inputClassName} autoComplete="given-name" placeholder="Your first name" />
                  </FormField>
                  <FormField label="Last name" htmlFor="last-name" error={errors.lastName}>
                    <input id="last-name" name="lastName" value={values.lastName} onChange={(event) => updateValue("lastName", event.target.value)} className={inputClassName} autoComplete="family-name" placeholder="Your last name" />
                  </FormField>
                </div>

                <FormField label="Email" htmlFor="email" error={errors.email}>
                  <div className="relative">
                    <Mail size={17} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                    <input id="email" name="email" type="email" value={values.email} onChange={(event) => updateValue("email", event.target.value)} className={`${inputClassName} pl-10`} autoComplete="email" placeholder="you@example.com" />
                  </div>
                </FormField>

                <FormField label="Subject / topic" htmlFor="topic">
                  <select id="topic" name="topic" value={values.topic} onChange={(event) => updateValue("topic", event.target.value)} className={inputClassName}>
                    <option>General</option>
                    <option>Support</option>
                    <option>Feedback</option>
                    <option>Press</option>
                  </select>
                </FormField>

                <FormField label="Message" htmlFor="message" error={errors.message}>
                  <textarea id="message" name="message" value={values.message} onChange={(event) => updateValue("message", event.target.value)} maxLength={1000} rows={4} className={`${inputClassName} resize-y`} placeholder="Tell us how we can help..." />
                  <p className="mt-1.5 text-right text-xs text-muted">{values.message.length}/1000</p>
                </FormField>

                <button type="submit" className="btn-primary w-full py-3 text-sm">Send message</button>
                <p className="text-center text-xs leading-relaxed text-muted">
                  By contacting us, you agree to our <Link href="/terms" className="text-primary underline underline-offset-2 hover:text-primary-hover">Terms of service</Link> and <Link href="/privacy" className="text-primary underline underline-offset-2 hover:text-primary-hover">Privacy policy</Link>
                </p>
              </form>
            </HoverCard>
          </motion.div>
        </motion.div>
        </div>
      </main>
      <Footer />
    </>
  );
}

function FormField({ label, htmlFor, error, children }: { label: string; htmlFor: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">{label}</label>
      {children}
      {error && <p className="mt-1.5 text-xs text-error" role="alert">{error}</p>}
    </div>
  );
}