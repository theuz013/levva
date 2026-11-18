# Design — Levva

Identidade definida pelo **logo oficial**: preto, branco e verde-limão (#9BD033). O logo só aparece sobre preto
(trilho de navegação, painel do login, topo no celular), porque o nome está em branco.
A área de trabalho é clara por escolha de cena: o gestor usa o painel no escritório e no celular, na rua e no sol.

Modo das telas atuais: **Operate** (painel de trabalho). Navegação, tabelas e controles seguem o padrão da web;
a marca entra por paleta, logo, densidade e um movimento próprio.

## Movimento próprio

**O recibo da corrida**: barra proporcional que mostra para onde vai cada real do preço
(motorista em preto, gestor em verde, plataforma, taxa Pix, locadora), com legenda em valores e %.
Apoio: trajeto como itinerário (ponto vazado na origem, ponto verde no destino, como o pin do logo).

## Tokens (apps/web/app/globals.css)

| Papel | Token | Valor |
| --- | --- | --- |
| Texto | `--ink` / `--ink-2` / `--ink-3` | #0b0c0a / #4a4e47 / #61665d |
| Fundo / superfície | `--ground` / `--surface` | #f4f5f3 / #ffffff |
| Linhas | `--line` / `--line-strong` | #e0e2dd / #c3c7bf |
| Shell (trilho, topo, painel do login) | `--shell` / `--shell-2` / `--on-shell` / `--on-shell-2` | #000000 / #1a1b19 / #ffffff / #b4b8b0 |
| Verde da marca | `--accent` / `--accent-hover` / `--accent-tint` | #9bd033 / #8cc020 / #f0f7e1 |
| Verde para texto sobre branco | `--accent-ink` | #3f6b0c (o limão puro não tem contraste sobre branco) |
| Recibo | `--part-motorista` `--part-gestor` `--part-plataforma` `--part-pix` `--part-locadora` | #0b0c0a #9bd033 #7a8091 #b8bec9 #2f6f8f |
| Estados | `--ok` `--warn` `--danger` (+ `-tint`) | #1f7a4d #9a5800 #b42318 |

- Ação primária: botão verde-limão com texto preto. Verde nunca é usado como cor de texto sobre fundo branco (usar `--accent-ink`).
- Item ativo da navegação: fundo #1a1b19 com ícone verde; no celular, fundo verde-claro.
- Blindado tem etiqueta própria em preto (`.tag-blindado`), para ser visto de relance.

## Tipografia

Manrope Variable (self-hosted via @fontsource) para toda a interface; o logo carrega a geométrica larga da marca.
Escala fixa: 12 / 13 / 15 / 18 / 22 / 32 px; preço sugerido 40 px peso 800. Números sempre `tabular-nums` (`.num`).

## Componentes e regras

- Controles com 44 px de altura; foco com anel duplo (branco + verde escuro); campo em erro com anel vermelho.
- Raio 10 px em painéis, 6 px em controles; sombra leve só no recibo.
- Sem cartões dentro de cartões, sem rótulo acima de título, sem borda lateral colorida.
- No celular (≤ 900 px) a navegação vira barra inferior; na cotação (≤ 1100 px) o preço fica fixo acima dela com o botão Enviar.
- Movimento: 150–250 ms, curva `--ease`; respeita `prefers-reduced-motion`.

## Processo

Primeira versão com cobalto provisório, substituída pela identidade do logo. Revisada por capturas em 1440 px e iPhone 13.
O sorteio `concept-seed` e a revisão final por subagente do Impeccable não rodaram neste ambiente.
