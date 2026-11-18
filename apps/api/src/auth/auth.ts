import {
  BadRequestException,
  CanActivate,
  createParamDecorator,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Perfil } from '@prisma/client';
import { z } from 'zod';

/** Conteúdo do token. tenantId vem SEMPRE daqui, nunca do corpo da requisição. */
export interface Sessao {
  sub: string;
  membershipId: string;
  perfil: Perfil;
  tenantId: string | null;
}

export const PERFIS_KEY = 'perfis';
export const PUBLICA_KEY = 'publica';

/** Restringe a rota aos perfis informados. */
export const Perfis = (...perfis: Perfil[]) => SetMetadata(PERFIS_KEY, perfis);
/** Libera a rota sem login. */
export const Publica = () => SetMetadata(PUBLICA_KEY, true);

export const SessaoAtual = createParamDecorator((_: unknown, ctx: ExecutionContext): Sessao => {
  return ctx.switchToHttp().getRequest().sessao;
});

/** tenantId da sessão; falha se o perfil não pertence a uma empresa. */
export const TenantAtual = createParamDecorator((_: unknown, ctx: ExecutionContext): string => {
  const sessao: Sessao | undefined = ctx.switchToHttp().getRequest().sessao;
  if (!sessao?.tenantId) throw new ForbiddenException('perfil sem empresa vinculada');
  return sessao.tenantId;
});

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService, private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const alvo = [ctx.getHandler(), ctx.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(PUBLICA_KEY, alvo)) return true;

    const req = ctx.switchToHttp().getRequest();
    const header: string | undefined = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) throw new UnauthorizedException('login necessário');
    try {
      req.sessao = this.jwt.verify<Sessao>(header.slice(7));
    } catch {
      throw new UnauthorizedException('sessão inválida ou expirada');
    }

    const perfis = this.reflector.getAllAndOverride<Perfil[] | undefined>(PERFIS_KEY, alvo);
    if (perfis && !perfis.includes(req.sessao.perfil)) {
      throw new ForbiddenException('perfil sem permissão para esta ação');
    }
    return true;
  }
}

export function validar<S extends z.ZodTypeAny>(schema: S, dados: unknown): z.output<S> {
  const r = schema.safeParse(dados);
  if (!r.success) {
    throw new BadRequestException({
      mensagem: 'dados inválidos',
      erros: r.error.issues.map((i) => ({ campo: i.path.join('.'), mensagem: i.message })),
    });
  }
  return r.data;
}
