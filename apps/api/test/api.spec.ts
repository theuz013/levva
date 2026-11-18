import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient, Perfil } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import request from 'supertest';
import { AppModule } from '../src/app.module';

const prisma = new PrismaClient();
let app: INestApplication;
const SENHA = 'senha-forte-123';

async function criarUsuario(email: string, vinculos: { perfil: Perfil; tenantId: string | null }[]) {
  return prisma.user.create({
    data: {
      nome: email.split('@')[0],
      email,
      senhaHash: await bcrypt.hash(SENHA, 4),
      memberships: { create: vinculos.map((v) => ({ perfil: v.perfil, tenantId: v.tenantId })) },
    },
  });
}

async function login(email: string, membershipId?: string): Promise<string> {
  const r = await request(app.getHttpServer()).post('/auth/login').send({ email, senha: SENHA, membershipId }).expect(200);
  return r.body.token;
}

const api = () => request(app.getHttpServer());

let tokenA: string, tokenB: string, tokenAdmin: string, tokenMotorista: string;
let empresaA: string;

beforeAll(async () => {
  const mod = await Test.createTestingModule({ imports: [AppModule] }).compile();
  app = mod.createNestApplication();
  await app.init();

  const a = await prisma.tenant.create({ data: { nome: 'Executivo A', slug: 'exec-a', pixChave: '12345678000199' } });
  const b = await prisma.tenant.create({ data: { nome: 'Executivo B', slug: 'exec-b' } });
  empresaA = a.id;
  await prisma.pricingSettings.create({ data: { tenantId: a.id, taxaPixBps: 100 } });

  await criarUsuario('gestor.a@teste.com', [{ perfil: 'GESTOR', tenantId: a.id }]);
  await criarUsuario('gestor.b@teste.com', [{ perfil: 'GESTOR', tenantId: b.id }]);
  await criarUsuario('admin@teste.com', [{ perfil: 'ADMIN_MASTER', tenantId: null }]);
  await criarUsuario('motorista@teste.com', [{ perfil: 'MOTORISTA', tenantId: a.id }]);

  [tokenA, tokenB, tokenAdmin, tokenMotorista] = await Promise.all([
    login('gestor.a@teste.com'),
    login('gestor.b@teste.com'),
    login('admin@teste.com'),
    login('motorista@teste.com'),
  ]);
});

afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

describe('login', () => {
  it('recusa senha errada sem revelar se o e-mail existe', async () => {
    const errada = await api().post('/auth/login').send({ email: 'gestor.a@teste.com', senha: 'x' }).expect(401);
    const inexistente = await api().post('/auth/login').send({ email: 'ninguem@teste.com', senha: 'x' }).expect(401);
    expect(errada.body.message).toBe(inexistente.body.message);
  });

  it('pede escolha de perfil quando o usuário tem mais de um', async () => {
    await criarUsuario('duplo@teste.com', [
      { perfil: 'GESTOR', tenantId: empresaA },
      { perfil: 'MOTORISTA', tenantId: empresaA },
    ]);
    const r = await api().post('/auth/login').send({ email: 'duplo@teste.com', senha: SENHA }).expect(200);
    expect(r.body.precisaEscolherPerfil).toBe(true);
    const motorista = r.body.perfis.find((p: { perfil: string }) => p.perfil === 'MOTORISTA');
    const token = await login('duplo@teste.com', motorista.membershipId);
    const me = await api().get('/auth/me').set('Authorization', `Bearer ${token}`).expect(200);
    expect(me.body.perfil).toBe('MOTORISTA');
  });

  it('exige login nas rotas protegidas', async () => {
    await api().get('/clientes').expect(401);
    await api().get('/clientes').set('Authorization', 'Bearer token-falso').expect(401);
  });
});

