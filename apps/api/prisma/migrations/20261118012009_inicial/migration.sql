-- CreateEnum
CREATE TYPE "Perfil" AS ENUM ('ADMIN_MASTER', 'GESTOR', 'MOTORISTA', 'CLIENTE');

-- CreateEnum
CREATE TYPE "StatusCorrida" AS ENUM ('COTACAO_SOLICITADA', 'PRECO_ENVIADO', 'CONFIRMADA', 'MOTORISTA_DESIGNADO', 'ACEITA_MOTORISTA', 'A_CAMINHO', 'CHEGOU', 'EM_VIAGEM', 'FINALIZADA', 'PAGA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "TipoCorrida" AS ENUM ('PASSAGEIRO', 'OBJETO', 'AMBOS');

-- CreateEnum
CREATE TYPE "CategoriaVeiculo" AS ENUM ('EXECUTIVO', 'SUV', 'BLINDADO', 'VAN');

-- CreateEnum
CREATE TYPE "OrigemVeiculo" AS ENUM ('MOTORISTA', 'ALUGADO');

-- CreateEnum
CREATE TYPE "ModoPagamento" AS ENUM ('PIX_POR_CORRIDA', 'FATURADO');

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "documento" TEXT,
    "slug" TEXT NOT NULL,
    "logoUrl" TEXT,
    "corPrimaria" TEXT,
    "pixChave" TEXT,
    "gestorBps" INTEGER NOT NULL DEFAULT 1500,
    "plataformaBps" INTEGER NOT NULL DEFAULT 700,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefone" TEXT,
    "senhaHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Membership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT,
    "perfil" "Perfil" NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Driver" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT,
    "nome" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "cnh" TEXT,
    "cnhValidade" TIMESTAMP(3),
    "chavePix" TEXT,
    "qualificacoes" TEXT[],
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Driver_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "driverId" TEXT,
    "placa" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "cor" TEXT NOT NULL,
    "ano" INTEGER NOT NULL,
    "categoria" "CategoriaVeiculo" NOT NULL DEFAULT 'EXECUTIVO',
    "origem" "OrigemVeiculo" NOT NULL DEFAULT 'MOTORISTA',
    "nivelBlindagem" TEXT,
    "consumoKmPorLitro" DOUBLE PRECISION NOT NULL,
    "desgasteCentavosKm" INTEGER NOT NULL DEFAULT 40,
    "aprovado" BOOLEAN NOT NULL DEFAULT false,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "documento" TEXT,
    "email" TEXT,
    "telefone" TEXT,
    "modoPagamento" "ModoPagamento" NOT NULL DEFAULT 'PIX_POR_CORRIDA',
    "diaFechamento" INTEGER,
    "prazoVencimento" INTEGER,
    "limiteCentavos" INTEGER,
    "preferencias" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PricingSettings" (
    "tenantId" TEXT NOT NULL,
    "precoCombustivelCentavos" INTEGER NOT NULL DEFAULT 620,
    "desgasteCentavosKm" INTEGER NOT NULL DEFAULT 40,
    "esperaCentavosHora" INTEGER NOT NULL DEFAULT 6000,
    "taxaPixBps" INTEGER NOT NULL DEFAULT 0,
    "arredondarCentavos" INTEGER NOT NULL DEFAULT 1000,

    CONSTRAINT "PricingSettings_pkey" PRIMARY KEY ("tenantId")
);

-- CreateTable
CREATE TABLE "FixedRoute" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "origem" TEXT NOT NULL,
    "destino" TEXT NOT NULL,
    "precoCentavos" INTEGER NOT NULL,

    CONSTRAINT "FixedRoute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentalPartner" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "contato" TEXT,
    "niveis" TEXT[],
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "RentalPartner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trip" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "driverId" TEXT,
    "vehicleId" TEXT,
    "tipo" "TipoCorrida" NOT NULL DEFAULT 'PASSAGEIRO',
    "categoria" "CategoriaVeiculo" NOT NULL DEFAULT 'EXECUTIVO',
    "status" "StatusCorrida" NOT NULL DEFAULT 'COTACAO_SOLICITADA',
    "origem" TEXT NOT NULL,
    "destino" TEXT NOT NULL,
    "agendadaPara" TIMESTAMP(3) NOT NULL,
    "passageiroNome" TEXT,
    "ocultarPassageiro" BOOLEAN NOT NULL DEFAULT false,
    "precoCentavos" INTEGER,
    "motoristaCentavos" INTEGER,
    "gestorCentavos" INTEGER,
    "plataformaCentavos" INTEGER,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Trip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripEvent" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "status" "StatusCorrida" NOT NULL,
    "autorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TripEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocationPoint" (
    "id" BIGSERIAL NOT NULL,
    "tripId" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "velocidade" DOUBLE PRECISION,
    "registradoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LocationPoint_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Membership_tenantId_idx" ON "Membership"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_userId_tenantId_perfil_key" ON "Membership"("userId", "tenantId", "perfil");

-- CreateIndex
CREATE INDEX "Driver_tenantId_idx" ON "Driver"("tenantId");

-- CreateIndex
CREATE INDEX "Vehicle_tenantId_idx" ON "Vehicle"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_tenantId_placa_key" ON "Vehicle"("tenantId", "placa");

-- CreateIndex
CREATE INDEX "Customer_tenantId_idx" ON "Customer"("tenantId");

-- CreateIndex
CREATE INDEX "FixedRoute_tenantId_idx" ON "FixedRoute"("tenantId");

-- CreateIndex
CREATE INDEX "RentalPartner_tenantId_idx" ON "RentalPartner"("tenantId");

-- CreateIndex
CREATE INDEX "Trip_tenantId_status_idx" ON "Trip"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Trip_tenantId_agendadaPara_idx" ON "Trip"("tenantId", "agendadaPara");

-- CreateIndex
CREATE INDEX "TripEvent_tripId_idx" ON "TripEvent"("tripId");

-- CreateIndex
CREATE INDEX "LocationPoint_tripId_registradoEm_idx" ON "LocationPoint"("tripId", "registradoEm");

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Driver" ADD CONSTRAINT "Driver_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PricingSettings" ADD CONSTRAINT "PricingSettings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FixedRoute" ADD CONSTRAINT "FixedRoute_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalPartner" ADD CONSTRAINT "RentalPartner_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripEvent" ADD CONSTRAINT "TripEvent_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationPoint" ADD CONSTRAINT "LocationPoint_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
