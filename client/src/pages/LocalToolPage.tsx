/**
 * Orbit Studio design reminder: browser-local utility pages are calm, editorial,
 * and candid about computation happening entirely on-device.
 */
import { NexaMark } from "@/components/NexaMark";
import type { LocalToolId, ToolDefinition } from "@/data/nexa";
import { ArrowLeft, Copy, RotateCcw, Sparkles } from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

type TextToolResult = {
  value: string;
  label: string;
  detail: string;
  copyValue: string;
};

const TEXT_TOOL_IDS: LocalToolId[] = [
  "word-counter",
  "character-counter",
  "sentence-counter",
  "reading-time",
  "case-converter",
  "text-cleaner",
];

const EXAMPLE_TEXT = "FINEMIND AI keeps everyday utility close. Write clearly, make one useful change, then move on with less friction.";

function wordCount(value: string) {
  return value.trim().match(/\S+/g)?.length ?? 0;
}

function sentenceCount(value: string) {
  return (value.trim().match(/[^.!?]+(?:[.!?]+|$)/g) ?? []).filter((sentence) => sentence.trim()).length;
}

function toTitleCase(value: string) {
  return value.toLocaleLowerCase().replace(/\b[a-z]/g, (letter) => letter.toLocaleUpperCase());
}

function toSentenceCase(value: string) {
  const lowered = value.toLocaleLowerCase();
  return lowered.replace(/(^|[.!?]\s+)([a-z])/g, (match, prefix: string, letter: string) => `${prefix}${letter.toLocaleUpperCase()}`);
}

