import { Body, Controller, Get, NotFoundException, Param, Patch, Post } from '@nestjs/common';
import { z } from 'zod';
import { Perfis, TenantAtual, validar } from '../auth/auth';
import { PrismaService } from '../prisma.service';

const MotoristaSchema = z.object({
  nome: z.string().min(2),
  telefone: z.string().min(8),
  cnh: z.string().optional(),
  cnhValidade: z.coerce.date().optional(),
  chavePix: z.string().optional(),
  qualificacoes: z.array(z.string()).default([]),
});

const VeiculoSchema = z.object({
  driverId: z.string().optional(),
  placa: z.string().min(7).transform((p) => p.toUpperCase().replace(/[^A-Z0-9]/g, '')),
  modelo: z.string().min(2),
  cor: z.string().min(2),
  ano: z.number().int().min(2000).max(2100),
  categoria: z.enum(['EXECUTIVO', 'SUV', 'BLINDADO', 'VAN']).default('EXECUTIVO'),
  origem: z.enum(['MOTORISTA', 'ALUGADO']).default('MOTORISTA'),
  nivelBlindagem: z.string().optional(),
  consumoKmPorLitro: z.number().positive(),
  desgasteCentavosKm: z.number().int().nonnegative().default(40),
});

const ClienteSchema = z.object({
  nome: z.string().min(2),
  documento: z.string().optional(),
  email: z.string().email().optional(),
  telefone: z.string().optional(),
  modoPagamento: z.enum(['PIX_POR_CORRIDA', 'FATURADO']).default('PIX_POR_CORRIDA'),
  diaFechamento: z.number().int().min(1).max(28).optional(),
  prazoVencimento: z.number().int().min(0).max(60).optional(),
  limiteCentavos: z.number().int().nonnegative().optional(),
  preferencias: z.record(z.string()).optional(),
});

/** Cadastros do gestor. Todas as consultas filtram pelo tenant da sessão. */
@Perfis('GESTOR')
@Controller()
export class CadastrosController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('motoristas')
  listarMotoristas(@TenantAtual() tenantId: string) {
    return this.prisma.driver.findMany({ where: { tenantId }, include: { vehicles: true }, orderBy: { nome: 'asc' } });
  }

  @Post('motoristas')
  criarMotorista(@TenantAtual() tenantId: string, @Body() body: unknown) {
    return this.prisma.driver.create({ data: { ...validar(MotoristaSchema, body), tenantId } });
  }

  @Get('motoristas/:id')
  async verMotorista(@TenantAtual() tenantId: string, @Param('id') id: string) {
    const m = await this.prisma.driver.findFirst({ where: { id, tenantId }, include: { vehicles: true } });
    if (!m) throw new NotFoundException('motorista não encontrado');
    return m;
  }

  @Get('veiculos')
  listarVeiculos(@TenantAtual() tenantId: string) {
    return this.prisma.vehicle.findMany({ where: { tenantId }, include: { driver: { select: { id: true, nome: true } } }, orderBy: { modelo: 'asc' } });
  }

  @Post('veiculos')
  async criarVeiculo(@TenantAtual() tenantId: string, @Body() body: unknown) {
    const dados = validar(VeiculoSchema, body);
    if (dados.driverId) {
      const dono = await this.prisma.driver.findFirst({ where: { id: dados.driverId, tenantId } });
      if (!dono) throw new NotFoundException('motorista não encontrado');
    }
    return this.prisma.vehicle.create({ data: { ...dados, tenantId } });
  }

  @Patch('veiculos/:id/aprovacao')
  async aprovarVeiculo(@TenantAtual() tenantId: string, @Param('id') id: string, @Body() body: unknown) {
    const { aprovado } = validar(z.object({ aprovado: z.boolean() }), body);
    const r = await this.prisma.vehicle.updateMany({ where: { id, tenantId }, data: { aprovado } });
    if (r.count === 0) throw new NotFoundException('veículo não encontrado');
    return { id, aprovado };
  }

  @Get('clientes')
  listarClientes(@TenantAtual() tenantId: string) {
    return this.prisma.customer.findMany({ where: { tenantId }, orderBy: { nome: 'asc' } });
  }

  @Post('clientes')
  criarCliente(@TenantAtual() tenantId: string, @Body() body: unknown) {
    return this.prisma.customer.create({ data: { ...validar(ClienteSchema, body), tenantId } });
  }

  @Get('clientes/:id')
  async verCliente(@TenantAtual() tenantId: string, @Param('id') id: string) {
    const c = await this.prisma.customer.findFirst({ where: { id, tenantId } });
    if (!c) throw new NotFoundException('cliente não encontrado');
    return c;
  }
}
