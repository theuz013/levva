import { describe, expect, it } from 'vitest';
import { calcularPreco, crc16, dividirCorrida, gerarPixCopiaECola, podeTransitar } from './index';

const bhConfins = {
  distanciaKm: 40,
  retornoVazio: true,
  consumoKmPorLitro: 10,
  precoCombustivelCentavosPorLitro: 620,
  desgasteCentavosPorKm: 40,
  tempoMotoristaCentavos: 7000,
  taxaPixBps: 100,
};

describe('calcularPreco', () => {
  it('reproduz o exemplo do plano: BH → Confins com retorno vazio sugere R$ 200', () => {
    const r = calcularPreco(bhConfins);
    expect(r.kmTotal).toBe(80);
    expect(r.combustivelCentavos).toBe(4960);
    expect(r.desgasteCentavos).toBe(3200);
    expect(r.custoMotoristaCentavos).toBe(15160);
    expect(Math.round(r.precoExatoCentavos)).toBe(19688);
    expect(r.precoSugeridoCentavos).toBe(20000);
    expect(r.divisao).toEqual({
      precoCentavos: 20000,
      gestorCentavos: 3000,
      plataformaCentavos: 1400,
      taxaPixCentavos: 200,
      locadoraCentavos: 0,
      motoristaCentavos: 15400,
    });
  });

  it('motorista sempre recebe pelo menos o custo dele', () => {
    for (const km of [5, 12.3, 40, 87, 250]) {
      const r = calcularPreco({ ...bhConfins, distanciaKm: km });
      expect(r.divisao.motoristaCentavos).toBeGreaterThanOrEqual(r.custoMotoristaCentavos);
    }
  });

  it('aluguel de blindado vai para a locadora, não para o motorista', () => {
    const r = calcularPreco({ ...bhConfins, aluguel: { diariaCentavos: 90000, dias: 1, entregaRetiradaCentavos: 10000 } });
    expect(r.aluguelCentavos).toBe(100000);
    expect(r.divisao.locadoraCentavos).toBe(100000);
    expect(r.divisao.motoristaCentavos).toBeGreaterThanOrEqual(r.custoMotoristaCentavos);
  });

  it('adicionais percentuais e fixos entram no custo do motorista', () => {
    const r = calcularPreco({
      ...bhConfins,
      adicionais: [
        { nome: 'Noturno', tipo: 'percentual', bps: 2000 },
        { nome: 'Bilíngue', tipo: 'fixo', centavos: 3000 },
      ],
    });
    expect(r.adicionaisCentavos).toBe(3032 + 3000);
    expect(r.custoMotoristaCentavos).toBe(15160 + 6032);
  });

  it('recusa percentuais que somam 100% ou mais', () => {
    expect(() => calcularPreco({ ...bhConfins, gestorBps: 9000, plataformaBps: 1000 })).toThrow();
  });
});

describe('dividirCorrida', () => {
  it('a soma das partes fecha exatamente no preço', () => {
    for (const preco of [1, 999, 12345, 20000, 1234567]) {
      const d = dividirCorrida(preco, { taxaPixBps: 100 });
      expect(d.gestorCentavos + d.plataformaCentavos + d.taxaPixCentavos + d.locadoraCentavos + d.motoristaCentavos).toBe(preco);
    }
  });

  it('recusa valores que não são centavos inteiros', () => {
    expect(() => dividirCorrida(100.5)).toThrow();
  });
});

describe('Pix Copia e Cola', () => {
  it('CRC16 confere com o valor de referência do algoritmo', () => {
    expect(crc16('123456789')).toBe('29B1');
  });

  it('gera payload com valor, recebedor sem acentos e CRC válido', () => {
    const p = gerarPixCopiaECola({
      chave: '12345678000199',
      nomeRecebedor: 'Levva Transporte Executivo',
      cidade: 'Belo Horizonte',
      valorCentavos: 20000,
      txid: 'CORRIDA-0001',
    });
    expect(p.startsWith('000201')).toBe(true);
    expect(p).toContain('0014br.gov.bcb.pix011412345678000199');
    expect(p).toContain('5406200.00');
    expect(p).toContain('5925Levva Transporte Executi');
    expect(p).toContain('6014Belo Horizonte');
    expect(p).toContain('0511CORRIDA0001');
    expect(p.slice(-4)).toBe(crc16(p.slice(0, -4)));
  });
});

describe('ciclo da corrida', () => {
  it('não permite pular etapas', () => {
    expect(podeTransitar('CONFIRMADA', 'MOTORISTA_DESIGNADO')).toBe(true);
    expect(podeTransitar('CONFIRMADA', 'EM_VIAGEM')).toBe(false);
    expect(podeTransitar('EM_VIAGEM', 'CANCELADA')).toBe(false);
  });
});