function cleanText(value: string) {
  return value
    .replace(/\r\n/g, "\n")
    .replace(/[\t ]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function copyToClipboard(value: string, label = "Result") {
  if (!value) {
    toast.message("There is no result to copy yet.");
    return;
  }

  if (!navigator.clipboard) {
    toast.error("Clipboard access is unavailable in this browser.");
    return;
  }

  void navigator.clipboard.writeText(value).then(() => toast.success(`${label} copied.`)).catch(() => toast.error("Could not copy the result."));
}

function ToolPageShell({ tool, children }: { tool: ToolDefinition; children: ReactNode }) {
  const [, setLocation] = useLocation();
  const Icon = tool.icon;

  return (
    <div className="tool-route-page local-tool-page">
      <header className="nexa-nav tool-route-nav">
        <a href="/" aria-label="Return to FINEMIND AI home"><NexaMark /></a>
        <a className="secondary-button tool-route-home" href="/#tool-index"><ArrowLeft size={16} /> Tool index</a>
      </header>
      <main className="local-tool-main">
        <section className="local-tool-hero">
          <div>
            <p className="section-index"><span /> {tool.category.toUpperCase()} / LOCAL TOOL</p>
            <div className="tool-route-icon"><Icon size={28} /></div>
            <h1>{tool.name}<br /><em>without leaving your browser.</em></h1>
            <p>{tool.description} Your input stays in this page and is never sent to an external service.</p>
          </div>
          <div className="local-tool-orbit" aria-hidden="true"><i /><i /><b><Sparkles size={17} /></b></div>
        </section>
        <section className="local-tool-workspace">
          <div className="local-tool-meta"><span>FREE / BROWSER-LOCAL</span><button onClick={() => setLocation("/#tool-index")}><ArrowLeft size={15} /> All tools</button></div>
          {children}
        </section>
      </main>
    </div>
  );
}

function TextTool({ tool }: { tool: ToolDefinition }) {
  const [text, setText] = useState("");
  const [caseMode, setCaseMode] = useState<"upper" | "lower" | "title" | "sentence">("title");
  const [result, setResult] = useState<TextToolResult | null>(null);

  const characterWithoutSpaces = useMemo(() => text.replace(/\s/g, "").length, [text]);

  const runTool = () => {
    if (!text.trim()) {
      toast.error("Add some text before running this tool.");
      return;
    }

    if (tool.id === "word-counter") {
      const count = wordCount(text);
      setResult({ value: String(count), label: "Words in your text", detail: `${text.length} characters including spaces`, copyValue: String(count) });
      return;
    }

    if (tool.id === "character-counter") {
      setResult({ value: String(text.length), label: "Characters including spaces", detail: `${characterWithoutSpaces} characters excluding spaces`, copyValue: String(text.length) });
      return;
    }

    if (tool.id === "sentence-counter") {
      const count = sentenceCount(text);
      setResult({ value: String(count), label: "Estimated sentences", detail: `${wordCount(text)} words measured locally`, copyValue: String(count) });
      return;
    }

    if (tool.id === "reading-time") {
      const words = wordCount(text);
      const minutes = words / 200;
      const value = words === 0 ? "0 min" : minutes < 1 ? "Under 1 min" : `${Math.ceil(minutes)} min`;
      setResult({ value, label: "Estimated reading time", detail: `${words} words at 200 words per minute`, copyValue: value });
      return;
    }

    const converted = tool.id === "case-converter"
      ? caseMode === "upper" ? text.toLocaleUpperCase() : caseMode === "lower" ? text.toLocaleLowerCase() : caseMode === "title" ? toTitleCase(text) : toSentenceCase(text)
      : cleanText(text);
    setResult({ value: converted, label: tool.id === "case-converter" ? `${caseMode} case output` : "Cleaned text", detail: tool.id === "case-converter" ? "Converted entirely in your browser" : "Extra spaces and surplus blank lines removed", copyValue: converted });
  };

  const reset = () => {
    setText("");
    setResult(null);
  };

  const isTransformTool = tool.id === "case-converter" || tool.id === "text-cleaner";

  return (
    <ToolPageShell tool={tool}>
      <div className="local-tool-grid">
        <div className="local-input-panel">
          <div className="local-panel-heading"><div><span>INPUT</span><h2>Bring in the text.</h2></div><button className="local-example-button" onClick={() => setText(EXAMPLE_TEXT)}>Use example</button></div>
          {tool.id === "case-converter" ? <label className="local-select-label">OUTPUT FORMAT<select value={caseMode} onChange={(event) => setCaseMode(event.target.value as typeof caseMode)}><option value="upper">UPPERCASE</option><option value="lower">lowercase</option><option value="title">Title Case</option><option value="sentence">Sentence case</option></select></label> : null}
          <textarea className="local-tool-textarea" value={text} onChange={(event) => setText(event.target.value)} placeholder="Paste or write text here…" aria-label={`${tool.name} input`} />
          <div className="local-input-footer"><span>{text.length} characters</span><span>{wordCount(text)} words</span></div>
          <div className="local-tool-actions"><button className="primary-button" onClick={runTool}>{isTransformTool ? "Transform text" : "Analyze text"}<Sparkles size={16} /></button><button className="secondary-button" onClick={reset}><RotateCcw size={15} /> Reset</button></div>
        </div>
        <div className="local-result-panel" aria-live="polite">
          <div className="local-panel-heading"><div><span>RESULT</span><h2>{result ? "Clear signal." : "Waiting for input."}</h2></div>{result ? <button className="local-copy-button" onClick={() => copyToClipboard(result.copyValue)}><Copy size={15} /> Copy</button> : null}</div>
          {result ? (
            <div className={isTransformTool ? "local-result-output transform-output" : "local-result-output"}>
              <strong>{result.value}</strong><p>{result.label}</p><small>{result.detail}</small>
            </div>
          ) : <div className="local-empty-state"><Sparkles size={20} /><p>Enter text, then run the local action to see a real result.</p></div>}
        </div>
      </div>
    </ToolPageShell>
  );
}

function CalculatorTool({ tool }: { tool: ToolDefinition }) {
  const [left, setLeft] = useState("");
  const [right, setRight] = useState("");
  const [operation, setOperation] = useState<"+" | "−" | "×" | "÷">("+");
  const [result, setResult] = useState<string | null>(null);

  const calculate = () => {
    const leftNumber = Number(left);
    const rightNumber = Number(right);
    if (!left.trim() || !right.trim() || Number.isNaN(leftNumber) || Number.isNaN(rightNumber)) {
      toast.error("Enter two valid numbers to calculate.");
      return;
    }
    if (operation === "÷" && rightNumber === 0) {
      toast.error("A number cannot be divided by zero.");
      return;
    }
    const value = operation === "+" ? leftNumber + rightNumber : operation === "−" ? leftNumber - rightNumber : operation === "×" ? leftNumber * rightNumber : leftNumber / rightNumber;
    setResult(Number.isInteger(value) ? String(value) : String(Number(value.toFixed(8))));
  };

  return (
    <ToolPageShell tool={tool}>
      <div className="local-calculator-panel">
        <div className="local-panel-heading"><div><span>LOCAL CALCULATOR</span><h2>Keep the math close.</h2></div>{result ? <button className="local-copy-button" onClick={() => copyToClipboard(result, "Calculation") }><Copy size={15} /> Copy result</button> : null}</div>
        <div className="local-calculator-display">{result ?? "0"}</div>
        <div className="local-calculator-inputs"><input type="number" inputMode="decimal" value={left} onChange={(event) => setLeft(event.target.value)} placeholder="First number" aria-label="First number" /><div className="calculator-operations" aria-label="Arithmetic operation">{(["+", "−", "×", "÷"] as const).map((item) => <button key={item} className={operation === item ? "active" : ""} onClick={() => setOperation(item)}>{item}</button>)}</div><input type="number" inputMode="decimal" value={right} onChange={(event) => setRight(event.target.value)} placeholder="Second number" aria-label="Second number" /></div>
        <div className="local-tool-actions"><button className="primary-button" onClick={calculate}>Calculate <Sparkles size={16} /></button><button className="secondary-button" onClick={() => { setLeft(""); setRight(""); setResult(null); }}><RotateCcw size={15} /> Reset</button></div>
      </div>
    </ToolPageShell>
  );
}

export default function LocalToolPage({ tool }: { tool: ToolDefinition }) {
  return TEXT_TOOL_IDS.includes(tool.id as LocalToolId) ? <TextTool tool={tool} /> : <CalculatorTool tool={tool} />;
}
