/**
 * Orbit Studio design reminder: this is a composed AI request workspace, not a faux result screen.
 * Signal Azure marks connection boundaries; every output remains visibly unavailable until a backend API exists.
 */
import { NexaMark } from "@/components/NexaMark";
import { isAiCreatorToolId, type AiCreatorToolId, type ToolDefinition } from "@/data/nexa";
import { getAiCreatorConfig } from "@/lib/aiCreator";
import { ArrowLeft, Cable, RefreshCw, ShieldAlert, SlidersHorizontal, Sparkles, Upload, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

type Props = { tool: ToolDefinition };

function createInitialSettings(toolId: AiCreatorToolId) {
  return Object.fromEntries(getAiCreatorConfig(toolId).settings.map((setting) => [setting.id, setting.defaultValue]));
}

function AiProofMotif({ toolId }: { toolId: AiCreatorToolId }) {
  if (toolId === "ai-translator") return <div className="ai-proof-motif ai-proof-translation" aria-hidden="true"><span>SRC</span><i /><span>TGT</span></div>;
  if (toolId === "ai-hashtag-generator") return <div className="ai-proof-motif ai-proof-tags" aria-hidden="true"><span>#</span><span>#</span><span>#</span><span>#</span><i /></div>;
  if (toolId === "ai-description-generator") return <div className="ai-proof-motif ai-proof-editorial" aria-hidden="true"><i /><i /><i /><i /></div>;
  return <div className="ai-proof-motif ai-proof-motion" aria-hidden="true"><span /><span /><span /><span /><i /></div>;
}

export default function AiCreatorToolPage({ tool }: Props) {
  const [, setLocation] = useLocation();
  const toolId: AiCreatorToolId = isAiCreatorToolId(tool.id) ? tool.id : "ai-translator";
  const config = getAiCreatorConfig(toolId);
  const Icon = tool.icon;
  const [source, setSource] = useState("");
  const [settings, setSettings] = useState(() => createInitialSettings(toolId));
  const [videoFileName, setVideoFileName] = useState("");
  const [contractPrepared, setContractPrepared] = useState(false);
  const inputStatus = useMemo(() => (source.trim() || videoFileName ? "INPUT READY" : "AWAITING INPUT"), [source, videoFileName]);

  const resetWorkspace = () => {
    setSource("");
    setSettings(createInitialSettings(toolId));
    setVideoFileName("");
    setContractPrepared(false);
  };

  const prepareContract = () => {
    if (!source.trim() && !videoFileName) {
      toast.error("Add source text, a video URL, or a local video file before preparing the request.");
      return;
    }
    setContractPrepared(true);
    toast.message("Request structure prepared locally. No AI request was sent.");
  };

  return <div className={`tool-route-page local-tool-page ai-creator-page ai-creator-${tool.id}`}>
    <header className="nexa-nav tool-route-nav"><a href="/" aria-label="Return to NEXA home"><NexaMark /></a><a className="secondary-button tool-route-home" href="/#tool-index"><ArrowLeft size={16} /> Tool index</a></header>
    <main className="local-tool-main ai-creator-main">
      <section className="local-tool-hero ai-creator-hero">
        <div className="ai-hero-copy"><p className="section-index"><span /> AI CREATOR TOOLS / API-READY WORKSPACE</p><div className="tool-route-icon"><Icon size={28} /></div><h1><span>{tool.name}</span><em>{config.promise}</em></h1><p>{config.detail}<span className="ai-hero-locality">AI API REQUIRED · NO REQUESTS ARE SENT</span></p></div>
        <div className={`ai-creator-orbit ai-orbit-${toolId}`} aria-hidden="true"><i /><i /><span className="ai-orbit-axis" /><span className="ai-orbit-node ai-orbit-node-a" /><span className="ai-orbit-node ai-orbit-node-b" /><b><NexaMark withWordmark={false} className="ai-orbit-mark" imageClassName="!h-5 !w-5" /></b><AiProofMotif toolId={toolId} /><p>N/O AXIS · {config.eyebrow}</p></div>
      </section>

      <section className="local-tool-workspace ai-creator-workspace">
        <div className="local-tool-meta ai-creator-meta"><span>AI REQUEST SURFACE / NOT CONNECTED</span><span className="ai-connection-state"><i /> BACKEND AI API REQUIRED</span><button onClick={() => setLocation("/#tool-index")}><ArrowLeft size={15} /> All tools</button></div>
        <div className="ai-connection-banner" role="status"><ShieldAlert size={18} /><div><strong>Output is intentionally unavailable.</strong><p>This route prepares structured client input only. Connect a secured backend AI API to create, analyze, or return content.</p></div></div>

        <div className="ai-creator-grid">
          <section className="ai-creator-panel ai-input-panel">
            <div className="local-panel-heading"><div><span>{config.inputLabel}</span><h2>{config.inputTitle}</h2></div><span className="ai-panel-state">{inputStatus}</span></div>
            <textarea className="local-tool-textarea ai-creator-textarea" value={source} onChange={(event) => { setSource(event.target.value); setContractPrepared(false); }} placeholder={config.inputPlaceholder} aria-label={config.inputLabel} />
            {config.supportsVideoSource ? <label className="ai-video-source"><input type="file" accept="video/*" onChange={(event) => { setVideoFileName(event.target.files?.[0]?.name ?? ""); setContractPrepared(false); }} /><span><Upload size={16} /> {videoFileName ? videoFileName : "Choose a local video for the future API"}</span><small>Retained in this browser only; upload begins after an API integration exists.</small></label> : null}
            <div className="local-input-footer"><span>{source.length.toLocaleString()} characters</span><span>{config.inputHint}</span></div>

            <div className="ai-settings-wrap"><div className="ai-settings-heading"><span><SlidersHorizontal size={15} /> REQUEST SETTINGS</span><small>Sent as API options later</small></div><div className="ai-settings-grid">{config.settings.map((setting) => <label key={setting.id} className="local-select-label"><span>{setting.label}</span><select value={settings[setting.id] ?? setting.defaultValue} onChange={(event) => { setSettings((current) => ({ ...current, [setting.id]: event.target.value })); setContractPrepared(false); }}>{setting.options.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>)}</div></div>
            <div className="local-tool-actions"><button className="primary-button" onClick={prepareContract}><Cable size={17} /> Prepare API request</button><button className="secondary-button" onClick={resetWorkspace}><RefreshCw size={16} /> Reset</button></div>
          </section>

          <aside className="ai-creator-panel ai-output-panel">
            <div className="local-panel-heading"><div><span>AI OUTPUT</span><h2>{contractPrepared ? "Contract prepared." : "Awaiting connection."}</h2></div><Sparkles size={18} className="ai-output-spark" /></div>
            <div className="ai-output-stack">{config.outputs.map((output) => <div className="ai-output-slot" key={output.label}><span>{output.label}</span><strong>Not generated</strong><p>{output.hint}</p></div>)}</div>
            <div className="ai-api-contract"><div><span>SERVER CAPABILITY</span><strong>{config.apiCapability}</strong></div><div><span>CLIENT PAYLOAD</span><code>toolId · source · options</code></div><div><span>SERVER RESPONSE</span><code>outputs[] · metadata</code></div></div>
            <div className="ai-no-request"><X size={15} /><span>No AI request has been sent from this page.</span></div>
          </aside>
        </div>
      </section>
    </main>
  </div>;
}
