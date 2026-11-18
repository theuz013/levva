/**
 * Calculadora de preço da corrida.
 *
 * Todos os valores de dinheiro são em CENTAVOS (inteiros).
 * Percentuais são em pontos-base (bps): 1500 = 15%.
 *
 * Fórmula:
 *   custo do motorista = combustível + desgaste + pedágios + tempo + espera (+ adicionais)
 *   preço sugerido     = (custo do motorista + aluguel) / (1 - gestor - plataforma - taxa Pix)
 *   arredondado para cima no múltiplo de `arredondarParaCentavos`.
 */

export const PADROES = {
  gestorBps: 1500,
  plataformaBps: 700,
  taxaPixBps: 0,
  arredondarParaCentavos: 1000,
} as const;

export type Adicional =
  | { nome: string; tipo: 'percentual'; bps: number }
  | { nome: string; tipo: 'fixo'; centavos: number };

export interface AluguelVeiculo {
  diariaCentavos: number;
  dias: number;
  kmExcedenteCentavos?: number;
  entregaRetiradaCentavos?: number;
}

export interface EntradaCalculo {
  /** Distância de ida, em km. */
  distanciaKm: number;
  /** Se o carro volta vazio, os km dobram. */
  retornoVazio: boolean;
  consumoKmPorLitro: number;
  precoCombustivelCentavosPorLitro: number;
  desgasteCentavosPorKm: number;
  pedagiosCentavos?: number;
  /** Valor do tempo do motorista na corrida. */
  tempoMotoristaCentavos: number;
  esperaHoras?: number;
  esperaCentavosPorHora?: number;
  /** Aplicados sobre o custo do motorista (ex.: noturno 20%) ou somados a ele (fixos). */
  adicionais?: Adicional[];
  /** Veículo alugado (ex.: blindado). Repassado à locadora, fora do repasse do motorista. */
  aluguel?: AluguelVeiculo;
  gestorBps?: number;
  plataformaBps?: number;
  taxaPixBps?: number;
  arredondarParaCentavos?: number;
}

export interface DivisaoCorrida {
  precoCentavos: number;
  gestorCentavos: number;
  plataformaCentavos: number;
  taxaPixCentavos: number;
  locadoraCentavos: number;
  motoristaCentavos: number;
}

export interface ResultadoCalculo {
  kmTotal: number;
  combustivelCentavos: number;
  desgasteCentavos: number;
  pedagiosCentavos: number;
  tempoMotoristaCentavos: number;
  esperaCentavos: number;
  adicionaisCentavos: number;
  custoMotoristaCentavos: number;
  aluguelCentavos: number;
  precoExatoCentavos: number;
  precoSugeridoCentavos: number;
  divisao: DivisaoCorrida;
}

function assertNaoNegativo(nome: string, valor: number) {
  if (!Number.isFinite(valor) || valor < 0) {
    throw new RangeError(`${nome} deve ser um número maior ou igual a zero`);
  }
}

function aplicarBps(centavos: number, bps: number): number {
  return Math.round((centavos * bps) / 10_000);
}

export function custoAluguelCentavos(aluguel?: AluguelVeiculo): number {
  if (!aluguel) return 0;
  assertNaoNegativo('diária', aluguel.diariaCentavos);
  assertNaoNegativo('dias', aluguel.dias);
  return (
    aluguel.diariaCentavos * aluguel.dias +
    (aluguel.kmExcedenteCentavos ?? 0) +
    (aluguel.entregaRetiradaCentavos ?? 0)
  );
}

/**
 * Divide o preço final de uma corrida entre gestor, plataforma, taxa Pix, locadora e motorista.
 * O motorista fica com o restante, para que a soma feche exatamente no preço.
 */
