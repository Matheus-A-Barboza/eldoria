'use client';
import { FormEvent, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>, signUp: boolean) {
    event.preventDefault();
    if (!supabase) { setMessage('Supabase ainda nao configurado.'); return; }
    setLoading(true);
    const { error } = signUp ? await supabase.auth.signUp({ email, password }) : await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { setMessage(error.message); return; }
    if (signUp) setMessage('Cadastro recebido. Confirme seu email, caso solicitado.');
    else window.location.href = '/personagem';
  }
  return <main className="mx-auto max-w-md space-y-6 p-8"><a href="/" className="text-amber-300">← Eldoria</a><h1 className="text-3xl font-bold">Acesse Eldoria</h1><form className="space-y-4"><label className="block">Email<input className="mt-2 w-full rounded bg-slate-800 p-3" type="email" required value={email} onChange={e => setEmail(e.target.value)}/></label><label className="block">Senha<input className="mt-2 w-full rounded bg-slate-800 p-3" type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)}/></label><div className="flex gap-3"><button disabled={loading} formAction="javascript:void(0)" onClick={e => {e.preventDefault(); void submit(e as unknown as FormEvent<HTMLFormElement>, false)}} className="rounded bg-amber-500 px-4 py-3 text-slate-950">Entrar</button><button disabled={loading} onClick={e => {e.preventDefault(); void submit(e as unknown as FormEvent<HTMLFormElement>, true)}} className="rounded border border-amber-500 px-4 py-3">Criar conta</button></div></form><p role="status">{message}</p></main>;
}
