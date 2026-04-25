import { PrismaClient, RiskLevel, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const locations = [
  { name: "Praça Central", riskLevel: RiskLevel.LOW, description: "Centro urbano com grande circulação de jogadores." },
  { name: "Banco Central", riskLevel: RiskLevel.MEDIUM, description: "Instituição financeira com vigilância e operações bancárias." },
  { name: "Hospital", riskLevel: RiskLevel.MEDIUM, description: "Atendimento médico para ferimentos e emergências." },
  { name: "Delegacia", riskLevel: RiskLevel.HIGH, description: "Base de operações policiais e registro de ocorrências." },
  { name: "Prefeitura", riskLevel: RiskLevel.LOW, description: "Órgão público para protocolos e documentos." },
  { name: "Mercado", riskLevel: RiskLevel.LOW, description: "Comércio local e interações cotidianas." },
  { name: "Mecânica", riskLevel: RiskLevel.MEDIUM, description: "Serviços de reparo e logística urbana." },
  { name: "Beco Industrial", riskLevel: RiskLevel.EXTREME, description: "Zona de alto risco com eventos críticos." }
];

const basicActions = [
  ["talk", "Conversar"],
  ["observe", "Observar"],
  ["enter", "Entrar"],
  ["leave", "Sair"],
  ["request_service", "Solicitar atendimento"],
  ["withdraw", "Sacar dinheiro"],
  ["deposit", "Depositar"],
  ["call_police", "Chamar polícia"],
  ["call_medic", "Solicitar médico"],
  ["draw_weapon", "Sacar arma"],
  ["rob", "Assaltar"],
  ["surrender", "Se render"],
  ["flee", "Fugir"]
] as const;

async function main() {
  for (const location of locations) {
    await prisma.location.upsert({
      where: { name: location.name },
      update: location,
      create: location
    });
  }

  for (const [key, label] of basicActions) {
    await prisma.actionCatalog.upsert({
      where: { key },
      update: { label },
      create: { key, label }
    });
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (adminEmail && adminPassword) {
    const hash = await bcrypt.hash(adminPassword, 12);
    await prisma.user.upsert({
      where: { email: adminEmail },
      update: { passwordHash: hash, role: UserRole.master_admin },
      create: {
        username: "master_admin",
        email: adminEmail,
        passwordHash: hash,
        role: UserRole.master_admin
      }
    });
  }

  console.log("Seed concluído com locais e ações básicas.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
