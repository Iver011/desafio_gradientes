export type Mat = number[][]; export type Vec = number[]; export type Prec = 'jacobi' | 'ic0' | 'ssor'
export const dot = (a: Vec, b: Vec) => a.reduce((s, v, i) => s + v * b[i], 0)
export const norm = (a: Vec) => Math.sqrt(dot(a, a))
export const mv = (A: Mat, x: Vec) => A.map(r => dot(r, x))
const clone = (A: Mat) => A.map(r => r.slice())
export function chol(A: Mat): Mat | null { const n = A.length, L = A.map(() => Array(n).fill(0))
  for (let i = 0; i < n; i++) for (let j = 0; j <= i; j++) { let s = A[i][j]; for (let k = 0; k < j; k++) s -= L[i][k] * L[j][k]
    if (i === j) { if (!(s > 1e-12 * Math.abs(A[i][i]))) return null; L[i][i] = Math.sqrt(s) } else L[i][j] = s / L[j][j] }
  return L }
const fwd = (L: Mat, b: Vec) => { const y: Vec = []; for (let i = 0; i < b.length; i++) { let s = b[i]; for (let k = 0; k < i; k++) s -= L[i][k] * y[k]; y[i] = s / L[i][i] } return y }
export function cholSolve(L: Mat, b: Vec) { const n = b.length, y = fwd(L, b), x: Vec = Array(n).fill(0)
  for (let i = n - 1; i >= 0; i--) { let s = y[i]; for (let k = i + 1; k < n; k++) s -= L[k][i] * x[k]; x[i] = s / L[i][i] } return x }
export function eig(A: Mat): Vec { const n = A.length, a = clone(A), f2 = A.flat().reduce((s, v) => s + v * v, 0)
  for (let sw = 0; sw < 100; sw++) { let off = 0; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) off += a[i][j] ** 2; if (off <= 1e-28 * f2) break
    for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) { if (a[p][q] === 0) continue
      const th = (a[q][q] - a[p][p]) / (2 * a[p][q]), t = (th >= 0 ? 1 : -1) / (Math.abs(th) + Math.sqrt(th * th + 1)), c = 1 / Math.sqrt(t * t + 1), s = t * c
      for (let k = 0; k < n; k++) { const u = a[k][p], v = a[k][q]; a[k][p] = c * u - s * v; a[k][q] = s * u + c * v }
      for (let k = 0; k < n; k++) { const u = a[p][k], v = a[q][k]; a[p][k] = c * u - s * v; a[q][k] = s * u + c * v } } }
  return a.map((r, i) => r[i]).sort((x, y) => x - y) }
function det(M: Mat) { const a = clone(M), n = a.length; let d = 1
  for (let c = 0; c < n; c++) { let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(a[r][c]) > Math.abs(a[p][c])) p = r
    if (a[p][c] === 0) return 0; if (p !== c) { [a[p], a[c]] = [a[c], a[p]]; d = -d } d *= a[c][c]
    for (let r = c + 1; r < n; r++) { const f = a[r][c] / a[c][c]; for (let k = c; k < n; k++) a[r][k] -= f * a[c][k] } } return d }
export function validate(A: Mat) { if (A.flat().some(x => !Number.isFinite(x))) return { ok: false, errs: ['La matriz tiene valores vacíos o no numéricos.'], as: NaN, minors: [] as number[], eigs: null as Vec | null }
  let as = 0, mx = 0; A.forEach((r, i) => r.forEach((v, j) => { as = Math.max(as, Math.abs(v - A[j][i])); mx = Math.max(mx, Math.abs(v)) }))
  const sym = as <= 1e-9 * mx, errs: string[] = [], minors = A.map((_, k) => det(A.slice(0, k + 1).map(r => r.slice(0, k + 1))))
  if (!sym) errs.push(`A no es simétrica: ‖A−Aᵀ‖∞ = ${as.toExponential(2)}.`)
  const eigs = sym ? eig(A) : null
  if (eigs && (eigs[0] <= 0 || minors.some(m => m <= 0))) errs.push(`A no es definida positiva: λmín = ${eigs[0].toExponential(2)}.`)
  return { ok: !errs.length, errs, as, minors, eigs } }
