import { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Download,
  FileText,
  FileSpreadsheet,
  Printer,
  Mail,
  Cloud,
  HardDrive,
} from "lucide-react";

type Column<T> = { key: keyof T | string; label: string; get?: (row: T) => string | number };

export function ExportMenu<T extends Record<string, any>>({
  title,
  rows,
  columns,
}: {
  title: string;
  rows: T[];
  columns: Column<T>[];
}) {
  const [emailOpen, setEmailOpen] = useState(false);
  const filename = title.toLowerCase().replace(/\s+/g, "-");

  const toCells = (r: T) => columns.map((c) => (c.get ? c.get(r) : (r as any)[c.key]) ?? "");

  const downloadPdf = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(title, 14, 16);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Generated ${new Date().toLocaleString()} — ${rows.length} row(s)`, 14, 22);
    autoTable(doc, {
      startY: 28,
      head: [columns.map((c) => c.label)],
      body: rows.map((r) => toCells(r).map((v) => String(v))),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [30, 30, 30] },
      margin: { left: 14, right: 14 },
    });
    doc.save(`${filename}.pdf`);
    toast.success("PDF downloaded.");
  };

  const downloadCsv = () => {
    const esc = (v: any) => {
      const s = String(v ?? "");
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [
      columns.map((c) => esc(c.label)).join(","),
      ...rows.map((r) => toCells(r).map(esc).join(",")),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV downloaded.");
  };

  const printView = () => {
    const w = window.open("", "_blank", "width=1200,height=900");
    if (!w) return toast.error("Popup blocked. Allow popups and try again.");
    const style = `
      body{font:12px system-ui,sans-serif;margin:24px;color:#111}
      h1{font:600 18px Georgia,serif;margin:0 0 4px}
      .meta{color:#666;font-size:11px;margin-bottom:12px}
      table{width:100%;border-collapse:collapse}
      th,td{border-bottom:1px solid #ddd;padding:6px 8px;text-align:left;vertical-align:top}
      th{background:#f3f3f3}
      @media print{@page{size:landscape;margin:12mm}}
    `;
    const head = `<tr>${columns.map((c) => `<th>${escapeHtml(c.label)}</th>`).join("")}</tr>`;
    const body = rows
      .map((r) => `<tr>${toCells(r).map((v) => `<td>${escapeHtml(String(v))}</td>`).join("")}</tr>`)
      .join("");
    w.document.write(
      `<!doctype html><html><head><title>${escapeHtml(title)}</title><style>${style}</style></head><body><h1>${escapeHtml(title)}</h1><div class="meta">Generated ${new Date().toLocaleString()} — ${rows.length} row(s)</div><table>${head}${body}</table><script>window.onload=()=>setTimeout(()=>window.print(),200)<\/script></body></html>`,
    );
    w.document.close();
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="rounded-xl gap-2">
            <Download className="size-4" /> Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Download</DropdownMenuLabel>
          <DropdownMenuItem onClick={downloadPdf}>
            <FileText className="mr-2 size-4" /> PDF
          </DropdownMenuItem>
          <DropdownMenuItem onClick={downloadCsv}>
            <FileSpreadsheet className="mr-2 size-4" /> CSV
          </DropdownMenuItem>
          <DropdownMenuItem onClick={printView}>
            <Printer className="mr-2 size-4" /> Print
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Share</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => setEmailOpen(true)}>
            <Mail className="mr-2 size-4" /> Email…
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled
            onSelect={(e) => {
              e.preventDefault();
              toast("Google Drive save — coming in the next drop.");
            }}
          >
            <Cloud className="mr-2 size-4" /> Save to Google Drive
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled
            onSelect={(e) => {
              e.preventDefault();
              toast("Dropbox save — coming in the next drop.");
            }}
          >
            <Cloud className="mr-2 size-4" /> Save to Dropbox
          </DropdownMenuItem>
          <DropdownMenuItem onClick={downloadPdf}>
            <HardDrive className="mr-2 size-4" /> Save to device (PDF)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={emailOpen} onOpenChange={setEmailOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Email this report</DialogTitle>
            <DialogDescription>
              We'll open your mail client with the report attached as a PDF. Native inbox sending
              lands in the next update.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Recipient</Label>
            <Input id="rcpt" placeholder="colleague@example.com" />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEmailOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                const rcpt = (document.getElementById("rcpt") as HTMLInputElement)?.value ?? "";
                downloadPdf();
                const subject = encodeURIComponent(`${title} — Groundwork report`);
                const body = encodeURIComponent(
                  `The ${title} export is attached (downloaded to your device — please attach it before sending).\n\nGenerated ${new Date().toLocaleString()}.`,
                );
                window.location.href = `mailto:${encodeURIComponent(rcpt)}?subject=${subject}&body=${body}`;
                setEmailOpen(false);
              }}
            >
              Open mail
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
