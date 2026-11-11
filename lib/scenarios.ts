import type { Mat, Vec } from './linalg'
export const N = 5
export const NAMES = ['Bonos soberanos', 'Acciones locales', 'Acciones internac.', 'REITs', 'Oro / commodities']
const R = (d: number, o: Record<string, number>): Mat => { const m = Array.from({ length: N }, (_, i) => Array.from({ length: N }, (_, j) => (i === j ? 1 : d)))
  for (const [k, v] of Object.entries(o)) { const i = +k[0], j = +k[1]; m[i][j] = m[j][i] = v } return m }
const build = (sg: Vec, rho: Mat, mu: Vec, g: number, e: number) => ({ A: sg.map((s, i) => sg.map((t, j) => s * t * rho[i][j] + (i === j ? e : 0))), b: mu.map(m => m / g) })
export const SC = {
  ideal: { n: 'Ideal', d: 'Mercado estable: volatilidades moderadas y correlaciones bajas (0,05–0,30). Se espera κ(A) bajo y convergencia rápida.',
    ...build([.06, .16, .17, .14, .15], R(.2, { '01': .05, '02': .05, '03': .1, '04': .1, '12': .3 }), [.04, .09, .095, .075, .05], 3, .001),
    t: 'Cartera diversificada y estable: los pesos reflejan la relación retorno/riesgo. La convergencia rápida confirma un sistema bien condicionado.' },
  stress: { n: 'Bajo estrés', d: 'Crisis: volatilidades ×1,5–2, correlaciones de renta variable en 0,75 (contagio), bonos como refugio y μ a la baja. Cambian A y b.',
    ...build([.09, .30, .32, .26, .28], R(.75, { '01': -.2, '02': -.2, '03': -.1, '04': .1 }), [.03, -.05, -.04, 0, .07], 3, .001),
    t: 'El equilibrio se desplaza hacia bonos y oro y se reduce la renta variable. κ sube por el contagio, pero el método sigue convergiendo.' },
  ill: { n: 'Mal condicionado', d: 'Acciones locales e internacionales casi duplicadas (ρ=0,98), REITs correlacionados 0,9 y escalas dispares (bonos 1 % vs commodities 60 %). ε = 10⁻⁶.',
    ...build([.01, .15, .15, .30, .60], R(.2, { '01': .05, '02': .05, '03': .05, '04': .05, '12': .98, '13': .9, '23': .9 }), [.03, .09, .09, .12, .2], 3, 1e-6),
    t: 'Con activos casi redundantes, pequeños cambios en μ generan posiciones largas y cortas enormes: el optimizador es inestable y requiere precondicionar.' },
}
export type Key = keyof typeof SC
