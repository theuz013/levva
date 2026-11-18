import { Body, Controller, Get, HttpCode, Post, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { z } from 'zod';
import { PrismaService } from '../prisma.service';
import { Publica, Sessao, SessaoAtual, validar } from './auth';

const LoginSchema = z.object({
  email: z.string().email().transform((e) => e.toLowerCase().trim()),
  senha: z.string().min(1),
  /** Quando o usuário tem mais de um perfil, escolhe qual usar. */
  membershipId: z.string().optional(),
});

@Controller('auth')
export class AuthController {
  constructor(private readonly prisma: PrismaService, private readonly jwt: JwtService) {}

  @Publica()
  @Post('login')
  @HttpCode(200)
  async login(@Body() body: unknown) {
    const { email, senha, membershipId } = validar(LoginSchema, body);
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { memberships: { where: { ativo: true }, include: { tenant: true } } },
    });
    // Mesma resposta para e-mail inexistente e senha errada.
    if (!user || !(await bcrypt.compare(senha, user.senhaHash))) {
      throw new UnauthorizedException('e-mail ou senha incorretos');
    }

    const perfis = user.memberships
      .filter((m) => m.tenant === null || m.tenant.ativo)
      .map((m) => ({ membershipId: m.id, perfil: m.perfil, tenantId: m.tenantId, empresa: m.tenant?.nome ?? null }));
    if (perfis.length === 0) throw new UnauthorizedException('conta sem perfil ativo');

    const escolhido = membershipId ? perfis.find((p) => p.membershipId === membershipId) : perfis.length === 1 ? perfis[0] : undefined;
    if (membershipId && !escolhido) throw new UnauthorizedException('perfil não encontrado');
    if (!escolhido) return { precisaEscolherPerfil: true, perfis };

    const sessao: Sessao = { sub: user.id, membershipId: escolhido.membershipId, perfil: escolhido.perfil, tenantId: escolhido.tenantId };
    return {
      token: this.jwt.sign(sessao),
      usuario: { id: user.id, nome: user.nome, email: user.email },
      perfil: escolhido,
      perfis,
    };
  }

  @Get('me')
  async me(@SessaoAtual() sessao: Sessao) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: sessao.sub }, select: { id: true, nome: true, email: true } });
    const tenant = sessao.tenantId
      ? await this.prisma.tenant.findUnique({ where: { id: sessao.tenantId }, select: { id: true, nome: true, slug: true, logoUrl: true, corPrimaria: true } })
      : null;
    return { usuario: user, perfil: sessao.perfil, empresa: tenant };
  }
}
