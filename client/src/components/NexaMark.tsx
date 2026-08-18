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
  return (
    <div className={`flex items-center gap-3 ${className}`} aria-label="NEXA home">
      <img
        className={`h-11 w-11 shrink-0 object-contain ${imageClassName}`}
        src="/manus-storage/nexa-mark_9240b89d.png"
        alt="NEXA nexus mark"
      />
      {withWordmark ? (
        <span className="nexa-wordmark text-[1.08rem] tracking-[0.24em] text-white">NEXA</span>
      ) : null}
    </div>
  );
}
