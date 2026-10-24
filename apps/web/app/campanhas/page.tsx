'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

type Character = { id: string; name: string; ancestry: string; class_name: string };
type Campaign = { id: string; character_id: string; world_state: { prologue: string; location: string; mode: string } };
const api = process.env.NEXT_PUBLIC_API_URL;

export default function CampaignsPage() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState('');
  const [actions, setActions] = useState<Record<string, string>>({});
  const [events, setEvents] = useState<Record<string, { id: number; payload: { action: string; narration: string } }[]>>({});
  async function authToken() {
    if (!supabase) throw new Error('Supabase não configurado');
    const { data } = await supabase.auth.getSession();
    if (!data.session) { window.location.href = '/entrar'; throw new Error('Entre na sua conta'); }
    return data.session.access_token;
  }
  async function load() {
    try {
      const token = await authToken();
      const h = { Authorization: `Bearer ${token}` };
      const [c, a] = await Promise.all([fetch(`${api}/v1/characters`, { headers: h }), fetch(`${api}/v1/campaigns`, { headers: h })]);
      if (!c.ok || !a.ok) throw new Error('Falha ao consultar seus dados');
      setCharacters(await c.json()); const saved: Campaign[] = await a.json(); setCampaigns(saved);
      const histories = await Promise.all(saved.map(async campaign => { const r = await fetch(`${api}/v1/campaigns/${campaign.id}/events`, { headers: h }); return [campaign.id, r.ok ? await r.json() : []] as const; }));
      setEvents(Object.fromEntries(histories));
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Erro inesperado'); }
  }
  useEffect(() => { void load(); }, []);
  async function start() {
    if (!selected) return;
    setLoading(true); setMessage('');
    try {
      const token = await authToken();
      const r = await fetch(`${api}/v1/campaigns`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ character_id: selected }) });
      if (!r.ok) throw new Error('Não foi possível iniciar a campanha');
      await load();
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Erro inesperado'); }
    finally { setLoading(false); }
  }
  async function sendTurn(id: string) {
    const action = (actions[id] || '').trim();
    if (action.length < 2 || loading) return;
    setLoading(true); setMessage('');
    try {
      const token = await authToken();
      const response = await fetch(`${api}/v1/campaigns/${id}/turns`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) });
      if (!response.ok) throw new Error('Não foi possível registrar a ação. Atualize e tente novamente.');
      setActions(previous => ({ ...previous, [id]: '' }));
      await load();
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Erro inesperado'); }
    finally { setLoading(false); }
  }
  return <main className="mx-auto max-w-3xl space-y-8 p-6 md:p-12">
    <a href="/" className="text-amber-300">← Eldoria</a>
    <header className="space-y-2"><h1 className="text-4xl font-bold">Suas campanhas</h1><p className="text-stone-400">Toda jornada começa com uma escolha.</p></header>
    <section className="space-y-4 rounded-xl border border-slate-700 p-5"><h2 className="text-xl font-semibold">Iniciar aventura solo</h2>
      <select aria-label="Personagem" className="w-full rounded bg-slate-800 p-3" value={selected} onChange={e => setSelected(e.target.value)}><option value="">Selecione um personagem</option>{characters.map(c => <option key={c.id} value={c.id}>{c.name} — {c.class_name}</option>)}</select>
      <button disabled={!selected || loading} onClick={() => void start()} className="rounded bg-amber-500 px-5 py-3 font-semibold text-slate-950 disabled:opacity-40">Iniciar campanha</button>
      <a className="ml-4 text-amber-300 underline" href="/personagem">Criar personagem</a></section>
    <p role="status" className="text-amber-300">{message}</p>
    <section className="space-y-6"><h2 className="text-2xl font-semibold">Jornadas iniciadas</h2>{campaigns.length === 0 && <p className="text-stone-400">Nenhuma campanha iniciada.</p>}{campaigns.map(c => <article key={c.id} className="space-y-4 rounded-xl border border-amber-800/50 bg-slate-900 p-6"><h3 className="text-xl text-amber-200">{characters.find(x => x.id === c.character_id)?.name || 'Aventureiro'} — Valebruma</h3><p className="whitespace-pre-wrap leading-8 text-stone-200">{c.world_state.prologue}</p><div className="space-y-4">{(events[c.id] || []).map(event => <div key={event.id} className="space-y-2 border-l-2 border-amber-700 pl-4"><p className="text-amber-300">Você: {event.payload.action}</p><p className="whitespace-pre-wrap text-stone-200">{event.payload.narration}</p></div>)}</div><label className="block space-y-2"><span className="text-sm text-stone-300">O que você faz?</span><textarea maxLength={1500} rows={3} className="w-full rounded bg-slate-800 p-3" value={actions[c.id] || ''} onChange={e => setActions(prev => ({ ...prev, [c.id]: e.target.value }))} placeholder="Descreva livremente sua próxima ação..." /></label><button disabled={loading || (actions[c.id] || '').trim().length < 2} onClick={() => void sendTurn(c.id)} className="rounded bg-amber-500 px-5 py-3 font-bold text-slate-950 disabled:opacity-40">Enviar ação</button><p className="text-sm text-stone-400">Narrador provisório; Mestre IA será integrado na próxima fase.</p></article>)}</section>
  </main>;
}
