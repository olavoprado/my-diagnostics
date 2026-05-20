import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

export async function formsRoutes(server: FastifyInstance) {
  server.addHook('onRequest', server.authenticate);

  // Criar um novo Template de Formulário
  server.post('/forms/templates', async (request, reply) => {
    const createTemplateSchema = z.object({
      moduleId: z.string().uuid(),
      name: z.string(),
      description: z.string().optional(),
    });

    const { moduleId, name, description } = createTemplateSchema.parse(request.body);

    const template = await prisma.formTemplate.create({
      data: { moduleId, name, description }
    });

    return reply.status(201).send({ template });
  });

  // Criar Sessões e Questões para um Template (Simplificado para o MVP)
  server.post('/forms/templates/:templateId/sections', async (request, reply) => {
    const { templateId } = request.params as { templateId: string };
    const sectionSchema = z.object({
      title: z.string(),
      orderIndex: z.number().int(),
      questions: z.array(z.object({
        code: z.string(),
        text: z.string(),
        type: z.enum(['TEXT', 'NUMBER', 'SELECT', 'MULTISELECT', 'BOOLEAN', 'DATE']),
        options: z.array(z.object({
          label: z.string(),
          value: z.string(),
          riskItemId: z.string().uuid().optional(), // Vínculo com a matriz de risco
        })).optional(),
      }))
    });

    const { title, orderIndex, questions } = sectionSchema.parse(request.body);

    const section = await prisma.formSection.create({
      data: {
        formTemplateId: templateId,
        title,
        orderIndex,
        questions: {
          create: questions.map(q => ({
            code: q.code,
            text: q.text,
            type: q.type,
            options: {
              create: q.options?.map(opt => ({
                label: opt.label,
                value: opt.value,
                riskItemId: opt.riskItemId,
              })) || []
            }
          }))
        }
      },
      include: {
        questions: {
          include: { options: true }
        }
      }
    });

    return reply.status(201).send({ section });
  });

  // Buscar um formulário completo para responder
  server.get('/forms/templates/:templateId', async (request, reply) => {
    const { templateId } = request.params as { templateId: string };
    
    const template = await prisma.formTemplate.findUnique({
      where: { id: templateId },
      include: {
        sections: {
          orderBy: { orderIndex: 'asc' },
          include: {
            questions: {
              include: { options: true }
            }
          }
        }
      }
    });

    if (!template) return reply.status(404).send({ message: "Template não encontrado" });

    return { template };
  });

  // Rota auxiliar para injetar e buscar o Formulário Dinâmico da NR-1
  server.get('/forms/mock-nr1', async (request, reply) => {
    let template = await prisma.formTemplate.findFirst({
      where: { name: 'Questionário de Riscos Ocupacionais - NR-1' },
      include: {
        sections: {
          orderBy: { orderIndex: 'asc' },
          include: { questions: { include: { options: true }, orderBy: { code: 'asc' } } }
        }
      }
    });

    if (!template) {
      const module = await prisma.module.findFirst({ where: { name: 'NR-1' } });
      if (!module) return reply.status(404).send({ message: "Módulo NR-1 não encontrado" });

      const fisRisk = await prisma.riskItem.findFirst({ where: { code: 'FIS-01' } });
      const ergRisk = await prisma.riskItem.findFirst({ where: { code: 'ERG-01' } });

      const defaultOptions = [
        { label: 'Nunca', value: 'nunca', riskItemId: undefined },
        { label: 'Às vezes', value: 'as_vezes', riskItemId: undefined },
        { label: 'Frequentemente', value: 'frequentemente', riskItemId: undefined },
      ];

      template = await prisma.formTemplate.create({
        data: {
          moduleId: module.id,
          name: 'Questionário de Riscos Ocupacionais - NR-1',
          description: 'Sua opinião faz a diferença! Este questionário tem o objetivo de identificar situações de risco no ambiente de trabalho.',
          sections: {
            create: [
              {
                title: '01. Riscos Físicos',
                orderIndex: 0,
                questions: {
                  create: [
                    {
                      code: 'Q01-01', text: 'Você sente desconforto com calor, frio, ruído ou vibrações no ambiente?', type: 'SELECT',
                      options: { create: [
                        { label: 'Nunca', value: 'nunca' },
                        { label: 'Às vezes', value: 'as_vezes', riskItemId: fisRisk?.id },
                        { label: 'Frequentemente', value: 'frequentemente', riskItemId: fisRisk?.id }
                      ]}
                    },
                    {
                      code: 'Q01-02', text: 'A iluminação do seu local de trabalho é adequada?', type: 'SELECT',
                      options: { create: [
                        { label: 'Sempre', value: 'nunca' },
                        { label: 'Às vezes', value: 'as_vezes', riskItemId: fisRisk?.id },
                        { label: 'Nunca', value: 'frequentemente', riskItemId: fisRisk?.id }
                      ]}
                    }
                  ]
                }
              },
              {
                title: '02. Riscos Químicos',
                orderIndex: 1,
                questions: {
                  create: [
                    { code: 'Q02-01', text: 'Você tem contato com produtos químicos?', type: 'SELECT', options: { create: defaultOptions } },
                    { code: 'Q02-02', text: 'Recebe orientação sobre o uso seguro desses produtos?', type: 'SELECT', options: { create: [
                      { label: 'Sempre', value: 'nunca' }, { label: 'Às vezes', value: 'as_vezes' }, { label: 'Nunca', value: 'frequentemente' }
                    ] } }
                  ]
                }
              },
              {
                title: '03. Riscos Biológicos',
                orderIndex: 2,
                questions: {
                  create: [
                    { code: 'Q03-01', text: 'Você tem contato com lixo, sujeira, sangue ou material contaminado?', type: 'SELECT', options: { create: defaultOptions } },
                    { code: 'Q03-02', text: 'Utiliza os EPIs adequados para esse tipo de atividade?', type: 'SELECT', options: { create: [
                      { label: 'Sempre', value: 'nunca' }, { label: 'Às vezes', value: 'as_vezes' }, { label: 'Nunca', value: 'frequentemente' }
                    ] } }
                  ]
                }
              },
              {
                title: '04. Ergonomia',
                orderIndex: 3,
                questions: {
                  create: [
                    { code: 'Q04-01', text: 'Você sente dores no corpo (coluna, braços, pernas, ombros) durante ou após o trabalho?', type: 'SELECT', options: { create: [
                      { label: 'Nunca', value: 'nunca' },
                      { label: 'Às vezes', value: 'as_vezes', riskItemId: ergRisk?.id },
                      { label: 'Frequentemente', value: 'frequentemente', riskItemId: ergRisk?.id }
                    ] } },
                    { code: 'Q04-02', text: 'Sua posição de trabalho é confortável e adequada?', type: 'SELECT', options: { create: [
                      { label: 'Sempre', value: 'nunca' }, { label: 'Às vezes', value: 'as_vezes', riskItemId: ergRisk?.id }, { label: 'Nunca', value: 'frequentemente', riskItemId: ergRisk?.id }
                    ] } }
                  ]
                }
              },
              {
                title: '05. Riscos de Acidentes',
                orderIndex: 4,
                questions: {
                  create: [
                    { code: 'Q05-01', text: 'Existe risco de queda, batida, cortes ou outros acidentes no seu setor?', type: 'SELECT', options: { create: defaultOptions } },
                    { code: 'Q05-02', text: 'Você se sente seguro no ambiente de trabalho?', type: 'SELECT', options: { create: [
                      { label: 'Sempre', value: 'nunca' }, { label: 'Às vezes', value: 'as_vezes' }, { label: 'Nunca', value: 'frequentemente' }
                    ] } }
                  ]
                }
              },
              {
                title: '06. Riscos Mecânicos',
                orderIndex: 5,
                questions: {
                  create: [
                    { code: 'Q06-01', text: 'Você trabalha com máquinas ou equipamentos?', type: 'SELECT', options: { create: defaultOptions } },
                    { code: 'Q06-02', text: 'Eles possuem proteção adequada (grades, travas, proteções)?', type: 'SELECT', options: { create: [
                      { label: 'Sempre', value: 'nunca' }, { label: 'Às vezes', value: 'as_vezes' }, { label: 'Nunca', value: 'frequentemente' }
                    ] } }
                  ]
                }
              },
              {
                title: '07 a 09. Elétricos, Incêndio e Transporte',
                orderIndex: 6,
                questions: {
                  create: [
                    { code: 'Q07-01', text: 'Existe risco de choque elétrico no seu trabalho?', type: 'SELECT', options: { create: defaultOptions } },
                    { code: 'Q08-01', text: 'Você sabe como agir em caso de incêndio?', type: 'SELECT', options: { create: [
                      { label: 'Sim', value: 'nunca' }, { label: 'Parcialmente', value: 'as_vezes' }, { label: 'Não', value: 'frequentemente' }
                    ] } },
                    { code: 'Q09-01', text: 'Seu trabalho envolve transporte ou deslocamento com riscos?', type: 'SELECT', options: { create: defaultOptions } }
                  ]
                }
              },
              {
                title: '10 a 13. Atividades Especiais e Psicossociais',
                orderIndex: 7,
                questions: {
                  create: [
                    { code: 'Q10-01', text: 'Você realiza atividades em altura ou espaço confinado?', type: 'SELECT', options: { create: defaultOptions } },
                    { code: 'Q12-01', text: 'Você sente excesso de trabalho ou pressão no seu dia a dia?', type: 'SELECT', options: { create: defaultOptions } },
                    { code: 'Q13-01', text: 'Existe pressão excessiva por metas, estresse ou cansaço emocional?', type: 'SELECT', options: { create: defaultOptions } }
                  ]
                }
              }
            ]
          }
        },
        include: {
          sections: {
            orderBy: { orderIndex: 'asc' },
            include: { questions: { include: { options: true }, orderBy: { code: 'asc' } } }
          }
        }
      });
    }

    return { template };
  });
  // Iniciar um Diagnóstico
  server.post('/diagnostics', async (request, reply) => {
    const startDiagnosticSchema = z.object({
      moduleId: z.string().uuid().optional(),
      formTemplateId: z.string().uuid(),
      responsibleUserId: z.string().uuid().optional(),
    });

    const { moduleId, formTemplateId, responsibleUserId } = startDiagnosticSchema.parse(request.body);
    const userCompany = request.user.companies[0]; 

    if (!userCompany) return reply.status(403).send({ message: "Sem empresa vinculada." });

    let workplace = await prisma.workplace.findFirst({ where: { companyId: userCompany.companyId } });
    if (!workplace) {
      workplace = await prisma.workplace.create({
        data: { companyId: userCompany.companyId, name: 'Sede Principal' }
      });
    }

    let actualModuleId = moduleId;
    if (!actualModuleId) {
      const template = await prisma.formTemplate.findUnique({ where: { id: formTemplateId }});
      actualModuleId = template?.moduleId;
    }

    const diagnostic = await prisma.diagnostic.create({
      data: {
        companyId: userCompany.companyId,
        workplaceId: workplace.id,
        moduleId: actualModuleId!,
        formTemplateId,
        status: 'IN_PROGRESS',
        responsibleUserId: responsibleUserId || request.user.sub,
      }
    });

    return reply.status(201).send({ diagnostic });
  });

  // Salvar respostas do diagnóstico (Pode ser chamado parcialmente)
  server.post('/diagnostics/:diagnosticId/answers', async (request, reply) => {
    const { diagnosticId } = request.params as { diagnosticId: string };
    
    const answerSchema = z.object({
      answers: z.array(z.object({
        questionId: z.string().uuid(),
        textValue: z.string().optional(),
        numberValue: z.number().optional(),
        optionIds: z.array(z.string()).optional(),
      }))
    });

    const { answers } = answerSchema.parse(request.body);

    // Salvar respostas
    for (const ans of answers) {
      await prisma.diagnosticAnswer.upsert({
        where: { id: 'dummy' }, // Fallback to create many or implement unique compound index later
        update: {},
        create: {
          diagnosticId,
          questionId: ans.questionId,
          textValue: ans.textValue,
          numberValue: ans.numberValue,
          optionIds: ans.optionIds || [],
          answeredBy: request.user.sub,
        }
      }).catch(async () => {
         await prisma.diagnosticAnswer.create({
          data: {
            diagnosticId,
            questionId: ans.questionId,
            textValue: ans.textValue,
            numberValue: ans.numberValue,
            optionIds: ans.optionIds || [],
            answeredBy: request.user.sub,
          }
        })
      });

      // Se respondeu uma opção vinculada a um Risco, já joga pra Matriz de Riscos!
      if (ans.optionIds && ans.optionIds.length > 0) {
        const options = await prisma.questionOption.findMany({
          where: { id: { in: ans.optionIds }, riskItemId: { not: null } }
        });

        for (const opt of options) {
          if (opt.riskItemId) {
            // Pegar a severidade padrão do item
            const riskItem = await prisma.riskItem.findUnique({ where: { id: opt.riskItemId } });
            
            // Busca o primeiro GHE dessa unidade para vincular no MVP
            const diagnostic = await prisma.diagnostic.findUnique({ where: { id: diagnosticId }, select: { workplaceId: true } });
            let ghe = await prisma.exposureGroup.findFirst({ where: { workplaceId: diagnostic?.workplaceId } });
            
            if (!ghe && diagnostic) {
               ghe = await prisma.exposureGroup.create({
                 data: { workplaceId: diagnostic.workplaceId, name: 'Geral', description: 'GHE Padrão' }
               });
            }

            if (riskItem && ghe) {
              await prisma.diagnosticRiskItem.create({
                data: {
                  diagnosticId,
                  riskItemId: riskItem.id,
                  exposureGroupId: ghe.id,
                  probability: 3, // Probabilidade padrão no MVP (o usuário edita depois na matriz)
                  severity: riskItem.severityDefault,
                  riskScore: 3 * riskItem.severityDefault,
                }
              });
            }
          }
        }
      }
    }

    return reply.status(200).send({ message: "Respostas salvas com sucesso!" });
  });

  // Visualizar resultados de um diagnóstico
  server.get('/diagnostics/:diagnosticId/results', async (request, reply) => {
    const { diagnosticId } = request.params as { diagnosticId: string };
    const userCompany = request.user.companies[0];
    if (!userCompany) return reply.status(403).send({ message: "Não autorizado." });

    const diagnostic = await prisma.diagnostic.findUnique({
      where: { id: diagnosticId },
      include: {
        workplace: true,
        template: {
          include: {
            sections: {
              orderBy: { orderIndex: 'asc' },
              include: { questions: { include: { options: true }, orderBy: { code: 'asc' } } }
            }
          }
        },
        answers: true,
        riskItems: {
          include: { riskItem: true, exposureGroup: true }
        }
      }
    });

    if (!diagnostic || diagnostic.companyId !== userCompany.companyId) {
      return reply.status(404).send({ message: "Diagnóstico não encontrado" });
    }

    // Buscar dados do responsável manualmente ou via include se estiver no schema
    const responsibleUser = diagnostic.responsibleUserId 
      ? await prisma.user.findUnique({ where: { id: diagnostic.responsibleUserId }, select: { name: true, email: true } })
      : null;

    return { diagnostic: { ...diagnostic, responsibleUser } };
  });

  // Listar diagnósticos da empresa
  server.get('/diagnostics', async (request, reply) => {
    const userCompany = request.user.companies[0];
    if (!userCompany) return reply.status(403).send({ message: "Não autorizado." });

    const where: any = { companyId: userCompany.companyId };
    
    // Se for COLABORADOR, filtrar apenas o que ele deve responder
    if (userCompany.role === 'COLABORADOR') {
      where.responsibleUserId = request.user.sub;
      where.status = 'IN_PROGRESS';
    }

    const diagnostics = await prisma.diagnostic.findMany({
      where,
      include: {
        module: true,
        workplace: true,
        template: true,
      },
      orderBy: { startedAt: 'desc' },
      take: 10
    });

    return { diagnostics };
  });

  // Deletar um diagnóstico
  server.delete('/diagnostics/:diagnosticId', async (request, reply) => {
    const { diagnosticId } = request.params as { diagnosticId: string };
    const userCompany = request.user.companies[0];
    if (!userCompany) return reply.status(403).send({ message: "Não autorizado." });

    const diagnostic = await prisma.diagnostic.findUnique({
      where: { id: diagnosticId }
    });

    if (!diagnostic || diagnostic.companyId !== userCompany.companyId) {
      return reply.status(404).send({ message: "Diagnóstico não encontrado" });
    }

    // Deletar respostas e riscos vinculados primeiro (Cascade ou manual)
    // No Prisma se estiver configurado cascade deleta automático, mas vamos garantir
    await prisma.diagnosticAnswer.deleteMany({ where: { diagnosticId } });
    await prisma.diagnosticRiskItem.deleteMany({ where: { diagnosticId } });
    await prisma.actionPlan.deleteMany({ where: { diagnosticId } });

    await prisma.diagnostic.delete({
      where: { id: diagnosticId }
    });

    return { message: "Diagnóstico removido com sucesso." };
  });
}
