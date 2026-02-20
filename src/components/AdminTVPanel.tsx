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
}

export function AdminTVPanel() {
  const [problems, setProblems] = useState<TVProblem[]>([]);
  const [metrics, setMetrics] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  // Form states for new problem
  const [newDate, setNewDate] = useState('');
  const [newProblem, setNewProblem] = useState('');
  const [newSolution, setNewSolution] = useState('');
  const [newResponsible, setNewResponsible] = useState('');

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
      const [probsRes, metricsRes] = await Promise.all([
        supabase.from('tv_problems').select('*').order('created_at', { ascending: false }),
        supabase.from('tv_metrics').select('*')
      ]);

      if (probsRes.data) setProblems(probsRes.data);

      if (metricsRes.data) {
        const mMap: Record<string, string> = {};
        metricsRes.data.forEach(m => {
          mMap[m.id] = m.value;
        });
        setMetrics(mMap);
        setDefectsCount(mMap['defects_count'] || '0');
        setBreakdownsCount(mMap['breakdowns_count'] || '0');
        setQualityInfo(mMap['quality_info'] || 'KOKYBĖS SKYRIAUS INFORMACIJA NĖRA.');
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleAddProblem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProblem) return;

    try {
      await supabase.from('tv_problems').insert({
        date_reported: newDate || new Date().toISOString().split('T')[0],
        problem: newProblem,
        solution: newSolution,
        responsible: newResponsible,
        status: 'OPEN'
      });
      // reset
      setNewProblem('');
      setNewSolution('');
      setNewResponsible('');
      setNewDate('');
      
      fetchData();
    } catch (e) {
      console.error('Failed to add problem', e);
      alert('Klaida pridedant problemą');
    }
  };

  const handleDeleteProblem = async (id: string) => {
    if (!confirm('Ar tikrai norite ištrinti šią problemą?')) return;
    try {
      await supabase.from('tv_problems').delete().eq('id', id);
      fetchData();
    } catch (e) {
      console.error('Failed to delete problem', e);
    }
  };

  const updateMetric = async (id: string, value: string) => {
    try {
      // Upsert
      await supabase.from('tv_metrics').upsert({ id, value, updated_at: new Date().toISOString() });
    } catch (e) {
      console.error(`Failed to update metric ${id}`, e);
      throw e;
    }
  };

  const handleSaveMetrics = async () => {
    try {
      await Promise.all([
        updateMetric('defects_count', defectsCount),
        updateMetric('breakdowns_count', breakdownsCount),
        updateMetric('quality_info', qualityInfo)
      ]);
      alert('Rodikliai išsaugoti!');
      fetchData();
    } catch (e) {
      alert('Klaida saugant rodiklius');
    }
  };

  if (loading) return <div className="p-10 text-center text-slate-400">Kraunama...</div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-slate-800 uppercase">TV Ekrano Valdymas</h2>
        <Button onClick={fetchData} variant="outline" size="icon" className="rounded-full">
          <RefreshCw className="w-4 h-4 text-slate-500" />
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Metric Controls */}
        <div className="bg-white rounded-[32px] shadow-sm border border-slate-200 p-8 space-y-6 flex flex-col">
          <h3 className="text-lg font-black text-slate-800 uppercase border-b border-slate-100 pb-4">Rodikliai ir Informacija</h3>
          
          <div className="space-y-4 flex-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Brokų Skaičius</label>
                <input 
                  type="number" 
                  value={defectsCount} 
                  onChange={(e) => setDefectsCount(e.target.value)}
                  className="w-full h-14 rounded-2xl border-slate-200 bg-slate-50 px-4 font-bold text-amber-600 text-xl focus:ring-2 focus:ring-mimaki-blue"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Gedimų Skaičius</label>
                <input 
                  type="number" 
                  value={breakdownsCount} 
                  onChange={(e) => setBreakdownsCount(e.target.value)}
                  className="w-full h-14 rounded-2xl border-slate-200 bg-slate-50 px-4 font-bold text-red-600 text-xl focus:ring-2 focus:ring-mimaki-blue"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Kokybės Skyriaus Informacija</label>
              <textarea 
                value={qualityInfo} 
                onChange={(e) => setQualityInfo(e.target.value)}
                className="w-full h-32 rounded-2xl border-slate-200 bg-slate-50 p-4 font-bold text-slate-700 resize-none focus:ring-2 focus:ring-mimaki-blue"
              />
            </div>
          </div>

          <Button onClick={handleSaveMetrics} className="w-full h-14 rounded-xl bg-slate-900 text-white font-bold uppercase text-sm hover:bg-slate-800 gap-2">
            <Save className="w-5 h-5" /> Išsaugoti Rodiklius
          </Button>
        </div>

        {/* Problems List */}
        <div className="bg-white rounded-[32px] shadow-sm border border-slate-200 p-8 flex flex-col h-full">
          <h3 className="text-lg font-black text-slate-800 uppercase border-b border-slate-100 pb-4 mb-4">Problemos</h3>
          
          {/* New Problem Form */}
          <form onSubmit={handleAddProblem} className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <input 
              type="text" 
              placeholder="Data (Pvz. 01-20)" 
              value={newDate} 
              onChange={e => setNewDate(e.target.value)} 
              className="rounded-xl border-slate-200 text-sm font-bold h-10 px-3"
            />
            <input 
              type="text" 
              placeholder="Problema" 
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
              className="rounded-xl border-slate-200 text-sm font-bold h-10 px-3 md:col-span-2"
            />
            <input 
              type="text" 
              placeholder="Atsakingas" 
              value={newResponsible} 
              onChange={e => setNewResponsible(e.target.value)} 
              className="rounded-xl border-slate-200 text-sm font-bold h-10 px-3"
            />
            <Button type="submit" className="h-10 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold">
              <Plus className="w-4 h-4" />
            </Button>
          </form>

          {/* List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            {problems.length === 0 ? (
              <div className="text-center text-slate-400 italic py-10">Problemų nėra</div>
            ) : (
              problems.map(p => (
                <div key={p.id} className="flex flex-col md:flex-row gap-3 bg-white border border-slate-100 p-4 rounded-2xl hover:border-slate-300 transition-colors group">
                  <div className="w-full md:w-20 text-xs font-bold text-slate-400 shrink-0">{p.date_reported || new Date(p.created_at).toLocaleDateString()}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-red-500 text-sm">{p.problem}</div>
                    {p.solution && <div className="text-emerald-600 text-xs mt-1 font-medium">{p.solution}</div>}
                  </div>
                  <div className="w-full md:w-32 text-xs font-bold text-slate-500 text-right shrink-0 self-start md:self-center">{p.responsible}</div>
                  
                  <div className="shrink-0 flex items-center">
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
        </div>

      </div>
    </div>
  );
}
