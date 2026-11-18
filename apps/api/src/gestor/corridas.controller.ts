import { BadRequestException, Body, Controller, Get, NotFoundException, Param, Post, Query } from '@nestjs/common';
import { calcularPreco, dividirCorrida, gerarPixCopiaECola, podeTransitar, type StatusCorrida } from '@levva/shared';
import { z } from 'zod';
import { Perfis, Sessao, SessaoAtual, TenantAtual, validar } from '../auth/auth';
import { PrismaService } from '../prisma.service';

const CalculoSchema = z.object({
  distanciaKm: z.number().nonnegative(),
  retornoVazio: z.boolean().default(false),
  vehicleId: z.string().optional(),
  consumoKmPorLitro: z.number().positive().optional(),
  tempoMotoristaCentavos: z.number().int().nonnegative(),
  pedagiosCentavos: z.number().int().nonnegative().optional(),
  esperaHoras: z.number().nonnegative().optional(),
  adicionais: z
    .array(
      z.discriminatedUnion('tipo', [
        z.object({ nome: z.string(), tipo: z.literal('percentual'), bps: z.number().int().nonnegative() }),
        z.object({ nome: z.string(), tipo: z.literal('fixo'), centavos: z.number().int().nonnegative() }),
      ]),
    )
    .optional(),
  aluguel: z
    .object({
      diariaCentavos: z.number().int().nonnegative(),
      dias: z.number().int().positive(),
      kmExcedenteCentavos: z.number().int().nonnegative().optional(),
      entregaRetiradaCentavos: z.number().int().nonnegative().optional(),
    })
    .optional(),
});

const NovaCorridaSchema = z.object({
  customerId: z.string(),
  tipo: z.enum(['PASSAGEIRO', 'OBJETO', 'AMBOS']).default('PASSAGEIRO'),
  categoria: z.enum(['EXECUTIVO', 'SUV', 'BLINDADO', 'VAN']).default('EXECUTIVO'),
  origem: z.string().min(3),
  destino: z.string().min(3),
  agendadaPara: z.coerce.date(),
  passageiroNome: z.string().optional(),
  ocultarPassageiro: z.boolean().default(false),
  observacoes: z.string().optional(),
});

@Perfis('GESTOR')
@Controller()
export class CorridasController {
  constructor(private readonly prisma: PrismaService) {}

