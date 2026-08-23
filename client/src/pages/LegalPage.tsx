import { Link } from "wouter";
import { ArrowLeft, ArrowUpRight, FileCheck2, ShieldCheck } from "lucide-react";

type LegalPageKind = "privacy" | "terms";

type LegalSection = {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
};

const LAST_UPDATED = "August 21, 2026";

const privacySections: LegalSection[] = [
  {
    heading: "1. Overview",
    paragraphs: [
      "This Privacy Policy explains how the FINEMIND AI website and its tool platform handle information when you browse, create an account, use local tools, or use server-backed features. It is written to describe the current product behavior and does not add promises beyond the services that are actually available.",
      "FINEMIND AI offers browser-local utilities alongside account-backed and Premium AI workflows. The information involved depends on the tool and the features you choose to use.",
    ],
  },
  {
    heading: "2. Information connected to your account",
    paragraphs: [
      "When you sign in, FINEMIND AI may maintain an account record needed to identify your session and preserve your selected plan, subscription state, remaining credit balance, credit transaction history, and AI usage records. A Google sign-in, when selected, uses a verified Google identity subject to find or create one persistent FINEMIND AI account.",
      "FINEMIND AI does not place Google OAuth client credentials in the browser. Authentication is handled through secure server-side routes and session mechanisms.",
    ],
  },
  {
    heading: "3. Tool inputs and usage history",
    paragraphs: [
      "Many FINEMIND AI tools are designed to work locally in your browser. For those tools, input processing remains on your device unless a feature clearly indicates a server-backed operation.",
      "When you use a protected AI workflow, the service may process the request data necessary to produce the requested result, validate Premium access, enforce the applicable credit cost, and record the request outcome. AI tools should not be used to submit information that you are not permitted to share.",
    ],
  },
  {
    heading: "4. Browser storage, cookies, and sessions",
    paragraphs: [
      "FINEMIND AI uses browser storage and cookies where needed for product operation. For example, recently used tools can be stored locally in your browser, and secure cookies can support authenticated sessions and OAuth state validation.",
      "You can manage browser storage and cookies through your browser settings. Clearing them may remove local preferences, recent-tool history, or active session state.",
    ],
  },
  {
    heading: "5. Premium plans, credits, and billing-related data",
    paragraphs: [
      "FINEMIND AI keeps the plan and subscription information required to apply FREE or PREMIUM access rules. Premium access is activated only by a verified server-side subscription or payment event, not by a browser action.",
      "If a payment provider is configured, provider references and verified subscription events may be recorded to administer the subscription. Payment card details are handled by the applicable payment provider rather than being entered into the FINEMIND AI application.",
    ],
  },
  {
    heading: "6. Service providers and external services",
    paragraphs: [
      "FINEMIND AI may rely on infrastructure, authentication, AI-provider, storage, analytics, or payment services to provide particular features. Google is used only when you choose Google sign-in. Server-backed AI requests are sent only through configured server-side provider connections.",
      "Those services may process information under their own terms and privacy documentation. Their availability and configuration can affect the features available in FINEMIND AI.",
    ],
  },
  {
    heading: "7. Security and your choices",
    paragraphs: [
      "FINEMIND AI is designed to keep protected credentials on the server and to limit Premium AI requests to authenticated, authorized accounts. No online system can guarantee absolute security, so you should protect your sign-in method and avoid sharing account access.",
      "Use the available product contact or support channel if you need help with an account-related request. Do not send passwords, payment credentials, or OAuth secrets through ordinary messages or tool inputs.",
    ],
  },
  {
    heading: "8. Updates to this policy",
    paragraphs: [
      "This policy may be updated when the product changes. The date above indicates the version currently published on this page.",
    ],
  },
];