describe('isolamento entre empresas', () => {
  let clienteA: string;

  beforeAll(async () => {
    const r = await api().post('/clientes').set('Authorization', `Bearer ${tokenA}`).send({ nome: 'Banco Exemplo', modoPagamento: 'FATURADO' }).expect(201);
    clienteA = r.body.id;
  });

  it('gestor B não vê clientes do gestor A', async () => {
    const lista = await api().get('/clientes').set('Authorization', `Bearer ${tokenB}`).expect(200);
    expect(lista.body).toEqual([]);
    await api().get(`/clientes/${clienteA}`).set('Authorization', `Bearer ${tokenB}`).expect(404);
  });

  it('gestor B não cria corrida para cliente do gestor A', async () => {
    await api()
      .post('/corridas')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ customerId: clienteA, origem: 'Savassi', destino: 'Aeroporto de Confins', agendadaPara: '2026-12-01T08:00:00-03:00' })
      .expect(404);
  });

  it('o tenantId enviado no corpo é ignorado', async () => {
    const r = await api().post('/clientes').set('Authorization', `Bearer ${tokenB}`).send({ nome: 'Intruso', tenantId: empresaA }).expect(201);
    const salvo = await prisma.customer.findUniqueOrThrow({ where: { id: r.body.id } });
    expect(salvo.tenantId).not.toBe(empresaA);
  });

  it('motorista e admin não acessam rotas do gestor', async () => {
    await api().get('/clientes').set('Authorization', `Bearer ${tokenMotorista}`).expect(403);
    await api().get('/clientes').set('Authorization', `Bearer ${tokenAdmin}`).expect(403);
  });

  it('gestor não acessa o painel do Admin Master', async () => {
    await api().get('/admin/empresas').set('Authorization', `Bearer ${tokenA}`).expect(403);
  });
});

describe('ciclo da corrida', () => {
  it('cotação → preço → confirmação → designação → Pix', async () => {
    const auth = { Authorization: `Bearer ${tokenA}` };
    const cliente = await api().post('/clientes').set(auth).send({ nome: 'Diretoria Financeira' }).expect(201);
    const motorista = await api().post('/motoristas').set(auth).send({ nome: 'Carlos Souza', telefone: '31999990000' }).expect(201);
    const veiculo = await api()
      .post('/veiculos')
      .set(auth)
      .send({ driverId: motorista.body.id, placa: 'ABC-1D23', modelo: 'Toyota Corolla', cor: 'Preto', ano: 2025, consumoKmPorLitro: 10 })
      .expect(201);

    const calc = await api()
      .post('/precos/calcular')
      .set(auth)
      .send({ distanciaKm: 40, retornoVazio: true, vehicleId: veiculo.body.id, tempoMotoristaCentavos: 7000 })
      .expect(201);
    expect(calc.body.precoSugeridoCentavos).toBe(20000);

    const corrida = await api()
      .post('/corridas')
      .set(auth)
      .send({ customerId: cliente.body.id, origem: 'Savassi', destino: 'Aeroporto de Confins', agendadaPara: '2026-12-01T08:00:00-03:00' })
      .expect(201);
    const id = corrida.body.id;

    const comPreco = await api().post(`/corridas/${id}/preco`).set(auth).send({ precoCentavos: 20000 }).expect(201);
    expect(comPreco.body).toMatchObject({ status: 'PRECO_ENVIADO', gestorCentavos: 3000, plataformaCentavos: 1400, motoristaCentavos: 15400 });

    // Não pode pular etapas.
    await api().post(`/corridas/${id}/pagamento`).set(auth).expect(400);
    await api().post(`/corridas/${id}/confirmar`).set(auth).expect(201);

    // Veículo ainda não aprovado no padrão executivo.
    const designacao = { driverId: motorista.body.id, vehicleId: veiculo.body.id };
    await api().post(`/corridas/${id}/designar`).set(auth).send(designacao).expect(400);
    await api().patch(`/veiculos/${veiculo.body.id}/aprovacao`).set(auth).send({ aprovado: true }).expect(200);
    const designada = await api().post(`/corridas/${id}/designar`).set(auth).send(designacao).expect(201);
    expect(designada.body.status).toBe('MOTORISTA_DESIGNADO');

    const pix = await api().get(`/corridas/${id}/pix`).set(auth).expect(200);
    expect(pix.body.copiaECola).toContain('5406200.00');

    const eventos = await prisma.tripEvent.findMany({ where: { tripId: id } });
    expect(eventos.map((e) => e.status)).toEqual(['COTACAO_SOLICITADA', 'PRECO_ENVIADO', 'CONFIRMADA', 'MOTORISTA_DESIGNADO']);
  });

  it('Admin Master vê volume e comissão, sem dados de clientes', async () => {
    const r = await api().get('/admin/empresas').set('Authorization', `Bearer ${tokenAdmin}`).expect(200);
    expect(r.body.length).toBeGreaterThanOrEqual(2);
    expect(JSON.stringify(r.body)).not.toContain('Diretoria Financeira');
  });
});
