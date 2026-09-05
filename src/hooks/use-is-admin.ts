import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { isCurrentUserAdmin } from "@/lib/admin.functions";

/**
 * Admin check that only fires once a Supabase session exists in the browser.
 * Without the session the bearer token is missing and the server function
 * throws "Unauthorized: No authorization header provided".
 */
export function useIsAdmin() {
  const checkAdmin = useServerFn(isCurrentUserAdmin);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) setHasSession(Boolean(data.session));
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setHasSession(Boolean(session));
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return useQuery({
    queryKey: ["is-admin"],
    queryFn: async () => {
      try {
        return await checkAdmin();
      } catch {
        return { admin: false };
      }
    },
    enabled: hasSession,
    staleTime: 60_000,
    retry: false,
  });
}
