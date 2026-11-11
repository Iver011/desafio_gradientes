import { create } from 'zustand'
import { SC, type Key } from './scenarios'
import type { Mat, Vec, Prec } from './linalg'
type S = { scen: Key; A: Mat; b: Vec; x0: Vec; tol: number; nmax: number; prec: Prec
  load: (k: Key) => void; setA: (i: number, j: number, v: number) => void; setB: (i: number, v: number) => void; set: (p: Partial<S>) => void }
export const useStore = create<S>(set => ({ scen: 'ideal', A: SC.ideal.A.map(r => [...r]), b: [...SC.ideal.b], x0: [0, 0, 0, 0, 0], tol: 1e-6, nmax: 200, prec: 'jacobi',
  load: k => set({ scen: k, A: SC[k].A.map(r => [...r]), b: [...SC[k].b] }),
  setA: (i, j, v) => set(s => ({ A: s.A.map((r, a) => r.map((x, c) => (a === i && c === j ? v : x))) })),
  setB: (i, v) => set(s => ({ b: s.b.map((x, a) => (a === i ? v : x)) })), set: p => set(p) }))
