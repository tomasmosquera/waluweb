'use client';

import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie,
} from 'recharts';
import { useLanguage } from '@/context/LanguageContext';
import { useTransactions } from '@/context/TransactionsContext';
import { useTools } from '@/context/ToolsContext';
import { useCategories } from '@/context/CategoriesContext';
import ToolIcon from '@/components/tools/ToolIcon';

/* ── Constants ───────────────────────────────────────────── */

const MONTHS_ES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const MONTHS_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const CHART_COLORS = [
  '#E53935','#FF9800','#FDD835','#4CAF50','#26C6DA',
  '#2196F3','#9C27B0','#EC407A','#8D6E63','#78909C',
  '#F4511E','#00897B','#6D4C41','#546E7A','#ADC130',
];

type ViewMode = 'overview' | 'categories' | 'trend' | 'tools';

/* ── Helpers ─────────────────────────────────────────────── */

function fmt(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000)     return `$${(n / 1_000).toFixed(0)}k`;
  return `$${new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(n)}`;
}

function fmtFull(n: number): string {
  return `$${new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.abs(n))}`;
}

function formatMonthYear(year: number, month: number, language: string): string {
  const MONTHS = language === 'es' ? MONTHS_ES : MONTHS_EN;
  return `${MONTHS[month]} ${year}`;
}

/* ── Custom tooltip ──────────────────────────────────────── */

function ChartTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; fill?: string; color?: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl border px-3 py-2 text-xs shadow-lg"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
    >
      {label && <p className="font-bold mb-1" style={{ color: 'var(--text)' }}>{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.fill ?? p.color ?? 'var(--text)' }}>
          {p.name}: {fmtFull(p.value)}
        </p>
      ))}
    </div>
  );
}

/* ── Progress bar ────────────────────────────────────────── */

function ProgressBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-subtle)' }}>
      <div
        className="h-full rounded-full"
        style={{ width: `${Math.min(pct, 100)}%`, background: color }}
      />
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────── */

