import { Link } from "wouter";
import { ArrowRight, CheckCircle2, Clock3, Crown, ShieldCheck } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

/**
 * Checkout return page. It deliberately reads server-owned billing state rather
 * than treating a checkout redirect as proof of a successful subscription.
 */
export default function Welcome() {
  const { isAuthenticated, loading } = useAuth();
  const billing = trpc.billing.status.useQuery(undefined, { enabled: Boolean(isAuthenticated) });
  const status = billing.data;
  const isPremium = status?.plan === "PREMIUM" && (status.subscriptionStatus === "ACTIVE" || status.subscriptionStatus === "TRIALING");

  const heading = isPremium ? "Premium is active." : "We’re confirming your subscription.";
  const description = isPremium
    ? "Your server-verified Premium entitlement and current AI credit balance are now available in your workspace."
    : "A return from checkout never activates Premium by itself. Your access changes only after FINEMIND AI receives and verifies the Paddle subscription event.";

  return (
    <main className="min-h-screen overflow-hidden bg-[#06101d] px-5 py-5 text-[#f5f8ff] sm:px-8 sm:py-8">
      <div className="relative mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-[980px] items-center overflow-hidden rounded-[2rem] border border-white/[0.09] bg-[linear-gradient(145deg,rgba(12,31,49,0.98),rgba(5,13,24,0.98))] p-7 sm:p-12">
        <div className="absolute -right-32 -top-32 size-[440px] rounded-full border border-[#59B5FF]/15" aria-hidden="true" />
        <div className="absolute -bottom-44 -left-36 size-[460px] rounded-full border border-[#59B5FF]/10" aria-hidden="true" />
        <section className="relative z-10 max-w-2xl">
          <p className="flex items-center gap-2 text-[11px] font-bold tracking-[0.18em] text-[#9ad3ff]"><Crown size={14} /> FINEMIND AI PREMIUM</p>
          <div className="mt-7 flex size-14 items-center justify-center rounded-2xl border border-[#59B5FF]/25 bg-[#59B5FF]/10 text-[#8dceff]">
            {isPremium ? <CheckCircle2 size={28} /> : <Clock3 size={28} />}
          </div>
          <h1 className="mt-7 text-4xl font-semibold leading-[0.98] tracking-[-0.06em] sm:text-6xl">{heading}</h1>
          <p className="mt-6 max-w-xl text-sm leading-7 text-[#b3c5d8]">{description}</p>

          <div className="mt-8 rounded-2xl border border-white/[0.09] bg-white/[0.035] p-5 text-sm leading-6 text-[#b3c5d8]">
            <div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 shrink-0 text-[#70c4ff]" size={19} /><p><b className="text-white">Server-verified only.</b> {loading || billing.isLoading ? "Checking your account state…" : isPremium ? "Your verified subscription is active." : "If payment is still processing, refresh this page shortly after Paddle completes the webhook."}</p></div>
            {status && <p className="mt-3 border-t border-white/[0.08] pt-3 text-xs text-[#90a9bf]">Current account state: <b className="text-[#ddebfa]">{status.plan}</b> · {status.subscriptionStatus.replace("_", " ")}</p>}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/tools" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#f5f8ff] px-5 text-sm font-bold text-[#101923] transition hover:bg-white">Open tools <ArrowRight size={16} /></Link>
            <Link href="/premium" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/15 bg-white/[0.035] px-5 text-sm font-semibold text-white transition hover:border-[#59B5FF]/50 hover:bg-[#59B5FF]/[0.08]">View Premium status</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
