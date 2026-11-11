import { solve, type Prec } from './linalg'
import { SC, N } from './scenarios'
export function runQA() { const base = { tol: 1e-6, nmax: 200, x0: Array(N).fill(0) }, rows: string[][] = []
  const add = (n: string, i: string, e: string, f: () => [boolean, string]) => { let ok = false, o = ''; try { [ok, o] = f() } catch (x) { o = 'Excepción: ' + (x as Error).message } rows.push([n, i, e, o, ok ? '✔ Aprobada' : '✘ Fallida']) }
  const S = (k: keyof typeof SC, p: Prec = 'jacobi', A = SC[k].A) => solve({ ...base, A, b: SC[k].b, prec: p })
  add('1. Carga de escenarios', 'Ideal, Estrés, Mal cond.', 'Los 3 convergen con residuo < 1e-6', () => { const r = (Object.keys(SC) as (keyof typeof SC)[]).map(k => S(k)); return [r.every(s => s.ok && s.gcp.conv && s.res < 1e-6), r.map(s => (s.ok ? `${s.gcp.it} it` : 'inválido')).join(' | ')] })
  add('2a. Matriz no simétrica', 'A[1][2] += 0,01', 'Error capturado sin colapso', () => { const A = SC.ideal.A.map(r => [...r]); A[0][1] += .01; const s = S('ideal', 'jacobi', A); return [!s.ok, s.ok ? '' : s.errs.join(' ')] })
  add('2b. No definida positiva', 'A[3][3] = −0,05', 'Error capturado sin colapso', () => { const A = SC.ideal.A.map(r => [...r]); A[2][2] = -.05; const s = S('ideal', 'jacobi', A); return [!s.ok, s.ok ? '' : s.errs.join(' ')] })
  add('3. Edición dinámica', 'a11 ×1,5 en Ideal', 'Cambia x_ref y el GCP lo sigue', () => { const a = S('ideal'), A = SC.ideal.A.map(r => [...r]); A[0][0] *= 1.5; const s = S('ideal', 'jacobi', A)
    if (!a.ok || !s.ok) return [false, 'inválido']; const d = Math.max(...s.xr.map((v, i) => Math.abs(v - a.xr[i]))); return [d > 1e-9 && s.res < 1e-6, `Δx_ref = ${d.toExponential(2)}, residuo ${s.res.toExponential(1)}`] })
  add('4. Precondicionamiento', 'Mal cond.: Jacobi/IC(0)/SSOR', 'Mejor GCP ≤ iteraciones GC', () => { const r = (['jacobi', 'ic0', 'ssor'] as Prec[]).map(p => S('ill', p)); if (r.some(s => !s.ok)) return [false, 'inválido']
    const g = r.map(s => (s.ok ? s.gcp.it : 0)), gc = r[0].ok ? r[0].gc.it : 0; return [Math.min(...g) <= gc, `GC ${gc} | Jacobi ${g[0]}, IC(0) ${g[1]}, SSOR ${g[2]}`] })
  return rows }
