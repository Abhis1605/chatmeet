import Link from "next/link";
import Footer from "@/components/landing/Footer";
import Navbar from "@/components/landing/Navbar";

const LAST_UPDATED = "September 11, 2026";

export default function PrivacyPage() {
  return (
    <>
      <Navbar />

      <main className="bg-background px-4 pb-12 pt-32 md:px-8 md:pb-20 md:pt-36">
        <article className="mx-auto max-w-3xl">
          <header className="border-b border-border pb-8">
            <h1 className="font-heading text-4xl font-bold tracking-tight text-foreground md:text-5xl">Privacy Policy</h1>
            <p className="mt-4 text-sm text-muted">Last updated: {LAST_UPDATED}</p>
            <p className="mt-6">
              This Privacy Policy explains how ChatMeet (&quot;we&quot;, &quot;us&quot;) collects, uses, and protects your
              information when you use the Service. It should be read alongside our{" "}
              <Link href="/terms" className="text-primary underline underline-offset-4 hover:text-primary-hover">Terms of Service</Link>.
            </p>
          </header>

          <div className="space-y-10 pt-10 text-base leading-relaxed text-muted">
            <section>
              <h2 className="font-heading text-2xl font-semibold text-foreground">1. Information we collect</h2>
              <p className="mt-4"><strong className="font-semibold text-foreground">Account information</strong> - name, email address, phone number (for OTP verification), profile photo (optional).</p>
              <p className="mt-4"><strong className="font-semibold text-foreground">Usage data</strong> - messages, group/room membership, timestamps of activity, device/browser type, IP address.</p>
              <p className="mt-4"><strong className="font-semibold text-foreground">Call data</strong> - ChatMeet facilitates video/audio calls; we do not store call content or recordings unless [update if you add recording features]. Connection metadata (call duration, participants) may be logged for service reliability.</p>
              <p className="mt-4"><strong className="font-semibold text-foreground">Content you share</strong> - messages, media, and files you send in chats, groups, or rooms.</p>
            </section>

            <section>
              <h2 className="font-heading text-2xl font-semibold text-foreground">2. How we use your information</h2>
              <p className="mt-4">We use your information to:</p>
              <ul className="mt-4 list-disc space-y-2 pl-6">
                <li>Provide and operate the Service (authentication, messaging, calls, group/room management).</li>
                <li>Send OTP verification codes and account-related notifications.</li>
                <li>Maintain security and prevent abuse (e.g. detecting spam, unauthorized access).</li>
                <li>Improve the Service based on aggregated, non-identifying usage patterns.</li>
                <li>Respond to support requests you send via our <Link href="/contact" className="text-primary underline underline-offset-4 hover:text-primary-hover">Contact page</Link>.</li>
              </ul>
              <p className="mt-4">We do not sell your personal data to third parties.</p>
            </section>

            <section>
              <h2 className="font-heading text-2xl font-semibold text-foreground">3. How we store &amp; protect your data</h2>
              <ul className="mt-4 list-disc space-y-2 pl-6">
                <li>Passwords/credentials are stored using industry-standard hashing - never in plain text.</li>
                <li>Data is transmitted over encrypted connections (HTTPS/WSS).</li>
                <li>[Add specifics once finalized: which database, hosting provider, and whether messages are encrypted at rest / end-to-end.]</li>
              </ul>
            </section>

            <section>
              <h2 className="font-heading text-2xl font-semibold text-foreground">4. Data sharing</h2>
              <p className="mt-4">We may share information with:</p>
              <ul className="mt-4 list-disc space-y-2 pl-6">
                <li><strong className="font-semibold text-foreground">Service providers</strong> who help us operate ChatMeet (e.g. hosting, SMS/OTP delivery, video call infrastructure) - bound by confidentiality obligations.</li>
                <li><strong className="font-semibold text-foreground">Legal authorities</strong>, if required by law or to protect the rights, safety, or property of ChatMeet or its users.</li>
              </ul>
              <p className="mt-4">We do not share your data with advertisers or data brokers.</p>
            </section>

            <section>
              <h2 className="font-heading text-2xl font-semibold text-foreground">5. Your rights &amp; choices</h2>
              <p className="mt-4">You can:</p>
              <ul className="mt-4 list-disc space-y-2 pl-6">
                <li>Access, update, or delete your account information at any time from account settings.</li>
                <li>
                  Request a copy of your data or full account deletion by contacting us at{" "}
                  <a href="mailto:privacy@chatmeet.app" className="text-primary underline underline-offset-4 hover:text-primary-hover">privacy@chatmeet.app</a>.
                </li>
                <li>Leave any group or room at any time; leaving removes your future participation.</li>
              </ul>
            </section>
          </div>
        </article>
      </main>

      <Footer />
    </>
  );
}
