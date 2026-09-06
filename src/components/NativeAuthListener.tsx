import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { isCapacitor } from "@/lib/native";

/**
 * Google sign-in has to briefly hand off to the system browser (Google
 * blocks completing OAuth inside an app WebView). On the web this comes
 * back via a normal https redirect. Inside the native app, it comes back
 * as a "groundwork://login-callback" deep link instead — this listens for
 * that and finishes the sign-in, then sends the user into the app.
 *
 * Mounted once near the app root; renders nothing.
 */
export function NativeAuthListener() {
  const navigate = useNavigate();

  useEffect(() => {
    let remove: (() => void) | undefined;

    (async () => {
      if (!(await isCapacitor())) return;

      const { App } = await import("@capacitor/app");
      const sub = await App.addListener("appUrlOpen", async (event: { url: string }) => {
        try {
          const url = new URL(event.url);
          const code = url.searchParams.get("code");
          if (!code) return;
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error("[native auth] exchangeCodeForSession failed", error);
            return;
          }
          navigate({ to: "/dashboard" });
        } catch (err) {
          console.error("[native auth] failed to handle deep link", err);
        }
      });
      remove = () => sub.remove();
    })();

    return () => remove?.();
  }, [navigate]);

  return null;
}
