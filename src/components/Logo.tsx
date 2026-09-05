import mark from "@/assets/groundwork-mark.png.asset.json";
import { cn } from "@/lib/utils";

/**
 * Groundwork brand mark. The glyph is white, so it is always presented on the
 * primary terracotta tile — never recoloured, never stretched.
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
        "grid size-9 shrink-0 place-items-center rounded-xl bg-primary",
        className,
      )}
    >
      <img
        src={mark.url}
        alt="Groundwork"
        className={cn("size-[62%] object-contain", imgClassName)}
      />
    </span>
  );
}
