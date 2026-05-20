import "@fastify/jwt"

declare module "fastify" {
  export interface FastifyInstance {
    authenticate: any;
  }
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: { sub: string, name: string, companies: { companyId: string, role: string }[] }
    user: { sub: string, name: string, companies: { companyId: string, role: string }[] }
  }
}
