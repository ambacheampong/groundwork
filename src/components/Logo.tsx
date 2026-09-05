import { cn } from "@/lib/utils";

/**
 * Groundwork brand mark. app-icon.png already includes its own background
 * fill, so it renders full-bleed inside a rounded tile — no separate
 * background layer behind it (that caused a visible seam).
 */
export function Logo({
  className,
  imgClassName,
}: {
  className?: string;
  imgClassName?: string;
}) {
  return (
    <span
      className={cn(
        "grid size-9 shrink-0 place-items-center overflow-hidden rounded-xl",
        className,
      )}
    >
      <img
        src="/app-icon.png"
        alt="Groundwork"
        className={cn("size-full object-cover", imgClassName)}
      />
    </span>
  );
}