export function dividirCorrida(
  precoCentavos: number,
  opcoes: { gestorBps?: number; plataformaBps?: number; taxaPixBps?: number; locadoraCentavos?: number } = {},
): DivisaoCorrida {
  assertNaoNegativo('preço', precoCentavos);
  if (!Number.isInteger(precoCentavos)) throw new RangeError('preço deve estar em centavos inteiros');
  const gestorCentavos = aplicarBps(precoCentavos, opcoes.gestorBps ?? PADROES.gestorBps);
  const plataformaCentavos = aplicarBps(precoCentavos, opcoes.plataformaBps ?? PADROES.plataformaBps);
  const taxaPixCentavos = aplicarBps(precoCentavos, opcoes.taxaPixBps ?? PADROES.taxaPixBps);
  const locadoraCentavos = opcoes.locadoraCentavos ?? 0;
  const motoristaCentavos =
    precoCentavos - gestorCentavos - plataformaCentavos - taxaPixCentavos - locadoraCentavos;
  if (motoristaCentavos < 0) {
    throw new RangeError('o preço não cobre gestor, plataforma, taxas e aluguel');
  }
  return { precoCentavos, gestorCentavos, plataformaCentavos, taxaPixCentavos, locadoraCentavos, motoristaCentavos };
}

export function calcularPreco(e: EntradaCalculo): ResultadoCalculo {
  assertNaoNegativo('distância', e.distanciaKm);
  assertNaoNegativo('tempo do motorista', e.tempoMotoristaCentavos);
  if (!(e.consumoKmPorLitro > 0)) throw new RangeError('consumo deve ser maior que zero');

  const gestorBps = e.gestorBps ?? PADROES.gestorBps;
  const plataformaBps = e.plataformaBps ?? PADROES.plataformaBps;
  const taxaPixBps = e.taxaPixBps ?? PADROES.taxaPixBps;
  const arredondar = e.arredondarParaCentavos ?? PADROES.arredondarParaCentavos;
  const somaBps = gestorBps + plataformaBps + taxaPixBps;
  if (somaBps >= 10_000) throw new RangeError('gestor + plataforma + taxa precisam somar menos de 100%');

  const kmTotal = e.retornoVazio ? e.distanciaKm * 2 : e.distanciaKm;
  const combustivelCentavos = Math.round((kmTotal / e.consumoKmPorLitro) * e.precoCombustivelCentavosPorLitro);
  const desgasteCentavos = Math.round(kmTotal * e.desgasteCentavosPorKm);
  const pedagiosCentavos = e.pedagiosCentavos ?? 0;
  const esperaCentavos = Math.round((e.esperaHoras ?? 0) * (e.esperaCentavosPorHora ?? 0));

  const custoBase =
    combustivelCentavos + desgasteCentavos + pedagiosCentavos + e.tempoMotoristaCentavos + esperaCentavos;

  let adicionaisCentavos = 0;
  for (const a of e.adicionais ?? []) {
    adicionaisCentavos += a.tipo === 'percentual' ? aplicarBps(custoBase, a.bps) : a.centavos;
  }

  const custoMotoristaCentavos = custoBase + adicionaisCentavos;
  const aluguelCentavos = custoAluguelCentavos(e.aluguel);

  const precoExatoCentavos = ((custoMotoristaCentavos + aluguelCentavos) * 10_000) / (10_000 - somaBps);
  const precoSugeridoCentavos =
    arredondar > 0 ? Math.ceil(precoExatoCentavos / arredondar) * arredondar : Math.ceil(precoExatoCentavos);

  return {
    kmTotal,
    combustivelCentavos,
    desgasteCentavos,
    pedagiosCentavos,
    tempoMotoristaCentavos: e.tempoMotoristaCentavos,
    esperaCentavos,
    adicionaisCentavos,
    custoMotoristaCentavos,
    aluguelCentavos,
    precoExatoCentavos,
    precoSugeridoCentavos,
    divisao: dividirCorrida(precoSugeridoCentavos, {
      gestorBps,
      plataformaBps,
      taxaPixBps,
      locadoraCentavos: aluguelCentavos,
    }),
  };
}

/** Formata centavos como "R$ 1.234,56". */
export function formatarBRL(centavos: number): string {
  return (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
