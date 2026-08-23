/**
 * Orbit Studio design reminder: free utility tools make local computation legible,
 * calm, and export-ready without inventing cloud processing or hidden services.
 */
import { NexaMark } from "@/components/NexaMark";
import type { DocumentUtilityToolId, ToolDefinition } from "@/data/nexa";
import { decodeBase64Utf8, encodeBase64Utf8, generatePassword, markdownToSafeHtml } from "@/lib/documentUtility";
import { ArrowLeft, CheckCircle2, Copy, Download, FileStack, FileText, FileUp, LoaderCircle, QrCode, RotateCcw, ShieldCheck } from "lucide-react";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist/legacy/build/pdf.mjs";
import QRCode from "qrcode";
import { type ChangeEvent, type DragEvent, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/legacy/build/pdf.worker.min.mjs", import.meta.url).toString();

type ToolProps = { tool: ToolDefinition };
const TEXT_TOOL_IDS: DocumentUtilityToolId[] = ["markdown-previewer", "markdown-to-html", "json-formatter", "json-validator", "json-minifier", "base64-encoder", "base64-decoder", "url-encoder", "url-decoder"];
const EXAMPLE_MARKDOWN = "# A useful note\n\nWrite **clearly**, keep the work close, and [visit FINEMIND AI](https://example.com).\n\n- Local\n- Useful\n- Exportable";

function copyValue(value: string, label = "Result") {
  if (!value) { toast.message("There is no result to copy yet."); return; }
  if (!navigator.clipboard) { toast.error("Clipboard access is unavailable in this browser."); return; }
  void navigator.clipboard.writeText(value).then(() => toast.success(`${label} copied.`)).catch(() => toast.error("Could not copy the result."));
}

const UTILITY_VOICE: Record<DocumentUtilityToolId, { promise: string; detail: string; lens: string; node: string }> = {
  "pdf-page-counter": { promise: "Count the actual pages.", detail: "Inspect a local PDF and read its real page total before it leaves your screen.", lens: "PAGE INDEX", node: "DOCUMENT COUNT" },
  "markdown-previewer": { promise: "Write. Render. Inspect.", detail: "Turn Markdown into a safe, browser-local reading surface while you keep the source in view.", lens: "EDITOR / PREVIEW", node: "RENDERED NOTE" },
  "markdown-to-html": { promise: "Ship semantic HTML.", detail: "Convert plain Markdown into clean local HTML with an output that stays close at hand.", lens: "SOURCE / HTML", node: "MARKUP OUTPUT" },
  "json-formatter": { promise: "Structure every key.", detail: "Indent valid JSON into a readable local structure without sending the payload anywhere.", lens: "SYNTAX GRID", node: "STRUCTURED DATA" },
  "json-validator": { promise: "Know if it parses.", detail: "Run a direct syntax check on JSON and see a precise local result in this tab.", lens: "PARSE CHECK", node: "VALIDATION NODE" },
  "json-minifier": { promise: "Trim only the syntax.", detail: "Remove JSON whitespace while preserving the data that matters, entirely in-browser.", lens: "COMPACT MODE", node: "MINIFIED DATA" },
  "base64-encoder": { promise: "Encode a clear payload.", detail: "Transform UTF-8 text into Base64 locally, with the output ready to copy when you need it.", lens: "ENCODE PATH", node: "BASE64 SIGNAL" },
  "base64-decoder": { promise: "Read the source again.", detail: "Decode Base64 into readable UTF-8 text using the browser session you already have open.", lens: "DECODE PATH", node: "UTF-8 OUTPUT" },
  "url-encoder": { promise: "Prepare the exact URL.", detail: "Encode URL components locally so reserved characters arrive with their intended meaning.", lens: "URL ESCAPE", node: "ENCODED ROUTE" },
  "url-decoder": { promise: "Reveal the route text.", detail: "Decode URL components into their readable form without passing the string through a service.", lens: "URL REVEAL", node: "DECODED ROUTE" },
  "qr-code-generator": { promise: "Encode a useful signal.", detail: "Generate a high-resolution QR code from text or a URL and keep its source inside this browser.", lens: "ENCODED SIGNAL", node: "QR MATRIX" },
  "password-generator": { promise: "Tune the entropy.", detail: "Create a configurable random password with browser cryptography and no account requirement.", lens: "ENTROPY CONTROL", node: "SECURE OUTPUT" },
};

function PageShell({ tool, children }: ToolProps & { children: ReactNode }) {
  const [, setLocation] = useLocation();
  const Icon = tool.icon;
  const voice = UTILITY_VOICE[tool.id as DocumentUtilityToolId];
  return <div className={`tool-route-page local-tool-page utility-tool-page utility-tool-${tool.id}`}><header className="nexa-nav tool-route-nav"><a href="/" aria-label="Return to FINEMIND AI home"><NexaMark /></a><a className="secondary-button tool-route-home" href="/#tool-index"><ArrowLeft size={16} /> Tool index</a></header><main className="local-tool-main utility-tool-main"><section className="local-tool-hero utility-tool-hero"><div className="utility-hero-copy"><p className="section-index"><span /> DOCUMENTS & UTILITY / LOCAL TOOL</p><div className="tool-route-icon"><Icon size={28} /></div><h1><span>{tool.name}</span><em>{voice.promise}</em></h1><p>{voice.detail}<span className="utility-locality-note">LOCAL SESSION · NO UPLOAD</span></p></div><div className="utility-orbit" aria-hidden="true"><span className="utility-orbit-axis" /><i /><i /><span className="utility-orbit-node utility-orbit-node-a" /><span className="utility-orbit-node utility-orbit-node-b" /><b><Icon size={17} /></b><p>{voice.node}</p></div></section><section className="local-tool-workspace utility-tool-workspace"><div className="local-tool-meta"><span>FREE / BROWSER-LOCAL UTILITY</span><span className="utility-lens-state"><i /> LIVE LENS / {voice.lens}</span><button onClick={() => setLocation("/#tool-index")}><ArrowLeft size={15} /> All tools</button></div>{children}</section></main></div>;
}

function ActionButton({ busy = false, onClick, children }: { busy?: boolean; onClick: () => void; children: ReactNode }) { return <button className="primary-button" onClick={onClick} disabled={busy}>{busy ? <><LoaderCircle className="image-spinner" size={16} /> Working…</> : children}</button>; }

function ResultPanel({ value, label, children }: { value: string; label: string; children?: ReactNode }) { return <div className="local-result-panel utility-result-panel" aria-live="polite"><div className="local-panel-heading"><div><span>RESULT</span><h2>{value ? "Signal received." : "Waiting for input."}</h2></div>{value ? <button className="local-copy-button" onClick={() => copyValue(value)}><Copy size={15} /> Copy</button> : null}</div>{value ? <div className="local-result-output transform-output"><strong>{value}</strong><p>{label}</p>{children}</div> : <div className="local-empty-state"><ShieldCheck size={20} /><p>Add input, then run the local action to see a real output.</p></div>}</div>; }

function TextUtility({ tool }: ToolProps) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [state, setState] = useState("");
  const isMarkdownPreview = tool.id === "markdown-previewer";
  const run = () => {
    if (!input.trim()) { toast.error("Add input before running this tool."); return; }
    try {
      if (tool.id === "markdown-previewer") { setOutput(markdownToSafeHtml(input)); setState("Rendered browser-local preview"); return; }
      if (tool.id === "markdown-to-html") { setOutput(markdownToSafeHtml(input)); setState("Safe HTML output"); return; }
      if (tool.id === "json-formatter") { setOutput(JSON.stringify(JSON.parse(input), null, 2)); setState("Valid JSON, formatted with two-space indentation"); return; }
      if (tool.id === "json-minifier") { setOutput(JSON.stringify(JSON.parse(input))); setState("Valid JSON, minified without data loss"); return; }
      if (tool.id === "json-validator") { JSON.parse(input); setOutput("Valid JSON"); setState("Syntax check passed"); return; }
      if (tool.id === "base64-encoder") { setOutput(encodeBase64Utf8(input)); setState("UTF-8 text encoded as Base64"); return; }
      if (tool.id === "base64-decoder") { setOutput(decodeBase64Utf8(input)); setState("Base64 decoded as UTF-8 text"); return; }
      if (tool.id === "url-encoder") { setOutput(encodeURIComponent(input)); setState("URL component encoded"); return; }
      if (tool.id === "url-decoder") { setOutput(decodeURIComponent(input)); setState("URL component decoded"); }
    } catch (error) { setOutput(""); setState(error instanceof Error ? error.message : "Input could not be processed."); toast.error("Check the input and try again."); }
  };
  const title = tool.id === "markdown-previewer" || tool.id === "markdown-to-html" ? "Bring in the Markdown." : tool.id.startsWith("json") ? "Bring in the JSON." : "Bring in the string.";
  return <PageShell tool={tool}><div className="local-tool-grid utility-tool-grid"><div className="local-input-panel"><div className="local-panel-heading"><div><span>INPUT</span><h2>{title}</h2></div><button className="local-example-button" onClick={() => setInput(tool.id.startsWith("markdown") ? EXAMPLE_MARKDOWN : tool.id.startsWith("json") ? '{"finemind_ai": true, "tools": ["local", "useful"]}' : "FINEMIND AI keeps utility local.")}>Use example</button></div><textarea className="local-tool-textarea" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Paste or write content here…" aria-label={`${tool.name} input`} /><div className="local-input-footer"><span>{input.length} characters</span><span>Browser-local</span></div><div className="local-tool-actions"><ActionButton onClick={run}>{tool.id === "json-validator" ? "Validate JSON" : tool.id.includes("encoder") ? "Encode" : tool.id.includes("decoder") ? "Decode" : tool.id === "json-minifier" ? "Minify JSON" : "Transform"}</ActionButton><button className="secondary-button" onClick={() => { setInput(""); setOutput(""); setState(""); }}><RotateCcw size={15} /> Reset</button></div></div>{isMarkdownPreview && output ? <div className="local-result-panel utility-result-panel"><div className="local-panel-heading"><div><span>LIVE PREVIEW</span><h2>Rendered locally.</h2></div></div><article className="markdown-preview" dangerouslySetInnerHTML={{ __html: output }} /></div> : <ResultPanel value={output} label={state}>{tool.id === "json-validator" && output ? <CheckCircle2 size={18} className="utility-success-icon" /> : null}</ResultPanel>}</div></PageShell>;
}

