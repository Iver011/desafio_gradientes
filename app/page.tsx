'use client'
import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, BarChart, Bar, CartesianGrid } from 'recharts'
import { useStore } from '@/lib/store'
import { solve, validate, type Prec } from '@/lib/linalg'
import { SC, NAMES, N, type Key } from '@/lib/scenarios'
import { runQA } from '@/lib/qa'

const f = (v: number) => (!Number.isFinite(v) ? '—' : v !== 0 && (Math.abs(v) < 1e-3 || Math.abs(v) >= 1e5) ? v.toExponential(3) : v.toFixed(4))
const C = ['#38bdf8', '#fb923c', '#34d399', '#a78bfa', '#f472b6']
const tip = { contentStyle: { background: '#0b1220', border: '1px solid #26324d', borderRadius: 12 } }
function Card({ id, n, title, children }: { id: string; n: number; title: string; children: React.ReactNode }) {
  return <motion.section id={id} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: .5 }}
    className="my-5 rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-xl backdrop-blur">
    <h2 className="mb-4 text-xl font-semibold"><span className="mr-2 rounded-lg bg-sky-500/20 px-2 py-0.5 text-sky-300">{n}</span>{title}</h2>{children}</motion.section> }
const Table = ({ h, rows }: { h: string[]; rows: React.ReactNode[][] }) => <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr>{h.map(x => <th key={x} className="px-2 py-2 text-left font-medium text-slate-400">{x}</th>)}</tr></thead>
  <tbody>{rows.map((r, i) => <tr key={i} className="border-t border-white/10">{r.map((c, j) => <td key={j} className="px-2 py-2 align-top">{c}</td>)}</tr>)}</tbody></table></div>
const Kpi = ({ t, v, s, c }: { t: string; v: string; s?: string; c?: string }) => <div className="rounded-2xl bg-black/30 p-4"><div className="text-xs uppercase tracking-wide text-slate-400">{t}</div><div className="text-3xl font-bold" style={{ color: c }}>{v}</div><div className="text-xs text-slate-400">{s}</div></div>