  /** Calculadora: sugere o preço com base nas configurações da empresa. */
  @Post('precos/calcular')
  async calcular(@TenantAtual() tenantId: string, @Body() body: unknown) {
    const e = validar(CalculoSchema, body);
    const [tenant, cfg] = await Promise.all([
      this.prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } }),
      this.prisma.pricingSettings.findUnique({ where: { tenantId } }),
    ]);
    let consumo = e.consumoKmPorLitro;
    let desgaste = cfg?.desgasteCentavosKm ?? 40;
    if (e.vehicleId) {
      const v = await this.prisma.vehicle.findFirst({ where: { id: e.vehicleId, tenantId } });
      if (!v) throw new NotFoundException('veículo não encontrado');
      consumo = v.consumoKmPorLitro;
      desgaste = v.desgasteCentavosKm;
    }
    if (!consumo) throw new BadRequestException('informe o veículo ou o consumo (km/L)');

    return calcularPreco({
      distanciaKm: e.distanciaKm,
      retornoVazio: e.retornoVazio,
      consumoKmPorLitro: consumo,
      precoCombustivelCentavosPorLitro: cfg?.precoCombustivelCentavos ?? 620,
      desgasteCentavosPorKm: desgaste,
      pedagiosCentavos: e.pedagiosCentavos,
      tempoMotoristaCentavos: e.tempoMotoristaCentavos,
      esperaHoras: e.esperaHoras,
      esperaCentavosPorHora: cfg?.esperaCentavosHora ?? 6000,
      adicionais: e.adicionais,
      aluguel: e.aluguel,
      gestorBps: tenant.gestorBps,
      plataformaBps: tenant.plataformaBps,
      taxaPixBps: cfg?.taxaPixBps ?? 0,
      arredondarParaCentavos: cfg?.arredondarCentavos ?? 1000,
    });
  }

  @Get('corridas')
  listar(@TenantAtual() tenantId: string, @Query('status') status?: string) {
    return this.prisma.trip.findMany({
      where: { tenantId, ...(status ? { status: status as StatusCorrida } : {}) },
      include: { customer: { select: { id: true, nome: true } }, driver: { select: { id: true, nome: true } } },
      orderBy: { agendadaPara: 'asc' },
    });
  }

  /** O gestor cria a corrida (ex.: pedido que chegou por WhatsApp). */
  @Post('corridas')
  async criar(@TenantAtual() tenantId: string, @SessaoAtual() s: Sessao, @Body() body: unknown) {
    const dados = validar(NovaCorridaSchema, body);
    const cliente = await this.prisma.customer.findFirst({ where: { id: dados.customerId, tenantId } });
    if (!cliente) throw new NotFoundException('cliente não encontrado');
    return this.prisma.trip.create({
      data: { ...dados, tenantId, events: { create: { status: 'COTACAO_SOLICITADA', autorId: s.sub } } },
    });
  }

  /** Envia o preço fechado ao cliente e registra a divisão da corrida. */
  @Post('corridas/:id/preco')
  async enviarPreco(@TenantAtual() tenantId: string, @SessaoAtual() s: Sessao, @Param('id') id: string, @Body() body: unknown) {
    const { precoCentavos, locadoraCentavos } = validar(
      z.object({ precoCentavos: z.number().int().positive(), locadoraCentavos: z.number().int().nonnegative().default(0) }),
      body,
    );
    const corrida = await this.buscar(tenantId, id);
    const tenant = await this.prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } });
    const cfg = await this.prisma.pricingSettings.findUnique({ where: { tenantId } });
    const d = dividirCorrida(precoCentavos, {
      gestorBps: tenant.gestorBps,
      plataformaBps: tenant.plataformaBps,
      taxaPixBps: cfg?.taxaPixBps ?? 0,
      locadoraCentavos,
    });
    return this.transitar(corrida.id, corrida.status, 'PRECO_ENVIADO', s.sub, {
      precoCentavos,
      gestorCentavos: d.gestorCentavos,
      plataformaCentavos: d.plataformaCentavos,
      motoristaCentavos: d.motoristaCentavos,
    });
  }

  @Post('corridas/:id/confirmar')
  async confirmar(@TenantAtual() tenantId: string, @SessaoAtual() s: Sessao, @Param('id') id: string) {
    const corrida = await this.buscar(tenantId, id);
    return this.transitar(corrida.id, corrida.status, 'CONFIRMADA', s.sub);
  }

  /** Designa motorista e veículo. O veículo precisa estar aprovado e ser da mesma empresa. */
  @Post('corridas/:id/designar')
  async designar(@TenantAtual() tenantId: string, @SessaoAtual() s: Sessao, @Param('id') id: string, @Body() body: unknown) {
    const { driverId, vehicleId, motoristaCentavos } = validar(
      z.object({ driverId: z.string(), vehicleId: z.string(), motoristaCentavos: z.number().int().nonnegative().optional() }),
      body,
    );
    const corrida = await this.buscar(tenantId, id);
    const [motorista, veiculo] = await Promise.all([
      this.prisma.driver.findFirst({ where: { id: driverId, tenantId, ativo: true } }),
      this.prisma.vehicle.findFirst({ where: { id: vehicleId, tenantId, ativo: true } }),
    ]);
    if (!motorista) throw new NotFoundException('motorista não encontrado');
    if (!veiculo) throw new NotFoundException('veículo não encontrado');
    if (!veiculo.aprovado) throw new BadRequestException('veículo fora do padrão: aprove antes de designar');
    if (veiculo.categoria !== corrida.categoria) throw new BadRequestException(`a corrida pede categoria ${corrida.categoria}`);

    return this.transitar(corrida.id, corrida.status, 'MOTORISTA_DESIGNADO', s.sub, {
      driverId,
      vehicleId,
      ...(motoristaCentavos !== undefined ? { motoristaCentavos } : {}),
    });
  }

  /** Pix Copia e Cola da corrida, para a chave Pix da empresa. */
  @Get('corridas/:id/pix')
  async pix(@TenantAtual() tenantId: string, @Param('id') id: string) {
    const corrida = await this.buscar(tenantId, id);
    if (!corrida.precoCentavos) throw new BadRequestException('a corrida ainda não tem preço');
    const tenant = await this.prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } });
    const chave = tenant.pixChave ?? process.env.PIX_CHAVE;
    if (!chave) throw new BadRequestException('cadastre a chave Pix da empresa');
    const copiaECola = gerarPixCopiaECola({
      chave,
      nomeRecebedor: tenant.nome,
      cidade: process.env.PIX_CIDADE ?? 'Belo Horizonte',
      valorCentavos: corrida.precoCentavos,
      txid: corrida.id.slice(-25),
    });
    return { valorCentavos: corrida.precoCentavos, copiaECola };
  }

  /** Baixa manual: o gestor confere o extrato do banco e marca como paga. */
  @Post('corridas/:id/pagamento')
  async registrarPagamento(@TenantAtual() tenantId: string, @SessaoAtual() s: Sessao, @Param('id') id: string) {
    const corrida = await this.buscar(tenantId, id);
    return this.transitar(corrida.id, corrida.status, 'PAGA', s.sub);
  }

  private async buscar(tenantId: string, id: string) {
    const corrida = await this.prisma.trip.findFirst({ where: { id, tenantId } });
    if (!corrida) throw new NotFoundException('corrida não encontrada');
    return corrida;
  }

  private async transitar(id: string, de: StatusCorrida, para: StatusCorrida, autorId: string, dados: object = {}) {
    if (!podeTransitar(de, para)) throw new BadRequestException(`não é possível passar de ${de} para ${para}`);
    // updateMany com o status antigo evita duas mudanças simultâneas na mesma corrida.
    const r = await this.prisma.trip.updateMany({ where: { id, status: de }, data: { ...dados, status: para } });
    if (r.count === 0) throw new BadRequestException('a corrida mudou enquanto você editava; recarregue');
    await this.prisma.tripEvent.create({ data: { tripId: id, status: para, autorId } });
    return this.prisma.trip.findUniqueOrThrow({ where: { id } });
  }
}