function PdfPageCounter({ tool }: ToolProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const selectFile = (nextFile: File) => { if (nextFile.type !== "application/pdf") { setError("Choose a valid PDF document."); return; } if (nextFile.size > 40 * 1024 * 1024) { setError("Choose a PDF below 40 MB for reliable local processing."); return; } setFile(nextFile); setPages(null); setError(""); };
  const analyze = async () => { if (!file) return; setBusy(true); setError(""); try { const data = new Uint8Array(await file.arrayBuffer()); const task = getDocument({ data }); const pdf = await task.promise; setPages(pdf.numPages); } catch { setError("This PDF could not be read in the current browser."); } finally { setBusy(false); } };
  const drop = (event: DragEvent<HTMLButtonElement>) => { event.preventDefault(); const nextFile = event.dataTransfer.files?.[0]; if (nextFile) selectFile(nextFile); };
  const change = (event: ChangeEvent<HTMLInputElement>) => { const nextFile = event.target.files?.[0]; if (nextFile) selectFile(nextFile); event.target.value = ""; };
  return <PageShell tool={tool}><div className="utility-single-panel"><input ref={inputRef} className="image-file-input" type="file" accept="application/pdf" onChange={change} />{!file ? <button className="image-dropzone" onClick={() => inputRef.current?.click()} onDragOver={(event) => event.preventDefault()} onDrop={drop}><FileUp size={25} /><strong>Drop a PDF here</strong><span>or choose a local document below 40 MB</span></button> : <div className="utility-file-summary"><FileText size={24} /><div><strong>{file.name}</strong><span>{(file.size / 1024 / 1024).toFixed(2)} MB · local file only</span></div><button onClick={() => { setFile(null); setPages(null); setError(""); }}>Replace</button></div>}{error ? <p className="image-error">{error}</p> : null}{file ? <div className="utility-action-stack"><ActionButton busy={busy} onClick={analyze}>Count pages</ActionButton><button className="secondary-button" onClick={() => { setFile(null); setPages(null); setError(""); }}><RotateCcw size={15} /> Reset</button></div> : null}{pages !== null ? <div className="utility-count-result"><FileStack size={22} /><strong>{pages}</strong><span>pages in this PDF</span><small>The document stayed in this browser tab.</small></div> : null}</div></PageShell>;
}

