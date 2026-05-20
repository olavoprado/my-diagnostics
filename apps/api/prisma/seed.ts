import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed de módulos NR-1...');

  // Verifica se o módulo NR-1 já existe
  let nr1 = await prisma.module.findFirst({
    where: { name: 'NR-1' },
  });

  if (!nr1) {
    nr1 = await prisma.module.create({
      data: {
        name: 'NR-1',
        description: 'Programa de Gerenciamento de Riscos (PGR)',
        version: '1.0',
      },
    });
    console.log(`Módulo NR-1 criado com ID: ${nr1.id}`);
  } else {
    console.log(`Módulo NR-1 já existente (ID: ${nr1.id})`);
  }

  const categories = [
    { name: 'Físico', code: 'FISICO' },
    { name: 'Químico', code: 'QUIMICO' },
    { name: 'Biológico', code: 'BIOLOGICO' },
    { name: 'Ergonômico', code: 'ERGONOMICO' },
    { name: 'Acidente', code: 'ACIDENTE' },
  ];

  for (const catData of categories) {
    let category = await prisma.riskCategory.findFirst({
      where: { code: catData.code, moduleId: nr1.id },
    });

    if (!category) {
      category = await prisma.riskCategory.create({
        data: {
          name: catData.name,
          code: catData.code,
          moduleId: nr1.id,
        },
      });
      console.log(`Categoria ${category.name} criada.`);
    }

    // Criar riscos básicos para cada categoria
    if (catData.code === 'FISICO') {
      const risks = [
        { code: 'FIS-01', description: 'Ruído contínuo ou intermitente', severityDefault: 3 },
        { code: 'FIS-02', description: 'Vibrações de corpo inteiro', severityDefault: 3 },
      ];
      for (const risk of risks) {
        await prisma.riskItem.upsert({
          where: { id: 'dummy' }, // Trick for upsert without unique fields
          update: {},
          create: { ...risk, riskCategoryId: category.id },
        }).catch(async () => {
          // Fallback if upsert fails on missing unique index
          const exists = await prisma.riskItem.findFirst({ where: { code: risk.code, riskCategoryId: category.id } });
          if (!exists) {
            await prisma.riskItem.create({ data: { ...risk, riskCategoryId: category.id } });
          }
        });
      }
    }

    if (catData.code === 'ERGONOMICO') {
      const risks = [
        { code: 'ERG-01', description: 'Levantamento e transporte manual de peso', severityDefault: 4 },
        { code: 'ERG-02', description: 'Trabalho noturno ou em turnos', severityDefault: 2 },
      ];
      for (const risk of risks) {
        const exists = await prisma.riskItem.findFirst({ where: { code: risk.code, riskCategoryId: category.id } });
        if (!exists) {
          await prisma.riskItem.create({ data: { ...risk, riskCategoryId: category.id } });
        }
      }
    }
  }

  console.log('Seed NR-1 concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
