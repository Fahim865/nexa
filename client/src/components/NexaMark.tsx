/** Orbit Studio design reminder: bold open-loop nexus glyph, never a tiny generic icon. */
type NexaMarkProps = {
  className?: string;
  imageClassName?: string;
  withWordmark?: boolean;
};

export function NexaMark({
  className = "",
  imageClassName = "",
  withWordmark = false,
}: NexaMarkProps) {
  const source = "/manus-storage/finemind-ai-circular-badge_6c5f776e.png";

  return (
    <div className={`group flex items-center gap-2.5 ${className}`} aria-label="FINEMIND AI home">
      <img
        className={`h-10 w-10 shrink-0 rounded-full object-contain transition-[transform,filter,box-shadow] duration-200 [transition-timing-function:cubic-bezier(0.23,1,0.32,1)] group-hover:scale-[1.045] group-hover:drop-shadow-[0_0_6px_rgba(56,189,248,0.34)] group-hover:shadow-[0_7px_16px_rgba(2,8,23,0.46)] motion-reduce:transition-none motion-reduce:group-hover:scale-100 ${imageClassName}`}
        src={source}
        alt="FINEMIND AI circular logo"
      />
      {withWordmark ? (
        <span className="whitespace-nowrap font-semibold text-[0.7rem] tracking-[0.16em] text-slate-100">
          FINEMIND <span className="text-sky-300">AI</span>
        </span>
      ) : null}
    </div>
  );
}