function QrGenerator({ tool }: ToolProps) {
  const [input, setInput] = useState("https://");
  const [image, setImage] = useState("");
  const [busy, setBusy] = useState(false);
  const generate = async () => { if (!input.trim()) { toast.error("Add text or a URL before generating a QR code."); return; } setBusy(true); try { setImage(await QRCode.toDataURL(input, { width: 720, margin: 1, errorCorrectionLevel: "M", color: { dark: "#071a2b", light: "#ffffff" } })); } catch { toast.error("The QR code could not be generated."); } finally { setBusy(false); } };
  const download = () => { if (!image) return; const link = document.createElement("a"); link.href = image; link.download = "finemind-ai-qr-code.png"; link.click(); };
  return <PageShell tool={tool}><div className="utility-single-panel qr-tool-panel"><div className="local-panel-heading"><div><span>QR CONTENT</span><h2>Encode a useful signal.</h2></div><QrCode size={22} /></div><textarea className="local-tool-textarea" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Text or a URL" aria-label="QR code content" /><div className="local-tool-actions"><ActionButton busy={busy} onClick={generate}>Generate QR code</ActionButton><button className="secondary-button" onClick={() => { setInput(""); setImage(""); }}><RotateCcw size={15} /> Reset</button>{image ? <button className="secondary-button" onClick={download}><Download size={15} /> Download PNG</button> : null}</div>{image ? <div className="qr-result"><img src={image} alt="Generated QR code" /><span>Generated locally from the supplied content.</span></div> : null}</div></PageShell>;
}

