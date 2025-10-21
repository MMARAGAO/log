import jsPDF from "jspdf";
import type { CaixaAberto, Loja, ResumoVendas } from "./types";

interface CaixaPDFProps {
  caixa: CaixaAberto;
  loja: Loja;
  resumo: ResumoVendas;
}

export class CaixaPDFGenerator {
  static gerar({ caixa, loja, resumo }: CaixaPDFProps) {
    const doc = new jsPDF();

    // Cores
    const primaryColor: [number, number, number] = [59, 130, 246]; // Blue
    const successColor: [number, number, number] = [34, 197, 94]; // Green
    const dangerColor: [number, number, number] = [239, 68, 68]; // Red
    const textColor: [number, number, number] = [31, 41, 55]; // Gray-800
    const lightGray: [number, number, number] = [243, 244, 246]; // Gray-100

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
