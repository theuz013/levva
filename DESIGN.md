# Design — Levva

Mundo visual: **Pampulha**. O cobalto dos azulejos de Portinari na Igreja da Pampulha (BH) sobre um fundo
claro e frio, com as abóbadas de Niemeyer reduzidas a um traço na marca. Claro por escolha de cena:
o gestor usa o painel no escritório e no celular, na rua e no sol, e precisa de contraste alto.

Modo das telas atuais: **Operate** (painel de trabalho). Navegação, tabelas e controles seguem o padrão da web;
o mundo entra só por tipografia, paleta, densidade e um movimento próprio.

## Movimento próprio

**O recibo da corrida**: barra proporcional que mostra para onde vai cada real do preço
(motorista, locadora, gestor, plataforma, taxa Pix), com legenda em valores e %. Aparece onde houver preço.
Apoio: trajeto desenhado como itinerário (ponto vazado na origem, ponto cheio no destino, linha cobalto).

## Tokens (apps/web/app/globals.css)

| Papel | Token | Valor |
| --- | --- | --- |
| Texto | `--ink` / `--ink-2` / `--ink-3` | #0e1a33 / #46526b / #5e6a82 |
| Fundo / superfície | `--ground` / `--surface` | #f3f5f9 / #ffffff |
| Linhas | `--line` / `--line-strong` | #d9dfe9 / #b9c3d4 |
| Marca (trilho de navegação, ação primária) | `--cobalt` / `--cobalt-deep` / `--cobalt-tint` | #1c3da3 / #132c78 / #e8edfa |
| Recibo | `--part-motorista` `--part-gestor` `--part-plataforma` `--part-pix` `--part-locadora` | #1c3da3 #b5701a #5b6b8c #9aa6bc #2f7d6d |
| Estados | `--ok` `--warn` `--danger` (+ `-tint`) | #1f7a4d #9a5800 #b42318 |

- Estratégia de cor: trilho de navegação cobalto inteiro (comprometido no shell), área de trabalho neutra, cor de estado só quando carrega significado.
- Blindado tem etiqueta própria em tinta escura (`.tag-blindado`), para ser visto de relance.

## Tipografia

Manrope Variable (self-hosted via @fontsource), uma família para tudo. Escala fixa em rem:
12 / 13 / 15 / 18 / 22 / 32 px; preço sugerido 40 px peso 800. Números sempre `tabular-nums` (`.num`).

## Componentes e regras

- Controles com 44 px de altura (toque confortável); foco com anel cobalto de 3 px; seleção e cursor de texto em cobalto.
- Raio 10 px em painéis, 6 px em controles; sombra leve só no recibo.
- Sem cartões dentro de cartões, sem rótulo acima de título, sem borda lateral colorida.
- No celular (≤ 900 px) a navegação vira barra inferior; na cotação (≤ 1100 px) o preço fica fixo acima dela com o botão Enviar.
- Movimento: 150–250 ms, curva `--ease`; respeita `prefers-reduced-motion`.

## Processo

Direção escolhida sem o sorteio `concept-seed` do Impeccable (o executável dele não pôde rodar neste ambiente)
e sem a revisão final por subagente; revisada em duas rodadas de capturas (1440 px e iPhone 13).
