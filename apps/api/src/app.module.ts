import { Controller, Get, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { AdminController } from './admin/admin.controller';
import { AuthGuard, Publica } from './auth/auth';
import { AuthController } from './auth/auth.controller';
import { CadastrosController } from './gestor/cadastros.controller';
import { CorridasController } from './gestor/corridas.controller';
import { PrismaModule } from './prisma.service';

@Controller()
class SaudeController {
  @Publica()
  @Get('saude')
  saude() {
    return { ok: true };
  }
}

function segredoJwt(): string {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error('JWT_SECRET não definido');
  return s;
}

@Module({
  imports: [PrismaModule, JwtModule.register({ global: true, secret: segredoJwt(), signOptions: { expiresIn: '12h' } })],
  controllers: [SaudeController, AuthController, CadastrosController, CorridasController, AdminController],
  // Todas as rotas exigem login, exceto as marcadas com @Publica().
  providers: [{ provide: APP_GUARD, useClass: AuthGuard }],
})
export class AppModule {}
