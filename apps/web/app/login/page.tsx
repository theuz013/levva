'use client';

import { AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { api, ErroApi, salvarToken } from '@/lib/api';
import s from './login.module.css';

type PerfilOpcao = { membershipId: string; perfil: string; empresa: string | null };
type RespostaLogin = { token?: string; precisaEscolherPerfil?: boolean; perfis: PerfilOpcao[] };

const NOME_PERFIL: Record<string, string> = {
  ADMIN_MASTER: 'Admin Master',
  GESTOR: 'Gestor',
  MOTORISTA: 'Motorista',
  CLIENTE: 'Cliente',
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [perfis, setPerfis] = useState<PerfilOpcao[] | null>(null);

  async function entrar(membershipId?: string) {
    setErro(null);
    setEnviando(true);
    try {
      const r = await api<RespostaLogin>('/auth/login', { method: 'POST', body: { email, senha, membershipId } });
      if (r.precisaEscolherPerfil) {
        setPerfis(r.perfis);
        return;
      }
      salvarToken(r.token ?? null);
      const perfil = r.perfis.find((p) => p.membershipId === membershipId)?.perfil ?? r.perfis[0]?.perfil;
      router.push(perfil === 'ADMIN_MASTER' ? '/admin' : '/cotacoes');
    } catch (e) {
      setErro(e instanceof ErroApi ? e.message : 'Algo deu errado. Tente de novo.');
    } finally {
      setEnviando(false);
    }
  }

  function aoEnviar(e: FormEvent) {
    e.preventDefault();
    if (!email || !senha) {
      setErro('Informe e-mail e senha.');
      return;
    }
    entrar();
  }

  return (
    <main className={s.pagina}>
      <section className={s.painel}>
        <h2 className="sr-only">Levva Transporte Executivo</h2>
        <img src="/levva-logo.png" alt="" className={s.logo} width={340} height={67} />
        <div className={s.frase}>
          <div className={s.traco} aria-hidden="true" />
          <p className={s.fraseGrande}>Cada corrida com preço certo, motorista certo e horário cumprido.</p>
          <p className={s.fraseMenor}>Gestão de transporte executivo · Belo Horizonte</p>
        </div>
      </section>

      <section className={s.formArea}>
        <div className={s.marcaMobile}>
          <img src="/levva-logo.png" alt="Levva Transporte Executivo" width={200} height={39} />
        </div>

        {perfis ? (
          <div className={s.caixa}>
            <h1 className={s.titulo}>Entrar como</h1>
            <p className={s.sub}>Sua conta tem mais de um perfil. Escolha com qual quer trabalhar agora.</p>
            <ul className={s.perfis}>
              {perfis.map((p) => (
                <li key={p.membershipId}>
                  <button className={s.perfil} onClick={() => entrar(p.membershipId)} disabled={enviando}>
                    <span>
                      <strong>{NOME_PERFIL[p.perfil] ?? p.perfil}</strong>
                      {p.empresa && <small>{p.empresa}</small>}
                    </span>
                    <ArrowRight size={18} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
            <button className="btn btn-ghost" onClick={() => setPerfis(null)}>
              Voltar
            </button>
          </div>
        ) : (
          <form className={s.caixa} onSubmit={aoEnviar} noValidate>
            <h1 className={s.titulo}>Entrar</h1>
            <p className={s.sub}>Acesso para gestores e clientes corporativos.</p>

            <label className="field">
              <span>E-mail</span>
              <input
                className="input"
                type="email"
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!erro && !email}
              />
            </label>
            <label className="field">
              <span>Senha</span>
              <input
                className="input"
                type="password"
                autoComplete="current-password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                aria-invalid={!!erro && !senha}
              />
            </label>

            {erro && (
              <p className="alert alert-danger" role="alert">
                <AlertCircle size={16} aria-hidden="true" style={{ flex: 'none', marginTop: 2 }} />
                {erro}
              </p>
            )}

            <button className="btn btn-primary" type="submit" disabled={enviando}>
              {enviando ? <Loader2 size={18} className={s.gira} aria-hidden="true" /> : null}
              {enviando ? 'Entrando…' : 'Entrar'}
            </button>
            <p className={s.ajuda}>Esqueceu a senha? Fale com o gestor da sua conta.</p>
          </form>
        )}
      </section>
    </main>
  );
}
