// Groundwork brand voice — dry, slightly impatient on prompts and empty states.
// Never use on content that represents the user externally.

export const voice = {
  empty: {
    feed: "Nothing matches your filters. Either widen them, or sit with the silence.",
    saved: "You haven't saved anything. That is, in itself, a kind of decision.",
    tracked: "No organisations tracked yet. Pick a few; surprises will arrive.",
    organisations: "No organisations found by that name.",
  },
  auth: {
    signInTitle: "Welcome back.",
    signInSub: "The opportunities have been waiting. Some less patiently than others.",
    signUpTitle: "Make an account.",
    signUpSub: "Three minutes now will save you weeks of scrolling later.",
  },
  onboarding: {
    welcome: "Groundwork",
    welcomeSub: "Scholarships, fellowships, jobs, freelance work — all in one place. Tell us a little about you so we can stop guessing.",
    interests: "What are you actually interested in?",
    interestsSub: "Pick a handful. You can change these later. No one is keeping score.",
    eligibility: "And where do you stand, broadly?",
    eligibilitySub: "Helps us hide things you'd only be irritated by.",
    done: "That'll do. Let's begin.",
  },
} as const;

export const closedMessages: string[] = [
  "It has closed. It was not waiting on your schedule.",
  "Closed. The window shut while you were deciding.",
  "This one's done. There will be others, probably.",
  "Applications ended. History, now.",
  "Too late. Not dramatically so, but late.",
  "Closed — file it under 'next time'.",
  "The deadline passed without ceremony.",
  "No longer accepting anyone. Including you.",
  "Shut. Set an alert for the next round.",
  "Expired. Move along.",
];

function hash(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function closedCopy(seed?: string): string {
  const i = seed ? hash(seed) % closedMessages.length : Math.floor(Math.random() * closedMessages.length);
  return closedMessages[i]!;
}

export function deadlineCopy(deadline: Date | null, seed?: string): string {
  if (!deadline) return "No deadline listed";
  const ms = deadline.getTime() - Date.now();
  const days = Math.ceil(ms / 86_400_000);
  if (ms < 0) return closedCopy(seed);
  if (days === 0) return "Today is the deadline. There is no tomorrow version of today.";
  if (days === 1) return "This closes tomorrow. By all means, finish what you're watching first.";
  if (days <= 3) return `${days} days remain. It is not going to wait for you to feel ready.`;
  if (days <= 7) return `Closes in ${days} days.`;
  if (days <= 30) return `Closes in ${days} days.`;
  return `Closes ${deadline.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}`;
}


export type Status = "open" | "closing_soon" | "closed" | "coming_soon";

export function deriveStatus(opens_at: string | null, deadline_at: string | null): Status {
  const now = Date.now();
  if (opens_at && new Date(opens_at).getTime() > now) return "coming_soon";
  if (deadline_at) {
    const d = new Date(deadline_at).getTime();
    if (d < now) return "closed";
    if (d - now < 7 * 86_400_000) return "closing_soon";
  }
  return "open";
}

export const statusLabel: Record<Status, string> = {
  open: "Open",
  closing_soon: "Closing soon",
  closed: "Closed",
  coming_soon: "Coming soon",
};

export const categoryLabel: Record<string, string> = {
  scholarship: "Scholarship",
  postgraduate: "Postgraduate",
  fellowship: "Fellowship",
  internship: "Internship",
  job: "Job",
  freelance: "Freelance",
  programme: "Programme",
};
