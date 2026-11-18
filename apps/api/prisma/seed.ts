import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

// Dados iniciais de desenvolvimento: a empresa própria como primeiro gestor.
const prisma = new PrismaClient();

async function main() {
  const senha = process.env.SEED_SENHA;
  if (!senha) throw new Error('defina SEED_SENHA no .env para criar os usuários iniciais');
  const senhaHash = await bcrypt.hash(senha, 10);

  const empresa = await prisma.tenant.upsert({
    where: { slug: 'operacao' },
    update: {},
    create: { nome: 'Operação Levva', slug: 'operacao', pixChave: process.env.PIX_CHAVE },
  });
  await prisma.pricingSettings.upsert({ where: { tenantId: empresa.id }, update: {}, create: { tenantId: empresa.id } });

  await prisma.user.upsert({
    where: { email: 'admin@levva.local' },
    update: {},
    create: { nome: 'Admin Master', email: 'admin@levva.local', senhaHash, memberships: { create: { perfil: 'ADMIN_MASTER' } } },
  });
  await prisma.user.upsert({
    where: { email: 'gestor@levva.local' },
    update: {},
    create: { nome: 'Gestor', email: 'gestor@levva.local', senhaHash, memberships: { create: { perfil: 'GESTOR', tenantId: empresa.id } } },
  });
  console.log('Seed pronto: admin@levva.local e gestor@levva.local');
}

main().finally(() => prisma.$disconnect());