const termsSections: LegalSection[] = [
  {
    heading: "1. Using FINEMIND AI",
    paragraphs: [
      "FINEMIND AI provides a collection of browser-local utilities and server-backed creative and AI workflows. By using the website, you agree to use the available features responsibly and in accordance with these Terms of Service.",
      "Some tools are available without an account. Account-backed features, Premium AI workflows, billing status, and credit balances are administered server-side.",
    ],
  },
  {
    heading: "2. Accounts and authentication",
    paragraphs: [
      "You are responsible for protecting the sign-in method used for your FINEMIND AI account. If you use Google sign-in, the verified Google identity is linked to one persistent FINEMIND AI account so that the relevant plan, subscription, credits, and usage history can continue with that account.",
      "Do not attempt to bypass authentication, account controls, Premium authorization, credit accounting, rate limits, or other security measures.",
    ],
  },
  {
    heading: "3. FREE and PREMIUM access",
    paragraphs: [
      "FREE users can use the available local tools and browse protected AI tool information. Premium AI requests require a server-verified PREMIUM plan and an active subscription state.",
      "The published Premium offering is $10 USD per month and includes 5,000 AI credits for each verified subscription period. Each protected AI request has a visible, server-defined credit cost. Credits are reserved and recorded by the server, and unused credits do not carry over to a later subscription period.",
    ],
  },
  {
    heading: "4. Subscriptions and payments",
    paragraphs: [
      "Creating a checkout session or pressing an upgrade button does not itself activate Premium. Premium status changes only after a verified server-side event from the configured payment provider.",
      "Subscription availability, cancellation, renewal, expiry, billing portal access, and payment processing depend on the configured provider and verified subscription events. FINEMIND AI does not represent an unconfigured payment flow as a completed payment.",
    ],
  },
  {
    heading: "5. AI tools and your responsibilities",
    paragraphs: [
      "AI outputs may be incomplete, inaccurate, or unsuitable for a particular use. You are responsible for reviewing outputs before relying on, publishing, or using them. FINEMIND AI does not create a guarantee that an AI result is correct, original, lawful, or fit for a specific purpose.",
      "You must have the rights and permissions needed for the text, images, audio, video, or other material you submit. Do not use FINEMIND AI to process unlawful content, infringe rights, misrepresent AI output as verified fact, introduce harmful material, or interfere with the service.",
    ],
  },
  {
    heading: "6. Local and server-backed processing",
    paragraphs: [
      "Tool pages distinguish between browser-local processing and operations that require server-backed processing. You should not assume that an unavailable conversion, AI, or media operation has completed unless the product provides a result.",
      "FINEMIND AI may change, pause, or remove features when necessary to maintain security, reliability, or product integrity.",
    ],
  },
  {
    heading: "7. Third-party services",
    paragraphs: [
      "Certain features may depend on third-party services, including Google sign-in, AI providers, storage, analytics, or payment providers. Your use of those connected services may also be subject to their applicable terms and policies.",
    ],
  },
  {
    heading: "8. Changes to these terms",
    paragraphs: [
      "These terms may be updated as FINEMIND AI changes. The date above identifies the version published on this page. Continued use after an updated version is published is subject to the then-current terms.",
    ],
  },
];

function LegalNavigation({ active }: { active: LegalPageKind }) {
  return (
    <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/55" aria-label="Legal navigation">
      <Link href="/privacy" className={active === "privacy" ? "text-[#8dccff]" : "transition-colors hover:text-white"}>Privacy Policy</Link>
      <Link href="/terms" className={active === "terms" ? "text-[#8dccff]" : "transition-colors hover:text-white"}>Terms of Service</Link>
      <Link href="/" className="transition-colors hover:text-white">FINEMIND AI home <ArrowUpRight className="inline-block" size={13} /></Link>
    </nav>
  );
}

export default function LegalPage({ kind }: { kind: LegalPageKind }) {
  const isPrivacy = kind === "privacy";
  const title = isPrivacy ? "Privacy Policy" : "Terms of Service";
  const Icon = isPrivacy ? ShieldCheck : FileCheck2;
  const sections = isPrivacy ? privacySections : termsSections;

  return (
    <main className="premium-pricing-page min-h-screen">
      <div className="orbital-wash orbital-wash--pricing" aria-hidden="true" />
      <section className="premium-pricing-shell pb-16 pt-8 lg:pb-24">
        <div className="flex flex-col gap-7 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="tool-back-link"><ArrowLeft size={16} /> Back to FINEMIND AI</Link>
          <LegalNavigation active={kind} />
        </div>

        <header className="premium-pricing-header max-w-3xl pt-16 lg:pt-20">
          <span className="premium-eyebrow"><Icon size={14} /> FINEMIND AI LEGAL</span>
          <h1>{title}<br /><em>for a clear orbit.</em></h1>
          <p>Last updated: {LAST_UPDATED}. This public page describes the current FINEMIND AI product experience in clear, practical language.</p>
        </header>

        <article className="mt-10 overflow-hidden rounded-[1.65rem] border border-white/10 bg-[#0a1829]/88 shadow-[0_24px_90px_rgba(0,0,0,0.27)] backdrop-blur-sm">
          <div className="border-b border-white/10 bg-white/[0.025] px-6 py-5 sm:px-8">
            <span className="text-[0.67rem] font-semibold tracking-[0.22em] text-[#8dccff]">PUBLIC INFORMATION · NO SIGN-IN REQUIRED</span>
          </div>
          <div className="space-y-10 px-6 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12">
            {sections.map((section) => (
              <section key={section.heading} className="max-w-4xl">
                <h2 className="font-display text-xl font-medium tracking-[-0.03em] text-white sm:text-2xl">{section.heading}</h2>
                <div className="mt-3 space-y-3 text-sm leading-7 text-white/68 sm:text-[0.95rem]">
                  {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                </div>
                {section.bullets ? <ul className="mt-4 space-y-2 border-l border-[#59B5FF]/40 pl-4 text-sm leading-6 text-white/65">{section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul> : null}
              </section>
            ))}
          </div>
          <footer className="flex flex-col gap-4 border-t border-white/10 bg-[#06101d]/50 px-6 py-6 text-sm text-white/55 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
            <span>FINEMIND AI · one composed workspace for useful work.</span>
            <LegalNavigation active={kind} />
          </footer>
        </article>
      </section>
    </main>
  );
}
