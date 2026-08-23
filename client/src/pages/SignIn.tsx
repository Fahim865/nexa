import { NexaMark } from "@/components/NexaMark";
import { trpc } from "@/lib/trpc";
import { startLogin } from "@/const";
import { ArrowLeft, ArrowUpRight, Check, Chrome, Loader2, LockKeyhole, Sparkles } from "lucide-react";
import { useLocation } from "wouter";

const errorMessages: Record<string, string> = {
  configuration: "Google sign-in is not configured for this deployment yet.",
  denied: "Google sign-in was cancelled. You can try again whenever you are ready.",
  invalid: "That sign-in link expired or could not be verified. Please start again.",
  failed: "Google could not complete the sign-in. Your account and subscription were not changed.",
};

export default function SignIn() {
  const [location, setLocation] = useLocation();
  const googleStatus = trpc.auth.googleStatus.useQuery();
  const query = new URLSearchParams(location.split("?")[1] ?? "");
  const error = query.get("google");
  const requestedReturnTo = query.get("returnTo");
  const returnTo = requestedReturnTo && requestedReturnTo.startsWith("/") && !requestedReturnTo.startsWith("//") && !requestedReturnTo.includes("\\")
    ? requestedReturnTo
    : "/tools";
  const googleEnabled = googleStatus.data?.enabled === true;

  const continueWithGoogle = () => {
    if (!googleEnabled) return;
    window.location.assign(`/api/auth/google/start?returnTo=${encodeURIComponent(returnTo)}`);
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#06101d] px-5 py-5 text-[#f5f8ff] sm:px-8 sm:py-8">
      <div className="mx-auto grid min-h-[calc(100vh-2.5rem)] max-w-[1240px] overflow-hidden rounded-[2rem] border border-white/[0.09] bg-[linear-gradient(145deg,rgba(12,31,49,0.98),rgba(5,13,24,0.98))] lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative flex min-h-[310px] flex-col justify-between overflow-hidden border-b border-white/[0.08] p-7 sm:p-10 lg:min-h-full lg:border-b-0 lg:border-r">
          <div className="absolute -left-24 -top-28 size-[430px] rounded-full border border-[#59B5FF]/20" aria-hidden="true" />
          <div className="absolute -bottom-36 right-[-110px] size-[390px] rounded-full border border-[#59B5FF]/15" aria-hidden="true" />
          <div className="relative z-10 flex items-center justify-between"><a href="/" aria-label="FINEMIND AI home"><NexaMark /></a><span className="rounded-full border border-[#59B5FF]/25 bg-[#59B5FF]/10 px-3 py-1 text-[10px] font-bold tracking-[0.17em] text-[#9ad3ff]">SECURE ACCESS</span></div>
          <div className="relative z-10 max-w-[490px] py-8 lg:py-0"><p className="mb-4 flex items-center gap-2 text-[11px] font-bold tracking-[0.18em] text-[#9ad3ff]"><Sparkles size={14} /> FINEMIND AI ACCOUNT</p><h1 className="text-4xl font-semibold leading-[0.98] tracking-[-0.06em] sm:text-6xl">Your work,<br /><em className="font-normal text-[#78c5ff]">one secure orbit.</em></h1><p className="mt-6 max-w-md text-sm leading-7 text-[#b3c5d8]">Sign in to keep a single account connected to your Premium plan, AI credits, subscription status, and usage history. Local tools remain open to everyone.</p></div>
          <div className="relative z-10 flex items-center gap-2 text-xs text-[#90a9bf]"><LockKeyhole size={15} className="text-[#59B5FF]" /> Google identity is verified server-side before a FINEMIND AI session is created.</div>
        </section>

        <section className="flex items-center p-7 sm:p-10 lg:p-14"><div className="w-full"><button type="button" onClick={() => setLocation("/")} className="mb-10 flex items-center gap-2 text-xs font-medium text-[#aebfd0] transition hover:text-white"><ArrowLeft size={15} /> Back to FINEMIND AI</button><p className="text-[11px] font-bold tracking-[0.16em] text-[#59B5FF]">ACCOUNT ACCESS</p><h2 className="mt-3 text-3xl font-semibold tracking-[-0.045em]">Continue to your workspace</h2><p className="mt-3 text-sm leading-6 text-[#9fb2c7]">Use Google, or continue with the secure sign-in method already connected to this FINEMIND AI deployment.</p>
          {error ? <div role="alert" className="mt-6 rounded-2xl border border-amber-300/20 bg-amber-300/[0.07] px-4 py-3 text-sm leading-6 text-amber-100">{errorMessages[error] ?? "The sign-in request could not be completed."}</div> : null}
          <div className="mt-8 grid gap-3"><button type="button" onClick={continueWithGoogle} disabled={googleStatus.isLoading || !googleEnabled} className="flex min-h-14 items-center justify-center gap-3 rounded-xl bg-[#f5f8ff] px-5 text-sm font-bold text-[#101923] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50">{googleStatus.isLoading ? <Loader2 size={18} className="animate-spin" /> : <Chrome size={18} />} Continue with Google <ArrowUpRight size={15} /></button><button type="button" onClick={() => startLogin()} className="flex min-h-14 items-center justify-center gap-3 rounded-xl border border-white/15 bg-white/[0.035] px-5 text-sm font-semibold text-white transition hover:border-[#59B5FF]/50 hover:bg-[#59B5FF]/[0.08]"><LockKeyhole size={17} className="text-[#79c8ff]" /> Continue with existing secure sign-in</button></div>
          {!googleStatus.isLoading && !googleEnabled ? <p className="mt-4 text-xs leading-5 text-[#7f98af]">Google is shown only as a real OAuth route. Add the server-only Google OAuth configuration to enable this button.</p> : null}
          <div className="mt-9 space-y-3 border-t border-white/[0.08] pt-6 text-xs leading-5 text-[#91a8bc]"><p className="flex gap-2"><Check size={15} className="mt-0.5 shrink-0 text-[#59B5FF]" /> Free users can still use browser-local tools without an account.</p><p className="flex gap-2"><Check size={15} className="mt-0.5 shrink-0 text-[#59B5FF]" /> Premium AI actions remain server-authorized and credit-metered.</p></div>
        </div></section>
      </div>
    </main>
  );
}
