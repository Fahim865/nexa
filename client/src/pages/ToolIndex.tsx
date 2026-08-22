/**
 * Orbit Studio discovery: meaningful groupings and editorial sections instead
 * of a single unstructured wall of tools.
 */
import { NexaMark } from "@/components/NexaMark";
import { NexaAccountMenu } from "@/components/NexaAccountMenu";
import {
  FEATURED_AI_TOOL_IDS,
  getToolById,
  getToolDiscoveryCategory,
  POPULAR_TOOL_IDS,
  searchToolsForDiscovery,
  TOOL_DISCOVERY_CATEGORIES,
  TOOL_REGISTRY,
  type ToolDefinition,
  type ToolDiscoveryCategoryId,
} from "@/data/nexa";
import { useRecentTools } from "@/hooks/useRecentTools";
import { ArrowLeft, ArrowRight, ArrowUpRight, CheckCircle2, ChevronRight, Clock3, Layers3, Search, Sparkles, X } from "lucide-react";
import { useDeferredValue, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { useLocation } from "wouter";
import "./tool-index.css";

type ToolIndexProps = { mode?: "overview" | "all" };

function StatusLabel({ tool }: { tool: ToolDefinition }) {
  const label = tool.status === "available" ? "Ready" : tool.status === "beta" ? "Beta" : "Planned";
  return <span className={`status-pill status-${tool.status}`}>{label}</span>;
}

function ToolCard({ tool, rank }: { tool: ToolDefinition; rank?: number }) {
  const [, setLocation] = useLocation();
  const category = getToolDiscoveryCategory(tool);
  const Icon = tool.icon;
  const style = { "--tool-accent": category.accent } as CSSProperties;

  return (
    <button className="discovery-tool-card" style={style} onClick={() => setLocation(tool.route)} type="button" aria-label={`Open ${tool.name}`}>
      <div className="discovery-tool-card__top">
        <span className="discovery-tool-card__icon"><Icon size={20} /></span>
        <div className="discovery-tool-card__meta">
          {rank ? <span className="discovery-tool-card__rank">0{rank}</span> : null}
          <StatusLabel tool={tool} />
        </div>
      </div>
      <div className="discovery-tool-card__body">
        <span className="discovery-tool-card__category">{category.label}</span>
        <h3>{tool.name}</h3>
        <p>{tool.description}</p>
      </div>
      <div className="discovery-tool-card__footer">
        <span>{tool.creditCost === 0 ? "No credit charge" : `${tool.creditCost} credit${tool.creditCost === 1 ? "" : "s"}`}</span>
        <ArrowUpRight size={17} aria-hidden="true" />
      </div>
    </button>
  );
}

function ToolSection({ title, label, description, tools, empty, action }: {
  title: ReactNode;
  label: string;
  description: string;
  tools: readonly ToolDefinition[];
  empty?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="discovery-section">
      <div className="discovery-section__heading">
        <div>
          <p className="section-index"><span /> {label}</p>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        {action}
      </div>
      {tools.length ? <div className="discovery-tool-grid">{tools.map((tool, index) => <ToolCard key={tool.id} tool={tool} rank={title === "Popular tools" ? index + 1 : undefined} />)}</div> : empty}
    </section>
  );
}

function asTools(ids: readonly string[]) {
  return ids.flatMap((id) => {
    const tool = getToolById(id);
    return tool ? [tool] : [];
  });
}

export default function ToolIndex({ mode = "overview" }: ToolIndexProps) {
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<ToolDiscoveryCategoryId>("all");
  const deferredQuery = useDeferredValue(query);
  const recentTools = useRecentTools();
  const results = useMemo(() => searchToolsForDiscovery(deferredQuery, activeCategory), [activeCategory, deferredQuery]);
  const popularTools = useMemo(() => asTools(POPULAR_TOOL_IDS), []);
  const featuredAiTools = useMemo(() => asTools(FEATURED_AI_TOOL_IDS), []);
  const isFiltering = query.trim().length > 0 || activeCategory !== "all";
  const activeMetadata = TOOL_DISCOVERY_CATEGORIES.find((category) => category.id === activeCategory) ?? TOOL_DISCOVERY_CATEGORIES[0];

  return (
    <div className="tool-discovery-page">
      <header className="nexa-nav discovery-nav">
        <div className="discovery-nav__inner">
          <a href="/" className="group" aria-label="Return to NEXA home"><NexaMark imageClassName="transition-transform duration-200 group-hover:rotate-6" /></a>
          <nav aria-label="Tool discovery navigation">
            <a href="/">Home</a>
            <a href="/tools" aria-current={mode === "overview" ? "page" : undefined}>Discover</a>
            <a href="/tools/all" aria-current={mode === "all" ? "page" : undefined}>All tools</a>
            <a href="/premium">Premium</a>
          </nav>
          <div className="flex items-center gap-2"><NexaAccountMenu compact /><button className="discovery-nav__back" type="button" onClick={() => setLocation("/")}><ArrowLeft size={15} /> Home</button></div>
        </div>
      </header>

      <main className="tool-discovery-shell">
        <section className="discovery-hero">
          <div className="discovery-hero__copy">
            <p className="section-index"><span /> TOOL DISCOVERY / {mode === "all" ? "FULL CATALOG" : "CURATED INDEX"}</p>
            <h1>{mode === "all" ? <>Every tool.<br /><em>Clearer paths.</em></> : <>Find the right<br /><em>next tool.</em></>}</h1>
            <p>Search NEXA by outcome, format, or workflow. The catalog groups tools by the work they support, while every card stays connected to its canonical route.</p>
          </div>
          <div className="discovery-orbit" aria-hidden="true"><i /><i /><i /><b><Search size={21} /></b></div>
        </section>

        <section className="discovery-control-panel" aria-label="Tool search and category filters">
          <label className="discovery-search-field">
            <Search size={20} aria-hidden="true" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by tool, task, format, or keyword…" type="search" aria-label="Search NEXA tools" autoComplete="off" />
            {query ? <button type="button" onClick={() => setQuery("")} aria-label="Clear tool search"><X size={16} /></button> : null}
          </label>
          <div className="discovery-filter-strip" role="list" aria-label="Tool categories">
            {TOOL_DISCOVERY_CATEGORIES.map((category) => {
              const count = searchToolsForDiscovery("", category.id).length;
              return (
                <button
                  key={category.id}
                  type="button"
                  role="listitem"
                  data-active={activeCategory === category.id}
                  style={{ "--filter-accent": category.accent } as CSSProperties}
                  onClick={() => setActiveCategory(category.id)}
                >
                  <span>{category.label}</span><small>{count}</small>
                </button>
              );
            })}
          </div>
          <div className="discovery-result-summary">
            <span className="discovery-result-summary__mark" style={{ "--summary-accent": activeMetadata.accent } as CSSProperties} />
            <p><b>{activeMetadata.label}</b> · {results.length} of {TOOL_REGISTRY.length} registered tools</p>
            {isFiltering ? <button type="button" onClick={() => { setQuery(""); setActiveCategory("all"); }}>Reset filters</button> : null}
          </div>
        </section>

        {mode === "overview" && !isFiltering ? (
          <div className="discovery-editorial-flow">
            <ToolSection
              label="01 / START HERE"
              title="Popular tools"
              description="Curated shortcuts for common NEXA workflows; this is not a fabricated usage ranking."
              tools={popularTools}
              action={<button type="button" className="discovery-inline-link" onClick={() => setLocation("/tools/all")}>View all tools <ArrowRight size={16} /></button>}
            />
            <ToolSection
              label="02 / YOUR HISTORY"
              title="Recently used"
              description="Only tools opened on this browser are shown here. Your history stays in local storage."
              tools={recentTools}
              empty={<div className="discovery-empty-state"><Clock3 size={21} /><div><strong>Your recent tools will appear here.</strong><p>Open any registered tool to build a private, browser-local history.</p></div></div>}
            />
            <ToolSection
              label="03 / CREATOR INTELLIGENCE"
              title="Featured AI tools"
              description="Premium-capable creator workflows with server-side plan and credit checks at execution time."
              tools={featuredAiTools}
              action={<button type="button" className="discovery-inline-link" onClick={() => { setActiveCategory("creator"); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Explore creator tools <ChevronRight size={16} /></button>}
            />
            <section className="discovery-category-matrix">
              <div className="discovery-section__heading">
                <div><p className="section-index"><span /> 04 / CATALOG MAP</p><h2>Browse by category</h2><p>Different disciplines retain their own color and description, rather than sharing one anonymous tool grid.</p></div>
              </div>
              <div className="discovery-category-grid">
                {TOOL_DISCOVERY_CATEGORIES.filter((category) => category.id !== "all").map((category) => (
                  <button key={category.id} type="button" style={{ "--category-accent": category.accent } as CSSProperties} onClick={() => { setActiveCategory(category.id); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
                    <span className="discovery-category-grid__dot" /><small>{searchToolsForDiscovery("", category.id).length} TOOLS</small><strong>{category.label}</strong><p>{category.description}</p><ArrowRight size={16} />
                  </button>
                ))}
              </div>
            </section>
          </div>
        ) : (
          <ToolSection
            label={mode === "all" ? "ALL REGISTERED TOOLS" : "SEARCH RESULTS"}
            title={isFiltering ? <>Results for <em>{query || activeMetadata.label}</em></> : "The full NEXA catalog"}
            description={isFiltering ? "Search checks canonical names, registry descriptions, routes, categories, and common workflow keywords." : "Use the search field or a category filter to narrow the complete registry."}
            tools={results}
            empty={<div className="discovery-empty-state"><Layers3 size={21} /><div><strong>No registered tool matches this search.</strong><p>Try a broader task or reset the current category filter.</p></div></div>}
          />
        )}

        {mode === "overview" && isFiltering ? <button className="discovery-view-all-banner" type="button" onClick={() => setLocation("/tools/all")}><CheckCircle2 size={18} /><span>Need the complete registry? <b>Open View All Tools</b></span><ArrowRight size={17} /></button> : null}
      </main>
    </div>
  );
}
