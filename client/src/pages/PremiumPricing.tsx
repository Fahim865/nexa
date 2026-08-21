import { Link } from "wouter";
import { useState } from "react";
import { ArrowLeft, Check, CreditCard, Crown, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

const includedTools = ["AI Translator", "AI Hashtag Generator", "AI Description Generator", "AI Stock Metadata Generator", "AI YouTube SEO Assistant"];

export default function PremiumPricing() {
  const { user, isAuthenticated, loading } = useAuth();
  const [plan, setPlan] = useState<"monthly" | "annual">("monthly");
  const catalog = trpc.subscription.catalog.useQuery();
  const billing = trpc.billing.status.useQuery(undefined, { enabled: Boolean(isAuthenticated) });
  const checkout = trpc.billing.createCheckoutSession.useMutation({
    onSuccess: session => { window.location.assign(session.redirectUrl); },
    onError: error => toast.error(error.message),
  });

  const price = catalog.data?.monthlyPriceUsd ?? 10;
  const allowance = catalog.data?.monthlyCreditAllowance ?? 5000;
  const status = billing.data;
  const isPremium = status?.plan === "PREMIUM" && (status.subscriptionStatus === "ACTIVE" || status.subscriptionStatus === "TRIALING");

  const startUpgrade = () => {
    if (!isAuthenticated) {
      toast.error("Sign in is required before starting a secure checkout.");
      return;
    }
    checkout.mutate({
      plan,
      successUrl: `${window.location.origin}/premium?checkout=return`,
      cancelUrl: `${window.location.origin}/premium?checkout=cancel`,
    });
  };

  return <main className="premium-pricing-page">
    <div className="orbital-wash orbital-wash--pricing" aria-hidden="true" />
    <section className="premium-pricing-shell">
      <Link href="/" className="tool-back-link"><ArrowLeft size={16} /> Back to NEXA</Link>
      <header className="premium-pricing-header">
        <span className="premium-eyebrow"><Sparkles size={14} /> NEXA PREMIUM</span>
        <h1>More creative output.<br /><em>One clear plan.</em></h1>
        <p>Premium protects AI access with a verified subscription and a predictable monthly credit allowance.</p>
      </header>

      <div className="premium-pricing-grid">
        <article className="premium-plan-card">
          <div className="premium-plan-card__top"><Crown size={22} /><span>PREMIUM</span></div>
          <div className="premium-price"><strong>${price}</strong><span>USD / month</span></div>
          <p className="premium-credit-highlight"><b>{allowance.toLocaleString()}</b> AI credits per subscription period</p>
          <fieldset className="premium-plan-selector" disabled={loading || checkout.isPending || isPremium}>
            <legend>Billing cadence</legend>
            <div className="premium-plan-selector__choices">
              <label className={plan === "monthly" ? "is-selected" : ""}>
                <input type="radio" name="premium-plan" value="monthly" checked={plan === "monthly"} onChange={() => setPlan("monthly")} />
                <span><b>Monthly</b><small>${price} USD / month</small></span>
              </label>
              <label className={plan === "annual" ? "is-selected" : ""}>
                <input type="radio" name="premium-plan" value="annual" checked={plan === "annual"} onChange={() => setPlan("annual")} />
                <span><b>Annual</b><small>Configured Paddle price shown at checkout</small></span>
              </label>
            </div>
          </fieldset>
          <button type="button" className="premium-checkout-button" onClick={startUpgrade} disabled={loading || checkout.isPending || isPremium}>
            {checkout.isPending ? <><Loader2 size={17} className="spin" /> Opening secure checkout…</> : isPremium ? <><ShieldCheck size={17} /> Premium is active</> : <><CreditCard size={17} /> Upgrade to Premium</>}
          </button>
          <p className="premium-disclosure">Your selected cadence is mapped to a server-only Paddle price. Checkout is only available after secure provider configuration, and pressing this button never changes your plan.</p>
        </article>

        <div className="premium-benefits-panel">
          <div><span className="premium-section-label">INCLUDED AI TOOLS</span><ul>{includedTools.map(tool => <li key={tool}><Check size={16} /> {tool}</li>)}</ul></div>
          <div className="premium-usage-note"><span className="premium-section-label">CREDIT USE</span><p>Each AI request has a visible server-defined cost. Your remaining balance is shown inside each AI workspace. Credits reset at the beginning of a new verified subscription period and unused credits do not carry over.</p></div>
          {status && <div className="premium-account-state"><span className="premium-section-label">YOUR BILLING STATE</span><p><b>{status.plan}</b> · {status.subscriptionStatus.replace("_", " ")}</p>{status.subscriptionEndDate && <small>Current period ends {new Date(status.subscriptionEndDate).toLocaleDateString()}</small>}</div>}
        </div>
      </div>
      {checkout.error && <p className="premium-inline-error" role="alert">{checkout.error.message}</p>}
    </section>
  </main>;
}
