/**
 * Orbit Studio design reminder: tool routes retain NEXA's dark editorial rails,
 * signal-azure navigation, and explicit availability states—never simulated tools.
 */
import { NexaMark } from "@/components/NexaMark";
import { getToolByRoute, type ToolStatus } from "@/data/nexa";
import { ArrowLeft, ArrowUpRight, CircleAlert, Home } from "lucide-react";
import { useLocation } from "wouter";

function statusLabel(status: ToolStatus) {
  return status === "available" ? "Local preview registered" : status === "beta" ? "Beta — service not connected" : "Coming soon";
}

export default function ToolPlaceholder() {
  const [location, setLocation] = useLocation();
  const tool = getToolByRoute(location);

  if (!tool) {
    return (
      <div className="tool-route-page">
        <header className="nexa-nav tool-route-nav"><a href="/" aria-label="Return to NEXA home"><NexaMark /></a></header>
        <main className="tool-route-main">
          <section className="tool-route-panel">
            <p className="section-index"><span /> TOOL ROUTE</p>
            <CircleAlert size={26} className="tool-route-icon" />
            <h1>This tool route is <em>not registered.</em></h1>
            <p>The address does not match a current NEXA tool definition. Return to the Tool Index to browse the registered routes.</p>
            <button className="primary-button" onClick={() => setLocation("/#tool-index")}><ArrowLeft size={17} /> Back to tool index</button>
          </section>
        </main>
      </div>
    );
  }

  const Icon = tool.icon;

  return (
    <div className="tool-route-page">
      <header className="nexa-nav tool-route-nav">
        <a href="/" aria-label="Return to NEXA home"><NexaMark /></a>
        <a className="secondary-button tool-route-home" href="/#tool-index"><ArrowLeft size={16} /> Tool index</a>
      </header>
      <main className="tool-route-main">
        <section className="tool-route-panel">
          <p className="section-index"><span /> {tool.category.toUpperCase()} / REGISTERED TOOL</p>
          <div className="tool-route-icon"><Icon size={28} /></div>
          <div className="tool-route-heading">
            <div>
              <h1>{tool.name}<br /><em>route reserved.</em></h1>
              <p>{tool.description}</p>
            </div>
            <span className={`status-pill status-${tool.status}`}>{statusLabel(tool.status)}</span>
          </div>
          <div className="tool-route-details">
            <div><span>ROUTE</span><code>{tool.route}</code></div>
            <div><span>STATUS</span><strong>{tool.status.replace("-", " ")}</strong></div>
            <div><span>REGISTERED COST</span><strong>{tool.creditCost} credit{tool.creditCost === 1 ? "" : "s"}</strong></div>
          </div>
          <div className="tool-route-notice"><CircleAlert size={17} /><p>No live tool functionality is enabled on this page yet. This route is intentionally a transparent placeholder until the real implementation is added.</p></div>
          <div className="tool-route-actions">
            <button className="primary-button" onClick={() => setLocation("/#tool-index")}><ArrowLeft size={17} /> Browse registered tools</button>
            <a className="secondary-button" href="/"><Home size={16} /> NEXA home <ArrowUpRight size={15} /></a>
          </div>
        </section>
      </main>
    </div>
  );
}
