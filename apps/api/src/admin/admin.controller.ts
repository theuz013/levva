import { Controller, Get } from '@nestjs/common';
import { Perfis } from '../auth/auth';
import { PrismaService } from '../prisma.service';

/**
 * Admin Master: vê empresas, volume e comissão registrada.
 * Não vê clientes, preços por cliente nem dados de motoristas dos gestores.
 */
@Perfis('ADMIN_MASTER')
@Controller('admin')
export class AdminController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('empresas')
  async empresas() {
    const tenants = await this.prisma.tenant.findMany({ select: { id: true, nome: true, slug: true, ativo: true, gestorBps: true, plataformaBps: true } });
    const totais = await this.prisma.trip.groupBy({
      by: ['tenantId'],
      where: { status: 'PAGA' },
      _count: { _all: true },
      _sum: { precoCentavos: true, plataformaCentavos: true },
    });
    return tenants.map((t) => {
      const s = totais.find((x) => x.tenantId === t.id);
      return {
        ...t,
        corridasPagas: s?._count._all ?? 0,
        volumeCentavos: s?._sum.precoCentavos ?? 0,
        comissaoCentavos: s?._sum.plataformaCentavos ?? 0,
      };
    });
  }
}
