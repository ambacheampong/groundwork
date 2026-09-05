import { statusLabel, type Status } from "@/lib/voice";

const styles: Record<Status, string> = {
  open: "bg-success/15 text-success border-success/20",
  closing_soon: "bg-warning/15 text-warning border-warning/30",
  closed: "bg-muted text-muted-foreground border-border",
  coming_soon: "bg-accent/15 text-accent border-accent/30",
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {statusLabel[status]}
    </span>
  );
}
