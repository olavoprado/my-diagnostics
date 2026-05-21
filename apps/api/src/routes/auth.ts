import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';

export async function authRoutes(server: FastifyInstance) {
  // Register route
  server.post('/auth/register', async (request, reply) => {
    const registerSchema = z.object({
      name: z.string(),
      email: z.string().email(),
      password: z.string().min(6),
      companyName: z.string(),
      cnpj: z.string().min(14),
    });

    const { name, email, password, companyName, cnpj } = registerSchema.parse(request.body);

    const userExists = await prisma.user.findUnique({ where: { email } });
    if (userExists) {
      return reply.status(400).send({ message: 'E-mail já está em uso.' });
    }

    const companyExists = await prisma.company.findUnique({ where: { cnpj } });
    if (companyExists) {
      return reply.status(400).send({ message: 'CNPJ já cadastrado.' });
    }

    const passwordHash = await bcrypt.hash(password, 8);

    // Create Company and User in a transaction
    const userCompany = await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          name: companyName,
          cnpj,
        },
      });

      const user = await tx.user.create({
        data: {
          name,
          email,
          passwordHash,
        },
      });

      const workplace = await tx.workplace.create({
        data: {
          companyId: company.id,
          name: 'Sede Principal (Matriz)',
        },
      });

      await tx.userCompany.create({
        data: {
          userId: user.id,
          companyId: company.id,
          role: 'ADMIN',
        },
      });

      return { user, company };
    });

    return reply.status(201).send({
      message: 'Usuário e Empresa cadastrados com sucesso.',
      userId: userCompany.user.id,
    });
  });

  // Login route
  server.post('/auth/login', async (request, reply) => {
    const loginSchema = z.object({
      email: z.string().email(),
      password: z.string(),
    });

    const { email, password } = loginSchema.parse(request.body);

    const user = await prisma.user.findUnique({
      where: { email },
      include: { companies: true },
    });

    if (!user) {
      return reply.status(400).send({ message: 'Credenciais inválidas.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return reply.status(400).send({ message: 'Credenciais inválidas.' });
    }

    // Generate token
    const token = server.jwt.sign({
      sub: user.id,
      name: user.name,
      companies: user.companies.map((c) => ({
        companyId: c.companyId,
        role: c.role,
      })),
    }, { expiresIn: '7d' });

    return reply.status(200).send({ token });
  });

  // Me route
  server.get(
    '/auth/me',
    { onRequest: [server.authenticate] },
    async (request, reply) => {
      return { user: request.user };
    }
  );
}