export default function ReportsPage() {
  const { language, t } = useLanguage();
  const { transactions } = useTransactions();
  const { tools } = useTools();
  const { categories } = useCategories();

  const now = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [view,  setView]  = useState<ViewMode>('overview');
  const [catType, setCatType] = useState<'expense' | 'income'>('expense');

  const MONTHS = language === 'es' ? MONTHS_ES : MONTHS_EN;

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  }

  /* ── Period transactions ────────────────────────────────── */
  const periodTx = useMemo(() =>
    transactions.filter((tx) => {
      const d = new Date(tx.date);
      return d.getMonth() === month && d.getFullYear() === year;
    }),
    [transactions, month, year]
  );

  const totalIncome  = useMemo(() => periodTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0), [periodTx]);
  const totalExpense = useMemo(() => periodTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0), [periodTx]);
  const net = totalIncome - totalExpense;

  /* ── vs previous month ──────────────────────────────────── */
  const pm = month === 0 ? 11 : month - 1;
  const py = month === 0 ? year - 1 : year;
  const prevTx = useMemo(() =>
    transactions.filter((tx) => {
      const d = new Date(tx.date);
      return d.getMonth() === pm && d.getFullYear() === py;
    }),
    [transactions, pm, py]
  );
  const prevExpense = prevTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const prevIncome  = prevTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);

  function delta(curr: number, prev: number) {
    if (prev === 0) return null;
    const pct = ((curr - prev) / prev) * 100;
    return { pct: Math.abs(pct).toFixed(0), up: curr >= prev };
  }

  /* ── Category breakdown ─────────────────────────────────── */
  const catData = useMemo(() => {
    const map: Record<string, { name: string; value: number; color: string; icon: string }> = {};
    periodTx
      .filter((tx) => tx.type === catType)
      .forEach((tx) => {
        const key = tx.category ?? (language === 'es' ? 'Sin categoría' : 'No category');
        const cat = categories.find((c) => c.name === tx.category && c.type === catType);
        if (!map[key]) {
          map[key] = { name: key, value: 0, color: cat?.color ?? '#9E9E9E', icon: cat?.icon ?? 'pricetag' };
        }
        map[key].value += tx.amount;
      });
    return Object.values(map).sort((a, b) => b.value - a.value);
  }, [periodTx, catType, categories, language]);

  const catTotal = catData.reduce((s, c) => s + c.value, 0);

  /* ── Trend — last 6 months ──────────────────────────────── */
  const trendData = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(year, month - (5 - i), 1);
      const mm = d.getMonth();
      const yy = d.getFullYear();
      const txs = transactions.filter((tx) => {
        const td = new Date(tx.date);
        return td.getMonth() === mm && td.getFullYear() === yy;
      });
      return {
        label:    MONTHS[mm],
        income:   txs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
        expenses: txs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
      };
    });
  }, [transactions, month, year, MONTHS]);

  /* ── Tools breakdown ────────────────────────────────────── */
  const toolsData = useMemo(() => {
    return tools
      .filter((tool) => !tool.fullyArchived)
      .map((tool) => {
        const inc = periodTx.filter((tx) => tx.type === 'income'  && tx.toolId === tool.id).reduce((s, t) => s + t.amount, 0);
        const exp = periodTx.filter((tx) => tx.type === 'expense' && tx.toolId === tool.id).reduce((s, t) => s + t.amount, 0);
        return { tool, income: inc, expense: exp, net: inc - exp };
      })
      .filter((d) => d.income > 0 || d.expense > 0);
  }, [tools, periodTx]);

  /* ── Tabs ────────────────────────────────────────────────── */
  const TABS: Array<{ id: ViewMode; label: string }> = [
    { id: 'overview',   label: t.reports.overview },
    { id: 'categories', label: t.reports.categories },
    { id: 'trend',      label: t.reports.trend },
    { id: 'tools',      label: t.reports.tools },
  ];

  const hasData = periodTx.length > 0;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Month navigation */}
      <div
        className="flex items-center justify-between px-4 py-3 rounded-2xl border"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        <button onClick={prevMonth} className="p-2 rounded-xl hover:opacity-70" style={{ color: 'var(--text-muted)' }}>
          <ChevronLeft size={20} />
        </button>
        <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>
          {formatMonthYear(year, month, language)}
        </span>
        <button onClick={nextMonth} className="p-2 rounded-xl hover:opacity-70" style={{ color: 'var(--text-muted)' }}>
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setView(id)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all"
            style={view === id ? {
              background: '#4CAF50', borderColor: '#4CAF50', color: '#fff',
            } : {
              background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-muted)',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* No data */}
      {!hasData && view !== 'trend' && (
        <div className="text-center py-16 text-sm" style={{ color: 'var(--text-muted)' }}>
          {t.reports.noData}
        </div>
      )}

      {/* ── Overview ── */}
      {(hasData || view === 'overview') && view === 'overview' && hasData && (
        <div className="space-y-3">
          {[
            { label: t.reports.income,  value: totalIncome,  prevVal: prevIncome,  color: '#4CAF50', prefix: '+' },
            { label: t.reports.expense, value: totalExpense, prevVal: prevExpense, color: '#F44336', prefix: '-' },
            { label: t.reports.net,     value: Math.abs(net), prevVal: null,        color: net >= 0 ? '#4CAF50' : '#F44336', prefix: net >= 0 ? '+' : '-' },
          ].map(({ label, value, prevVal, color, prefix }) => {
            const d = prevVal !== null ? delta(value, prevVal) : null;
            return (
              <div
                key={label}
                className="flex items-center justify-between px-4 py-4 rounded-2xl border"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
              >
                <div>
                  <p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>{label}</p>
                  <p className="text-xl font-extrabold" style={{ color }}>
                    {prefix}{fmtFull(value)}
                  </p>
                </div>
                {d && (
                  <div
                    className="text-xs font-bold px-2 py-1 rounded-lg"
                    style={{
                      background: d.up ? '#E8F5E9' : '#FFEBEE',
                      color:      d.up ? '#2E7D32' : '#C62828',
                    }}
                  >
                    {d.up ? '▲' : '▼'} {d.pct}% {t.reports.vsLastMonth}
                  </div>
                )}
              </div>
            );
          })}

          <div
            className="rounded-2xl border p-4"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <p className="text-xs font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>
              {t.reports.income} vs {t.reports.expense}
            </p>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart
                data={[
                  { name: t.reports.income,  value: totalIncome,  fill: '#4CAF50' },
                  { name: t.reports.expense, value: totalExpense, fill: '#F44336' },
                  { name: t.reports.net,     value: Math.abs(net), fill: net >= 0 ? '#2196F3' : '#FF9800' },
                ]}
                margin={{ top: 4, right: 4, left: 4, bottom: 4 }}
              >
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="value" radius={[8,8,0,0]}>
                  {[totalIncome, totalExpense, Math.abs(net)].map((_, i) => (
                    <Cell key={i} fill={['#4CAF50','#F44336', net >= 0 ? '#2196F3' : '#FF9800'][i]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── Categories ── */}
      {view === 'categories' && (
        <div className="space-y-4">
          <div className="flex rounded-xl p-1 border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            {(['expense', 'income'] as const).map((tp) => (
              <button
                key={tp}
                onClick={() => setCatType(tp)}
                className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={catType === tp ? {
                  background: tp === 'expense' ? '#F44336' : '#4CAF50', color: '#fff',
                } : { color: 'var(--text-muted)' }}
              >
                {tp === 'expense' ? t.reports.expense : t.reports.income}
              </button>
            ))}
          </div>

          {catData.length === 0 ? (
            <div className="text-center py-10 text-sm" style={{ color: 'var(--text-muted)' }}>{t.reports.noData}</div>
          ) : (
            <>
              <div className="rounded-2xl border p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={catData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={44}>
                      {catData.map((entry, i) => (
                        <Cell key={i} fill={entry.color || CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2">
                {catData.map((cat) => {
                  const catInfo = categories.find((c) => c.name === cat.name && c.type === catType);
                  const pct = catTotal > 0 ? (cat.value / catTotal) * 100 : 0;
                  return (
                    <div
                      key={cat.name}
                      className="flex items-center gap-3 px-3 py-3 rounded-2xl border"
                      style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
                    >
                      <ToolIcon icon={catInfo?.icon ?? 'pricetag'} color={cat.color} size={16} withContainer />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold truncate" style={{ color: 'var(--text)' }}>{cat.name}</span>
                          <span className="text-xs font-bold ml-2 flex-shrink-0" style={{ color: cat.color }}>{fmtFull(cat.value)}</span>
                        </div>
                        <ProgressBar pct={pct} color={cat.color} />
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{pct.toFixed(1)}%</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Trend ── */}
      {view === 'trend' && (
        <div className="rounded-2xl border p-4 space-y-3" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{t.reports.last6Months}</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={trendData} margin={{ top: 4, right: 4, left: 4, bottom: 4 }} barGap={4}>
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={fmt} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} width={44} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="income"   name={t.reports.income}  fill="#4CAF50" radius={[6,6,0,0]} />
              <Bar dataKey="expenses" name={t.reports.expense} fill="#F44336" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 justify-center">
            {[{ color: '#4CAF50', label: t.reports.income }, { color: '#F44336', label: t.reports.expense }].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                <div className="w-3 h-3 rounded-sm" style={{ background: color }} />
                {label}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Tools ── */}
      {view === 'tools' && (
        <div className="space-y-2">
          {toolsData.length === 0 ? (
            <div className="text-center py-10 text-sm" style={{ color: 'var(--text-muted)' }}>{t.reports.noData}</div>
          ) : (
            toolsData.map(({ tool, income, expense, net: toolNet }) => (
              <div key={tool.id} className="px-4 py-3 rounded-2xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-3 mb-2">
                  <ToolIcon icon={tool.icon} color={tool.color} size={16} withContainer />
                  <span className="text-sm font-semibold flex-1" style={{ color: 'var(--text)' }}>{tool.name}</span>
                  <span className="text-sm font-bold" style={{ color: toolNet >= 0 ? '#4CAF50' : '#F44336' }}>
                    {toolNet >= 0 ? '+' : '-'}{fmtFull(toolNet)}
                  </span>
                </div>
                <div className="flex gap-4 text-xs">
                  <span style={{ color: '#4CAF50' }}>+{fmtFull(income)}</span>
                  <span style={{ color: '#F44336' }}>-{fmtFull(expense)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