export default function Page() {
  const st = useStore(), { A, b, x0, tol, nmax, prec, scen } = st
  const s = useMemo(() => solve({ A, b, x0, tol, nmax, prec }), [A, b, x0, tol, nmax, prec])
  const all = useMemo(() => (Object.keys(SC) as Key[]).map(k => ({ k, s: solve({ A: SC[k].A, b: SC[k].b, x0: Array(N).fill(0), tol, nmax, prec }) })), [tol, nmax, prec])
  const qa = useMemo(() => runQA(), [])
  const [k, setK] = useState(0), [play, setPlay] = useState(false)
  const maxK = s.ok ? s.gcp.it : 0
  useEffect(() => { if (!play) return; const t = setInterval(() => setK(x => { if (x >= maxK) { setPlay(false); return x } return x + 1 }), 700); return () => clearInterval(t) }, [play, maxK])
  const kk = Math.min(k, maxK), mx = Math.max(...A.flat().filter(Number.isFinite).map(Math.abs), 1e-12)
  const asym = (i: number, j: number) => Number.isFinite(A[i][j]) && Number.isFinite(A[j][i]) && Math.abs(A[i][j] - A[j][i]) > 1e-9 * mx
  const conv = s.ok ? Array.from({ length: Math.max(s.gc.hist.length, s.gcp.hist.length) }, (_, i) => ({ k: i, GC: Math.max(s.gc.hist[i] ?? NaN, 1e-17), GCP: Math.max(s.gcp.hist[i] ?? NaN, 1e-17) })) : []
  const spc = s.ok ? s.eA.map((v, i) => ({ n: `λ${i + 1}`, 'A': v, 'M⁻¹A': s.eM[i] })) : []
  const wts = NAMES.map((n, i) => ({ n, ...Object.fromEntries(all.map(a => [SC[a.k].n, a.s.ok ? a.s.xr[i] : 0])) }))
  const iter = s.ok ? NAMES.map((n, i) => ({ n, 'x_k': s.gcp.xs[kk][i], 'x_ref': s.xr[i] })) : []
  const vs = (Object.keys(SC) as Key[]).map(k => ({ k, v: validate(SC[k].A) }))
  return <main className="mx-auto max-w-6xl px-4 pb-24">
    <nav className="sticky top-0 z-10 -mx-4 flex gap-1 overflow-x-auto bg-[#070b14]/80 px-4 py-3 text-sm backdrop-blur">
      {['inicio', 'caso', 'formulacion', 'entrada', 'gcp', 'errores', 'qa', 'concl'].map(a => <a key={a} href={`#${a}`} className="rounded-full px-3 py-1 text-slate-300 hover:bg-white/10">{a}</a>)}</nav>
    <motion.header id="inicio" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="py-14">
      <p className="text-sky-300">Métodos Numéricos · Gradientes Conjugados Precondicionados</p>
      <h1 className="mt-2 bg-gradient-to-r from-sky-300 via-emerald-300 to-violet-300 bg-clip-text text-5xl font-extrabold text-transparent">Simulador de portafolio media-varianza</h1>
      <p className="mt-4 max-w-2xl text-slate-300">Se asigna capital entre 5 activos resolviendo <b>Ax = b</b> con GCP (Suñagua, 2020), contrastado con GC simple y con Cholesky como solución de referencia.</p>
      <p className="mt-3 text-sm text-slate-400">Estudiante: <span contentEditable suppressContentEditableWarning className="border-b border-dashed border-sky-400">[Tu nombre]</span> · Mención: <span contentEditable suppressContentEditableWarning className="border-b border-dashed border-sky-400">[Tu mención]</span></p></motion.header>
    <Card id="caso" n={2} title="Caso de estudio"><p className="text-slate-300">El inversionista maximiza U(x) = μᵀx − (γ/2)xᵀΣx. El gradiente nulo da <b>(Σ + εI)x = μ/γ</b>, con γ = 3. El término εI (Tikhonov) asegura A definida positiva y modela incertidumbre en Σ. Datos ilustrativos: reemplaza por series reales (Yahoo Finance, Bloomberg, banco central) y cita la fuente.</p></Card>
    <Card id="formulacion" n={3} title="Formulación y demostración SPD">
      <p className="mb-3 text-slate-300">xᵢ = fracción de capital en: {NAMES.map((n, i) => `x${i + 1} ${n}`).join(' · ')}. aᵢᵢ = σᵢ² + ε; aᵢⱼ = ρᵢⱼσᵢσⱼ; bᵢ = μᵢ/γ.</p>
      <Table h={['Escenario', '‖A−Aᵀ‖', 'Δ₁…Δ₅ (Sylvester)', 'λmín', '¿SPD?']} rows={vs.map(({ k, v }) => [SC[k].n, v.as.toExponential(1), v.minors.map(m => m.toExponential(1)).join(' · '), v.eigs ? v.eigs[0].toExponential(2) : '—', v.ok ? '✔' : '✘'])} /></Card>
    <Card id="entrada" n={4} title="Entrada de datos y escenarios">
      <div className="mb-3 flex flex-wrap gap-2">{(Object.keys(SC) as Key[]).map(key => <button key={key} onClick={() => { st.load(key); setK(0) }} className={`rounded-xl px-4 py-2 transition ${scen === key ? 'bg-sky-500 text-white' : 'bg-white/10 hover:bg-white/20'}`}>{SC[key].n}</button>)}</div>
      <p className="mb-3 text-sm text-slate-400">{SC[scen].d}</p>
      <div className="overflow-x-auto"><table className="text-xs"><thead><tr><th />{NAMES.map((_, j) => <th key={j} className="px-1 text-slate-400">x{j + 1}</th>)}<th className="text-slate-400">b</th></tr></thead><tbody>
        {A.map((r, i) => <tr key={i}><th className="pr-2 text-left font-normal text-slate-400">{NAMES[i]}</th>{r.map((v, j) => <td key={j} className="p-0.5"><input type="number" step="any" value={Number.isNaN(v) ? '' : v} onChange={e => st.setA(i, j, e.target.valueAsNumber)}
          style={{ background: `rgba(56,189,248,${Number.isFinite(v) ? Math.abs(v) / mx * .45 : 0})` }} className={`w-24 rounded-lg border px-2 py-1 text-right ${asym(i, j) ? 'border-red-500 ring-1 ring-red-500' : 'border-white/10'}`} /></td>)}
          <td className="p-0.5"><input type="number" step="any" value={Number.isNaN(b[i]) ? '' : b[i]} onChange={e => st.setB(i, e.target.valueAsNumber)} className="w-24 rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-right" /></td></tr>)}</tbody></table></div>
      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
        <label>x₀ <input defaultValue="0,0,0,0,0" onChange={e => { const x = e.target.value.split(',').map(Number); if (x.length === N && x.every(Number.isFinite)) st.set({ x0: x }) }} className="w-36 rounded-lg border border-white/10 bg-black/30 px-2 py-1" /></label>
        <label>Tol <select value={tol} onChange={e => st.set({ tol: +e.target.value })} className="rounded-lg border border-white/10 bg-black/60 px-2 py-1"><option value={1e-4}>1e-4</option><option value={1e-6}>1e-6</option><option value={1e-8}>1e-8</option></select></label>
        <label>N máx <input type="number" value={nmax} onChange={e => st.set({ nmax: +e.target.value || 200 })} className="w-20 rounded-lg border border-white/10 bg-black/30 px-2 py-1" /></label>
        <label>Precondicionador <select value={prec} onChange={e => st.set({ prec: e.target.value as Prec })} className="rounded-lg border border-white/10 bg-black/60 px-2 py-1"><option value="jacobi">Jacobi</option><option value="ic0">IC(0)</option><option value="ssor">SSOR</option></select></label></div>
      {!s.ok && <div role="alert" className="mt-4 rounded-xl border border-red-500 bg-red-500/10 p-3 text-red-300">⚠ Matriz no válida: {s.errs.join(' ')}</div>}
      <h3 className="mb-2 mt-6 font-semibold">Pesos óptimos por escenario</h3>
      <div className="h-72"><ResponsiveContainer><BarChart data={wts}><CartesianGrid stroke="#ffffff15" /><XAxis dataKey="n" tick={{ fill: '#94a3b8', fontSize: 11 }} /><YAxis tick={{ fill: '#94a3b8' }} /><Tooltip {...tip} /><Legend />
        {(Object.keys(SC) as Key[]).map((q, i) => <Bar key={q} dataKey={SC[q].n} fill={C[i]} radius={[6, 6, 0, 0]} />)}</BarChart></ResponsiveContainer></div></Card>
    {s.ok && <>
      <Card id="gcp" n={7} title="Referencia (Cholesky) · GCP vs GC">
        <div className="grid gap-3 sm:grid-cols-4"><Kpi t="Iter. GC" v={`${s.gc.it}`} c="#fb923c" s={s.gc.conv ? 'convergió' : 'NO convergió'} /><Kpi t={`Iter. GCP (${prec})`} v={`${s.gcp.it}`} c="#38bdf8" s={s.gcp.conv ? 'convergió' : 'NO convergió'} />
          <Kpi t="κ(A)" v={s.kA.toExponential(1)} s="original" /><Kpi t="κ(M⁻¹A)" v={s.kM.toExponential(1)} s={`ganancia ×${(s.kA / s.kM).toFixed(1)}`} c="#34d399" /></div>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="h-72"><ResponsiveContainer><LineChart data={conv}><CartesianGrid stroke="#ffffff15" /><XAxis dataKey="k" tick={{ fill: '#94a3b8' }} /><YAxis scale="log" domain={[1e-17, 10]} allowDataOverflow tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={v => v.toExponential(0)} />
            <Tooltip 
  formatter={(value: any) => {
    // Si el valor no existe o no es un número, devolvemos un texto vacío o por defecto
    if (value === undefined || typeof value !== 'number') return '';
    
    // Aquí ya es seguro usarlo como números
    return `$${value.toFixed(2)}`; 
  }} 
/><Legend />
            <Line dataKey="GC" stroke="#fb923c" strokeWidth={2.5} dot isAnimationActive /><Line dataKey="GCP" stroke="#38bdf8" strokeWidth={2.5} dot isAnimationActive /></LineChart></ResponsiveContainer></div>
          <div className="h-72"><ResponsiveContainer><BarChart data={spc}><CartesianGrid stroke="#ffffff15" /><XAxis dataKey="n" tick={{ fill: '#94a3b8' }} /><YAxis scale="log" domain={['auto', 'auto']} tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={v => v.toExponential(0)} />
            <Tooltip 
  formatter={(value: any) => {
    // Si el valor no existe o no es un número, devolvemos un texto vacío o por defecto
    if (value === undefined || typeof value !== 'number') return '';
    
    // Aquí ya es seguro usarlo como número
    return `$${value.toFixed(2)}`; 
  }} 
/><Legend />
            <Bar dataKey="A" fill="#fb923c" radius={[6, 6, 0, 0]} /><Bar dataKey="M⁻¹A" fill="#38bdf8" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div></div>
        <h3 className="mb-2 mt-6 font-semibold">Simulación paso a paso del GCP</h3>
        <div className="flex flex-wrap items-center gap-3"><button onClick={() => { if (kk >= maxK) setK(0); setPlay(p => !p) }} className="rounded-xl bg-sky-500 px-4 py-2">{play ? '⏸ Pausa' : '▶ Reproducir'}</button>
          <input type="range" min={0} max={maxK} value={kk} onChange={e => { setPlay(false); setK(+e.target.value) }} className="flex-1" /><span className="text-sm text-slate-300">k = {kk} · residuo {s.gcp.hist[kk].toExponential(2)}</span></div>
        <div className="h-64"><ResponsiveContainer><BarChart data={iter}><CartesianGrid stroke="#ffffff15" /><XAxis dataKey="n" tick={{ fill: '#94a3b8', fontSize: 11 }} /><YAxis tick={{ fill: '#94a3b8' }} /><Tooltip {...tip} /><Legend />
          <Bar dataKey="x_k" fill="#38bdf8" radius={[6, 6, 0, 0]} /><Bar dataKey="x_ref" fill="#34d399" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div></Card>
      <Card id="errores" n={8} title="Análisis de errores y tabla comparativa">
        <Table h={['Activo', 'x_ref', 'x_GCP', 'x_GC', 'Ea', 'Er', 'Ep %']} rows={NAMES.map((n, i) => [n, f(s.xr[i]), f(s.gcp.x[i]), f(s.gc.x[i]), s.Ea[i].toExponential(2), s.Er[i] === null ? 'no definido' : s.Er[i]!.toExponential(2), s.Er[i] === null ? '—' : (s.Er[i]! * 100).toExponential(2)])} />
        <p className="mt-2 text-sm text-slate-300">Residuo relativo global: <b>{s.res.toExponential(3)}</b></p>
        <div className="mt-6"><Table h={['Indicador', 'Ideal', 'Bajo estrés', 'Mal condicionado']} rows={[
          ['x_ref', ...all.map(a => a.s.ok ? '[' + a.s.xr.map(f).join(', ') + ']' : '—')], ['x_GCP', ...all.map(a => a.s.ok ? '[' + a.s.gcp.x.map(f).join(', ') + ']' : '—')],
          ['Ea', ...all.map(a => a.s.ok ? '[' + a.s.Ea.map(v => v.toExponential(1)).join(', ') + ']' : '—')], ['Ep %', ...all.map(a => a.s.ok ? '[' + a.s.Er.map(v => v === null ? 'n/d' : (v * 100).toExponential(1)).join(', ') + ']' : '—')],
          ['Iter. GC', ...all.map(a => a.s.ok ? a.s.gc.it : '—')], ['Iter. GCP', ...all.map(a => a.s.ok ? a.s.gcp.it : '—')], ['κ(A)', ...all.map(a => a.s.ok ? a.s.kA.toExponential(2) : '—')], ['κ(M⁻¹A)', ...all.map(a => a.s.ok ? a.s.kM.toExponential(2) : '—')],
          ['Residuo GCP', ...all.map(a => a.s.ok ? a.s.res.toExponential(2) : '—')], ['¿Convergió?', ...all.map(a => a.s.ok ? (a.s.gcp.conv ? 'Sí' : 'No') : '—')], ['Interpretación', ...all.map(a => SC[a.k].t)]]} /></div></Card></>}
    <Card id="qa" n={9} title="Módulo QA"><Table h={['Prueba', 'Entrada', 'Esperado', 'Obtenido', 'Conclusión']} rows={qa.map(r => r.map((c, i) => i === 4 ? <b className={c.startsWith('✔') ? 'text-emerald-400' : 'text-red-400'}>{c}</b> : c))} /></Card>
    <Card id="concl" n={10} title="Conclusiones y referencias">
      {all.every(a => a.s.ok) && <p className="text-slate-300">Con {prec}: el GCP usó {all.map(a => a.s.ok && a.s.gcp.it).join(', ')} iteraciones (ideal, estrés, mal cond.) frente a {all.map(a => a.s.ok && a.s.gc.it).join(', ')} del GC. El estrés desplaza el equilibrio con deterioro moderado de κ; el escenario mal condicionado ataca la estructura de A y ahí el precondicionador aporta más. Con n = 5 el GC converge en teoría en ≤ 5 pasos, por lo que la ventaja se ve más en la precisión y en κ(M⁻¹A).</p>}
      <p className="mt-3 text-sm text-slate-400">Suñagua, P. (2020). Método de Gradientes Conjugados Precondicionado (completa revista y DOI). Markowitz, H. (1952). Portfolio Selection. J. of Finance 7(1). Saad, Y. (2003). Iterative Methods for Sparse Linear Systems. SIAM. Ledoit, O. y Wolf, M. (2004). J. Portfolio Management.</p></Card>
  </main> }
