/**
 * Geração de Pix "Copia e Cola" (BR Code estático, padrão EMV do Banco Central), sem gateway.
 * O mesmo texto vira o QR code mostrado ao cliente.
 */

export interface DadosPix {
  /** Chave Pix da empresa (CNPJ, e-mail, telefone +55... ou chave aleatória). */
  chave: string;
  /** Nome do recebedor (até 25 caracteres, sem acentos). */
  nomeRecebedor: string;
  /** Cidade do recebedor (até 15 caracteres, sem acentos). */
  cidade: string;
  valorCentavos?: number;
  /** Identificador da corrida ou fatura (até 25 caracteres, só letras e números). */
  txid?: string;
}

function semAcentos(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function campo(id: string, valor: string): string {
  if (valor.length > 99) throw new RangeError(`campo ${id} excede 99 caracteres`);
  return id + String(valor.length).padStart(2, '0') + valor;
}

/** CRC16-CCITT (polinômio 0x1021, valor inicial 0xFFFF), exigido no campo 63. */
export function crc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let b = 0; b < 8; b++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export function gerarPixCopiaECola(d: DadosPix): string {
  const chave = d.chave.trim();
  if (!chave) throw new RangeError('chave Pix obrigatória');
  const nome = semAcentos(d.nomeRecebedor).trim().slice(0, 25);
  const cidade = semAcentos(d.cidade).trim().slice(0, 15);
  if (!nome || !cidade) throw new RangeError('nome e cidade do recebedor são obrigatórios');

  const txid = (d.txid ?? '***').replace(/[^A-Za-z0-9*]/g, '').slice(0, 25) || '***';

  let payload =
    campo('00', '01') +
    campo('26', campo('00', 'br.gov.bcb.pix') + campo('01', chave)) +
    campo('52', '0000') +
    campo('53', '986');

  if (d.valorCentavos !== undefined) {
    if (!Number.isInteger(d.valorCentavos) || d.valorCentavos <= 0) {
      throw new RangeError('valor do Pix deve ser em centavos inteiros e positivo');
    }
    payload += campo('54', (d.valorCentavos / 100).toFixed(2));
  }

  payload += campo('58', 'BR') + campo('59', nome) + campo('60', cidade) + campo('62', campo('05', txid));
  payload += '6304';
  return payload + crc16(payload);
}
