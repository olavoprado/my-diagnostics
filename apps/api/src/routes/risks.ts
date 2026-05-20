import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

export async function riskRoutes(server: FastifyInstance) {
  server.addHook('onRequest', server.authenticate);

  // Listar riscos identificados na matriz de uma empresa/unidade
  server.get('/risks', async (request, reply) => {
    // Para o MVP, pega os riscos do primeiro diagnóstico da empresa do usuário
    const userCompany = request.user.companies[0];
    if (!userCompany) return reply.status(403).send({ message: "Sem empresa" });

    const risks = await prisma.diagnosticRiskItem.findMany({
      where: {
        diagnostic: {
          companyId: userCompany.companyId
        }
      },
      include: {
        riskItem: {
          include: { category: true }
        },
        exposureGroup: true,
        diagnostic: true,
      },
      orderBy: { riskScore: 'desc' }
    });

    return { risks };
  });

  // Atualizar a Probabilidade e Severidade na Matriz (Cálculo do Risco)
  server.put('/risks/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const updateSchema = z.object({
      probability: z.number().int().min(1).max(5).optional(),
      severity: z.number().int().min(1).max(5).optional(),
      currentControls: z.string().optional(),
      recommendedActions: z.string().optional(),
      status: z.enum(['IDENTIFIED', 'CONTROLLED', 'MITIGATED']).optional(),
    });

    const data = updateSchema.parse(request.body);

    const currentRisk = await prisma.diagnosticRiskItem.findUnique({ where: { id } });
    if (!currentRisk) return reply.status(404).send({ message: "Risco não encontrado" });

    const probability = data.probability ?? currentRisk.probability;
    const severity = data.severity ?? currentRisk.severity;
    const riskScore = probability * severity;

    const updated = await prisma.diagnosticRiskItem.update({
      where: { id },
      data: {
        ...data,
        riskScore
      },
      include: {
        riskItem: { include: { category: true } },
        exposureGroup: true
      }
    });

    return { risk: updated };
  });
}
