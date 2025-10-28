import jsPDF from "jspdf";
import type { CaixaAberto, Loja, ResumoVendas, Venda } from "./types";

interface CaixaPDFProps {
  caixa: CaixaAberto;
  loja: Loja;
  resumo: ResumoVendas;
  vendas?: Venda[];
}

export class CaixaPDFGenerator {
  static gerar({ caixa, loja, resumo, vendas = [] }: CaixaPDFProps) {
    const doc = new jsPDF();

    // Cores
    const primaryColor: [number, number, number] = [59, 130, 246]; // Blue
    const successColor: [number, number, number] = [34, 197, 94]; // Green
    const dangerColor: [number, number, number] = [239, 68, 68]; // Red
    const textColor: [number, number, number] = [31, 41, 55]; // Gray-800
    const lightGray: [number, number, number] = [243, 244, 246]; // Gray-100
    const warningColor: [number, number, number] = [251, 191, 36]; // Yellow

    let yPos = 20;

    // ========== CABEÇALHO ==========
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 40, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("RELATORIO DE CAIXA", 105, 18, { align: "center" });

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(loja.nome, 105, 28, { align: "center" });

    if (loja.endereco) {
      doc.setFontSize(9);
      doc.text(loja.endereco, 105, 34, { align: "center" });
    }

    yPos = 50;

    // ========== INFORMAÇÕES DO CAIXA ==========
    doc.setTextColor(...textColor);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Informações do Caixa", 20, yPos);
    yPos += 8;

    // Box com informações principais
    doc.setFillColor(...lightGray);
    doc.rect(20, yPos, 170, 35, "F");

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    // Status
    doc.setFont("helvetica", "bold");
    doc.text("Status:", 25, yPos + 8);
    doc.setFont("helvetica", "normal");

    if (caixa.status === "aberto") {
      doc.setTextColor(...successColor);
      doc.text("ABERTO", 50, yPos + 8);
    } else {
      doc.setTextColor(...dangerColor);
      doc.text("FECHADO", 50, yPos + 8);
    }
    doc.setTextColor(...textColor);

    // Data de Abertura
    doc.setFont("helvetica", "bold");
    doc.text("Data de Abertura:", 25, yPos + 16);
    doc.setFont("helvetica", "normal");
    const dataAbertura = new Date(caixa.data_abertura).toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      dateStyle: "short",
      timeStyle: "short",
    });
    doc.text(dataAbertura, 70, yPos + 16);

    // Data de Fechamento (se houver)
    if (caixa.data_fechamento) {
      doc.setFont("helvetica", "bold");
      doc.text("Data de Fechamento:", 25, yPos + 24);
      doc.setFont("helvetica", "normal");
      const dataFechamento = new Date(caixa.data_fechamento).toLocaleString(
        "pt-BR",
        {
          timeZone: "America/Sao_Paulo",
          dateStyle: "short",
          timeStyle: "short",
        }
      );
      doc.text(dataFechamento, 70, yPos + 24);
    }

    // Valor Inicial
    doc.setFont("helvetica", "bold");
    doc.text("Valor Inicial:", 120, yPos + 8);
    doc.setFont("helvetica", "normal");
    doc.text(
      caixa.valor_inicial.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      }),
      165,
      yPos + 8
    );

    // Valor Final (se houver)
    if (caixa.valor_final !== null && caixa.valor_final !== undefined) {
      doc.setFont("helvetica", "bold");
      doc.text("Valor Final:", 120, yPos + 16);
      doc.setFont("helvetica", "normal");
      doc.text(
        caixa.valor_final.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        }),
        165,
        yPos + 16
      );

      // Diferença
      const diferenca =
        caixa.valor_final - (caixa.valor_inicial + resumo.valorDinheiro);
      doc.setFont("helvetica", "bold");
      doc.text("Diferença:", 120, yPos + 24);
      doc.setFont("helvetica", "normal");

      if (Math.abs(diferenca) < 0.01) {
        doc.setTextColor(...successColor);
      } else if (diferenca > 0) {
        doc.setTextColor(...primaryColor);
      } else {
        doc.setTextColor(...dangerColor);
      }

      doc.text(
        diferenca.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        }),
        165,
        yPos + 24
      );
      doc.setTextColor(...textColor);
    }

    yPos += 45;

    // ========== RESUMO DE VENDAS ==========
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Resumo de Vendas", 20, yPos);
    yPos += 8;

    // Box com métricas principais
    doc.setFillColor(...lightGray);
    doc.rect(20, yPos, 170, 24, "F");

    doc.setFontSize(10);

    // Total de Vendas
    doc.setFont("helvetica", "bold");
    doc.text("Total de Vendas:", 25, yPos + 8);
    doc.setFont("helvetica", "normal");
    doc.text(resumo.totalVendas.toString(), 65, yPos + 8);

    // Valor Total
    doc.setFont("helvetica", "bold");
    doc.text("Valor Total:", 25, yPos + 16);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...successColor);
    doc.setFontSize(11);
    doc.text(
      resumo.valorTotalVendas.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      }),
      65,
      yPos + 16
    );
    doc.setTextColor(...textColor);
    doc.setFontSize(10);

    // Ticket Médio
    doc.setFont("helvetica", "bold");
    doc.text("Ticket Médio:", 110, yPos + 8);
    doc.setFont("helvetica", "normal");
    doc.text(
      resumo.ticketMedio.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      }),
      145,
      yPos + 8
    );

    // Dinheiro no Caixa
    doc.setFont("helvetica", "bold");
    doc.text("Dinheiro no Caixa:", 110, yPos + 16);
    doc.setFont("helvetica", "normal");
    const dinheiroNoCaixa = caixa.valor_inicial + resumo.valorDinheiro;
    doc.text(
      dinheiroNoCaixa.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      }),
      145,
      yPos + 16
    );

    yPos += 32;

    // ========== FORMAS DE PAGAMENTO ==========
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Detalhamento por Forma de Pagamento", 20, yPos);
    yPos += 8;

    const formasPagamento = [
      { nome: "$ Dinheiro", valor: resumo.valorDinheiro, color: successColor },
      { nome: "> PIX", valor: resumo.valorPix, color: primaryColor },
      {
        nome: "# Cartao Debito",
        valor: resumo.valorCartaoDebito,
        color: primaryColor,
      },
      {
        nome: "# Cartao Credito",
        valor: resumo.valorCartaoCredito,
        color: primaryColor,
      },
      {
        nome: "@ Transferencia",
        valor: resumo.valorTransferencia,
        color: textColor,
      },
      { nome: "= Boleto", valor: resumo.valorBoleto, color: textColor },
      { nome: "+ Crediario", valor: resumo.valorCrediario, color: textColor },
      { nome: "* Fiado", valor: resumo.valorFiado, color: dangerColor },
    ];

    doc.setFontSize(10);

    // Criar tabela de formas de pagamento
    formasPagamento.forEach((forma, index) => {
      if (index % 2 === 0) {
        doc.setFillColor(...lightGray);
        doc.rect(20, yPos, 170, 8, "F");
      }

      doc.setFont("helvetica", "bold");
      doc.setTextColor(...textColor);
      doc.text(forma.nome, 25, yPos + 6);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(...forma.color);
      doc.text(
        forma.valor.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        }),
        175,
        yPos + 6,
        { align: "right" }
      );

      yPos += 8;
    });

    yPos += 8;

    // ========== VENDAS DETALHADAS POR FORMA DE PAGAMENTO ==========
    if (vendas && vendas.length > 0) {
      // Verificar se precisa adicionar nova página antes de começar a seção
      if (yPos > 200) {
        doc.addPage();
        yPos = 20;
      }

      // Título da seção completa
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...primaryColor);
      doc.text("VENDAS DETALHADAS", 105, yPos, { align: "center" });
      yPos += 3;

      // Linha decorativa
      doc.setDrawColor(...primaryColor);
      doc.setLineWidth(0.5);
      doc.line(20, yPos, 190, yPos);
      yPos += 10;

      // Agrupar vendas por forma de pagamento
      const vendasPorFormaPagamento: { [key: string]: Venda[] } = {};

      vendas.forEach((venda) => {
        const forma = venda.forma_pagamento || "Não especificado";
        if (!vendasPorFormaPagamento[forma]) {
          vendasPorFormaPagamento[forma] = [];
        }
        vendasPorFormaPagamento[forma].push(venda);
      });

      // Ordenar formas de pagamento (ordem fixa)
      const ordemFormasPagamento = [
        "Dinheiro",
        "PIX",
        "Cartão de Débito",
        "Cartão de Crédito",
        "Transferência",
        "Boleto",
        "Crediário",
        "Fiado",
      ];

      const formasOrdenadas = Object.keys(vendasPorFormaPagamento).sort(
        (a, b) => {
          const indexA = ordemFormasPagamento.indexOf(a);
          const indexB = ordemFormasPagamento.indexOf(b);
          if (indexA === -1 && indexB === -1) return a.localeCompare(b);
          if (indexA === -1) return 1;
          if (indexB === -1) return -1;
          return indexA - indexB;
        }
      );

      // Mapa de ícones para cada forma de pagamento
      const iconesFormas: { [key: string]: string } = {
        Dinheiro: "$",
        PIX: ">",
        "Cartão de Débito": "#",
        "Cartão de Crédito": "#",
        Transferência: "@",
        Boleto: "=",
        Crediário: "+",
        Fiado: "*",
      };

      formasOrdenadas.forEach((formaPagamento, formaIndex) => {
        const vendasDaForma = vendasPorFormaPagamento[formaPagamento];

        // Verificar se precisa adicionar nova página
        if (yPos > 235) {
          doc.addPage();
          yPos = 20;
        }

        // Box colorido para a forma de pagamento
        doc.setFillColor(...lightGray);
        doc.roundedRect(20, yPos - 3, 170, 12, 2, 2, "F");

        // Ícone e título da forma de pagamento
        const icone = iconesFormas[formaPagamento] || "$";
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...primaryColor);
        doc.text(`[${icone}] ${formaPagamento}`, 25, yPos + 3);

        // Quantidade e total no mesmo nível
        const totalForma = vendasDaForma.reduce((acc, v) => {
          const valor = Number(
            (v as any).valor_total ?? (v as any).total_liquido ?? 0
          );
          return acc + valor;
        }, 0);
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...textColor);

        const infoTexto = `${vendasDaForma.length} venda(s)`;
        doc.text(infoTexto, 25, yPos + 8);

        doc.setFont("helvetica", "bold");
        doc.setTextColor(...successColor);
        doc.text(
          totalForma.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          }),
          185,
          yPos + 5.5,
          { align: "right" }
        );

        yPos += 14;

        // Cabeçalho da tabela
        doc.setFillColor(220, 220, 220);
        doc.rect(20, yPos, 170, 7, "F");

        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(60, 60, 60);
        doc.text("ID", 23, yPos + 4.5);
        doc.text("Data/Hora", 40, yPos + 4.5);
        doc.text("Cliente", 80, yPos + 4.5);
        doc.text("Valor", 185, yPos + 4.5, { align: "right" });

        yPos += 9;

        // Listar vendas
        vendasDaForma.forEach((venda, index) => {
          // Verificar se precisa adicionar nova página
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;

            // Repetir info da forma de pagamento
            doc.setFillColor(...lightGray);
            doc.roundedRect(20, yPos - 3, 170, 8, 2, 2, "F");
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(...primaryColor);
            doc.text(
              `[${icone}] ${formaPagamento} (continuacao)`,
              25,
              yPos + 3
            );
            yPos += 10;

            // Repetir cabeçalho
            doc.setFillColor(220, 220, 220);
            doc.rect(20, yPos, 170, 7, "F");
            doc.setFontSize(8);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(60, 60, 60);
            doc.text("ID", 23, yPos + 4.5);
            doc.text("Data/Hora", 40, yPos + 4.5);
            doc.text("Cliente", 80, yPos + 4.5);
            doc.text("Valor", 185, yPos + 4.5, { align: "right" });
            yPos += 9;
          }

          // Linha alternada
          if (index % 2 === 0) {
            doc.setFillColor(248, 248, 248);
            doc.rect(20, yPos - 2, 170, 6.5, "F");
          }

          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.setTextColor(...textColor);

          // ID da venda
          doc.setFont("helvetica", "bold");
          doc.setTextColor(100, 100, 100);
          doc.text(`#${venda.id}`, 23, yPos + 2.5);

          // Data e hora
          doc.setFont("helvetica", "normal");
          doc.setTextColor(...textColor);
          const dataVenda = new Date(venda.data_venda);
          const dataFormatada = dataVenda.toLocaleString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          });
          doc.text(dataFormatada, 40, yPos + 2.5);

          // Cliente (truncar se muito longo)
          const cliente = venda.cliente_nome || "Cliente avulso";
          const clienteTruncado =
            cliente.length > 40 ? cliente.substring(0, 37) + "..." : cliente;
          doc.text(clienteTruncado, 80, yPos + 2.5);

          // Valor
          doc.setFont("helvetica", "bold");
          doc.setTextColor(...successColor);
          const valorVenda = Number(
            (venda as any).valor_total ?? (venda as any).total_liquido ?? 0
          );
          doc.text(
            valorVenda.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            }),
            185,
            yPos + 2.5,
            { align: "right" }
          );

          yPos += 6.5;
        });

        // Espaço entre formas de pagamento
        yPos += 5;
      });
    }

    // ========== OBSERVAÇÕES ==========
    if (caixa.observacoes_abertura || caixa.observacoes_fechamento) {
      doc.setTextColor(...textColor);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Observações", 20, yPos);
      yPos += 8;

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");

      if (caixa.observacoes_abertura) {
        doc.setFont("helvetica", "bold");
        doc.text("Abertura:", 25, yPos);
        doc.setFont("helvetica", "normal");
        yPos += 5;

        const obsAbertura = doc.splitTextToSize(
          caixa.observacoes_abertura,
          160
        );
        doc.text(obsAbertura, 25, yPos);
        yPos += obsAbertura.length * 5 + 5;
      }

      if (caixa.observacoes_fechamento) {
        doc.setFont("helvetica", "bold");
        doc.text("Fechamento:", 25, yPos);
        doc.setFont("helvetica", "normal");
        yPos += 5;

        const obsFechamento = doc.splitTextToSize(
          caixa.observacoes_fechamento,
          160
        );
        doc.text(obsFechamento, 25, yPos);
        yPos += obsFechamento.length * 5;
      }
    }

    // ========== RODAPÉ ==========
    const pageHeight = doc.internal.pageSize.height;
    doc.setFillColor(...lightGray);
    doc.rect(0, pageHeight - 20, 210, 20, "F");

    doc.setTextColor(...textColor);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Relatório gerado em: ${new Date().toLocaleString("pt-BR", {
        timeZone: "America/Sao_Paulo",
      })}`,
      105,
      pageHeight - 12,
      { align: "center" }
    );
    doc.text(
      "Sistema de Gerenciamento - Autorizada Cell",
      105,
      pageHeight - 7,
      { align: "center" }
    );

    // Salvar PDF
    const nomeArquivo = `Caixa_${loja.nome.replace(/\s+/g, "_")}_${new Date(
      caixa.data_abertura
    )
      .toLocaleDateString("pt-BR")
      .replace(/\//g, "-")}.pdf`;

    doc.save(nomeArquivo);
  }
}
