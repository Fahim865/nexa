/**
 * Orbit Studio design reminder: asymmetric editorial rails, tactile dark surfaces,
 * Signal Azure actions, and quiet orbital motion—not a generic SaaS grid.
 */
import { NexaMark } from "@/components/NexaMark";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useTheme } from "@/contexts/ThemeContext";
import {
  FEATURED_TOOL_IDS,
  getToolById,
  PLAN_CONFIG,
  searchToolRegistry,
  TOOL_CATEGORIES,
  TOOL_REGISTRY,
  type ToolCategoryId,
  type ToolId,
} from "@/data/nexa";
import {
  ArrowDownRight,
  ArrowUpRight,
  Calculator,
  Check,
  ChevronRight,
  Command,
  FileText,
  Heart,
  ImageIcon,
  Menu,
  Moon,
  Play,
  Search,
  Sparkles,
  Sun,
  TimerReset,
  Wand2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

const navItems = [
  { label: "Tool index", href: "#tool-index" },
  { label: "Workspace", href: "#workspace" },
  { label: "How it works", href: "#why-nexa" },
  { label: "Plans", href: "#plans" },
];

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function StatusPill({ status }: { status: "available" | "beta" | "coming-soon" }) {
  const label = status === "coming-soon" ? "Coming soon" : status === "beta" ? "Beta" : "Ready";
  return <span className={`status-pill status-${status}`}>{label}</span>;
}

export default function Home() {
  const { theme, toggleTheme } = useTheme();
  const [, setLocation] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<ToolId>("ai-summarizer");
  const [activeCategoryId, setActiveCategoryId] = useState<ToolCategoryId>("all");
  const [toolIndexQuery, setToolIndexQuery] = useState("");
  const [toolSearchQuery, setToolSearchQuery] = useState("");
  const [calcLeft, setCalcLeft] = useState("24");
  const [calcRight, setCalcRight] = useState("16");
  const [calcResult, setCalcResult] = useState("40");
  const [words, setWords] = useState("Shape a single, clearer next step for your work.");

  const selectedTool = useMemo(
    () => getToolById(selectedId) ?? TOOL_REGISTRY[0],
    [selectedId],
  );
  const SelectedIcon = selectedTool.icon;
  const featuredTools = useMemo(
    () => FEATURED_TOOL_IDS.flatMap((toolId) => {
      const tool = getToolById(toolId);
      return tool ? [tool] : [];
    }),
    [],
  );
  const visibleTools = useMemo(
    () => searchToolRegistry(toolIndexQuery, activeCategoryId),
    [activeCategoryId, toolIndexQuery],
  );
  const commandSearchResults = useMemo(() => searchToolRegistry(toolSearchQuery), [toolSearchQuery]);
  const wordCount = words.trim() ? words.trim().split(/\s+/).length : 0;

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  const chooseTool = (toolId: ToolId) => {
    setSelectedId(toolId);
    scrollToId("feature-lens");
  };

  const openToolRoute = (route: string) => {
    setLocation(route);
  };

  const handleToolAction = () => {
    if (selectedTool.status === "available") {
      toast.success(`${selectedTool.name} preview is ready below.`);
      scrollToId("workspace");
      return;
    }
    toast.message(
      selectedTool.status === "beta"
        ? "AI service is not connected in this frontend preview."
        : `${selectedTool.name} is marked as coming soon.`,
    );
  };

  const handleCalculator = () => {
    const left = Number(calcLeft);
    const right = Number(calcRight);
    if (Number.isNaN(left) || Number.isNaN(right)) {
      toast.error("Enter valid numbers to calculate.");
      return;
    }
    setCalcResult(String(left + right));
    toast.success("Calculation complete. Local preview only.");
  };

  return (
    <div className="nexa-site min-h-screen overflow-x-clip bg-[#06101d] text-[#f5f8ff] selection:bg-[#59B5FF]/30 selection:text-white">
      <header className="nexa-nav">
        <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between px-5 py-4 lg:px-10">
          <a href="#top" className="group" aria-label="Go to NEXA home">
            <NexaMark imageClassName="transition-transform duration-200 group-hover:rotate-6" />
          </a>

          <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary navigation">
            {navItems.map((item) => (
              <a key={item.href} className="nav-link" href={item.href}>
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-3 sm:flex">
            <button className="icon-button" onClick={toggleTheme} aria-label="Toggle color mode">
              {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <button className="search-trigger" onClick={() => setSearchOpen(true)} aria-label="Open tool search">
              <Search size={16} />
              <span>Search</span>
              <kbd><Command size={11} /> K</kbd>
            </button>
            <button className="nav-cta" onClick={() => scrollToId("tool-index")}>
              Open NEXA <ArrowUpRight size={16} />
            </button>
          </div>

          <button className="icon-button sm:hidden" onClick={() => setMenuOpen((value) => !value)} aria-label="Toggle navigation menu">
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        {menuOpen ? (
          <div className="mobile-menu sm:hidden">
            {navItems.map((item) => (
              <a key={item.href} href={item.href} onClick={() => setMenuOpen(false)}>{item.label}</a>
            ))}
            <button onClick={() => { setMenuOpen(false); setSearchOpen(true); }}>
              <Search size={16} /> Search tools
            </button>
          </div>
        ) : null}
      </header>

      <main id="top">
        <section className="hero-section">
          <img className="hero-art" src="/manus-storage/nexa-orbit-hero_2ebd6525.jpg" alt="Abstract orbital NEXA workspace artwork" />
          <div className="hero-shade" />
          <div className="hero-grid" aria-hidden="true" />
          <div className="relative z-10 mx-auto grid min-h-[760px] max-w-[1440px] items-center gap-12 px-5 pb-16 pt-28 lg:grid-cols-[minmax(0,0.88fr)_minmax(440px,0.95fr)] lg:px-10 lg:pb-20 lg:pt-32">
            <div className="hero-copy max-w-[720px]">
              <p className="section-index light-index"><span /> 01 — INTELLIGENT UTILITY</p>
              <h1>Your tools, <em>finally</em><br />in one orbit.</h1>
              <p className="hero-subcopy">NEXA brings everyday utility, creative momentum, and thoughtful AI workflows into one composed workspace—so your next useful action is already close.</p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <button className="primary-button" onClick={() => scrollToId("tool-index")}>
                  Explore the tool index <ArrowDownRight size={18} />
                </button>
                <button className="secondary-button" onClick={() => chooseTool("ai-summarizer")}>
                  <Play size={14} fill="currentColor" /> Try the AI lens
                </button>
              </div>
              <div className="hero-proof mt-11 flex flex-wrap gap-x-7 gap-y-3 text-xs text-white/60">
                <span><Check size={14} /> Local tools where practical</span>
                <span><Check size={14} /> Transparent credit model</span>
                <span><Check size={14} /> Built for every screen</span>
              </div>
            </div>

            <div className="hero-stage" aria-label="NEXA product preview">
              <div className="stage-orbit orbit-one" />
              <div className="stage-orbit orbit-two" />
              <div className="stage-axis axis-one"><i /><i /></div>
              <div className="stage-axis axis-two"><i /><i /></div>
              <div className="hero-tool-card hero-tool-ai">
                <span className="tool-card-dot"><Sparkles size={17} /></span>
                <span className="micro-label">AI / 10 CREDITS</span>
                <strong>Summarize the signal.</strong>
                <div className="portal-surface portal-summary"><i /><i /><i /><b /></div>
              </div>
              <div className="hero-tool-card hero-tool-image">
                <span className="tool-card-dot"><ImageIcon size={17} /></span>
                <span className="micro-label">IMAGE / 1 CREDIT</span>
                <strong>Lighten the file.</strong>
                <div className="portal-surface portal-compress"><i /><span /><b>72%</b></div>
              </div>
              <div className="hero-tool-card hero-tool-note">
                <span className="tool-card-dot"><FileText size={17} /></span>
                <span className="micro-label">WORKSPACE</span>
                <strong>Keep the thought.</strong>
                <div className="portal-surface portal-note"><i /><i /><b /></div>
              </div>
              <div className="stage-center-mark"><NexaMark withWordmark={false} imageClassName="h-16 w-16" /></div>
              <p className="stage-caption">ONE QUIET PLACE<br />FOR USEFUL MOTION.</p>
            </div>
          </div>
          <div className="hero-bottom-rail"><span>SCROLL TO DISCOVER</span><i /></div>
        </section>

        <section id="tool-index" className="section-shell dark-section">
          <div className="section-heading-grid">
              <div>
                <p className="section-index"><span /> 02 — TOOL INDEX</p>
                <h2>Everyday tools,<br /><span>arranged by intent.</span></h2>
            </div>
            <p className="section-lede">Browse an ecosystem designed around useful outcomes. Each tool makes its cost and readiness visible before you begin.</p>
          </div>

          <div className="tool-index-layout">
            <aside className="tool-rail" aria-label="Tool categories">
              <span className="micro-label">CATEGORIES</span>
              {TOOL_CATEGORIES.map((category, index) => (
                <button key={category.id} className={activeCategoryId === category.id ? "active" : ""} onClick={() => setActiveCategoryId(category.id)}>
                  <span>{String(index + 1).padStart(2, "0")}</span>{category.label}<ChevronRight size={15} />
                </button>
              ))}
            </aside>
            <div className="tool-index-results">
              <div className="tool-index-toolbar">
                <label className="tool-index-search">
                  <Search size={16} aria-hidden="true" />
                  <input
                    type="search"
                    value={toolIndexQuery}
                    onChange={(event) => setToolIndexQuery(event.target.value)}
                    placeholder="Search the tool index"
                    aria-label="Search the tool index"
                  />
                </label>
                <p>{visibleTools.length} of {TOOL_REGISTRY.length} tools</p>
              </div>
              <div className="tool-grid">
                {visibleTools.map((tool, index) => {
                  const Icon = tool.icon;
                  return (
                    <button key={tool.id} className={`nexa-tool-card tool-card-${index + 1}`} onClick={() => openToolRoute(tool.route)}>
                      <div className="flex items-start justify-between gap-3">
                        <span className="tool-icon"><Icon size={21} /></span>
                        <StatusPill status={tool.status} />
                      </div>
                      <div>
                        <p className="tool-category">{tool.category}</p>
                        <h3>{tool.name}</h3>
                        <p>{tool.description}</p>
                      </div>
                      <div className="tool-card-footer"><span>{tool.creditCost} credit{tool.creditCost > 1 ? "s" : ""}</span><ArrowUpRight size={17} /></div>
                    </button>
                  );
                })}
              </div>
              {visibleTools.length === 0 ? <p className="tool-index-empty">No registered tool matches this category and search.</p> : null}
            </div>
          </div>
        </section>

        <section id="feature-lens" className="feature-lens-section">
          <div className="mx-auto max-w-[1440px] px-5 py-24 lg:px-10 lg:py-32">
            <div className="feature-lens-frame">
              <div className="feature-copy">
                <p className="section-index"><span /> 03 — FEATURE LENS</p>
                <p className="micro-label mt-8">{selectedTool.category} / {selectedTool.creditCost} CREDIT{selectedTool.creditCost > 1 ? "S" : ""}</p>
                <h2>{selectedTool.name}<br /><em>in focus.</em></h2>
                <p>{selectedTool.description} This interactive foundation makes product availability explicit, before real services are connected.</p>
                <button className="primary-button mt-8" onClick={handleToolAction}>
                  {selectedTool.status === "available" ? "Open local preview" : "Check availability"}<ArrowUpRight size={17} />
                </button>
                <div className="feature-tabs" role="tablist" aria-label="Featured NEXA tools">
                  {featuredTools.map((tool) => {
                    const Icon = tool.icon;
                    return (
                      <button key={tool.id} className={selectedId === tool.id ? "selected" : ""} onClick={() => chooseTool(tool.id)} role="tab" aria-selected={selectedId === tool.id}>
                        <Icon size={17} /><span>{tool.name}</span><ChevronRight size={15} />
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="feature-art-panel">
                <img src="/manus-storage/nexa-tool-constellation_eab102ce.jpg" alt="Abstract constellation of NEXA tool modules" />
                <div className="active-lens" aria-label={`${selectedTool.name} active lens preview`}>
                  <div className="lens-header"><span><SelectedIcon size={15} /> ACTIVE LENS</span><i>LOCAL VIEW</i></div>
                  <div className="lens-body">
                    <span className="lens-node"><SelectedIcon size={19} /></span>
                    <div><strong>{selectedTool.name}</strong><p>{selectedTool.status === "available" ? "Input surface ready" : "Connection state visible"}</p></div>
                  </div>
                  <div className="lens-trace"><i /><i /><i /><b /></div>
                </div>
                <div className="art-overlay-card">
                  <span className="micro-label">CURRENT LENS</span>
                  <strong>{selectedTool.name}</strong>
                  <span>{selectedTool.status === "available" ? "Local-ready preview" : selectedTool.status === "beta" ? "Service connection pending" : "Roadmap capability"}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="workspace" className="workspace-section">
          <div className="section-shell pb-24 pt-24 lg:pb-32 lg:pt-32">
            <div className="section-heading-grid">
              <div>
                <p className="section-index"><span /> 04 — WORKSPACE PREVIEW</p>
                <h2>A calm place for<br /><span>small wins.</span></h2>
              </div>
              <p className="section-lede">NEXA is designed to make everyday utility feel considered. These local previews are real browser interactions, not simulated success states.</p>
            </div>
            <div className="workspace-grid">
              <article className="live-module calculator-module">
                <div className="module-header"><span><Calculator size={18} /> QUICK CALCULATOR</span><span className="module-live">LOCAL</span></div>
                <div className="calc-display">{calcResult}</div>
                <div className="calc-inputs">
                  <input aria-label="First number" value={calcLeft} onChange={(event) => setCalcLeft(event.target.value)} type="number" />
                  <b>+</b>
                  <input aria-label="Second number" value={calcRight} onChange={(event) => setCalcRight(event.target.value)} type="number" />
                </div>
                <button className="module-button" onClick={handleCalculator}>Calculate <ArrowUpRight size={15} /></button>
              </article>
              <article className="live-module word-module">
                <div className="module-header"><span><Wand2 size={18} /> WORD COUNTER</span><span className="module-live">LOCAL</span></div>
                <textarea value={words} onChange={(event) => setWords(event.target.value)} aria-label="Text to count" />
                <div className="word-count"><strong>{wordCount}</strong><span>words in view</span><span>{words.length} characters</span></div>
              </article>
              <article className="workspace-visual-card">
                <img src="/manus-storage/nexa-workspace-collage_291b6d71.jpg" alt="NEXA workspace panels floating in a dark studio" />
                <div className="workspace-visual-copy"><span className="section-index light-index"><span /> PERSONAL WORKSPACE</span><h3>Signals, notes, and tools in a single field.</h3></div>
              </article>
            </div>
          </div>
        </section>

        <section id="why-nexa" className="why-section">
          <div className="why-orbit" aria-hidden="true" />
          <div className="section-shell relative z-10 py-24 lg:py-32">
            <div className="why-layout">
              <div>
                <p className="section-index"><span /> 05 — THE NEXA DIFFERENCE</p>
                <h2>Less switching.<br /><span>More signal.</span></h2>
              </div>
              <div className="why-stat"><strong>01</strong><p>A focused tool ecosystem that behaves more like a workspace than a link directory.</p></div>
              <div className="why-stat"><strong>02</strong><p>Credit language that is plain about paid computing instead of hiding limits behind vague promises.</p></div>
              <div className="why-stat"><strong>03</strong><p>A product foundation prepared for local utility, future AI services, and real user trust.</p></div>
            </div>
          </div>
        </section>

        <section id="plans" className="plans-section">
          <div className="section-shell py-24 lg:py-32">
            <div className="plans-intro">
              <p className="section-index"><span /> 06 — CLEAR CAPACITY</p>
              <h2>A useful free start.<br /><span>A deliberate upgrade.</span></h2>
              <p>Credits make cost and capacity understandable. The plans below describe the intended product configuration; checkout is intentionally not connected in this frontend preview.</p>
            </div>
            <div className="plans-grid">
              <article className="plan-card free-plan">
                <div><span className="micro-label">{PLAN_CONFIG.free.name.toUpperCase()}</span><h3>{PLAN_CONFIG.free.priceLabel}</h3><p>{PLAN_CONFIG.free.creditsLabel}</p></div>
                <p className="plan-detail">{PLAN_CONFIG.free.detail}</p>
                <ul><li><Check size={15} /> Practical everyday utilities</li><li><Check size={15} /> Basic AI access when connected</li><li><Check size={15} /> Daily allowance resets</li></ul>
                <button className="secondary-button w-full" onClick={() => scrollToId("tool-index")}>Explore tools <ArrowUpRight size={16} /></button>
              </article>
              <article className="plan-card pro-plan">
                <div className="pro-orbit" aria-hidden="true" />
                <div><span className="micro-label">{PLAN_CONFIG.pro.name.toUpperCase()}</span><h3>{PLAN_CONFIG.pro.priceLabel}<small>{PLAN_CONFIG.pro.cadence}</small></h3><p>{PLAN_CONFIG.pro.creditsLabel}</p></div>
                <p className="plan-detail">{PLAN_CONFIG.pro.detail}</p>
                <ul><li><Check size={15} /> No 100-credit daily limit</li><li><Check size={15} /> Higher tool and AI capacity</li><li><Check size={15} /> Priority access to new capabilities</li></ul>
                <button className="primary-button w-full" onClick={() => toast.message("Payments are coming soon. No upgrade has been applied.")}>Payments coming soon <TimerReset size={16} /></button>
              </article>
            </div>
          </div>
        </section>

        <section className="final-cta-section">
          <div className="final-orbit one" /><div className="final-orbit two" />
          <div className="relative z-10 mx-auto max-w-[900px] px-5 py-28 text-center lg:py-36">
            <p className="section-index justify-center light-index"><span /> NEXA / YOUR DIGITAL TOOLKIT</p>
            <h2>Stop switching between<br /><em>dozens of tools.</em></h2>
            <p>Bring the next useful action into one intelligent workspace.</p>
            <button className="primary-button mx-auto mt-8" onClick={() => scrollToId("tool-index")}>Explore NEXA <ArrowDownRight size={18} /></button>
          </div>
        </section>
      </main>

      <footer className="nexa-footer">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-12 px-5 py-12 lg:flex-row lg:items-end lg:justify-between lg:px-10">
          <div><NexaMark /><p className="mt-5 max-w-xs text-sm leading-6 text-white/48">Everything you need. One intelligent workspace.</p></div>
          <div className="footer-links"><a href="#tool-index">Tools</a><a href="#plans">Plans</a><button onClick={() => toast.message("Privacy information will be available with the connected product services.")}>Privacy</button><button onClick={() => toast.message("Help centre is planned for the production product.")}>Help</button></div>
          <p className="text-xs text-white/35">© 2026 NEXA. Product experience preview.</p>
        </div>
      </footer>

      <CommandDialog open={searchOpen} onOpenChange={(open) => { setSearchOpen(open); if (!open) setToolSearchQuery(""); }}>
        <CommandInput placeholder="Search NEXA tools and actions…" value={toolSearchQuery} onValueChange={setToolSearchQuery} />
        <CommandList>
          <CommandEmpty>No matching tool found.</CommandEmpty>
          <CommandGroup heading="TOOLS">
            {commandSearchResults.map((tool) => {
              const Icon = tool.icon;
              return <CommandItem key={tool.id} value={`${tool.name} ${tool.category} ${tool.description} ${tool.route}`} onSelect={() => {
                setSearchOpen(false);
                setToolSearchQuery("");
                openToolRoute(tool.route);
              }}><Icon size={16} /><span>{tool.name}</span><span className="ml-auto text-xs text-muted-foreground">{tool.category}</span></CommandItem>;
            })}
          </CommandGroup>
          <CommandGroup heading="ACTIONS">
            <CommandItem value="Open tool index" onSelect={() => { setSearchOpen(false); scrollToId("tool-index"); }}><Search size={16} /><span>Open tool index</span></CommandItem>
            <CommandItem value="View NEXA plans" onSelect={() => { setSearchOpen(false); scrollToId("plans"); }}><Heart size={16} /><span>View NEXA plans</span></CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  );
}
