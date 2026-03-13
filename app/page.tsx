"use client";

import { useEffect, useState, useMemo } from "react";

type Lead = {
  name: string;
  address: string;
  phone: string;
  website: string;
  category: string;
  website_status: string;
  website_score: number;
  notes: string;
  rescanned?: boolean;
};

type OutcomeMap = Record<string, "won" | "lost" | "pending" | "called" | "removed">;

const STATUS_COLORS: Record<string, string> = {
  none: "bg-red-500/20 text-red-400 border-red-500/30",
  dead: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  bad: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  ok: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  error: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
};

const OUTCOME_COLORS: Record<string, string> = {
  won: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
  lost: "bg-red-500/20 text-red-400 border-red-500/40",
  called: "bg-sky-500/20 text-sky-400 border-sky-500/40",
  removed: "bg-zinc-500/20 text-zinc-500 border-zinc-500/40",
  pending: "",
};

export default function Home() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [outcomes, setOutcomes] = useState<OutcomeMap>({});
  const [filter, setFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [outcomeFilter, setOutcomeFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    fetch("/leads.json")
      .then((r) => r.json())
      .then(setLeads);
    const saved = localStorage.getItem("jonen-outcomes");
    if (saved) setOutcomes(JSON.parse(saved));
  }, []);

  function saveOutcome(key: string, value: "won" | "lost" | "pending" | "called" | "removed") {
    const next = { ...outcomes, [key]: value };
    setOutcomes(next);
    localStorage.setItem("jonen-outcomes", JSON.stringify(next));
  }

  const categories = useMemo(
    () => [...new Set(leads.map((l) => l.category))].sort(),
    [leads]
  );

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      if (filter !== "all" && l.category !== filter) return false;
      if (statusFilter !== "all" && l.website_status !== statusFilter) return false;
      const key = `${l.name}|${l.address}`;
      const outcome = outcomes[key] || "pending";
      if (outcome === "removed" && outcomeFilter !== "removed") return false;
      if (outcomeFilter !== "all" && outcome !== outcomeFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !l.name.toLowerCase().includes(q) &&
          !l.address.toLowerCase().includes(q) &&
          !l.category.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [leads, filter, statusFilter, outcomeFilter, search, outcomes]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { none: 0, dead: 0, bad: 0, ok: 0 };
    leads.forEach((l) => {
      if (filter !== "all" && l.category !== filter) return;
      const key = `${l.name}|${l.address}`;
      const outcome = outcomes[key] || "pending";
      if (outcome === "removed" && outcomeFilter !== "removed") return;
      if (outcomeFilter !== "all" && outcome !== outcomeFilter) return;
      if (search) {
        const q = search.toLowerCase();
        if (
          !l.name.toLowerCase().includes(q) &&
          !l.address.toLowerCase().includes(q) &&
          !l.category.toLowerCase().includes(q)
        ) return;
      }
      if (counts[l.website_status] !== undefined) counts[l.website_status]++;
    });
    return counts;
  }, [leads, filter, outcomeFilter, search, outcomes]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    leads.forEach((l) => {
      if (statusFilter !== "all" && l.website_status !== statusFilter) return;
      const key = `${l.name}|${l.address}`;
      const outcome = outcomes[key] || "pending";
      if (outcome === "removed" && outcomeFilter !== "removed") return;
      if (outcomeFilter !== "all" && outcome !== outcomeFilter) return;
      if (search) {
        const q = search.toLowerCase();
        if (
          !l.name.toLowerCase().includes(q) &&
          !l.address.toLowerCase().includes(q) &&
          !l.category.toLowerCase().includes(q)
        ) return;
      }
      counts[l.category] = (counts[l.category] || 0) + 1;
    });
    return counts;
  }, [leads, statusFilter, outcomeFilter, search, outcomes]);

  const stats = useMemo(() => {
    const total = leads.length;
    const won = Object.values(outcomes).filter((v) => v === "won").length;
    const lost = Object.values(outcomes).filter((v) => v === "lost").length;
    const called = Object.values(outcomes).filter((v) => v === "called").length;
    const removed = Object.values(outcomes).filter((v) => v === "removed").length;
    const pending = total - won - lost - called - removed;
    return { total, won, lost, called, removed, pending };
  }, [leads, outcomes]);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                Jonen Leads
              </h1>
              <p className="text-sm text-zinc-500">
                Businesses within 20km of Jonen 8916
              </p>
            </div>
            <div className="flex gap-3 text-sm">
              <Stat label="Total" value={stats.total} color="text-zinc-300" />
              <Stat label="Pending" value={stats.pending} color="text-zinc-400" />
              <Stat label="Called" value={stats.called} color="text-sky-400" />
              <Stat label="Won" value={stats.won} color="text-emerald-400" />
              <Stat label="Lost" value={stats.lost} color="text-red-400" />
            </div>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="sticky top-[73px] z-40 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 py-3 flex flex-wrap gap-3 items-center">
          <input
            type="text"
            placeholder="Search name, address, category..."
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm outline-none focus:border-[#8ab8c9] w-64"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm outline-none"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm outline-none"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All statuses</option>
            <option value="none">No website</option>
            <option value="dead">Dead website</option>
            <option value="bad">Bad website</option>
            <option value="ok">Mediocre</option>
          </select>
          <select
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm outline-none"
            value={outcomeFilter}
            onChange={(e) => setOutcomeFilter(e.target.value)}
          >
            <option value="all">All outcomes</option>
            <option value="pending">Pending</option>
            <option value="called">Called</option>
            <option value="won">Won</option>
            <option value="lost">Lost</option>
            <option value="removed">Removed</option>
          </select>
          <span className="text-sm text-zinc-500 ml-auto">
            {filtered.length} leads
          </span>
        </div>
      </div>

      {/* Sidebar + Lead list */}
      <div className="mx-auto max-w-7xl flex">
        {/* Sidebar */}
        <aside className={`sticky top-[130px] h-[calc(100vh-130px)] overflow-y-auto border-r border-zinc-800 bg-zinc-950/50 transition-all shrink-0 ${sidebarOpen ? "w-56" : "w-0 border-r-0"}`}>
          {sidebarOpen && (
            <div className="py-3 px-2">
              <div className="flex items-center justify-between px-2 mb-2">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Status</span>
                <button onClick={() => setSidebarOpen(false)} className="text-zinc-600 hover:text-zinc-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
              </div>
              <button
                onClick={() => setStatusFilter("all")}
                className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-sm transition-colors ${statusFilter === "all" ? "bg-[#8ab8c9]/15 text-[#8ab8c9]" : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"}`}
              >
                <span>All</span>
                <span className="text-xs tabular-nums">{statusCounts.none + statusCounts.dead + statusCounts.bad + statusCounts.ok}</span>
              </button>
              <div className="mt-1 space-y-0.5">
                {([
                  { key: "none", label: "No website", color: "text-red-400" },
                  { key: "dead", label: "Dead", color: "text-orange-400" },
                  { key: "bad", label: "Bad", color: "text-yellow-400" },
                  { key: "ok", label: "Mediocre", color: "text-blue-400" },
                ] as const).map(({ key: s, label, color }) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(statusFilter === s ? "all" : s)}
                    className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-sm transition-colors ${statusFilter === s ? "bg-[#8ab8c9]/15 text-[#8ab8c9]" : `${color} hover:bg-zinc-800`}`}
                  >
                    <span>{label}</span>
                    <span className="text-xs tabular-nums">{statusCounts[s]}</span>
                  </button>
                ))}
              </div>

              <div className="mt-4 mb-2 px-2">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Categories</span>
              </div>
              <button
                onClick={() => setFilter("all")}
                className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-sm transition-colors ${filter === "all" ? "bg-[#8ab8c9]/15 text-[#8ab8c9]" : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"}`}
              >
                <span>All</span>
                <span className="text-xs tabular-nums">{Object.values(categoryCounts).reduce((a, b) => a + b, 0)}</span>
              </button>
              <div className="mt-1 space-y-0.5">
                {categories.filter((c) => (categoryCounts[c] || 0) > 0).sort((a, b) => (categoryCounts[b] || 0) - (categoryCounts[a] || 0)).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilter(filter === cat ? "all" : cat)}
                    className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-sm transition-colors ${filter === cat ? "bg-[#8ab8c9]/15 text-[#8ab8c9]" : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"}`}
                  >
                    <span className="truncate">{cat}</span>
                    <span className="text-xs tabular-nums ml-2 shrink-0">{categoryCounts[cat] || 0}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* Toggle sidebar button when closed */}
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="sticky top-[140px] h-8 w-6 flex items-center justify-center bg-zinc-900 border border-zinc-700 rounded-r-md text-zinc-500 hover:text-zinc-300 z-30"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        )}

        <main className="flex-1 min-w-0 px-4 py-4">
        <div className="space-y-2">
          {filtered.map((lead) => {
            const key = `${lead.name}|${lead.address}`;
            const outcome = outcomes[key] || "pending";
            const isExpanded = expanded === key;

            return (
              <div
                key={key}
                className={`rounded-xl border transition-all ${
                  outcome === "won"
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : outcome === "lost"
                    ? "border-red-500/20 bg-red-500/5 opacity-60"
                    : outcome === "removed"
                    ? "border-zinc-700/30 bg-zinc-900/30 opacity-40"
                    : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700"
                }`}
              >
                {/* Row */}
                <div
                  className="flex items-center gap-4 px-4 py-3 cursor-pointer"
                  onClick={() => setExpanded(isExpanded ? null : key)}
                >
                  {/* Status badge */}
                  <span
                    className={`shrink-0 rounded-md border px-2 py-0.5 text-xs font-medium ${
                      STATUS_COLORS[lead.website_status] || STATUS_COLORS.error
                    }`}
                  >
                    {lead.website_status === "none"
                      ? "No site"
                      : lead.website_status === "dead"
                      ? "Dead"
                      : lead.website_status === "bad"
                      ? "Bad"
                      : lead.website_status === "ok"
                      ? "Mediocre"
                      : "?"}
                    {lead.website_score > 0 && ` ${lead.website_score}`}
                  </span>

                  {/* Name + address */}
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate flex items-center gap-1.5">
                      {lead.rescanned && (
                        <span className="relative flex h-2.5 w-2.5 shrink-0">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                        </span>
                      )}
                      {lead.name}
                    </div>
                    <div className="text-sm text-zinc-500 truncate">
                      {lead.address}
                    </div>
                  </div>

                  {/* Category */}
                  <span className="hidden sm:block text-xs text-zinc-500 shrink-0">
                    {lead.category}
                  </span>

                  {/* Outcome badge */}
                  {outcome !== "pending" && (
                    <span
                      className={`shrink-0 rounded-md border px-2 py-0.5 text-xs font-medium ${OUTCOME_COLORS[outcome]}`}
                    >
                      {outcome === "won" ? "WON" : outcome === "lost" ? "LOST" : outcome === "removed" ? "REMOVED" : "CALLED"}
                    </span>
                  )}

                  {/* Call button */}
                  {lead.phone && (
                    <a
                      href={`tel:${lead.phone.replace(/\s/g, "")}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (outcome === "pending") saveOutcome(key, "called");
                      }}
                      className="shrink-0 rounded-lg bg-[#8ab8c9] px-3 py-1.5 text-sm font-medium text-zinc-950 hover:bg-[#bcdae6] transition-colors"
                    >
                      Call
                    </a>
                  )}

                  {/* Expand arrow */}
                  <svg
                    className={`w-4 h-4 text-zinc-500 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-zinc-800 px-4 py-4 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-zinc-500">Phone: </span>
                        {lead.phone ? (
                          <a
                            href={`tel:${lead.phone.replace(/\s/g, "")}`}
                            className="text-[#8ab8c9] hover:underline"
                          >
                            {lead.phone}
                          </a>
                        ) : (
                          <span className="text-zinc-600">Not available</span>
                        )}
                      </div>
                      <div>
                        <span className="text-zinc-500">Website: </span>
                        {lead.website ? (
                          <a
                            href={lead.website}
                            target="_blank"
                            rel="noopener"
                            className="text-[#8ab8c9] hover:underline"
                          >
                            {lead.website}
                          </a>
                        ) : (
                          <span className="text-zinc-600">None</span>
                        )}
                      </div>
                      <div>
                        <span className="text-zinc-500">Category: </span>
                        {lead.category}
                      </div>
                      <div>
                        <span className="text-zinc-500">Score: </span>
                        {lead.website_score}/100
                      </div>
                      {lead.notes && (
                        <div className="sm:col-span-2">
                          <span className="text-zinc-500">Notes: </span>
                          <span className="text-zinc-400">{lead.notes}</span>
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 pt-2">
                      {lead.phone && (
                        <a
                          href={`tel:${lead.phone.replace(/\s/g, "")}`}
                          onClick={() => {
                            if (outcome === "pending") saveOutcome(key, "called");
                          }}
                          className="rounded-lg bg-[#8ab8c9] px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-[#bcdae6] transition-colors"
                        >
                          Call {lead.phone}
                        </a>
                      )}
                      <button
                        onClick={() => saveOutcome(key, "won")}
                        className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                          outcome === "won"
                            ? "border-emerald-500 bg-emerald-500/20 text-emerald-400"
                            : "border-zinc-700 hover:border-emerald-500/50 hover:text-emerald-400"
                        }`}
                      >
                        Won
                      </button>
                      <button
                        onClick={() => saveOutcome(key, "lost")}
                        className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                          outcome === "lost"
                            ? "border-red-500 bg-red-500/20 text-red-400"
                            : "border-zinc-700 hover:border-red-500/50 hover:text-red-400"
                        }`}
                      >
                        Lost
                      </button>
                      <button
                        onClick={() => saveOutcome(key, "removed")}
                        className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                          outcome === "removed"
                            ? "border-zinc-500 bg-zinc-500/20 text-zinc-400"
                            : "border-zinc-700 hover:border-zinc-500/50 hover:text-zinc-400"
                        }`}
                      >
                        Remove
                      </button>
                      <button
                        onClick={() => saveOutcome(key, "pending")}
                        className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="text-center">
      <div className={`text-lg font-semibold ${color}`}>{value}</div>
      <div className="text-xs text-zinc-500">{label}</div>
    </div>
  );
}
