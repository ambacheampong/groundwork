import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AdminShell } from "@/components/AdminShell";
import { ExportMenu } from "@/components/ExportMenu";
import { getAdminDashboard } from "@/lib/admin.functions";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({ meta: [{ title: "Admin — Groundwork" }] }),
  component: AdminDashboard,
});

const PALETTE = ["#c85a3a", "#7a9269", "#d4a373", "#5f7a7a", "#a06246", "#8f5f8f"];

function AdminDashboard() {
  const q = useQuery({ queryKey: ["admin-dashboard"], queryFn: () => getAdminDashboard() });

  if (q.isLoading || !q.data) {
    return (
      <AdminShell title="Dashboard">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      </AdminShell>
    );
  }

  const d = q.data;
  const kpis = [
    { label: "Opportunities", value: d.kpis.opportunities },
    { label: "Organisations", value: d.kpis.organisations },
    { label: "Posts", value: d.kpis.posts },
    { label: "Comments", value: d.kpis.comments },
    { label: "Ingestion runs (7d)", value: d.kpis.runsLast7d },
    { label: "Closing this week", value: d.kpis.closingThisWeek },
  ];

  return (
    <AdminShell title="Dashboard">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">A quick pulse. Numbers don't lie; interpretations do.</p>
        <ExportMenu
          title="Dashboard snapshot"
          rows={kpis}
          columns={[
            { key: "label", label: "Metric" },
            { key: "value", label: "Value" },
          ]}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {kpis.map((k) => (
          <div key={k.label} className="glass rounded-2xl p-4">
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">{k.label}</div>
            <div className="mt-1 font-display text-2xl sm:text-3xl">{k.value}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Signups per day (30d)">
          <LineChart data={d.signups}>
            <CartesianGrid strokeOpacity={0.15} />
            <XAxis dataKey="day" fontSize={10} />
            <YAxis fontSize={10} allowDecimals={false} />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke={PALETTE[0]} strokeWidth={2} dot={false} />
          </LineChart>
        </ChartCard>

        <ChartCard title="Ingestion volume (last 20 runs)">
          <BarChart data={d.runs}>
            <CartesianGrid strokeOpacity={0.15} />
            <XAxis dataKey="when" fontSize={10} />
            <YAxis fontSize={10} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="added" fill={PALETTE[1]} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ChartCard>

        <ChartCard title="Opportunities by study level">
          <BarChart data={d.byLevel}>
            <CartesianGrid strokeOpacity={0.15} />
            <XAxis dataKey="name" fontSize={10} />
            <YAxis fontSize={10} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill={PALETTE[2]} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ChartCard>

        <ChartCard title="Opportunities by funding type">
          <BarChart data={d.byFunding}>
            <CartesianGrid strokeOpacity={0.15} />
            <XAxis dataKey="name" fontSize={10} />
            <YAxis fontSize={10} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill={PALETTE[3]} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ChartCard>

        <ChartCard title="Top orgs by visitors">
          <BarChart data={d.topOrgs} layout="vertical">
            <CartesianGrid strokeOpacity={0.15} />
            <XAxis type="number" fontSize={10} allowDecimals={false} />
            <YAxis dataKey="name" type="category" fontSize={10} width={140} />
            <Tooltip />
            <Bar dataKey="views" fill={PALETTE[4]} radius={[0, 6, 6, 0]} />
          </BarChart>
        </ChartCard>

        <ChartCard title="Posts by community">
          <PieChart>
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Pie
              data={d.postsByCommunity}
              dataKey="count"
              nameKey="name"
              innerRadius={40}
              outerRadius={80}
            >
              {d.postsByCommunity.map((_, i) => (
                <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
              ))}
            </Pie>
          </PieChart>
        </ChartCard>
      </div>
    </AdminShell>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactElement }) {
  return (
    <div className="glass-strong rounded-3xl p-5">
      <h3 className="mb-3 font-display text-base">{title}</h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
