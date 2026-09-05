import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useSessionUser } from "@/hooks/use-session-user";

/**
 * Browsing is open to everyone. Anything that writes — posting, commenting,
 * voting, saving, tracking — asks for sign-in at the moment of the action.
 */
export function useAuthGate() {
  const { signedIn } = useSessionUser();
  const navigate = useNavigate();

  const requireAuth = (what = "do that") => {
    if (signedIn) return true;
    toast("Sign in first", { description: `You need an account to ${what}.` });
    navigate({ to: "/auth" });
    return false;
  };

  return { signedIn, requireAuth };
}
