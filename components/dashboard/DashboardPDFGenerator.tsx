import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  KPIData,
  ProdutoVendidoItem,
  FormasPagamentoItem,
  VendasPorLojaItem,
  TopClienteItem,
  TopVendedorItem,
  EstoqueInfo,
} from "./types";

export class DashboardPDFGenerator {
  static gerar(
    periodo: { inicio: string; fim: string },
    kpis: KPIData,
    produtos: ProdutoVendidoItem[],
    formasPagamento: FormasPagamentoItem[],
    vendasPorLoja: VendasPorLojaItem[],
    topClientes: TopClienteItem[],
    topVendedores: TopVendedorItem[],
    estoqueInfo: EstoqueInfo
  ) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;

    // ===== CABEÇALHO =====
    doc.setFillColor(59, 130, 246); // primary-600
    doc.rect(0, 0, pageWidth, 40, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("📊 Relatório de Dashboard", pageWidth / 2, 15, {
      align: "center",
    });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Período: ${formatDate(periodo.inicio)} até ${formatDate(periodo.fim)}`,
      pageWidth / 2,
      25,
      { align: "center" }
    );

    doc.text(
      `Gerado em: ${new Date().toLocaleString("pt-BR")}`,
      pageWidth / 2,
      32,
      { align: "center" }
    );

    yPos = 50;

    // ===== SEÇÃO 1: KPIs PRINCIPAIS =====
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("💰 Indicadores Principais", 14, yPos);
    yPos += 10;

    const kpiData = [
      [
        "Total de Vendas",
        kpis.totalVendas.toString(),
        "Receita Líquida",
        formatCurrency(kpis.receita),
      ],
      [
        "Receita Bruta",
        formatCurrency(kpis.receitaBruta),
        "Descontos",
        formatCurrency(kpis.descontos),
      ],
      [
        "Ticket Médio",
        formatCurrency(kpis.ticket),
        "A Receber",
        formatCurrency(kpis.aReceber),
      ],
      [
        "Valor Pago",
        formatCurrency(kpis.valorPago),
        "Fiados Vencidos",
        kpis.fiadoVencido.toString(),
      ],
    ];

    autoTable(doc, {
      startY: yPos,
      head: [],
      body: kpiData,
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { fontStyle: "bold", fillColor: [241, 245, 249] },
        2: { fontStyle: "bold", fillColor: [241, 245, 249] },
      },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;

    // ===== SEÇÃO 2: VENDAS E DEVOLUÇÕES =====
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("📈 Vendas e Devoluções", 14, yPos);
    yPos += 10;

    const vendasDevolData = [
      [
        "Total Devoluções",
        kpis.totalDevolucoes.toString(),
        "Valor Devolvido",
        formatCurrency(kpis.valorDevolucoes),
      ],
      [
        "Taxa de Devolução",
        `${kpis.taxaDevolucao.toFixed(2)}%`,
        "Margem Desconto",
        `${kpis.margemDesconto.toFixed(2)}%`,
      ],
    ];

    autoTable(doc, {
      startY: yPos,
      head: [],
      body: vendasDevolData,
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { fontStyle: "bold", fillColor: [241, 245, 249] },
        2: { fontStyle: "bold", fillColor: [241, 245, 249] },
      },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;

    // ===== SEÇÃO 3: ORDENS DE SERVIÇO =====
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("🔧 Ordens de Serviço", 14, yPos);
    yPos += 10;

    const ordensData = [
      [
        "Total Ordens",
        kpis.totalOrdens.toString(),
        "Ordens Abertas",
        kpis.ordensAbertas.toString(),
      ],
      [
        "Ordens Concluídas",
        kpis.ordensConcluidas.toString(),
        "Taxa Conclusão",
        `${kpis.taxaConclusao.toFixed(2)}%`,
      ],
      [
        "Valor Total",
        formatCurrency(kpis.valorOrdens),
        "Ticket Médio",
        formatCurrency(kpis.ticketOrdem),
      ],
    ];

    autoTable(doc, {
      startY: yPos,
      head: [],
      body: ordensData,
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { fontStyle: "bold", fillColor: [241, 245, 249] },
        2: { fontStyle: "bold", fillColor: [241, 245, 249] },
      },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;

    // Verificar espaço para nova página
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    // ===== SEÇÃO 4: TOP 10 PRODUTOS =====
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("📦 Top 10 Produtos Mais Vendidos", 14, yPos);
    yPos += 10;

    const produtosData = produtos
      .slice(0, 10)
      .map((p, index) => [
        (index + 1).toString(),
        p.produto,
        p.quantidade.toString(),
        formatCurrency(p.valor),
      ]);

    autoTable(doc, {
      startY: yPos,
      head: [["#", "Produto", "Qtd", "Valor Total"]],
      body: produtosData,
      theme: "striped",
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [59, 130, 246], textColor: 255 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;

    // Nova página
    doc.addPage();
    yPos = 20;

    // ===== SEÇÃO 5: FORMAS DE PAGAMENTO =====
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("💳 Formas de Pagamento", 14, yPos);
    yPos += 10;

    const pagamentoData = formasPagamento.map((fp) => [
      fp.forma,
      fp.quantidade.toString(),
      formatCurrency(fp.total),
      `${((fp.total / kpis.receita) * 100).toFixed(1)}%`,
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [["Forma", "Qtd", "Valor", "% do Total"]],
      body: pagamentoData,
      theme: "striped",
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [59, 130, 246], textColor: 255 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;

    // ===== SEÇÃO 6: VENDAS POR LOJA =====
    if (vendasPorLoja.length > 0) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("🏪 Vendas por Loja", 14, yPos);
      yPos += 10;

      const lojasData = vendasPorLoja.map((l) => [
        l.nome,
        l.vendas.toString(),
        formatCurrency(l.total),
        formatCurrency(l.ticket),
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [["Loja", "Vendas", "Total", "Ticket Médio"]],
        body: lojasData,
        theme: "striped",
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [59, 130, 246], textColor: 255 },
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;
    }

    // Verificar espaço para nova página
    if (yPos > 200) {
      doc.addPage();
      yPos = 20;
    }

    // ===== SEÇÃO 7: TOP 10 CLIENTES =====
    if (topClientes.length > 0) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("👥 Top 10 Clientes", 14, yPos);
      yPos += 10;

      const clientesData = topClientes
        .slice(0, 10)
        .map((c, index) => [
          (index + 1).toString(),
          c.nome,
          c.vendas.toString(),
          formatCurrency(c.total),
          formatCurrency(c.ticket),
        ]);

      autoTable(doc, {
        startY: yPos,
        head: [["#", "Cliente", "Vendas", "Total", "Ticket Médio"]],
        body: clientesData,
        theme: "striped",
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [59, 130, 246], textColor: 255 },
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;
    }

    // Nova página
    doc.addPage();
    yPos = 20;

    // ===== SEÇÃO 8: TOP 10 VENDEDORES =====
    if (topVendedores.length > 0) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("🏆 Top 10 Vendedores", 14, yPos);
      yPos += 10;

      const vendedoresData = topVendedores
        .slice(0, 10)
        .map((v, index) => [
          (index + 1).toString(),
          v.nome,
          v.vendas.toString(),
          formatCurrency(v.total),
          formatCurrency(v.ticket),
        ]);

      autoTable(doc, {
        startY: yPos,
        head: [["#", "Vendedor", "Vendas", "Total", "Ticket Médio"]],
        body: vendedoresData,
        theme: "striped",
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [59, 130, 246], textColor: 255 },
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;
    }

    // ===== SEÇÃO 9: STATUS DO ESTOQUE =====
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("📊 Status do Estoque", 14, yPos);
    yPos += 10;

    const estoqueData = [
      ["Total de Produtos", estoqueInfo.totalProdutos.toString()],
      [
        "Produtos Abaixo do Mínimo",
        estoqueInfo.produtosAbaixoMinimo.toString(),
      ],
      ["Produtos Sem Estoque", estoqueInfo.produtosSemEstoque.toString()],
      ["Valor Total em Estoque", formatCurrency(estoqueInfo.valorTotal)],
    ];

    autoTable(doc, {
      startY: yPos,
      head: [],
      body: estoqueData,
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { fontStyle: "bold", fillColor: [241, 245, 249] },
      },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;

    // ===== SEÇÃO 10: RESUMO GERAL =====
    if (yPos > 220) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("📋 Resumo Geral", 14, yPos);
    yPos += 10;

    const resumoData = [
      ["Total de Clientes", kpis.totalClientes.toString()],
      ["Clientes Ativos", kpis.clientesAtivos.toString()],
      ["Novos Clientes", kpis.clientesNovos.toString()],
      ["Total de Usuários", kpis.totalUsuarios.toString()],
      ["Total de Lojas", kpis.totalLojas.toString()],
      ["Total de Fornecedores", kpis.totalFornecedores.toString()],
      ["Fornecedores Ativos", kpis.fornecedoresAtivos.toString()],
    ];

    autoTable(doc, {
      startY: yPos,
      head: [],
      body: resumoData,
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { fontStyle: "bold", fillColor: [241, 245, 249] },
      },
    });

    // ===== RODAPÉ =====
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(
        `Página ${i} de ${totalPages}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: "center" }
      );
    }

    // ===== SALVAR PDF =====
    const nomeArquivo = `Dashboard_${periodo.inicio}_${periodo.fim}.pdf`;
    doc.save(nomeArquivo);
  }
}

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("pt-BR");
}