function PasswordGenerator({ tool }: ToolProps) {
  const [length, setLength] = useState(18);
  const [enabled, setEnabled] = useState({ upper: true, lower: true, number: true, symbol: true });
  const [password, setPassword] = useState("");
  const generate = () => { try { setPassword(generatePassword(length, enabled)); } catch (error) { toast.error(error instanceof Error ? error.message : "Password could not be generated."); } };
  const strength = useMemo(() => Math.min(100, Math.round((length / 32) * 55 + Object.values(enabled).filter(Boolean).length * 12)), [enabled, length]);
  return <PageShell tool={tool}><div className="utility-single-panel password-tool-panel"><div className="local-panel-heading"><div><span>PASSWORD SETTINGS</span><h2>Set your entropy.</h2></div><output>{length} characters</output></div><label className="password-range-label">LENGTH<input className="image-range" type="range" min="8" max="64" value={length} onChange={(event) => setLength(Number(event.target.value))} /></label><div className="password-options">{(["upper", "lower", "number", "symbol"] as const).map((option) => <label key={option}><input type="checkbox" checked={enabled[option]} onChange={(event) => setEnabled((current) => ({ ...current, [option]: event.target.checked }))} /> {option === "upper" ? "Uppercase" : option === "lower" ? "Lowercase" : option === "number" ? "Numbers" : "Symbols"}</label>)}</div><div className="local-tool-actions"><ActionButton onClick={generate}>Generate password</ActionButton><button className="secondary-button" onClick={() => setPassword("")}><RotateCcw size={15} /> Reset</button></div>{password ? <div className="password-result"><div><span>GENERATED PASSWORD</span><strong>{password}</strong></div><button className="local-copy-button" onClick={() => copyValue(password, "Password")}><Copy size={15} /> Copy</button><small>Strength estimate: {strength}% · generated with `crypto.getRandomValues`.</small></div> : null}</div></PageShell>;
}

export default function DocumentUtilityToolPage({ tool }: ToolProps) {
  if (tool.id === "pdf-page-counter") return <PdfPageCounter tool={tool} />;
  if (tool.id === "qr-code-generator") return <QrGenerator tool={tool} />;
  if (tool.id === "password-generator") return <PasswordGenerator tool={tool} />;
  return <TextUtility tool={tool} />;
}
