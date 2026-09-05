import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminShell } from "@/components/AdminShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { FileText } from "lucide-react";
import {
  adminListOrgApplications,
  adminReviewOrgApplication,
  adminGetOrgDocumentUrl,
} from "@/lib/admin-accounts.functions";

export const Route = createFileRoute("/_authenticated/admin/verifications")({
  head: () => ({
    meta: [
      { title: "Organisation verifications — Groundwork admin" },
      { name: "description", content: "Review organisation applications and approve or reject verification." },
      { property: "og:title", content: "Organisation verifications — Groundwork admin" },
      { property: "og:description", content: "Review organisation applications and approve or reject verification." },
    ],
  }),
  component: Verifications,
});

function Verifications() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["admin-org-applications"], queryFn: () => adminListOrgApplications() });
  const [notes, setNotes] = useState<Record<string, string>>({});

  const review = useMutation({
    mutationFn: (v: { id: string; approve: boolean; note?: string }) => adminReviewOrgApplication({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-org-applications"] });
      toast.success("Reviewed.");
    },
    onError: (e: any) => toast.error(e?.message ?? "That didn't work."),
  });

  const openDoc = async (path: string) => {
    try {
      const { url } = await adminGetOrgDocumentUrl({ data: { path } });
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e: any) {
      toast.error(e?.message ?? "Couldn't open the document.");
    }
  };

  const rows = q.data ?? [];

  return (
    <AdminShell title="Organisation verifications">
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing waiting. Enjoy it while it lasts.</p>
      ) : (
        <div className="space-y-4">
          {rows.map((a: any) => (
            <div key={a.id} className="glass rounded-2xl p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="font-display text-lg">{a.org_name}</div>
                  <div className="text-sm text-muted-foreground">
                    {a.org_type} · {a.official_email}
                    {a.website ? ` · ${a.website}` : ""}
                  </div>
                </div>
                <Badge
                  variant={a.status === "approved" ? "secondary" : a.status === "rejected" ? "destructive" : "outline"}
                >
                  {a.status}
                </Badge>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {a.document_path ? (
                  <Button size="sm" variant="outline" className="rounded-xl" onClick={() => openDoc(a.document_path)}>
                    <FileText className="mr-1 size-4" /> View document
                  </Button>
                ) : (
                  <span className="text-sm text-muted-foreground">No document uploaded.</span>
                )}
              </div>

              {a.status === "pending" ? (
                <div className="mt-4 space-y-2">
                  <Textarea
                    className="rounded-xl"
                    placeholder="Review note (shared with the organisation)"
                    value={notes[a.id] ?? ""}
                    maxLength={500}
                    onChange={(e) => setNotes((n) => ({ ...n, [a.id]: e.target.value }))}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="rounded-xl"
                      disabled={review.isPending}
                      onClick={() => review.mutate({ id: a.id, approve: true, note: notes[a.id] || undefined })}
                    >
                      Approve & verify
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="rounded-xl"
                      disabled={review.isPending}
                      onClick={() => review.mutate({ id: a.id, approve: false, note: notes[a.id] || undefined })}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              ) : a.review_note ? (
                <p className="mt-3 text-sm text-muted-foreground">Note: {a.review_note}</p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
