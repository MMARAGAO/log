import jsPDF from "jspdf";
import type { CaixaAberto, Loja, ResumoVendas, Venda, Sangria } from "./types";

// Helper para formatar datas corretamente (timestamps UTC do banco)
function formatarDataHora(timestamp: string): string {
  // Se o timestamp já tem timezone (+00, -03, Z), usa direto
  // Se não tem, adiciona 'Z' para forçar interpretação como UTC
  const ts =
    timestamp.includes("+") || timestamp.includes("Z")
      ? timestamp
      : timestamp + "Z";
  const date = new Date(ts);
  return date.toLocaleString("pt-BR");
}

function formatarDataHoraSimples(timestamp: string): string {
  const ts =
    timestamp.includes("+") || timestamp.includes("Z")
      ? timestamp
      : timestamp + "Z";
  const date = new Date(ts);
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface CaixaPDFProps {
  caixa: CaixaAberto;
  loja: Loja;
  resumo: ResumoVendas;
  vendas?: Venda[];
  sangrias?: Sangria[];
}

export class CaixaPDFGenerator {
  static gerar({
    caixa,
    loja,
    resumo,
    vendas = [],
    sangrias = [],
  }: CaixaPDFProps) {
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

    // ========== DEVOLUÇÕES (SE HOUVER) ==========
    if (resumo.totalDevolvidas > 0) {
      doc.setFillColor(254, 242, 242); // red-50
      doc.rect(20, yPos, 170, 22, "F");

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...dangerColor);
      doc.text("⚠ DEVOLUÇÕES:", 25, yPos + 6);

      doc.setFont("helvetica", "normal");
      doc.text(
        `${resumo.totalDevolvidas} venda${resumo.totalDevolvidas > 1 ? "s" : ""} devolvida${resumo.totalDevolvidas > 1 ? "s" : ""}`,
        25,
        yPos + 12
      );

      doc.setFont("helvetica", "bold");
      doc.text("Valor Total:", 110, yPos + 6);
      doc.setFont("helvetica", "normal");
      doc.text(
        resumo.valorTotalDevolvido.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        }),
        145,
        yPos + 6
      );

      doc.setFontSize(8);
      doc.setTextColor(127, 29, 29); // red-900
      doc.text(
        "* Vendas devolvidas estão incluídas no valor total acima",
        25,
        yPos + 18
      );

      doc.setTextColor(...textColor);
      yPos += 28;
    }

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

      // Cabeçalho da tabela
      doc.setFillColor(220, 220, 220);
      doc.rect(20, yPos, 170, 7, "F");

      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(60, 60, 60);
      doc.text("ID", 23, yPos + 4.5);
      doc.text("Data/Hora", 40, yPos + 4.5);
      doc.text("Cliente", 80, yPos + 4.5);
      // Mantemos Status na coluna (ex.: pago, devolvido, fiado)
      doc.text("Status", 140, yPos + 4.5);
      doc.text("Valor", 185, yPos + 4.5, { align: "right" });

      yPos += 9;

      // Listagem agrupada por forma de pagamento. Vendas com múltiplas formas
      // são divididas e cada parte aparece na sua categoria correspondente
      // (ex.: uma venda com Dinheiro R$150 + PIX R$150 aparece em ambas seções).
      const mapPaymentKeyToLabel = (key: string): string => {
        const k = (key || "").toLowerCase();
        if (k === "dinheiro") return "Dinheiro";
        if (k === "pix") return "PIX";
        if (k === "debito" || k === "débito") return "Cartão de Débito";
        if (k === "credito" || k === "crédito") return "Cartão de Crédito";
        if (k === "carteira_digital") return "Carteira";
        if (k === "transferencia" || k === "transferência" || k === "transfer")
          return "Transferência";
        if (k === "boleto") return "Boleto";
        if (k === "crediario") return "Crediário";
        if (k === "fiado") return "Fiado";
        return key.charAt(0).toUpperCase() + key.slice(1);
      };

      type VendaEntry = {
        venda: Venda;
        resumo: string; // e.g. "Dinheiro R$150 • PIX R$150" ou "PIX R$300"
        parts: { label: string; amt: number }[];
        valorParcial: number; // Valor da parte específica desta forma
      };

      const vendasPorFormaPagamento: { [key: string]: VendaEntry[] } = {};

      vendas.forEach((venda) => {
        const detalhes: any = (venda as any).pagamento_detalhes;
        const valorTotal = Number(
          (venda as any).valor_total ?? (venda as any).total_liquido ?? 0
        );

        const parts: { label: string; amt: number }[] = [];
        let temDetalhes = false;

        // Se tem pagamento_detalhes (vendas novas), usar ele
        if (
          detalhes &&
          typeof detalhes === "object" &&
          Object.keys(detalhes).length > 0
        ) {
          temDetalhes = true;
          Object.entries(detalhes).forEach(([k, val]) => {
            const amt = Number(val || 0);
            if (amt > 0) {
              const label = mapPaymentKeyToLabel(k);
              parts.push({ label, amt });
            }
          });
        } else {
          // FALLBACK: Se não tem pagamento_detalhes (vendas antigas), usar forma_pagamento
          const formaPrincipal = venda.forma_pagamento || "Outros";
          parts.push({
            label: mapPaymentKeyToLabel(formaPrincipal.toLowerCase()),
            amt: valorTotal,
          });
        }

        // APENAS para vendas SEM pagamento_detalhes (antigas):
        // Se há diferença entre valor_total e soma dos parts, adicionar restante
        if (!temDetalhes) {
          const soma = parts.reduce((s, p) => s + p.amt, 0);
          const restante = Math.max(0, valorTotal - soma);
          if (restante > 0.01) {
            // Tolerância de 1 centavo
            parts.push({
              label: venda.forma_pagamento || "Outros",
              amt: restante,
            });
          }
        }

        const isMultiple = parts.length > 1;

        const resumo = parts
          .map(
            (p) =>
              `${p.label} ${p.amt.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`
          )
          .join(" • ");

        // MUDANÇA: Ao invés de agrupar múltiplos em "Múltiplo",
        // adiciona cada parte na sua categoria correspondente
        if (isMultiple) {
          // Para vendas com múltiplas formas, adicionar uma entrada para CADA forma
          parts.forEach((part) => {
            const groupKey = part.label;
            if (!vendasPorFormaPagamento[groupKey])
              vendasPorFormaPagamento[groupKey] = [];
            vendasPorFormaPagamento[groupKey].push({
              venda,
              resumo,
              parts,
              valorParcial: part.amt,
            });
          });
        } else {
          // Venda com forma única
          const groupKey =
            parts[0]?.label || venda.forma_pagamento || "Não especificado";
          if (!vendasPorFormaPagamento[groupKey])
            vendasPorFormaPagamento[groupKey] = [];
          vendasPorFormaPagamento[groupKey].push({
            venda,
            resumo,
            parts,
            valorParcial: valorTotal,
          });
        }
      });

      // Ordem fixa das formas de pagamento
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

      // Ícones para cada forma
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

      formasOrdenadas.forEach((formaPagamento) => {
        const vendasDaForma = vendasPorFormaPagamento[formaPagamento] || [];
        if (vendasDaForma.length === 0) return;

        // Verificar se precisa adicionar nova página
        if (yPos > 235) {
          doc.addPage();
          yPos = 20;
        }

        // Box colorido para a forma de pagamento
        doc.setFillColor(...lightGray);
        doc.roundedRect(20, yPos - 3, 170, 12, 2, 2, "F");

        const icone = iconesFormas[formaPagamento] || "$";
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...primaryColor);
        doc.text(`[${icone}] ${formaPagamento}`, 25, yPos + 3);

        // Quantidade e total
        // Usa valorParcial para somar apenas a parte correspondente a esta forma
        const totalForma = vendasDaForma.reduce((acc, v) => {
          return acc + v.valorParcial;
        }, 0);

        // Conta vendas únicas (não duplica vendas com múltiplas formas)
        const vendasUnicas = new Set(vendasDaForma.map((v) => v.venda.id)).size;

        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...textColor);

        const infoTexto = `${vendasUnicas} venda(s)`;
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
        doc.text("Status", 140, yPos + 4.5);
        doc.text("Valor", 185, yPos + 4.5, { align: "right" });

        yPos += 9;

        vendasDaForma.forEach((entry, idx) => {
          // Nova página se necessário
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;

            // Repetir box
            doc.setFillColor(...lightGray);
            doc.roundedRect(20, yPos - 3, 170, 8, 2, 2, "F");
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(...primaryColor);
            doc.text(
              `[${icone}] ${formaPagamento} (continuação)`,
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
            doc.text("Status", 140, yPos + 4.5);
            doc.text("Valor", 185, yPos + 4.5, { align: "right" });
            yPos += 9;
          }

          // Verificar se é pagamento múltiplo
          const isMultiple = entry.parts.length > 1;

          // Linha zebrada
          if (idx % 2 === 0) {
            doc.setFillColor(248, 248, 248);
            doc.rect(20, yPos - 2, 170, 6.5, "F");
          }

          const cliente = entry.venda.cliente_nome || "Cliente avulso";
          const dataFormatada = formatarDataHoraSimples(
            entry.venda.data_pagamento || entry.venda.data_venda
          );
          const statusTexto = (entry.venda.status_pagamento || "-").toString();

          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.setTextColor(...textColor);

          // ID
          doc.setFont("helvetica", "bold");
          doc.setTextColor(100, 100, 100);
          doc.text(`#${entry.venda.id}`, 23, yPos + 2.5);

          // Data
          doc.setFont("helvetica", "normal");
          doc.setTextColor(...textColor);
          doc.text(dataFormatada, 40, yPos + 2.5);

          // Cliente - Se múltiplo, indicar com sufixo
          let clienteTexto = cliente;
          if (isMultiple) {
            // Criar resumo das outras formas (exceto a atual)
            const outrasFormas = entry.parts
              .filter((p) => p.label !== formaPagamento)
              .map(
                (p) =>
                  `${p.label} ${p.amt.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`
              )
              .join(" • ");

            if (outrasFormas) {
              clienteTexto = `${cliente} — Múltiplo (${outrasFormas})`;
            }
          }

          const clienteTruncado =
            clienteTexto.length > 40
              ? clienteTexto.substring(0, 37) + "..."
              : clienteTexto;
          doc.text(clienteTruncado, 80, yPos + 2.5);

          // Status
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.setTextColor(80, 80, 80);
          doc.text(statusTexto, 140, yPos + 2.5);
          doc.setTextColor(...textColor);

          // Valor - mostra apenas a parte correspondente a esta forma
          doc.setFont("helvetica", "bold");
          doc.setTextColor(...successColor);
          doc.text(
            entry.valorParcial.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            }),
            185,
            yPos + 2.5,
            { align: "right" }
          );

          yPos += 6.5;
        });

        yPos += 5;
      });
    }

    // ========== SANGRIAS ==========
    if (sangrias && sangrias.length > 0) {
      // Adiciona nova página se necessário
      if (yPos > 220) {
        doc.addPage();
        yPos = 20;
      }

      doc.setTextColor(...textColor);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("[$] Sangrias Realizadas", 20, yPos);
      yPos += 8;

      // Separar sangrias ativas e canceladas
      // Sangrias sem status são consideradas ativas (retrocompatibilidade)
      const sangriasAtivas = sangrias.filter(
        (s) => !s.status || s.status === "ativa"
      );
      const sangriasCanceladas = sangrias.filter(
        (s) => s.status === "cancelada"
      );

      // ========== SANGRIAS ATIVAS ==========
      if (sangriasAtivas.length > 0) {
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...successColor);
        doc.text(`Sangrias Ativas (${sangriasAtivas.length})`, 20, yPos);
        doc.setTextColor(...textColor);
        yPos += 6;

        // Box com lista de sangrias ativas
        doc.setFillColor(...lightGray);
        doc.rect(20, yPos, 170, 6, "F");

        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text("Data/Hora", 25, yPos + 4);
        doc.text("Motivo", 70, yPos + 4);
        doc.text("Valor", 165, yPos + 4);
        yPos += 6;

        doc.setFont("helvetica", "normal");
        let totalSangriasAtivas = 0;

        sangriasAtivas.forEach((sangria, idx) => {
          // Verifica se precisa de nova página
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;

            // Repete cabeçalho
            doc.setFillColor(...lightGray);
            doc.rect(20, yPos, 170, 6, "F");
            doc.setFont("helvetica", "bold");
            doc.text("Data/Hora", 25, yPos + 4);
            doc.text("Motivo", 70, yPos + 4);
            doc.text("Valor", 165, yPos + 4);
            yPos += 6;
            doc.setFont("helvetica", "normal");
          }

          // Linha zebrada
          if (idx % 2 === 0) {
            doc.setFillColor(255, 255, 255);
          } else {
            doc.setFillColor(250, 250, 250);
          }
          doc.rect(20, yPos, 170, 5, "F");

          // Data e hora
          const dataSangria = new Date(sangria.data_sangria).toLocaleString(
            "pt-BR",
            {
              dateStyle: "short",
              timeStyle: "short",
            }
          );
          doc.text(dataSangria, 25, yPos + 3.5);

          // Motivo (truncado)
          const motivoTruncado = doc.splitTextToSize(sangria.motivo, 85);
          doc.text(motivoTruncado[0], 70, yPos + 3.5);

          // Valor
          doc.setTextColor(...dangerColor);
          doc.text(
            "- " +
              sangria.valor.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              }),
            165,
            yPos + 3.5
          );
          doc.setTextColor(...textColor);

          totalSangriasAtivas += sangria.valor;
          yPos += 5;
        });

        // Total de sangrias ativas
        yPos += 2;
        doc.setFillColor(...warningColor);
        doc.rect(20, yPos, 170, 7, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text("Total de Sangrias Ativas:", 25, yPos + 5);
        doc.setTextColor(255, 255, 255);
        doc.text(
          "- " +
            totalSangriasAtivas.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            }),
          165,
          yPos + 5
        );
        doc.setTextColor(...textColor);
        doc.setFontSize(9);
        yPos += 12;
      }

      // ========== SANGRIAS CANCELADAS ==========
      if (sangriasCanceladas.length > 0) {
        // Verifica se precisa de nova página
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...dangerColor);
        doc.text(
          `Sangrias Canceladas (${sangriasCanceladas.length})`,
          20,
          yPos
        );
        doc.setTextColor(...textColor);
        yPos += 6;

        // Box com lista de sangrias canceladas
        doc.setFillColor(...lightGray);
        doc.rect(20, yPos, 170, 6, "F");

        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        doc.text("Criada em", 25, yPos + 4);
        doc.text("Cancelada em", 60, yPos + 4);
        doc.text("Motivo", 95, yPos + 4);
        doc.text("Valor", 165, yPos + 4);
        yPos += 6;

        doc.setFont("helvetica", "normal");

        sangriasCanceladas.forEach((sangria, idx) => {
          // Verifica se precisa de nova página
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;

            // Repete cabeçalho
            doc.setFillColor(...lightGray);
            doc.rect(20, yPos, 170, 6, "F");
            doc.setFont("helvetica", "bold");
            doc.text("Criada em", 25, yPos + 4);
            doc.text("Cancelada em", 60, yPos + 4);
            doc.text("Motivo", 95, yPos + 4);
            doc.text("Valor", 165, yPos + 4);
            yPos += 6;
            doc.setFont("helvetica", "normal");
          }

          // Linha zebrada (mais clara para indicar cancelada)
          if (idx % 2 === 0) {
            doc.setFillColor(254, 226, 226); // Red-100
          } else {
            doc.setFillColor(252, 245, 245); // Red-50
          }
          doc.rect(20, yPos, 170, 5, "F");

          // Data de criação
          const dataCriacao = new Date(sangria.data_sangria).toLocaleString(
            "pt-BR",
            {
              dateStyle: "short",
              timeStyle: "short",
            }
          );
          doc.setFontSize(7);
          doc.text(dataCriacao, 25, yPos + 3.5);

          // Data de cancelamento
          if (sangria.data_cancelamento) {
            const dataCancelamento = new Date(
              sangria.data_cancelamento
            ).toLocaleString("pt-BR", {
              dateStyle: "short",
              timeStyle: "short",
            });
            doc.text(dataCancelamento, 60, yPos + 3.5);
          }

          // Motivo cancelamento (truncado)
          if (sangria.motivo_cancelamento) {
            const motivoTrunc = doc.splitTextToSize(
              sangria.motivo_cancelamento,
              60
            );
            doc.text(motivoTrunc[0], 95, yPos + 3.5);
          }

          // Valor (riscado)
          doc.setTextColor(156, 163, 175); // Gray-400
          doc.text(
            sangria.valor.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            }),
            165,
            yPos + 3.5
          );
          doc.setTextColor(...textColor);

          yPos += 5;
        });

        yPos += 6;
      }
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
      `Relatório gerado em: ${new Date().toLocaleString("pt-BR")}`,
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
