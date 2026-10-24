'use client';

import { useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';

type Attribute = 'for' | 'des' | 'con' | 'int' | 'sab' | 'car';
const labels: Record<Attribute, string> = { for: 'Força', des: 'Destreza', con: 'Constituição', int: 'Inteligência', sab: 'Sabedoria', car: 'Carisma' };
const keys = Object.keys(labels) as Attribute[];
const costs: Record<number, number> = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };
const initial: Record<Attribute, number> = { for: 8, des: 8, con: 8, int: 8, sab: 8, car: 8 };

export default function CharacterPage() {
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [ancestry, setAncestry] = useState('humano');
  const [className, setClassName] = useState('guerreiro');
  const [background, setBackground] = useState('soldado');
  const [personalHistory, setPersonalHistory] = useState('');
  const [attributes, setAttributes] = useState(initial);
  const spent = useMemo(() => keys.reduce((total, key) => total + costs[attributes[key]], 0), [attributes]);
  const remaining = 27 - spent;
  function adjust(key: Attribute, change: number) {
    setAttributes(prev => {
      const next = prev[key] + change;
      if (next < 8 || next > 15 || spent - costs[prev[key]] + costs[next] > 27) return prev;
      return { ...prev, [key]: next };
    });
  }
  const character = { name, ancestry, class_name: className, background, personal_history: personalHistory, attributes };
  async function saveCharacter() {
    if (!supabase) { setMessage('Supabase nao configurado'); return; }
    const { data } = await supabase.auth.getSession();
    if (!data.session) { window.location.href = '/entrar'; return; }
    setSaving(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/characters`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session.access_token}` }, body: JSON.stringify(character) });
      if (!response.ok) { setMessage('Erro ao salvar ficha. Confira seus dados.'); return; }
      setMessage('Personagem salvo com sucesso!');
    } catch { setMessage('Nao foi possivel conectar a API.'); }
    finally { setSaving(false); }
  }
  return <main className="mx-auto max-w-3xl p-6 md:p-12 space-y-8">
    <header><a href="/" className="text-amber-300 text-sm">← Eldoria</a><h1 className="text-4xl font-bold mt-4">Crie seu personagem</h1><p className="text-stone-400 mt-2">Sua origem moldará o prólogo de sua jornada.</p></header>
    <div className="grid gap-5 sm:grid-cols-2">
      <label className="space-y-2">Nome<input aria-label="Nome" className="w-full rounded bg-slate-800 p-3" maxLength={80} value={name} onChange={e => setName(e.target.value)} /></label>
      {([{ title: 'Ancestralidade', value: ancestry, setter: setAncestry, options: [['humano','Humano'],['elfo','Elfo'],['anao','Anão'],['meio_orc','Meio-orc']] },{ title: 'Classe', value: className, setter: setClassName, options: [['guerreiro','Guerreiro'],['mago','Mago'],['patrulheiro','Patrulheiro'],['ladino','Ladino']] },{ title: 'Antecedente', value: background, setter: setBackground, options: [['soldado','Soldado'],['erudito','Erudito'],['forasteiro','Forasteiro'],['artesao','Artesão'],['criminoso','Criminoso']] }]).map(field => <label key={field.title} className="space-y-2">{field.title}<select className="w-full rounded bg-slate-800 p-3" value={field.value} onChange={e => field.setter(e.target.value)}>{field.options.map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select></label>)}
    </div>
    <section className="space-y-4"><h2 className="text-2xl">Atributos</h2><p className="text-amber-300" aria-live="polite">{remaining} de 27 pontos restantes</p><div className="grid gap-3 sm:grid-cols-2">{keys.map(key => <div key={key} className="flex items-center justify-between rounded bg-slate-800 p-4"><span>{labels[key]}</span><div className="flex items-center gap-4"><button aria-label={`Reduzir ${labels[key]}`} className="text-xl" onClick={() => adjust(key,-1)}>−</button><strong>{attributes[key]}</strong><button aria-label={`Aumentar ${labels[key]}`} className="text-xl" onClick={() => adjust(key,1)}>+</button></div></div>)}</div></section>
    <label className="block space-y-2">História pessoal<textarea className="w-full rounded bg-slate-800 p-3" rows={5} maxLength={3000} value={personalHistory} onChange={e => setPersonalHistory(e.target.value)} placeholder="Quem era você antes desta aventura?" /></label>
    <button disabled={remaining !== 0 || name.trim().length < 2 || saving} onClick={() => void saveCharacter()} className="rounded bg-amber-500 px-6 py-3 font-bold text-slate-950 disabled:opacity-40">Salvar personagem</button><p role="status">{message}</p>
    <button disabled={remaining !== 0 || name.trim().length < 2} onClick={() => { const blob = new Blob([JSON.stringify(character, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'eldoria-personagem.json'; a.click(); URL.revokeObjectURL(url); }} className="rounded bg-amber-500 px-6 py-3 font-bold text-slate-950 disabled:opacity-40">Exportar ficha (prévia)</button>
    <p className="text-sm text-stone-400">Entre na sua conta para salvar a ficha no Supabase.</p>
  </main>;
}
