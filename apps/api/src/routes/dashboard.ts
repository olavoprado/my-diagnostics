import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';

export async function dashboardRoutes(server: FastifyInstance) {
  server.addHook('onRequest', server.authenticate);

  server.get('/dashboard/stats', async (request, reply) => {
    const userCompany = request.user.companies[0];
    if (!userCompany) return reply.status(403).send({ message: "Não autorizado." });

    const companyId = userCompany.companyId;

    // 1. Riscos Críticos (Score > 15 no MVP)
    const criticalRisksCount = await prisma.diagnosticRiskItem.count({
      where: {
        diagnostic: { companyId },
        riskScore: { gt: 15 }
      }
    });

    // 2. Ações Concluídas e Atrasadas
    const actions = await prisma.actionPlan.findMany({
      where: { diagnostic: { companyId } }
    });

    const completedActions = actions.filter(a => a.status === 'DONE').length;
    const overdueActions = actions.filter(a => {
       const isOverdueStatus = a.status === 'OVERDUE';
       const isExpired = a.deadline && a.deadline < new Date() && a.status !== 'DONE';
       return isOverdueStatus || isExpired;
    }).length;

    // 3. Nível de Risco Global (Média dos scores)
    const riskItems = await prisma.diagnosticRiskItem.findMany({
      where: { diagnostic: { companyId } },
      select: { riskScore: true }
    });

    const avgScore = riskItems.length > 0 
      ? riskItems.reduce((acc, curr) => acc + curr.riskScore, 0) / riskItems.length 
      : 0;

    let globalRiskLevel = "Baixo";
    if (avgScore > 15) globalRiskLevel = "Crítico";
    else if (avgScore > 10) globalRiskLevel = "Alto";
    else if (avgScore > 5) globalRiskLevel = "Médio";

    return {
      stats: {
        globalRiskLevel,
        criticalRisksCount,
        completedActions,
        overdueActions,
        avgScore
      }
    };
  });
}
