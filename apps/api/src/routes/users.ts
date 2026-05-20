import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

export async function userRoutes(server: FastifyInstance) {
  server.addHook('onRequest', server.authenticate);

  // Obter perfil do usuário e da empresa ativa
  server.get('/users/profile', async (request, reply) => {
    const userCompany = request.user.companies[0];
    if (!userCompany) return reply.status(403).send({ message: "Usuário não vinculado a uma empresa." });

    const user = await prisma.user.findUnique({
      where: { id: request.user.sub },
      select: { id: true, name: true, email: true }
    });

    const company = await prisma.company.findUnique({
      where: { id: userCompany.companyId },
      include: {
        workplaces: true
      }
    });

    return { 
      user: { 
        ...user, 
        role: userCompany.role 
      }, 
      company 
    };
  });

  // Atualizar dados da empresa
  server.put('/companies/active', async (request, reply) => {
    const userCompany = request.user.companies[0];
    if (!userCompany) return reply.status(403).send({ message: "Não autorizado." });

    const updateSchema = z.object({
      name: z.string().optional(),
      cnpj: z.string().optional(),
      logoUrl: z.string().url().optional().or(z.literal('')),
    });

    const data = updateSchema.parse(request.body);

    const updated = await prisma.company.update({
      where: { id: userCompany.companyId },
      data
    });

    return { company: updated };
  });

  // Listar usuários da empresa
  server.get('/users/company', async (request, reply) => {
    const userCompany = request.user.companies[0];
    if (!userCompany) return reply.status(403).send({ message: "Não autorizado." });

    const where: any = { companyId: userCompany.companyId };
    
    // Se for GESTOR, não pode ver os ADMINS
    if (userCompany.role === 'GESTOR') {
      where.role = { not: 'ADMIN' };
    }

    const users = await prisma.userCompany.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, createdAt: true } }
      }
    });

    return { users };
  });

  // Convidar/Criar usuário para a empresa (MVP)
  server.post('/users/company', async (request, reply) => {
    const userCompany = request.user.companies[0];
    if (!userCompany) return reply.status(403).send({ message: "Não autorizado." });

    // Apenas Admin ou Gestor pode adicionar
    if (userCompany.role !== 'ADMIN' && userCompany.role !== 'GESTOR') {
      return reply.status(403).send({ message: "Apenas administradores podem adicionar usuários." });
    }

    const inviteSchema = z.object({
      name: z.string(),
      email: z.string().email(),
      role: z.enum(['ADMIN', 'GESTOR', 'COLABORADOR', 'AUDITOR'])
    });

    const { name, email, role } = inviteSchema.parse(request.body);

    // Se for GESTOR, não pode convidar um ADMIN
    if (userCompany.role === 'GESTOR' && role === 'ADMIN') {
      return reply.status(403).send({ message: "Gestores não podem convidar administradores." });
    }

    // No MVP, vamos criar o usuário com senha padrão se ele não existir
    let user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      const bcrypt = require('bcryptjs');
      const passwordHash = await bcrypt.hash('senha123', 8);
      user = await prisma.user.create({
        data: { name, email, passwordHash }
      });
    }

    // Vincula à empresa
    const existingLink = await prisma.userCompany.findUnique({
      where: {
        userId_companyId: { userId: user.id, companyId: userCompany.companyId }
      }
    });

    if (existingLink) {
      return reply.status(400).send({ message: "Usuário já pertence à empresa." });
    }

    const newLink = await prisma.userCompany.create({
      data: { userId: user.id, companyId: userCompany.companyId, role },
      include: { user: { select: { id: true, name: true, email: true } } }
    });

    return reply.status(201).send({ message: "Usuário adicionado com sucesso", userCompany: newLink });
  });
}
