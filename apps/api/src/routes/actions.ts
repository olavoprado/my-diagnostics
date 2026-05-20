import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

export async function actionRoutes(server: FastifyInstance) {
  server.addHook('onRequest', server.authenticate);

  // Listar Plano de Ação
  server.get('/actions', async (request, reply) => {
    const userCompany = request.user.companies[0];
    if (!userCompany) return reply.status(403).send({ message: "Sem empresa" });

    const actions = await prisma.actionPlan.findMany({
      where: {
        diagnostic: {
          companyId: userCompany.companyId
        }
      },
      include: {
        riskItem: true,
      },
      orderBy: { deadline: 'asc' }
    });

    return { actions };
  });

  // Criar uma nova Ação (PDCA) a partir de um Risco Crítico
  server.post('/actions', async (request, reply) => {
    const createActionSchema = z.object({
      diagnosticId: z.string().uuid(),
      riskItemId: z.string().uuid(),
      description: z.string(),
      deadline: z.string().datetime().optional(),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
      responsibleUserId: z.string().uuid().optional(),
    });

    const data = createActionSchema.parse(request.body);

    const action = await prisma.actionPlan.create({
      data: {
        ...data,
        status: 'PENDING',
      }
    });

    return reply.status(201).send({ action });
  });

  // Atualizar o status da ação
  server.put('/actions/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const updateSchema = z.object({
      status: z.enum(['PENDING', 'IN_PROGRESS', 'DONE', 'OVERDUE']),
      evidenceUrl: z.string().url().optional(),
    });

    const data = updateSchema.parse(request.body);

    const action = await prisma.actionPlan.update({
      where: { id },
      data: {
        ...data,
        completedAt: data.status === 'DONE' ? new Date() : null,
      }
    });

    return { action };
  });
}
