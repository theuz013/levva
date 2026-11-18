// DADOS DE EXEMPLO (fictícios) para demonstrar a tela enquanto a API de cotações
// não está conectada. Substituir pela lista real de corridas em COTACAO_SOLICITADA.

export type Categoria = 'EXECUTIVO' | 'SUV' | 'BLINDADO' | 'VAN';

export interface PedidoExemplo {
  id: string;
  cliente: string;
  solicitante: string;
  origem: string;
  destino: string;
  quando: string;
  quandoCurto: string;
  categoria: Categoria;
  passageiros: number;
  distanciaKm: number;
  observacao?: string;
  recebidoHa: string;
}

export interface VeiculoExemplo {
  id: string;
  rotulo: string;
  categoria: Categoria;
  consumoKmPorLitro: number;
}

export const PEDIDOS: PedidoExemplo[] = [
  {
    id: 'p1',
    cliente: 'Exemplo Financeira S.A.',
    solicitante: 'Secretaria da Diretoria',
    origem: 'Savassi',
    destino: 'Aeroporto de Confins',
    quando: 'Qui, 3 de dezembro · 06:10',
    quandoCurto: '3 dez · 06:10',
    categoria: 'EXECUTIVO',
    passageiros: 1,
    distanciaKm: 40,
    recebidoHa: 'há 12 min',
  },
  {
    id: 'p2',
    cliente: 'Exemplo Advogados',
    solicitante: 'Assessoria Jurídica',
    origem: 'Belvedere',
    destino: 'Cidade Administrativa',
    quando: 'Sex, 4 de dezembro · 08:30',
    quandoCurto: '4 dez · 08:30',
    categoria: 'BLINDADO',
    passageiros: 2,
    distanciaKm: 24,
    observacao: 'Blindagem nível III-A. Nome do passageiro oculto para o motorista.',
    recebidoHa: 'há 40 min',
  },
  {
    id: 'p3',
    cliente: 'Comitiva Exemplo',
    solicitante: 'Eventos',
    origem: 'Aeroporto de Confins',
    destino: 'Lourdes',
    quando: 'Seg, 7 de dezembro · 22:40',
    quandoCurto: '7 dez · 22:40',
    categoria: 'VAN',
    passageiros: 5,
    distanciaKm: 42,
    observacao: '5 malas grandes.',
    recebidoHa: 'há 2 h',
  },
];

export const VEICULOS: VeiculoExemplo[] = [
  { id: 'v1', rotulo: 'Corolla preto · Carlos', categoria: 'EXECUTIVO', consumoKmPorLitro: 11 },
  { id: 'v2', rotulo: 'Camry preto · Renata', categoria: 'EXECUTIVO', consumoKmPorLitro: 10 },
  { id: 'v3', rotulo: 'Blindado alugado (locadora)', categoria: 'BLINDADO', consumoKmPorLitro: 7 },
  { id: 'v4', rotulo: 'Sprinter executiva · Paulo', categoria: 'VAN', consumoKmPorLitro: 8 },
];
