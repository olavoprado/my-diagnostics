import Fastify from "fastify";
import jwt from "@fastify/jwt";
import { authRoutes } from "./routes/auth";
import { moduleRoutes } from "./routes/modules";
import { formsRoutes } from "./routes/forms";
import { riskRoutes } from "./routes/risks";
import { actionRoutes } from "./routes/actions";
import { reportsRoutes } from "./routes/reports";
import { userRoutes } from "./routes/users";
import { dashboardRoutes } from "./routes/dashboard";
import { FastifyRequest, FastifyReply } from "fastify";

import cors from "@fastify/cors";

const server = Fastify({
  logger: true,
});
console.log("CORS enabled!");

server.register(cors, {
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
});

server.register(jwt, {
  secret: process.env.JWT_SECRET || "supersecretkey_change_in_prod",
});

server.decorate(
  "authenticate",
  async function (request: FastifyRequest, reply: FastifyReply) {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.send(err);
    }
  }
);

// Register routes
server.register(authRoutes);
server.register(moduleRoutes);
server.register(formsRoutes);
server.register(riskRoutes);
server.register(actionRoutes);
server.register(reportsRoutes);
server.register(userRoutes);
server.register(dashboardRoutes);

server.get("/", async (request, reply) => {
  return { status: "ok", message: "API de Diagnóstico de Riscos (NR-1) Operacional" };
});

const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3333;
    await server.listen({ port, host: "0.0.0.0" });
    server.log.info(`Servidor rodando na porta ${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
