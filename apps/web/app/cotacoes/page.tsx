'use client';

import { calcularPreco, dividirCorrida, formatarBRL } from '@levva/shared';
import { AlertTriangle, Check, Clock, Route, Send, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Shell } from '@/components/Shell';
import { PEDIDOS, VEICULOS, type Categoria, type PedidoExemplo } from './exemplos';
import s from './cotacoes.module.css';

// Configurações da empresa (virão de PricingSettings na API).
const CONFIG = { combustivelCentavos: 620, desgasteCentavosKm: 40, esperaCentavosHora: 6000, taxaPixBps: 0 };

const NOME_CATEGORIA: Record<Categoria, string> = { EXECUTIVO: 'Executivo', SUV: 'SUV', BLINDADO: 'Blindado', VAN: 'Van' };

/** "151,60" ou "151.6" → 15160 centavos. Vazio ou inválido → 0. */
function paraCentavos(texto: string): number {
  const limpo = texto.replace(/\s|R\$/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.');
  const n = Number(limpo);
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : 0;
}

function paraNumero(texto: string): number {
  const n = Number(texto.replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function emReais(centavos: number): string {
  return (centavos / 100).toFixed(2).replace('.', ',');
}

export default function CotacoesPage() {
  const [selecionadoId, setSelecionadoId] = useState(PEDIDOS[0].id);
  const pedido = PEDIDOS.find((p) => p.id === selecionadoId)!;

  return (
    <Shell>
      <main className={s.pagina}>
        <header className={s.cabecalho}>
          <div>
            <h1 className={s.titulo}>Cotações</h1>
            <p className={s.resumo}>
              <span className="num">{PEDIDOS.length}</span> pedidos aguardando preço
            </p>
          </div>
          <span className="tag tag-warn">Dados de exemplo</span>
        </header>

        <div className={s.grade}>
          <section aria-label="Pedidos aguardando preço" className={s.lista}>
            <ul>
              {PEDIDOS.map((p) => (
                <li key={p.id}>
                  <button
                    className={s.pedido}
                    aria-pressed={p.id === selecionadoId}
                    onClick={() => {
                      setSelecionadoId(p.id);
                      if (window.matchMedia('(max-width: 1100px)').matches) {
                        document.getElementById('detalhe')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }}
                  >
                    <span className={s.pedidoTopo}>
                      <strong>{p.cliente}</strong>
                      <small>{p.recebidoHa}</small>
                    </span>
                    <span className={s.pedidoTrecho}>
                      {p.origem} → {p.destino}
                    </span>
                    <span className={s.pedidoMeta}>
                      <span className="num">{p.quandoCurto}</span>
                      <span className={p.categoria === 'BLINDADO' ? 'tag tag-blindado' : 'tag tag-neutral'}>
                        {NOME_CATEGORIA[p.categoria]}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <Detalhe key={pedido.id} pedido={pedido} />
        </div>
      </main>
    </Shell>
  );
}

function Detalhe({ pedido }: { pedido: PedidoExemplo }) {
  const veiculosCompativeis = VEICULOS.filter((v) => v.categoria === pedido.categoria);
  const blindado = pedido.categoria === 'BLINDADO';

  const [veiculoId, setVeiculoId] = useState(veiculosCompativeis[0]?.id ?? '');
  const [km, setKm] = useState(String(pedido.distanciaKm));
  const [retornoVazio, setRetornoVazio] = useState(true);
  const [tempo, setTempo] = useState('70,00');
  const [pedagios, setPedagios] = useState('');
  const [espera, setEspera] = useState('');
  const [noturno, setNoturno] = useState(false);
  const [bilingue, setBilingue] = useState(false);
  const [diaria, setDiaria] = useState(blindado ? '900,00' : '');
  const [entrega, setEntrega] = useState(blindado ? '100,00' : '');
  const [precoManual, setPrecoManual] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);

  const veiculo = VEICULOS.find((v) => v.id === veiculoId);

  const calculo = useMemo(() => {
    if (!veiculo) return null;
    const aluguelDiaria = paraCentavos(diaria);
    return calcularPreco({
      distanciaKm: paraNumero(km),
      retornoVazio,
      consumoKmPorLitro: veiculo.consumoKmPorLitro,
      precoCombustivelCentavosPorLitro: CONFIG.combustivelCentavos,
      desgasteCentavosPorKm: CONFIG.desgasteCentavosKm,
      pedagiosCentavos: paraCentavos(pedagios),
      tempoMotoristaCentavos: paraCentavos(tempo),
      esperaHoras: paraNumero(espera),
      esperaCentavosPorHora: CONFIG.esperaCentavosHora,
      taxaPixBps: CONFIG.taxaPixBps,
      adicionais: [
        ...(noturno ? [{ nome: 'Noturno', tipo: 'percentual' as const, bps: 2000 }] : []),
        ...(bilingue ? [{ nome: 'Bilíngue', tipo: 'fixo' as const, centavos: 3000 }] : []),
      ],
      aluguel: blindado && aluguelDiaria ? { diariaCentavos: aluguelDiaria, dias: 1, entregaRetiradaCentavos: paraCentavos(entrega) } : undefined,
    });
  }, [veiculo, km, retornoVazio, tempo, pedagios, espera, noturno, bilingue, diaria, entrega, blindado]);

  const precoEnviar = precoManual === null ? (calculo?.precoSugeridoCentavos ?? 0) : paraCentavos(precoManual);
  const divisao = useMemo(() => {
    if (!calculo || precoEnviar <= 0) return null;
    try {
      return dividirCorrida(precoEnviar, { taxaPixBps: CONFIG.taxaPixBps, locadoraCentavos: calculo.aluguelCentavos });
    } catch {
      return null;
    }
  }, [calculo, precoEnviar]);

  const abaixoDoCusto = !!calculo && (!divisao || divisao.motoristaCentavos < calculo.custoMotoristaCentavos);

  return (
    <section id="detalhe" aria-label="Cotação selecionada" className={s.detalhe}>
      <div className={s.viagem}>
        <div className={s.viagemCliente}>
          <h2>{pedido.cliente}</h2>
          <p>{pedido.solicitante}</p>
        </div>
        <ol className={s.trajeto} aria-label="Trajeto">
          <li>
            <span className={s.ponto} aria-hidden="true" />
            <span>
              <small>Origem</small>
              {pedido.origem}
            </span>
          </li>
          <li>
            <span className={s.pontoFinal} aria-hidden="true" />
            <span>
              <small>Destino</small>
              {pedido.destino}
            </span>
          </li>
        </ol>
        <dl className={s.fatos}>
          <div>
            <dt>
              <Clock size={15} aria-hidden="true" /> Horário
            </dt>
            <dd className="num">{pedido.quando}</dd>
          </div>
          <div>
            <dt>
              <Users size={15} aria-hidden="true" /> Passageiros
            </dt>
            <dd className="num">{pedido.passageiros}</dd>
          </div>
          <div>
            <dt>
              <Route size={15} aria-hidden="true" /> Categoria
            </dt>
            <dd>{NOME_CATEGORIA[pedido.categoria]}</dd>
          </div>
        </dl>
        {pedido.observacao && <p className={s.obs}>{pedido.observacao}</p>}
      </div>

      <div className={s.trabalho}>
        <form className={s.calculadora} onSubmit={(e) => e.preventDefault()} aria-label="Calculadora de preço">
          <h3 className={s.secao}>Custos da corrida</h3>

          <label className="field">
            <span>Veículo</span>
            <select className="select" value={veiculoId} onChange={(e) => setVeiculoId(e.target.value)}>
              {veiculosCompativeis.length === 0 && <option value="">Nenhum veículo desta categoria</option>}
              {veiculosCompativeis.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.rotulo} · {String(v.consumoKmPorLitro).replace('.', ',')} km/L
                </option>
              ))}
            </select>
          </label>

          <div className={s.linha2}>
            <label className="field">
              <span>Distância de ida (km)</span>
              <input className="input num" inputMode="decimal" value={km} onChange={(e) => setKm(e.target.value)} />
            </label>
            <label className="field">
              <span>Tempo do motorista</span>
              <span className="input-prefix">
                <b>R$</b>
                <input className="input num" inputMode="decimal" value={tempo} onChange={(e) => setTempo(e.target.value)} />
              </span>
            </label>
          </div>

          <label className="check">
            <input type="checkbox" checked={retornoVazio} onChange={(e) => setRetornoVazio(e.target.checked)} />
            Retorno vazio (conta os km da volta)
          </label>

          <div className={s.linha2}>
            <label className="field">
              <span>Pedágios</span>
              <span className="input-prefix">
                <b>R$</b>
                <input className="input num" inputMode="decimal" placeholder="0,00" value={pedagios} onChange={(e) => setPedagios(e.target.value)} />
              </span>
            </label>
            <label className="field">
              <span>Espera (horas)</span>
              <input className="input num" inputMode="decimal" placeholder="0" value={espera} onChange={(e) => setEspera(e.target.value)} />
            </label>
          </div>

          {blindado && (
            <fieldset className={s.aluguel}>
              <legend>Aluguel do blindado</legend>
              <div className={s.linha2}>
                <label className="field">
                  <span>Diária da locadora</span>
                  <span className="input-prefix">
                    <b>R$</b>
                    <input className="input num" inputMode="decimal" value={diaria} onChange={(e) => setDiaria(e.target.value)} />
                  </span>
                </label>
                <label className="field">
                  <span>Entrega e retirada</span>
                  <span className="input-prefix">
                    <b>R$</b>
                    <input className="input num" inputMode="decimal" value={entrega} onChange={(e) => setEntrega(e.target.value)} />
                  </span>
                </label>
              </div>
            </fieldset>
          )}

          <h3 className={s.secao}>Adicionais</h3>
          <div className={s.checks}>
          <label className="check">
            <input type="checkbox" checked={noturno} onChange={(e) => setNoturno(e.target.checked)} />
            Noturno (+20% sobre o custo)
          </label>
          <label className="check">
            <input type="checkbox" checked={bilingue} onChange={(e) => setBilingue(e.target.checked)} />
            Motorista bilíngue (+R$ 30,00)
          </label>
          </div>

          {calculo && (
            <dl className={s.custos}>
              <div>
                <dt>Combustível · {String(calculo.kmTotal).replace('.', ',')} km</dt>
                <dd className="num">{formatarBRL(calculo.combustivelCentavos)}</dd>
              </div>
              <div>
                <dt>Desgaste do carro</dt>
                <dd className="num">{formatarBRL(calculo.desgasteCentavos)}</dd>
              </div>
              {calculo.pedagiosCentavos > 0 && (
                <div>
                  <dt>Pedágios</dt>
                  <dd className="num">{formatarBRL(calculo.pedagiosCentavos)}</dd>
                </div>
              )}
              <div>
                <dt>Tempo do motorista</dt>
                <dd className="num">{formatarBRL(calculo.tempoMotoristaCentavos)}</dd>
              </div>
              {calculo.esperaCentavos > 0 && (
                <div>
                  <dt>Espera</dt>
                  <dd className="num">{formatarBRL(calculo.esperaCentavos)}</dd>
                </div>
              )}
              {calculo.adicionaisCentavos > 0 && (
                <div>
                  <dt>Adicionais</dt>
                  <dd className="num">{formatarBRL(calculo.adicionaisCentavos)}</dd>
                </div>
              )}
              <div className={s.custoTotal}>
                <dt>Custo do motorista</dt>
                <dd className="num">{formatarBRL(calculo.custoMotoristaCentavos)}</dd>
              </div>
            </dl>
          )}
        </form>

        <aside className={s.recibo} aria-label="Preço e divisão da corrida">
          {calculo ? (
            <>
              <p className={s.sugeridoRotulo}>Preço sugerido</p>
              <p className={`${s.sugerido} num`}>{formatarBRL(calculo.precoSugeridoCentavos)}</p>
              <p className={s.sugeridoNota}>
                Cobre o custo do motorista, 15% do gestor e 7% da plataforma. Arredondado para cima a cada R$ 10.
              </p>

              <label className="field">
                <span>Preço a enviar ao cliente</span>
                <span className="input-prefix">
                  <b>R$</b>
                  <input
                    className={`input num ${s.precoInput}`}
                    inputMode="decimal"
                    value={precoManual ?? emReais(calculo.precoSugeridoCentavos)}
                    onChange={(e) => {
                      setPrecoManual(e.target.value);
                      setEnviado(false);
                    }}
                    aria-invalid={abaixoDoCusto}
                    aria-describedby="aviso-preco"
                  />
                </span>
              </label>

              {divisao && (
                <>
                  <div className={s.barra} role="img" aria-label="Divisão do preço da corrida">
                    {[
                      ['motorista', divisao.motoristaCentavos],
                      ['locadora', divisao.locadoraCentavos],
                      ['gestor', divisao.gestorCentavos],
                      ['plataforma', divisao.plataformaCentavos],
                      ['pix', divisao.taxaPixCentavos],
                    ]
                      .filter(([, v]) => (v as number) > 0)
                      .map(([k, v]) => (
                        <span key={k as string} className={s[`p_${k}`]} style={{ flexGrow: v as number }} />
                      ))}
                  </div>
                  <dl className={s.partes}>
                    <Parte classe={s.p_motorista} rotulo="Motorista" valor={divisao.motoristaCentavos} total={precoEnviar} />
                    {divisao.locadoraCentavos > 0 && (
                      <Parte classe={s.p_locadora} rotulo="Locadora" valor={divisao.locadoraCentavos} total={precoEnviar} />
                    )}
                    <Parte classe={s.p_gestor} rotulo="Gestor" valor={divisao.gestorCentavos} total={precoEnviar} />
                    <Parte classe={s.p_plataforma} rotulo="Plataforma" valor={divisao.plataformaCentavos} total={precoEnviar} />
                    {divisao.taxaPixCentavos > 0 && (
                      <Parte classe={s.p_pix} rotulo="Taxa Pix" valor={divisao.taxaPixCentavos} total={precoEnviar} />
                    )}
                  </dl>
                </>
              )}

              <div id="aviso-preco" aria-live="polite">
                {abaixoDoCusto && (
                  <p className="alert alert-danger">
                    <AlertTriangle size={16} aria-hidden="true" style={{ flex: 'none', marginTop: 2 }} />
                    Com esse preço o motorista recebe menos que o custo dele ({formatarBRL(calculo.custoMotoristaCentavos)}). Suba o preço ou
                    revise os custos.
                  </p>
                )}
                {enviado && (
                  <p className="alert alert-info">
                    <Check size={16} aria-hidden="true" style={{ flex: 'none', marginTop: 2 }} />
                    Exemplo: na versão conectada, o cliente recebe o preço e o link para confirmar.
                  </p>
                )}
              </div>

              <div className={s.acoes}>
                <button className="btn btn-primary" disabled={abaixoDoCusto || precoEnviar <= 0} onClick={() => setEnviado(true)}>
                  <Send size={17} aria-hidden="true" />
                  Enviar preço ao cliente
                </button>
                {precoManual !== null && (
                  <button className="btn btn-ghost" onClick={() => setPrecoManual(null)}>
                    Usar o sugerido
                  </button>
                )}
              </div>
            </>
          ) : (
            <p className={s.vazio}>Cadastre um veículo da categoria {NOME_CATEGORIA[pedido.categoria]} para calcular o preço.</p>
          )}
        </aside>
      </div>

      {calculo && (
        <div className={s.precoFixo}>
          <span>
            <small>Preço a enviar</small>
            <strong className="num">{formatarBRL(precoEnviar)}</strong>
          </span>
          <button
            className="btn btn-primary"
            disabled={abaixoDoCusto || precoEnviar <= 0}
            onClick={() => {
              setEnviado(true);
              document.getElementById('aviso-preco')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
          >
            <Send size={16} aria-hidden="true" />
            Enviar
          </button>
        </div>
      )}
    </section>
  );
}

function Parte({ classe, rotulo, valor, total }: { classe: string; rotulo: string; valor: number; total: number }) {
  const pct = total > 0 ? Math.round((valor / total) * 100) : 0;
  return (
    <div>
      <dt>
        <span className={`${s.chip} ${classe}`} aria-hidden="true" />
        {rotulo}
      </dt>
      <dd className="num">
        {formatarBRL(valor)} <small>{pct}%</small>
      </dd>
    </div>
  );
}
