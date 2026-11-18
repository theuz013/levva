const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333';
const CHAVE_TOKEN = 'levva.token';

export class ErroApi extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

export function lerToken(): string | null {
  try {
    return localStorage.getItem(CHAVE_TOKEN);
  } catch {
    return null;
  }
}

export function salvarToken(token: string | null) {
  try {
    if (token) localStorage.setItem(CHAVE_TOKEN, token);
    else localStorage.removeItem(CHAVE_TOKEN);
  } catch {
    /* navegador sem armazenamento: a sessão dura só esta aba */
  }
}

export async function api<T>(caminho: string, opcoes: { method?: string; body?: unknown } = {}): Promise<T> {
  const token = lerToken();
  let resp: Response;
  try {
    resp = await fetch(BASE + caminho, {
      method: opcoes.method ?? 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: opcoes.body === undefined ? undefined : JSON.stringify(opcoes.body),
    });
  } catch {
    throw new ErroApi('Não foi possível falar com o servidor. Verifique sua conexão e tente de novo.', 0);
  }
  const dados = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    const msg = typeof dados.message === 'string' ? dados.message : 'Algo deu errado. Tente de novo.';
    throw new ErroApi(msg.charAt(0).toUpperCase() + msg.slice(1) + (msg.endsWith('.') ? '' : '.'), resp.status);
  }
  return dados as T;
}