export function Mmat(A: Mat, t: Prec, w = 1.2): Mat { const n = A.length, Z = () => A.map(() => Array(n).fill(0))
  if (t === 'jacobi') { const M = Z(); A.forEach((_, i) => (M[i][i] = A[i][i])); return M }
  if (t === 'ssor') { const T = A.map((r, i) => r.map((_, j) => (i === j ? A[i][i] : j < i ? w * A[i][j] : 0)))
    return A.map((_, i) => A.map((_, j) => { let s = 0; for (let k = 0; k < n; k++) s += (T[i][k] * T[j][k]) / A[k][k]; return s / (w * (2 - w)) })) }
  const L = Z(); for (let i = 0; i < n; i++) for (let j = Math.max(0, i - 1); j <= i; j++) { let s = A[i][j]; for (let k = 0; k < j; k++) s -= L[i][k] * L[j][k]
    if (i === j) L[i][i] = Math.sqrt(s > 0 ? s : A[i][i]); else L[i][j] = s / L[j][j] }
  return A.map((_, i) => A.map((_, j) => dot(L[i], L[j]))) }
export function pcg(A: Mat, b: Vec, x0: Vec, Mm: Mat | null, tol: number, nmax: number) {
  const Lm = Mm ? chol(Mm) : null; if (Mm && !Lm) throw new Error('El precondicionador M no es definido positivo.')
  const ap = (r: Vec) => (Lm ? cholSolve(Lm, r) : r.slice()), nb = norm(b) || 1
  let x = x0.slice(); const Ax = mv(A, x); let r = b.map((v, i) => v - Ax[i]), z = ap(r), p = z.slice(), rz = dot(r, z)
  const hist = [norm(r) / nb], xs = [x.slice()]; let k = 0
  while (hist[k] >= tol && k < nmax) { const Ap = mv(A, p), al = rz / dot(p, Ap)
    x = x.map((v, i) => v + al * p[i]); r = r.map((v, i) => v - al * Ap[i]); z = ap(r)
    const rn = dot(r, z), be = rn / rz; p = z.map((v, i) => v + be * p[i]); rz = rn; k++; hist.push(norm(r) / nb); xs.push(x.slice()) }
  return { x, it: k, hist, xs, conv: hist[k] < tol } }
function spec(A: Mat, Mm: Mat | null): Vec { if (!Mm) return eig(A); const L = chol(Mm)!
  const Bc = A.map((_, j) => fwd(L, A.map(r => r[j]))), B = A.map((_, i) => Bc.map(c => c[i])), Cc = B.map(r => fwd(L, r)), C = A.map((_, i) => Cc.map(c => c[i]))
  return eig(C.map((r, i) => r.map((v, j) => (v + C[j][i]) / 2))) }
export type P = { A: Mat; b: Vec; x0: Vec; tol: number; nmax: number; prec: Prec }
export type Sol = { ok: false; errs: string[] } | { ok: true; xr: Vec; gcp: ReturnType<typeof pcg>; gc: ReturnType<typeof pcg>; eA: Vec; eM: Vec; kA: number; kM: number; res: number; Ea: Vec; Er: (number | null)[]; v: ReturnType<typeof validate> }
export function solve(P: P): Sol { const v = validate(P.A); if (!v.ok) return { ok: false, errs: v.errs }
  if (P.b.some(x => !Number.isFinite(x))) return { ok: false, errs: ['b contiene valores no numéricos.'] }
  try { const xr = cholSolve(chol(P.A)!, P.b), Mm = Mmat(P.A, P.prec), gcp = pcg(P.A, P.b, P.x0, Mm, P.tol, P.nmax), gc = pcg(P.A, P.b, P.x0, null, P.tol, P.nmax)
    const eA = spec(P.A, null), eM = spec(P.A, Mm), Ax = mv(P.A, gcp.x), res = norm(P.b.map((q, i) => q - Ax[i])) / (norm(P.b) || 1)
    const Ea = xr.map((q, i) => Math.abs(q - gcp.x[i])), Er = xr.map((q, i) => (Math.abs(q) < 1e-12 ? null : Ea[i] / Math.abs(q)))
    return { ok: true, xr, gcp, gc, eA, eM, kA: eA[eA.length - 1] / eA[0], kM: eM[eM.length - 1] / eM[0], res, Ea, Er, v }
  } catch (e) { return { ok: false, errs: [(e as Error).message] } } }
