# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Gestor** (primary): dono/operador de uma empresa de transporte executivo em Belo Horizonte. Recebe pedidos de clientes recorrentes, fecha preço, designa motoristas, acompanha corridas e cobra. Usa o painel tanto no computador do escritório quanto no celular, na rua, por igual.
- **Admin Master**: dono da plataforma Levva. Vê empresas, volume e comissão registrada; não vê a carteira de clientes dos gestores.
- **Clientes corporativos**: secretárias, assistentes e áreas de bancos e empresas que pedem cotação e acompanham corridas pelo navegador. Exigentes, pouco tempo, esperam um serviço de alto nível.
- Motoristas e passageiros usam o app mobile (fora do escopo web).

## Product Purpose

Tirar a operação de transporte executivo do WhatsApp e da planilha: cotação com preço fechado, calculadora que garante que o motorista cobre seus custos, designação de motorista, rastreio pelo GPS do celular, cobrança por Pix e faturamento de clientes recorrentes. Sucesso é o gestor responder uma cotação em segundos, com preço certo, e provar ao cliente corporativo pontualidade e padrão.

## Positioning

Não é app de corrida. É a ferramenta de uma operação executiva de alto nível — carros novos, blindados sob demanda, atendimento a bancos — onde sigilo, previsibilidade e comprovação valem mais que velocidade de chamada.

## Operating Context

- Pedidos chegam com antecedência (agendamento, recorrência); trecho mais comum é BH ↔ Aeroporto de Confins.
- Preço é fechado com o cliente; a calculadora sugere (custo do motorista ÷ (1 − 15% gestor − 7% plataforma − taxa Pix)).
- Carros são dos motoristas; blindados são alugados de locadoras quando pedidos.
- Pagamento só por Pix (Copia e Cola/QR), baixa manual conferindo o extrato; clientes faturados pagam um Pix por fechamento.
- Multi-empresa por arquitetura, mas no MVP só a empresa do próprio dono opera.

## Capabilities and Constraints

- Stack: Next.js (apps/web) consumindo a API NestJS (apps/api); regras de preço em packages/shared.
- Valores em centavos; moeda BRL; datas e textos em português do Brasil.
- Perfis: ADMIN_MASTER, GESTOR, MOTORISTA, CLIENTE.
- Undecided: domínio; versão do logo para fundo claro; acesso web do cliente corporativo ainda não construído.

## Brand Commitments

- Nome: **Levva — Transporte Executivo** (marca ainda não registrada no INPI).
- Logo oficial fornecido pelo dono: símbolo "L" com estrada e pin de localização verde, linha vertical e o nome LEVVA em geométrica larga com o último A em verde; assinatura "TRANSPORTE EXECUTIVO" espaçada. Arquivos em `apps/web/public/levva-logo.png` e `levva-simbolo.png` (recortados do original, fundo transparente, versão para fundo escuro).
- Cores da marca, vinculantes: preto, branco e verde-limão (~#9BD033, medido no logo).
- Tom: discreto, preciso, de alto padrão; nada de linguagem de app de corrida popular, gamificação ou promoção.

## Evidence on Hand

Nenhum cliente, depoimento, número de desempenho ou foto real ainda. Não inventar clientes, bancos parceiros nem métricas; dados de demonstração devem ser marcados como exemplo.

## Product Principles

1. O preço certo em segundos: a calculadora é o coração do trabalho do gestor.
2. Discrição é recurso: sigilo do passageiro e do trajeto é padrão, não opção escondida.
3. Comprovar, não prometer: pontualidade, checklist e trajeto registrados viram argumento de venda.
4. Funciona igual no escritório e na rua.

## Accessibility & Inclusion

WCAG 2.1 AA como mínimo; alvos de toque confortáveis no celular; contraste alto para uso ao ar livre.
