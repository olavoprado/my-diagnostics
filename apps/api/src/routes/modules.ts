import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

export async function moduleRoutes(server: FastifyInstance) {
  // Add onRequest hook to authenticate all routes in this file
  server.addHook('onRequest', server.authenticate);

  // List all modules
  server.get('/modules', async (request, reply) => {
    const modules = await prisma.module.findMany({
      include: {
        categories: {
          include: {
            items: true
          }
        }
      }
    });
    return { modules };
  });

  // Create a new module (Admin only ideally, but we keep it open for now)
  server.post('/modules', async (request, reply) => {
    const createModuleSchema = z.object({
      name: z.string(),
      description: z.string().optional(),
      version: z.string().default("1.0"),
    });

    const { name, description, version } = createModuleSchema.parse(request.body);

    const module = await prisma.module.create({
      data: { name, description, version }
    });

    return reply.status(201).send({ module });
  });

  // Create a Risk Category for a Module
  server.post('/modules/:moduleId/categories', async (request, reply) => {
    const createCategorySchema = z.object({
      name: z.string(),
      code: z.string(),
    });

    const { moduleId } = request.params as { moduleId: string };
    const { name, code } = createCategorySchema.parse(request.body);

    const category = await prisma.riskCategory.create({
      data: {
        name,
        code,
        moduleId,
      }
    });

    return reply.status(201).send({ category });
  });

  // Create a Risk Item (Danger/Factor) inside a Category
  server.post('/categories/:categoryId/items', async (request, reply) => {
    const createRiskItemSchema = z.object({
      code: z.string(),
      description: z.string(),
      severityDefault: z.number().int().min(1).max(5),
    });

    const { categoryId } = request.params as { categoryId: string };
    const { code, description, severityDefault } = createRiskItemSchema.parse(request.body);

    const riskItem = await prisma.riskItem.create({
      data: {
        code,
        description,
        severityDefault,
        riskCategoryId: categoryId,
      }
    });

    return reply.status(201).send({ riskItem });
  });
}
