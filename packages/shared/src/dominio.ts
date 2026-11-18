export const PERFIS = ['ADMIN_MASTER', 'GESTOR', 'MOTORISTA', 'CLIENTE'] as const;
export type Perfil = (typeof PERFIS)[number];

export const STATUS_CORRIDA = [
  'COTACAO_SOLICITADA',
  'PRECO_ENVIADO',
  'CONFIRMADA',
  'MOTORISTA_DESIGNADO',
  'ACEITA_MOTORISTA',
  'A_CAMINHO',
  'CHEGOU',
  'EM_VIAGEM',
  'FINALIZADA',
  'PAGA',
  'CANCELADA',
] as const;
export type StatusCorrida = (typeof STATUS_CORRIDA)[number];

/** Transições permitidas do ciclo da corrida. */
export const TRANSICOES: Record<StatusCorrida, StatusCorrida[]> = {
  COTACAO_SOLICITADA: ['PRECO_ENVIADO', 'CANCELADA'],
  PRECO_ENVIADO: ['CONFIRMADA', 'CANCELADA'],
  CONFIRMADA: ['MOTORISTA_DESIGNADO', 'CANCELADA'],
  MOTORISTA_DESIGNADO: ['ACEITA_MOTORISTA', 'CONFIRMADA', 'CANCELADA'],
  ACEITA_MOTORISTA: ['A_CAMINHO', 'CANCELADA'],
  A_CAMINHO: ['CHEGOU', 'CANCELADA'],
  CHEGOU: ['EM_VIAGEM', 'CANCELADA'],
  EM_VIAGEM: ['FINALIZADA'],
  FINALIZADA: ['PAGA'],
  PAGA: [],
  CANCELADA: [],
};

export function podeTransitar(de: StatusCorrida, para: StatusCorrida): boolean {
  return TRANSICOES[de].includes(para);
}

export const CATEGORIAS_VEICULO = ['EXECUTIVO', 'SUV', 'BLINDADO', 'VAN'] as const;
export type CategoriaVeiculo = (typeof CATEGORIAS_VEICULO)[number];
