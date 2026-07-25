import React, { useEffect, useState, useCallback } from 'react';
import { PrinterLog } from '../types';
import { usePrinters } from '../contexts/DataContext';
import { getVilniusShiftBoundaries } from '../lib/utils';
import { parseChecklistItem } from '../lib/checklistUtils';
import { CheckCircle2, XCircle, ChevronLeft, ChevronRight, Camera, Pen, FileText, AlertTriangle, RefreshCw } from 'lucide-react';

function formatDateLT(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${d}.${m}.${y}`;
}

function formatTime(isoStr?: string): string {
  if (!isoStr) return '–';
  return new Date(isoStr).toLocaleTimeString('lt-LT', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Vilnius' });
}

function addDays(dateStr: string, n: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + n);
  return dt.toISOString().slice(0, 10);
}

function todayVilnius(): string {
  return getVilniusShiftBoundaries().logicalDateString;
}

interface PhotoLightboxProps {
  url: string;
  label: string;
  onClose: () => void;
}
const PhotoLightbox: React.FC<PhotoLightboxProps> = ({ url, label, onClose }) => (
  <div
    className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4"
    onClick={onClose}
  >
    <button
      onClick={onClose}
      className="absolute top-4 right-4 w-11 h-11 bg-white/10 hover:bg-white/25 active:bg-white/40 text-white rounded-full flex items-center justify-center text-xl font-black transition-all"
      aria-label="Uždaryti"
    >
      ✕
    </button>
    <p className="text-white text-sm font-semibold mb-3 opacity-50">{label}</p>
    <img
      src={url}
      alt={label}
      className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl object-contain"
      onClick={e => e.stopPropagation()}
    />
    <p className="text-white/30 text-xs mt-3">Spustelėkite foną arba ✕ norėdami uždaryti</p>
  </div>
);

interface VITSectionProps {
  log: PrinterLog;
}
const VITSection: React.FC<VITSectionProps> = ({ log }) => {
  const checklist = log.vitData?.checklist || {};
  const items = Object.entries(checklist);
  const checkedCount = items.filter(([, v]) => v).length;
  const allGood = checkedCount === items.length && items.length > 0 && log.vitData?.confirmed && !!log.vitData?.signature;
  const pct = items.length > 0 ? Math.round((checkedCount / items.length) * 100) : 0;

  return (
    <div className="mt-3">
      {/* Progress bar */}
      <div className="flex items-center gap-2 mb-2">
        <div className="flex-1 bg-slate-100 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${pct === 100 ? 'bg-emerald-500' : pct >= 70 ? 'bg-yellow-400' : 'bg-red-400'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className={`text-xs font-bold tabular-nums ${pct === 100 ? 'text-emerald-600' : pct >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
          {checkedCount}/{items.length}
        </span>
      </div>

      {/* Unchecked items highlighted first */}
      <div className="space-y-1">
        {items.sort(([, a], [, b]) => (a === b ? 0 : a ? 1 : -1)).map(([raw, done]) => {
          const text = parseChecklistItem(raw).text;
          return (
            <div key={raw} className={`flex items-start gap-2 text-sm px-2 py-1 rounded-lg ${done ? 'text-slate-500' : 'bg-red-50 text-red-700 font-semibold'}`}>
              {done
                ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                : <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />}
              <span>{text}</span>
            </div>
          );
        })}
      </div>

      {/* Confirmed + Signature row */}
      <div className="flex gap-3 mt-3">
        <div className={`flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded-lg ${log.vitData?.confirmed ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
          {log.vitData?.confirmed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
          Patvirtinta
        </div>
        <div className={`flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded-lg ${log.vitData?.signature ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
          <Pen className="w-3.5 h-3.5" />
          {log.vitData?.signature ? 'Parašas ✓' : 'Parašo nėra'}
        </div>
        {!allGood && (
          <div className="flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded-lg bg-orange-50 text-orange-700 ml-auto">
            <AlertTriangle className="w-3.5 h-3.5" />
            Neužbaigta
          </div>
        )}
      </div>

      {/* Notes */}
      {log.vitData?.notes && (
        <div className="mt-2 flex items-start gap-2 bg-slate-50 rounded-lg px-3 py-2 text-sm text-slate-600">
          <FileText className="w-4 h-4 shrink-0 mt-0.5 text-slate-400" />
          <span>{log.vitData.notes}</span>
        </div>
      )}
    </div>
  );
};

interface NozzleSection {
  log: PrinterLog;
}
const NozzlePhotos: React.FC<NozzleSection> = ({ log }) => {
  const [lightbox, setLightbox] = useState<{ url: string; label: string } | null>(null);
  const photos: { url: string; label: string }[] = [];

  if (log.nozzleData?.url) {
    photos.push({ url: log.nozzleData.url, label: `${log.printerName} — Nozzle check` });
  }
  if (log.nozzleData?.mimakiFiles) {
    Object.entries(log.nozzleData.mimakiFiles).forEach(([unit, f]) => {
      if (f?.url) photos.push({ url: f.url, label: `${log.printerName} — Blokas ${unit}` });
    });
  }

  if (photos.length === 0) return (
    <div className="mt-3 flex items-center gap-2 text-sm text-slate-400 bg-slate-50 rounded-xl px-3 py-2">
      <Camera className="w-4 h-4" />
      <span>Nozzle check nuotrauka nėra įkelta</span>
    </div>
  );

  return (
    <div className="mt-3">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
        <Camera className="w-3.5 h-3.5" /> Nozzle check
      </p>
      <div className="flex flex-wrap gap-2">
        {photos.map(p => (
          <button
            key={p.url}
            onClick={() => setLightbox(p)}
            className="relative group active:scale-95 transition-transform"
          >
            <img
              src={p.url}
              alt={p.label}
              className="w-28 h-20 object-cover rounded-xl border-2 border-slate-200 group-hover:border-mimaki-blue transition-all shadow-sm"
            />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 rounded-xl transition-all flex items-center justify-center">
              <span className="text-white text-xs font-black drop-shadow">🔍 Atidaryti</span>
            </div>
          </button>
        ))}
      </div>
      {lightbox && (
        <PhotoLightbox url={lightbox.url} label={lightbox.label} onClose={() => setLightbox(null)} />
      )}
    </div>
  );
};

interface LogCardProps {
  log: PrinterLog;
}
const LogCard: React.FC<LogCardProps> = ({ log }) => {
  const [expanded, setExpanded] = useState(false);
  const checklist = log.vitData?.checklist || {};
  const items = Object.entries(checklist);
  const checkedCount = items.filter(([, v]) => v).length;
  const vitOk = checkedCount === items.length && log.vitData?.confirmed && !!log.vitData?.signature;
  const hasNozzle = !!(log.nozzleData?.url || Object.keys(log.nozzleData?.mimakiFiles || {}).length > 0);

  return (
    <div className={`bg-white rounded-2xl shadow-sm border-2 transition-all ${vitOk ? 'border-emerald-200' : 'border-orange-200'}`}>
      {/* Header — always visible, tap to expand */}
      <button
        className="w-full text-left p-4 flex items-start gap-3"
        onClick={() => setExpanded(e => !e)}
      >
        <div className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1.5 ${vitOk ? 'bg-emerald-500' : 'bg-orange-400'}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="font-black text-slate-800 text-base truncate">{log.printerName}</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${log.shift === 'Dieninė' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>
              {log.shift}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
            <span className="font-semibold text-slate-700 truncate">{log.operatorName}</span>
            <span className="shrink-0">{formatTime(log.startedAt)} – {formatTime(log.finishedAt)}</span>
          </div>
          {/* Mini status bar */}
          <div className="flex items-center gap-3 mt-2">
            <span className={`text-xs font-bold ${vitOk ? 'text-emerald-600' : 'text-orange-600'}`}>
              VIT {checkedCount}/{items.length}
            </span>
            <span className={`text-xs font-bold ${hasNozzle ? 'text-emerald-600' : 'text-slate-400'}`}>
              {hasNozzle ? '📷 Nuotrauka ✓' : '📷 Nuotraukos nėra'}
            </span>
            <span className="ml-auto text-xs text-slate-400">{expanded ? '▲' : '▼'}</span>
          </div>
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-slate-100 pt-3 space-y-1">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">VIT kontrolinis sąrašas</p>
          <VITSection log={log} />
          <NozzlePhotos log={log} />
        </div>
      )}
    </div>
  );
};

export const KokybeView: React.FC = () => {
  const { getShiftLogs } = usePrinters();
  const [date, setDate] = useState<string>(todayVilnius);
  const [logs, setLogs] = useState<PrinterLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const today = todayVilnius();
  const isToday = date === today;

  const fetchLogs = useCallback(async (d: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getShiftLogs({ date: d });
      setLogs(data);
    } catch {
      setError('Nepavyko užkrauti duomenų. Patikrinkite ryšį.');
    } finally {
      setLoading(false);
    }
  }, [getShiftLogs]);

  useEffect(() => { fetchLogs(date); }, [date, fetchLogs]);

  const dayLogs = logs.filter(l => l.shift === 'Dieninė').sort((a, b) => a.printerName.localeCompare(b.printerName));
  const nightLogs = logs.filter(l => l.shift === 'Naktinė').sort((a, b) => a.printerName.localeCompare(b.printerName));

  const vitOkCount = logs.filter(l => {
    const items = Object.entries(l.vitData?.checklist || {});
    return items.length > 0 && items.every(([, v]) => v) && l.vitData?.confirmed && l.vitData?.signature;
  }).length;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-lg font-black text-slate-800 tracking-tight">Kokybės kontrolė</h1>
              <p className="text-xs text-slate-400">VIT patikrinimai ir nozzle check nuotraukos</p>
            </div>
            <button
              onClick={() => fetchLogs(date)}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
              title="Atnaujinti"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Date navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDate(d => addDays(d, -1))}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 text-center">
              <span className="font-black text-slate-800">{formatDateLT(date)}</span>
              {isToday && <span className="ml-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Šiandien</span>}
            </div>
            <button
              onClick={() => setDate(d => addDays(d, 1))}
              disabled={isToday}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Summary chips */}
          {!loading && !error && (
            <div className="flex gap-2 mt-3 flex-wrap">
              <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
                {logs.length} pamainų
              </span>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${vitOkCount === logs.length && logs.length > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                {vitOkCount}/{logs.length} VIT visiškai atlikta
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 py-4 pb-12">
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-500 rounded-full animate-spin mb-3" />
            <p className="text-sm">Kraunama...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center text-red-700 text-sm font-semibold">
            {error}
          </div>
        )}

        {!loading && !error && logs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <FileText className="w-12 h-12 mb-3 opacity-30" />
            <p className="font-semibold">Šiai dienai įrašų nėra</p>
          </div>
        )}

        {!loading && !error && dayLogs.length > 0 && (
          <section className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base">🌅</span>
              <h2 className="text-sm font-black text-slate-500 uppercase tracking-widest">Dieninė pamaina</h2>
            </div>
            <div className="space-y-3">
              {dayLogs.map(log => <LogCard key={log.id} log={log} />)}
            </div>
          </section>
        )}

        {!loading && !error && nightLogs.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base">🌙</span>
              <h2 className="text-sm font-black text-slate-500 uppercase tracking-widest">Naktinė pamaina</h2>
            </div>
            <div className="space-y-3">
              {nightLogs.map(log => <LogCard key={log.id} log={log} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
