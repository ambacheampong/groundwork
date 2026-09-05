import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/** Returns a signed URL for a private storage path. Refreshes when path changes. */
export function useSignedUrl(bucket: "avatars" | "banners", path: string | null | undefined) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    if (!path) {
      setUrl(null);
      return;
    }
    supabase.storage
      .from(bucket)
      .createSignedUrl(path, 60 * 60)
      .then(({ data }) => {
        if (!cancelled) setUrl(data?.signedUrl ?? null);
      });
    return () => {
      cancelled = true;
    };
  }, [bucket, path]);
  return url;
}
