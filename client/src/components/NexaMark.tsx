/** Orbit Studio design reminder: bold open-loop nexus glyph, never a tiny generic icon. */
type NexaMarkProps = {
  className?: string;
  imageClassName?: string;
  withWordmark?: boolean;
};

export function NexaMark({
  className = "",
  imageClassName = "",
  withWordmark = true,
}: NexaMarkProps) {
  const source = "/manus-storage/finemind-ai-circular-badge_6c5f776e.png";

  return (
    <div className={`flex items-center gap-2 ${className}`} aria-label="FINEMIND AI home">
      <img
        className={`h-10 w-10 shrink-0 rounded-full object-contain ${imageClassName}`}
        src={source}
        alt="FINEMIND AI circular logo"
      />
      {withWordmark ? (
        <span className="whitespace-nowrap font-semibold text-[0.7rem] tracking-[0.18em] text-slate-100">
          FINEMIND <span className="text-sky-300">AI</span>
        </span>
      ) : null}
    </div>
  );
}
