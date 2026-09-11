import Link from "next/link";
import Footer from "@/components/landing/Footer";
import Navbar from "@/components/landing/Navbar";

const LAST_UPDATED = "September 11, 2026";

export default function TermsPage() {
  return (
    <>
      <Navbar />

      <main className="bg-background px-4 pb-12 pt-32 md:px-8 md:pb-20 md:pt-36">
        <article className="mx-auto max-w-3xl">
          <header className="border-b border-border pb-8">
            <h1 className="font-heading text-4xl font-bold tracking-tight text-foreground md:text-5xl">Terms of Service</h1>
            <p className="mt-4 text-sm text-muted">Last updated: {LAST_UPDATED}</p>
            <p className="mt-6">
              Welcome to ChatMeet. These Terms of Service (&quot;Terms&quot;) govern your access to and use of ChatMeet (the
              &quot;Service&quot;), operated by [Your Name / Entity]. By creating an account or using the Service, you agree to
              these Terms. If you don&apos;t agree, please don&apos;t use ChatMeet.
            </p>
          </header>

          <div className="space-y-10 pt-10 text-base leading-relaxed text-muted">
            <section>
              <h2 className="font-heading text-2xl font-semibold text-foreground">1. Acceptable use</h2>
              <p className="mt-4">You agree not to use ChatMeet to:</p>
              <ul className="mt-4 list-disc space-y-2 pl-6">
                <li>Harass, threaten, or abuse other users.</li>
                <li>Share illegal content, or content that infringes someone else&apos;s rights.</li>
                <li>Impersonate another person or misrepresent your affiliation with any person or entity.</li>
                <li>Attempt to gain unauthorized access to other accounts, rooms, or groups.</li>
                <li>Disrupt or interfere with the Service&apos;s operation (e.g. spamming, scraping, exploiting bugs).</li>
              </ul>
              <p className="mt-4">We reserve the right to suspend or terminate accounts that violate these rules.</p>
            </section>

            <section>
              <h2 className="font-heading text-2xl font-semibold text-foreground">2. Accounts &amp; registration</h2>
              <ul className="mt-4 list-disc space-y-2 pl-6">
                <li>You must provide accurate information when creating an account.</li>
                <li>You&apos;re responsible for maintaining the security of your login credentials and any OTP/verification methods tied to your account.</li>
                <li>You must be at least [13 / 16 / 18 - pick per your jurisdiction] years old to use ChatMeet.</li>
                <li>You&apos;re responsible for all activity that occurs under your account.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-heading text-2xl font-semibold text-foreground">3. User content &amp; conduct in rooms/groups</h2>
              <ul className="mt-4 list-disc space-y-2 pl-6">
                <li>You retain ownership of any messages, media, or content you share (&quot;User Content&quot;).</li>
                <li>By posting content, you grant ChatMeet a limited license to store, transmit, and display that content as necessary to operate the Service.</li>
                <li>Group and room admins/moderators may set additional rules for their spaces (e.g. posting permissions, announcement-only mode); you agree to follow those rules within those spaces.</li>
                <li>We may remove content or restrict access to rooms/groups that violate these Terms.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-heading text-2xl font-semibold text-foreground">4. Data &amp; privacy</h2>
              <p className="mt-4">
                Your use of ChatMeet is also governed by our{" "}
                <Link href="/privacy" className="text-primary underline underline-offset-4 hover:text-primary-hover">Privacy policy</Link>.
                By using the Service, you consent to that collection and use.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl font-semibold text-foreground">5. Video/audio calls &amp; recording consent</h2>
              <ul className="mt-4 list-disc space-y-2 pl-6">
                <li>ChatMeet allows video and audio calls between users.</li>
                <li>ChatMeet does not record calls by default. [Update this if you add call-recording features - if you do, you MUST get explicit consent from all participants before recording, and this section needs to say so clearly, since recording laws vary significantly by jurisdiction.]</li>
                <li>You&apos;re responsible for obtaining consent from other participants if you record a call through any external means.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-heading text-2xl font-semibold text-foreground">6. Termination</h2>
              <ul className="mt-4 list-disc space-y-2 pl-6">
                <li>You may delete your account at any time.</li>
                <li>We may suspend or terminate your access to the Service if you violate these Terms, at our discretion.</li>
                <li>Upon termination, your right to use the Service ends immediately; some data may be retained as described in our Privacy Policy.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-heading text-2xl font-semibold text-foreground">7. Changes to these terms</h2>
              <p className="mt-4">We may update these Terms from time to time. We&apos;ll update the &quot;Last updated&quot; date above, and for material changes, we&apos;ll make a reasonable effort to notify users (e.g. in-app notice or email). Continued use of ChatMeet after changes take effect means you accept the updated Terms.</p>
            </section>

            <section>
              <h2 className="font-heading text-2xl font-semibold text-foreground">8. Contact</h2>
              <p className="mt-4">
                Questions about these Terms? Reach us at{" "}
                <a href="mailto:support@chatmeet.app" className="text-primary underline underline-offset-4 hover:text-primary-hover">support@chatmeet.app</a>{" "}
                or via our <Link href="/contact" className="text-primary underline underline-offset-4 hover:text-primary-hover">Contact page</Link>.
              </p>
            </section>
          </div>
        </article>
      </main>

      <Footer />
    </>
  );
}