import { Logo } from "@/components/Logo";

export function LoadingScreen() {
  return (
    <div className="grid min-h-[60vh] w-full place-items-center">
      <div className="flex flex-col items-center gap-3">
        <Logo className="size-14 animate-pulse rounded-2xl" />
        <span className="text-sm text-muted-foreground">Loading…</span>
      </div>
    </div>
  );
}
