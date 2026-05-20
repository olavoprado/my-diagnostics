import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';
import PDFDocument from 'pdfkit';

export async function reportsRoutes(server: FastifyInstance) {
  server.addHook('onRequest', server.authenticate);

  // Gerar PGR (Programa de Gerenciamento de Riscos) em PDF
  server.get('/reports/pgr/:workplaceId', async (request, reply) => {
    const { workplaceId } = request.params as { workplaceId: string };
    const userCompany = request.user.companies[0];

    if (!userCompany) return reply.status(403).send({ message: "Acesso negado" });

    // Busca dados para o relatório
    const workplace = await prisma.workplace.findUnique({
      where: { id: workplaceId },
      include: {
        company: true,
        exposureGroups: true,
        diagnostics: {
          where: { module: { name: 'NR-1' } },
          include: {
            riskItems: {
              include: {
                riskItem: { include: { category: true } },
                exposureGroup: true,
              }
            },
            actionPlans: {
              include: { riskItem: true }
            }
          }
        }
      }
    });

    if (!workplace) return reply.status(404).send({ message: "Unidade não encontrada" });

    // Pega o diagnóstico mais recente
    const latestDiagnostic = workplace.diagnostics[0];

    // Configurar o PDF
    const doc = new PDFDocument({ margin: 50 });
    
    // Configurar headers para download do PDF
    reply.header('Content-Type', 'application/pdf');
    reply.header('Content-Disposition', `attachment; filename=PGR_${workplace.company.name.replace(/\s+/g, '_')}.pdf`);
    
    // Passa o stream do PDF direto para a resposta do Fastify
    reply.send(doc);

    // ==================
    // DESENHO DO PDF
    // ==================
    
    // Capa
    doc.fontSize(24).text('PGR - Programa de Gerenciamento de Riscos', { align: 'center' });
    doc.moveDown(2);
    doc.fontSize(16).text(`Empresa: ${workplace.company.name}`);
    doc.fontSize(12).text(`CNPJ: ${workplace.company.cnpj}`);
    doc.text(`Unidade: ${workplace.name}`);
    doc.moveDown(4);
    doc.text(`Data de Emissão: ${new Date().toLocaleDateString('pt-BR')}`, { align: 'right' });
    
    doc.addPage();

    // Matriz de Riscos
    doc.fontSize(18).text('1. Inventário de Riscos (Matriz)', { underline: true });
    doc.moveDown();

    if (!latestDiagnostic || latestDiagnostic.riskItems.length === 0) {
      doc.fontSize(12).text('Nenhum risco foi mapeado neste diagnóstico ainda.');
    } else {
      latestDiagnostic.riskItems.forEach((risk, index) => {
        doc.fontSize(14).text(`${index + 1}. ${risk.riskItem.code} - ${risk.riskItem.description}`);
        doc.fontSize(10).text(`Categoria: ${risk.riskItem.category.name} | GHE: ${risk.exposureGroup.name}`);
        doc.text(`Severidade: ${risk.severity} | Probabilidade: ${risk.probability} => SCORE: ${risk.riskScore}`);
        doc.text(`Status atual: ${risk.status}`);
        doc.moveDown();
      });
    }

    doc.addPage();

    // Plano de Ação
    doc.fontSize(18).text('2. Plano de Ação (PDCA)', { underline: true });
    doc.moveDown();

    if (!latestDiagnostic || latestDiagnostic.actionPlans.length === 0) {
      doc.fontSize(12).text('Nenhum plano de ação definido no momento.');
    } else {
      latestDiagnostic.actionPlans.forEach((action, index) => {
        doc.fontSize(14).text(`Ação ${index + 1}: ${action.description}`);
        doc.fontSize(10).text(`Risco associado: ${action.riskItem.code} - ${action.riskItem.description}`);
        doc.text(`Prioridade: ${action.priority} | Status: ${action.status}`);
        if (action.deadline) doc.text(`Prazo: ${new Date(action.deadline).toLocaleDateString('pt-BR')}`);
        doc.moveDown();
      });
    }

    // Finalizar o documento
    doc.end();
  });
}
