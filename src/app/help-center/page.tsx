"use client";

import Link from "next/link";
import { CheckCircle2, ExternalLink, Mail } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { FormEvent, useState } from "react";
import { HoverCard } from "@/components/ui/hover-card";
import Footer from "@/components/landing/Footer";
import Navbar from "@/components/landing/Navbar";

type FormValues = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  message: string;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

const INITIAL_VALUES: FormValues = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  message: "",
};

const HELP_POINTS = [
  "Get help with a room, group, or video call",
  "Share feedback and ideas with the ChatMeet team",
  "Learn how to make the most of ChatMeet",
];

const inputClassName = "mt-2 w-full rounded-(--radius) border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted/70 focus:border-primary focus:ring-2 focus:ring-primary/20";

export default function HelpCenterPage() {
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
    if (!values.phone.trim()) nextErrors.phone = "Phone number is required.";
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
              aria-labelledby="help-center-heading"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">ChatMeet help center</p>
              <h1 id="help-center-heading" className="mt-4 max-w-2xl font-heading text-4xl font-bold leading-tight tracking-tight text-foreground md:text-6xl">
                How can we <span className="text-primary">help?</span>
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-muted md:text-lg">
                Get in touch with our support team for help with rooms, groups, calls, or anything else about ChatMeet.
              </p>

              <ul className="mt-7 space-y-4" aria-label="Ways we can help">
                {HELP_POINTS.map((point) => (
                  <li key={point} className="flex items-center gap-3 text-sm text-foreground md:text-base">
                    <CheckCircle2 size={18} strokeWidth={1.8} aria-hidden="true" className="shrink-0 text-primary" />
                    {point}
                  </li>
                ))}
              </ul>

              <div className="mt-36 grid max-w-xl gap-4 sm:grid-cols-2">
                <div className="rounded-(--radius) border border-border bg-surface p-5 shadow-sm">
                  <h2 className="font-heading text-base font-semibold text-foreground">General communication</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted">For general questions, send us an email and we&apos;ll get back to you.</p>
                  <a href="mailto:support@chatmeet.app" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary underline decoration-primary/30 underline-offset-4 transition-colors hover:text-primary-hover">
                    <Mail size={16} aria-hidden="true" />
                    support@chatmeet.app
                  </a>
                </div>
                <div className="rounded-(--radius) border border-border bg-surface p-5 shadow-sm">
                  <h2 className="font-heading text-base font-semibold text-foreground">ChatMeet resources</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted">Explore our latest updates and learn more about the platform.</p>
                  <Link href="/" className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary-hover">
                    Visit ChatMeet <ExternalLink size={15} aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </motion.section>

            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
              whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.65, delay: prefersReducedMotion ? 0 : 0.12, ease: "easeOut" }}
            >
              <HoverCard autoGlow className="p-6 sm:p-7">
                <h2 className="mb-5 font-heading text-xl font-semibold text-foreground">Contact our support team</h2>
                <form onSubmit={handleSubmit} noValidate className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField label="First name" htmlFor="help-first-name" error={errors.firstName}>
                      <input id="help-first-name" name="firstName" value={values.firstName} onChange={(event) => updateValue("firstName", event.target.value)} className={inputClassName} autoComplete="given-name" placeholder="Your first name" />
                    </FormField>
                    <FormField label="Last name" htmlFor="help-last-name" error={errors.lastName}>
                      <input id="help-last-name" name="lastName" value={values.lastName} onChange={(event) => updateValue("lastName", event.target.value)} className={inputClassName} autoComplete="family-name" placeholder="Your last name" />
                    </FormField>
                  </div>

                  <FormField label="Email" htmlFor="help-email" error={errors.email}>
                    <div className="relative">
                      <Mail size={17} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                      <input id="help-email" name="email" type="email" value={values.email} onChange={(event) => updateValue("email", event.target.value)} className={`${inputClassName} pl-10`} autoComplete="email" placeholder="you@example.com" />
                    </div>
                  </FormField>

                  <FormField label="Phone number" htmlFor="help-phone" error={errors.phone}>
                    <input id="help-phone" name="phone" type="tel" value={values.phone} onChange={(event) => updateValue("phone", event.target.value)} className={inputClassName} autoComplete="tel" placeholder="+1 555 123 4567" />
                  </FormField>

                  <FormField label="Message" htmlFor="help-message" error={errors.message}>
                    <textarea id="help-message" name="message" value={values.message} onChange={(event) => updateValue("message", event.target.value)} maxLength={1000} rows={4} className={`${inputClassName} resize-y`} placeholder="Tell us how we can help..." />
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
