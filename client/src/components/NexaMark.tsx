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
  const source = withWordmark
    ? "/manus-storage/finemind-ai-lockup_4094cc3a.jpg"
    : "/manus-storage/finemind-ai-mark_eb8c5537.jpg";
  const defaultSize = withWordmark ? "h-11 w-24" : "h-11 w-11";

  return (
    <div className={`flex items-center ${className}`} aria-label="FINEMIND AI home">
      <img
        className={`${defaultSize} shrink-0 object-contain ${imageClassName}`}
        src={source}
        alt={withWordmark ? "FINEMIND AI logo" : "FINEMIND AI mark"}
      />
    </div>
  );
}
