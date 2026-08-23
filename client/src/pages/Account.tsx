import { useAuth } from "@/_core/hooks/useAuth";
import { NexaAccountMenu } from "@/components/NexaAccountMenu";
import { NexaMark } from "@/components/NexaMark";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, ArrowUpRight, CalendarClock, CheckCircle2, CreditCard, Crown, ExternalLink, Loader2, ShieldCheck, Sparkles, UserRound, WalletCards } from "lucide-react";
import { toast } from "sonner";
import { Link, useLocation } from "wouter";

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "Not available";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not available" : date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function friendlyStatus(status: string | undefined) {
  return status ? status.replaceAll("_", " ") : "Loading";
}

function identityInitial(name?: string | null, email?: string | null) {
  return (name?.trim().charAt(0) || email?.trim().charAt(0) || "N").toUpperCase();
}

export default function Account() {
  const [, setLocation] = useLocation();
  const { user, loading, isAuthenticated } = useAuth({ redirectOnUnauthenticated: true, redirectPath: "/sign-in?returnTo=%2Faccount" });
  const billing = trpc.billing.status.useQuery(undefined, { enabled: isAuthenticated, retry: false });
  const premiumActive = billing.data?.plan === "PREMIUM" && (billing.data.subscriptionStatus === "ACTIVE" || billing.data.subscriptionStatus === "TRIALING");
  const credit = trpc.subscription.creditStatus.useQuery(undefined, { enabled: premiumActive, retry: false });
  const portal = trpc.billing.createPortalSession.useMutation({
    onSuccess: (session) => window.location.assign(session.redirectUrl),
    onError: (error) => toast.error(error.message),
  });
  const cancelSubscription = trpc.billing.cancelSubscription.useMutation({
    onSuccess: () => {
      toast.success("Cancellation request sent. Your access changes only after the verified provider update.");
      void billing.refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  if (loading || !user) {
    return <main className="min-h-screen bg-[#06101d] text-white"><div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-5"><Loader2 className="size-6 animate-spin text-[#8ed0ff]" aria-label="Loading account" /></div></main>;
  }

  const status = billing.data;
  const allowance = credit.data?.monthlyCreditAllowance ?? status?.monthlyCreditAllowance ?? 5000;
  const remaining = credit.data?.remainingCredits ?? status?.remainingCredits ?? 0;
  const usagePercent = allowance > 0 ? Math.min(100, Math.max(0, (remaining / allowance) * 100)) : 0;
  const canManageProvider = Boolean(status?.providerCustomerId);
  const canCancel = Boolean(status?.providerSubscriptionId && premiumActive && !status?.cancelAtPeriodEnd);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#06101d] text-[#f5f8ff]">
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true"><div className="absolute -right-40 -top-40 size-[38rem] rounded-full border border-[#59B5FF]/10" /><div className="absolute -bottom-60 -left-44 size-[36rem] rounded-full border border-[#a47cff]/10" /></div>
      <header className="nexa-nav relative">
        <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between px-5 py-3.5 lg:px-10">
          <Link href="/" aria-label="FINEMIND AI home"><NexaMark imageClassName="transition-transform duration-200 hover:rotate-6" /></Link>
          <nav className="hidden items-center gap-6 text-sm text-white/60 sm:flex"><Link href="/tools" className="transition-colors hover:text-white">Tools</Link><Link href="/premium" className="transition-colors hover:text-white">Premium</Link><span className="text-[#a9dcff]">Account</span></nav>
          <NexaAccountMenu compact />
        </div>
      </header>

      <div className="relative mx-auto max-w-[1240px] px-5 pb-16 pt-28 lg:px-10 lg:pt-32">
        <Link href="/tools" className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.12em] text-white/55 transition-colors hover:text-[#9ed8ff]"><ArrowLeft size={15} /> TOOL WORKSPACE</Link>
        <section className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div><p className="flex items-center gap-2 text-[11px] font-bold tracking-[0.17em] text-[#9ed8ff]"><Sparkles size={14} /> FINEMIND AI ACCOUNT</p><h1 className="mt-4 text-4xl font-semibold tracking-[-0.055em] sm:text-6xl">Your account,<br /><em className="font-normal text-[#78c5ff]">in clear orbit.</em></h1><p className="mt-5 max-w-xl text-sm leading-7 text-[#aebfd1]">Review your profile, plan, server-verified credit balance, and subscription status from one focused workspace.</p></div>
          <div className="rounded-[1.6rem] border border-white/10 bg-[#0a1929]/80 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.24)] backdrop-blur"><div className="flex items-center gap-4"><Avatar className="size-14 border border-[#59B5FF]/30 bg-[#0b2741]"><AvatarFallback className="bg-[#0b2741] text-lg font-bold text-[#a9dcff]">{identityInitial(user.name, user.email)}</AvatarFallback></Avatar><div className="min-w-0"><p className="truncate text-lg font-semibold">{user.name || "FINEMIND AI member"}</p><p className="mt-0.5 truncate text-sm text-white/50">{user.email || "Signed-in account"}</p></div></div><div className="mt-5 flex items-center gap-2 rounded-xl border border-white/8 bg-black/15 px-3 py-2 text-xs text-white/55"><ShieldCheck size={15} className="text-[#87d2ff]" /> Secure Google-linked FINEMIND AI identity</div></div>
        </section>

        <section className="mt-10 grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
          <article className="rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-6"><div className="flex items-center justify-between"><span className="text-[11px] font-bold tracking-[0.16em] text-white/45">MY PROFILE</span><UserRound className="size-5 text-[#8ed0ff]" /></div><div className="mt-6 space-y-4"><div><p className="text-xs text-white/45">Display name</p><p className="mt-1 font-medium">{user.name || "FINEMIND AI member"}</p></div><div><p className="text-xs text-white/45">Email address</p><p className="mt-1 break-all font-medium">{user.email || "Not available"}</p></div><div><p className="text-xs text-white/45">Sign-in method</p><p className="mt-1 font-medium">Google OAuth</p></div></div></article>

          <article id="billing" className="scroll-mt-24 rounded-[1.5rem] border border-[#59B5FF]/20 bg-[linear-gradient(135deg,rgba(27,86,130,0.22),rgba(9,24,40,0.72))] p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-[11px] font-bold tracking-[0.16em] text-[#9ed8ff]">PLAN & BILLING</p><h2 className="mt-2 text-2xl font-semibold tracking-[-0.035em]">{billing.isLoading ? "Loading subscription…" : premiumActive ? "Premium is active" : "Free workspace"}</h2></div><span className={`rounded-full border px-3 py-1 text-[10px] font-bold tracking-[0.14em] ${premiumActive ? "border-[#65d6b4]/35 bg-[#65d6b4]/10 text-[#8ff0cf]" : "border-white/15 bg-white/[0.06] text-white/60"}`}>{friendlyStatus(status?.subscriptionStatus)}</span></div>
            {billing.error ? <p className="mt-5 rounded-xl border border-red-400/25 bg-red-400/10 px-3 py-2 text-sm text-red-100" role="alert">{billing.error.message}</p> : <><div className="mt-6 grid gap-3 sm:grid-cols-3"><div className="rounded-xl border border-white/10 bg-black/15 p-3"><p className="text-[10px] font-bold tracking-[0.12em] text-white/45">CURRENT PLAN</p><p className="mt-2 flex items-center gap-2 text-sm font-semibold">{premiumActive ? <Crown className="size-4 text-[#f2c56f]" /> : <CheckCircle2 className="size-4 text-white/50" />}{status?.plan ?? "FREE"}</p></div><div className="rounded-xl border border-white/10 bg-black/15 p-3"><p className="text-[10px] font-bold tracking-[0.12em] text-white/45">PERIOD START</p><p className="mt-2 text-sm font-semibold">{formatDate(status?.subscriptionStartDate)}</p></div><div className="rounded-xl border border-white/10 bg-black/15 p-3"><p className="text-[10px] font-bold tracking-[0.12em] text-white/45">NEXT DATE</p><p className="mt-2 text-sm font-semibold">{formatDate(status?.subscriptionEndDate)}</p></div></div>
            {premiumActive ? <div className="mt-5 rounded-2xl border border-[#59B5FF]/20 bg-[#06111e]/65 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2 text-sm font-semibold"><WalletCards className="size-4 text-[#8ed0ff]" /> AI credits</div><span className="text-sm text-[#bce6ff]"><b>{remaining.toLocaleString()}</b> / {allowance.toLocaleString()} remaining</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[linear-gradient(90deg,#59B5FF,#8dceff)] transition-[width] duration-300" style={{ width: `${usagePercent}%` }} /></div><p className="mt-3 flex items-center gap-1.5 text-xs text-white/48"><CalendarClock className="size-3.5" /> Resets {formatDate(credit.data?.nextCreditResetDate ?? status?.subscriptionEndDate)}</p></div> : <div className="mt-5 rounded-2xl border border-white/10 bg-black/15 p-4"><p className="text-sm leading-6 text-white/65">Upgrade to Premium for the server-verified monthly AI credit allowance and access to protected AI creator tools.</p><button type="button" onClick={() => setLocation("/premium")} className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#59B5FF] px-4 py-2 text-xs font-bold text-[#05111f] transition-transform hover:bg-[#7ac7ff] active:scale-[0.97]">Explore Premium <ArrowUpRight className="size-4" /></button></div>}
            <div className="mt-5 flex flex-wrap gap-2">{canManageProvider ? <button type="button" disabled={portal.isPending} onClick={() => portal.mutate({ returnUrl: `${window.location.origin}/account` })} className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/[0.12] disabled:opacity-50">{portal.isPending ? <Loader2 className="size-4 animate-spin" /> : <ExternalLink className="size-4" />} Manage billing</button> : null}{canCancel ? <AlertDialog><AlertDialogTrigger asChild><button type="button" className="inline-flex items-center gap-2 rounded-full border border-red-300/20 px-4 py-2 text-xs font-semibold text-[#ffb7b7] transition-colors hover:bg-red-400/10"><CreditCard className="size-4" /> Cancel renewal</button></AlertDialogTrigger><AlertDialogContent className="border-white/10 bg-[#0a1727] text-white"><AlertDialogHeader><AlertDialogTitle>Cancel Premium renewal?</AlertDialogTitle><AlertDialogDescription className="text-white/60">We will send a cancellation request to the billing provider. FINEMIND AI access remains unchanged until the provider sends a verified subscription update.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel className="border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white">Keep Premium</AlertDialogCancel><AlertDialogAction onClick={() => cancelSubscription.mutate()} className="bg-red-500 text-white hover:bg-red-400">{cancelSubscription.isPending ? "Sending…" : "Send cancellation request"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog> : null}</div></>}
          </article>
        </section>
      </div>
    </main>
  );
}
