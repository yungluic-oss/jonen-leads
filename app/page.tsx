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
};

type OutcomeMap = Record<string, "won" | "lost" | "pending" | "called">;

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

  useEffect(() => {
    fetch("/leads.json")
      .then((r) => r.json())
      .then(setLeads);
    const saved = localStorage.getItem("jonen-outcomes");
    if (saved) setOutcomes(JSON.parse(saved));
  }, []);

  function saveOutcome(key: string, value: "won" | "lost" | "pending" | "called") {
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

  const stats = useMemo(() => {
    const total = leads.length;
    const won = Object.values(outcomes).filter((v) => v === "won").length;
    const lost = Object.values(outcomes).filter((v) => v === "lost").length;
    const called = Object.values(outcomes).filter((v) => v === "called").length;
    const pending = total - won - lost - called;
    return { total, won, lost, called, pending };
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
          </select>
          <span className="text-sm text-zinc-500 ml-auto">
            {filtered.length} leads
          </span>
        </div>
      </div>

      {/* Lead list */}
      <main className="mx-auto max-w-7xl px-4 py-4">
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
                    <div className="font-medium truncate">{lead.name}</div>
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
                      {outcome === "won" ? "WON" : outcome === "lost" ? "LOST" : "CALLED"}
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
