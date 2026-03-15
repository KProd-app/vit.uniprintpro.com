import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Button } from './ui/button';
import { Trash2, Plus, RefreshCw, Save } from 'lucide-react';

interface TVProblem {
  id: string;
  created_at: string;
  date_reported: string;
  problem: string;
  solution: string;
  responsible: string;
  status: string;
  deadline?: string;
}

interface TVTransfer {
  id: string;
  created_at: string;
  scanned_by: string;
  product_info: string;
  photo_url?: string;
}

interface TVProposal {
  id: string;
  created_at: string;
  submitted_by: string;
  proposal_text: string;
}

export function AdminTVPanel() {
  const [problems, setProblems] = useState<TVProblem[]>([]);
  const [metrics, setMetrics] = useState<Record<string, string>>({});
  const [transfers, setTransfers] = useState<TVTransfer[]>([]);
  const [proposals, setProposals] = useState<TVProposal[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states for new/edit problem
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newDate, setNewDate] = useState('');
  const [newProblem, setNewProblem] = useState('');
  const [newSolution, setNewSolution] = useState('');
  const [newResponsible, setNewResponsible] = useState('');
  const [newDeadline, setNewDeadline] = useState('');

  // Form states for metrics
  const [defectsCount, setDefectsCount] = useState('0');
  const [breakdownsCount, setBreakdownsCount] = useState('0');
  const [qualityInfo, setQualityInfo] = useState('KOKYBĖS SKYRIAUS INFORMACIJA NĖRA.');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [probsRes, metricsRes, transRes, propsRes] = await Promise.all([
        supabase.from('tv_problems').select('*').order('created_at', { ascending: false }),
        supabase.from('tv_metrics').select('*'),
        supabase.from('tv_transfers').select('*').order('created_at', { ascending: false }),
        supabase.from('tv_proposals').select('*').order('created_at', { ascending: false })
      ]);

      if (probsRes.data) setProblems(probsRes.data);
      if (transRes.data) setTransfers(transRes.data);
      if (propsRes.data) setProposals(propsRes.data);

      if (metricsRes.data) {
        const mMap: Record<string, string> = {};
        metricsRes.data.forEach(m => {
          mMap[m.id] = m.value;
        });
        setMetrics(mMap);
        setQualityInfo(mMap['quality_info'] || 'KOKYBĖS SKYRIAUS INFORMACIJA NĖRA.');
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleSaveProblem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProblem) return;

    try {
      if (editingId) {
        const { error } = await supabase.from('tv_problems').update({
          date_reported: newDate || new Date().toISOString().split('T')[0],
          problem: newProblem,
          solution: newSolution,
          responsible: newResponsible,
          deadline: newDeadline
        }).eq('id', editingId);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('tv_problems').insert({
          date_reported: newDate || new Date().toISOString().split('T')[0],
          problem: newProblem,
          solution: newSolution,
          responsible: newResponsible,
          deadline: newDeadline,
          status: 'OPEN'
        });

        if (error) throw error;
      }
      setEditingId(null);
      setNewProblem('');
      setNewSolution('');
      setNewResponsible('');
      setNewDate('');
      setNewDeadline('');
      fetchData();
    } catch (e: any) {
      console.error('Failed to save problem', e);
      alert('Klaida išsaugant problemą: ' + (e?.message || 'Nežinoma klaida'));
    }
  };

  const handleResetDefectReasons = async () => {
    if (!confirm('Ar tikrai norite nunulinti TV lentos brokų priežasčių rodymą? (Senos priežastys pradings)')) return;
    try {
      await updateMetric('reset_defects_time', new Date().toISOString());
      alert('Brokų priežasčių rodymas nunulintas!');
      fetchData();
    } catch (e) {
      alert('Klaida nunulinant');
    }
  };

  const startEditing = (p: TVProblem) => {
    setEditingId(p.id);
    setNewDate(p.date_reported || '');
    setNewProblem(p.problem || '');
    setNewSolution(p.solution || '');
    setNewResponsible(p.responsible || '');
    setNewDeadline(p.deadline || '');
  };

  const cancelEditing = () => {
    setEditingId(null);
    setNewProblem('');
    setNewSolution('');
    setNewResponsible('');
    setNewDate('');
    setNewDeadline('');
  };

  const handleDeleteProblem = async (id: string) => {
    if (!confirm('Ar tikrai norite ištrinti šį pranešimą?')) return;
    try {
      await supabase.from('tv_problems').delete().eq('id', id);
      fetchData();
    } catch (e) {
      console.error('Failed to delete', e);
    }
  };

  const handleDeleteTransfer = async (id: string) => {
    if (!confirm('Ar tikrai norite ištrinti šį pervežimą?')) return;
    try {
      await supabase.from('tv_transfers').delete().eq('id', id);
      fetchData();
    } catch (e) {
      console.error('Failed to delete transfer', e);
    }
  };

  const handleDeleteProposal = async (id: string) => {
    if (!confirm('Ar tikrai norite ištrinti šį pasiūlymą?')) return;
    try {
      await supabase.from('tv_proposals').delete().eq('id', id);
      fetchData();
    } catch (e) {
      console.error('Failed to delete proposal', e);
    }
  };

  const updateMetric = async (id: string, value: string) => {
    try {
      await supabase.from('tv_metrics').upsert({ id, value, updated_at: new Date().toISOString() });
    } catch (e) {
      console.error(`Failed to update metric ${id}`, e);
      throw e;
    }
  };

  const handleSaveMetrics = async () => {
    try {
      await Promise.all([
        updateMetric('quality_info', qualityInfo)
      ]);
      alert('Rodikliai išsaugoti!');
      fetchData();
    } catch (e) {
      alert('Klaida saugant rodiklius');
    }
  };

  if (loading) return <div className="p-10 text-center text-slate-400">Kraunama...</div>;

  const gedimai = problems.filter(p => p.problem.startsWith('Gedimas: '));
  const shortages = problems.filter(p => p.problem.startsWith('Žaliavų trūkumas: '));
  const otherProblems = problems.filter(p => !p.problem.startsWith('Gedimas: ') && !p.problem.startsWith('Žaliavų trūkumas: '));

  const renderProblemList = (list: TVProblem[], emptyMsg: string) => (
    <div className="flex-1 overflow-y-auto space-y-2 pr-2" style={{ maxHeight: '300px' }}>
      {list.length === 0 ? (
        <div className="text-center text-slate-400 italic py-10">{emptyMsg}</div>
      ) : (
        list.map(p => (
          <div key={p.id} className="flex flex-col md:flex-row gap-3 bg-white border border-slate-100 p-4 rounded-2xl hover:border-slate-300 transition-colors group">
            <div className="w-full md:w-20 text-xs font-bold text-slate-400 shrink-0">{p.date_reported || new Date(p.created_at).toLocaleDateString()}</div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-red-500 text-sm">{p.problem}</div>
              {p.solution && <div className="text-emerald-600 text-xs mt-1 font-medium">{p.solution}</div>}
            </div>
            <div className="w-full md:w-32 text-xs font-bold shrink-0 self-start md:self-center flex flex-col items-end">
              <span className="text-slate-500">{p.responsible}</span>
              {p.deadline && <span className="text-amber-500 mt-1 uppercase">Iki: {p.deadline}</span>}
            </div>

            <div className="shrink-0 flex gap-2 items-center">
              <button
                onClick={() => startEditing(p)}
                className="p-2 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                title="Redaguoti"
              >
                EDIT
              </button>
              <button
                onClick={() => handleDeleteProblem(p.id)}
                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Ištrinti"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-slate-800 uppercase">TV Ekrano Valdymas</h2>
        <Button onClick={fetchData} variant="outline" size="icon" className="rounded-full">
          <RefreshCw className="w-4 h-4 text-slate-500" />
        </Button>
      </div>

      {/* Primary Section: All TV Problems Form and 3 Lists */}
      <div className="bg-white rounded-[32px] shadow-sm border border-slate-200 p-8 flex flex-col w-full">
        <h3 className="text-lg font-black text-slate-800 uppercase border-b border-slate-100 pb-4 mb-4">
          {editingId ? 'Redaguoti Pranešimą' : 'Pridėti arba Valdyti Problemas / Gedimus'}
        </h3>

        <form onSubmit={handleSaveProblem} className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-8 bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <input
            type="text"
            placeholder="Data (pvz. 01-20)"
            value={newDate}
            onChange={e => setNewDate(e.target.value)}
            className="rounded-xl border-slate-200 text-sm font-bold h-10 px-3"
          />
          <input
            type="text"
            placeholder="Gedimas / Žaliava / Problema"
            value={newProblem}
            onChange={e => setNewProblem(e.target.value)}
            className="rounded-xl border-slate-200 text-sm font-bold h-10 px-3 md:col-span-2"
            required
          />
          <input
            type="text"
            placeholder="Sprendimas"
            value={newSolution}
            onChange={e => setNewSolution(e.target.value)}
            className="rounded-xl border-slate-200 text-sm font-bold h-10 px-3"
          />
          <input
            type="text"
            placeholder="Terminas"
            value={newDeadline}
            onChange={e => setNewDeadline(e.target.value)}
            className="rounded-xl border-slate-200 text-sm font-bold h-10 px-3"
          />
          <input
            type="text"
            placeholder="Atsakingas"
            value={newResponsible}
            onChange={e => setNewResponsible(e.target.value)}
            className="rounded-xl border-slate-200 text-sm font-bold h-10 px-3"
          />
          <div className="flex flex-row md:col-start-6 gap-2">
            <Button type="submit" className={`flex-1 h-10 rounded-xl text-white font-bold gap-2 ${editingId ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}>
              {editingId ? <><Save className="w-4 h-4" /> Išsaugoti</> : <><Plus className="w-4 h-4" /> Pridėti</>}
            </Button>
            {editingId && (
              <Button type="button" onClick={cancelEditing} variant="outline" className="flex-1 h-10 rounded-xl hover:bg-slate-100">
                Atšaukti
              </Button>
            )}
          </div>
        </form>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-col">
            <h4 className="font-black text-slate-700 uppercase mb-4 text-sm tracking-widest text-center">Bendros Problemos</h4>
            {renderProblemList(otherProblems, 'Problemų nėra')}
          </div>
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-col">
            <h4 className="font-black text-red-700 uppercase mb-4 text-sm tracking-widest text-center">Gedimai</h4>
            {renderProblemList(gedimai, 'Gedimų nėra')}
          </div>
          <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100 flex flex-col">
            <h4 className="font-black text-amber-700 uppercase mb-4 text-sm tracking-widest text-center">Žaliavų trūkumas</h4>
            {renderProblemList(shortages, 'Trūkumų nėra')}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Metric Controls */}
        <div className="bg-white rounded-[32px] shadow-sm border border-slate-200 p-8 flex flex-col">
          <h3 className="text-lg font-black text-slate-800 uppercase border-b border-slate-100 pb-4 mb-6">Informacija ir Brokų Valdymas</h3>

          <div className="space-y-6 flex-1">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Kokybės Skyriaus Informacija</label>
              <textarea
                value={qualityInfo}
                onChange={(e) => setQualityInfo(e.target.value)}
                className="w-full h-32 rounded-2xl border-slate-200 bg-slate-50 p-4 font-bold text-slate-700 resize-none focus:ring-2 focus:ring-mimaki-blue"
              />
            </div>
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Lentos Brokų Skaitiklis</label>
              <p className="text-xs text-slate-500 mb-2">Visos brokų priežastys ekrane dingsta automatiškai po 24 valandų. Jei reikia jas išvalyti anksčiau, paspauskite mygtuką.</p>
              <Button onClick={handleResetDefectReasons} className="w-full h-12 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 font-bold uppercase text-sm border border-red-200">
                <Trash2 className="w-4 h-4 mr-2" /> Išvalyti Brokų Priežastis Ekrane
              </Button>
            </div>
          </div>

          <Button onClick={handleSaveMetrics} className="w-full h-14 mt-6 rounded-xl bg-slate-900 text-white font-bold uppercase text-sm hover:bg-slate-800 gap-2">
            <Save className="w-5 h-5" /> Išsaugoti Informaciją
          </Button>
        </div>

        {/* Proposals List */}
        <div className="bg-white rounded-[32px] shadow-sm border border-slate-200 p-8 flex flex-col min-h-[400px]">
          <h3 className="text-lg font-black text-slate-800 uppercase border-b border-slate-100 pb-4 mb-4">Pasiūlymai</h3>
          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            {proposals.length === 0 ? (
              <div className="text-center text-slate-400 italic py-10">Pasiūlymų nėra</div>
            ) : (
              proposals.map(p => (
                <div key={p.id} className="flex gap-3 bg-white border border-slate-100 p-4 rounded-2xl group">
                  <div className="flex-1">
                    <div className="text-xs text-slate-400 mb-1">{new Date(p.created_at).toLocaleString()} - <strong>{p.submitted_by}</strong></div>
                    <div className="text-sm font-medium text-slate-700">{p.proposal_text}</div>
                  </div>
                  <button
                    onClick={() => handleDeleteProposal(p.id)}
                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg self-center"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Transfers List */}
        <div className="bg-white rounded-[32px] shadow-sm border border-slate-200 p-8 flex flex-col min-h-[400px]">
          <h3 className="text-lg font-black text-slate-800 uppercase border-b border-slate-100 pb-4 mb-4">Pervežimai</h3>
          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            {transfers.length === 0 ? (
              <div className="text-center text-slate-400 italic py-10">Pervežimų nėra</div>
            ) : (
              transfers.map(t => (
                <div key={t.id} className="flex flex-col gap-3 bg-white border border-slate-100 p-4 rounded-2xl group">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="text-xs text-slate-400 mb-1">{new Date(t.created_at).toLocaleString()} - <strong>{t.scanned_by}</strong></div>
                      <div className="text-sm font-bold text-slate-700">{t.product_info}</div>
                    </div>
                    <button
                      onClick={() => handleDeleteTransfer(t.id)}
                      className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  {t.photo_url && (
                    <div className="w-full mt-2 rounded-xl overflow-hidden border border-slate-200">
                      <a href={t.photo_url} target="_blank" title="Atidaryti pilną nuotrauką" rel="noreferrer">
                        <img src={t.photo_url} alt="Pervežimas" className="w-full h-48 object-cover hover:opacity-90 transition-opacity cursor-pointer" />
                      </a>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
