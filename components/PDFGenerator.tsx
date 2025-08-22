import jsPDF from "jspdf";

interface Cliente {
  id: number;
  nome: string;
  email?: string;
  telefone?: string;
  doc?: string;
  endereco?: string;
}

interface Ordem {
  id: number;
  modelo: string;
  cor?: string;
  defeito?: string;
  diagnostico?: string;
  entrada?: string;
  saida?: string;
  forma_pagamento?: string;
  status: string;
  garantia: boolean;
  periodo_garantia?: string;
  observacoes?: string;
  prazo?: string;
  prioridade: string;
  tecnico_responsavel?: string;
  valor?: number;
  id_cliente?: number;
}

interface PDFGeneratorProps {
  ordem: Ordem;
  cliente?: Cliente;
  statusLabel?: string;
  prioridadeLabel?: string;
  formaPagamentoLabel?: string;
}

export class PDFGenerator {
  static gerar({
    ordem,
    cliente,
    statusLabel,
    prioridadeLabel,
    formaPagamentoLabel,
  }: PDFGeneratorProps) {
    const doc = new jsPDF();

    // Configuração de cores como tuplas [R, G, B]
    const primaryColor: [number, number, number] = [76, 175, 80]; // Verde da logo
    const secondaryColor: [number, number, number] = [33, 37, 41]; // Cinza escuro
    const lightGray: [number, number, number] = [248, 249, 250]; // Cinza claro
    const success: [number, number, number] = [40, 167, 69]; // Verde sucesso
    const white: [number, number, number] = [255, 255, 255]; // Branco
    const borderColor: [number, number, number] = [222, 226, 230]; // Cinza borda

    // Função auxiliar para adicionar texto com quebra de linha
    function addTextWithWrap(
      text: string,
      x: number,
      y: number,
      maxWidth: number,
      fontSize: number = 10
    ) {
      doc.setFontSize(fontSize);
      const lines = doc.splitTextToSize(text, maxWidth);
      doc.text(lines, x, y);
      return y + lines.length * (fontSize * 0.35) + 2;
    }

    // Função para adicionar logo via URL/caminho
    function addLogo() {
      try {
        // Caminho para a logo na pasta public do seu projeto
        const logoPath = "/autorizada-cell-logo.png"; // Coloque sua logo aqui

        // Ou se estiver hospedada online
        // const logoPath = "https://seusite.com/logo.png";

        doc.addImage(
          logoPath,
          "PNG", // ou "JPEG" dependendo do formato
          8, // x
          8, // y
          30, // largura
          25 // altura
        );
      } catch (error) {
        // Fallback caso não carregue a logo
        console.log("Erro ao carregar logo:", error);
        // Usar placeholder
        doc.setFillColor(...primaryColor);
        doc.circle(25, 20, 8, "F");
        doc.setTextColor(...white);
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text("AC", 22, 22);
      }
    }

    // Cabeçalho com gradiente simulado
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 40, "F");

    // Adicionar logo
    addLogo();

    // Informações da empresa (lado esquerdo) - ajustado para dar espaço à logo
    doc.setTextColor(...white);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("AUTORIZADA CELL", 45, 15); // Movido para a direita

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("CNPJ: 34.720.091/0001-51", 45, 21);
    doc.text("Luiz Felipe Oliveira - Socio Administrador", 45, 26);
    doc.text("SIA Trecho 7, Bloco D, Banca 229 - CEP: 71200-100", 45, 31);
    doc.text("Tel: (61) 98212-0747 | luizfelipeoliveirar@gmail.com", 45, 36);

    // Título da OS (lado direito)
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("ORDEM DE SERVICO", 130, 18);

    doc.setFontSize(14);
    doc.text(`OS #${ordem.id.toString().padStart(4, "0")}`, 130, 26);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Emitido: ${new Date().toLocaleDateString("pt-BR")}`, 130, 32);

    if (ordem.entrada) {
      doc.text(
        `Entrada: ${new Date(ordem.entrada).toLocaleDateString("pt-BR")}`,
        130,
        36
      );
    }

    // Reset cor do texto
    doc.setTextColor(0, 0, 0);

    let yPosition = 55;

    // Seção Cliente com bordas
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.5);
    doc.rect(10, yPosition, 190, 35);

    doc.setFillColor(...lightGray);
    doc.rect(10, yPosition, 190, 8, "F");
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...secondaryColor);
    doc.text(" DADOS DO CLIENTE", 15, yPosition + 5);

    yPosition += 12;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    if (cliente) {
      doc.setFont("helvetica", "bold");
      doc.text("Nome:", 15, yPosition);
      doc.setFont("helvetica", "normal");
      doc.text(cliente.nome, 35, yPosition);

      doc.setFont("helvetica", "bold");
      doc.text("Documento:", 110, yPosition);
      doc.setFont("helvetica", "normal");
      doc.text(cliente.doc || "N/A", 145, yPosition);

      yPosition += 6;
      doc.setFont("helvetica", "bold");
      doc.text("Email:", 15, yPosition);
      doc.setFont("helvetica", "normal");
      doc.text(cliente.email || "N/A", 35, yPosition);

      doc.setFont("helvetica", "bold");
      doc.text("Telefone:", 110, yPosition);
      doc.setFont("helvetica", "normal");
      doc.text(cliente.telefone || "N/A", 140, yPosition);

      if (cliente.endereco) {
        yPosition += 6;
        doc.setFont("helvetica", "bold");
        doc.text("Endereco:", 15, yPosition);
        doc.setFont("helvetica", "normal");
        yPosition = addTextWithWrap(cliente.endereco, 45, yPosition, 150, 10);
      }
    } else {
      doc.text("Cliente nao informado", 15, yPosition);
    }

    yPosition += 10;

    // Seção Equipamento
    doc.rect(10, yPosition, 190, 40);
    doc.setFillColor(...lightGray);
    doc.rect(10, yPosition, 190, 8, "F");
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...secondaryColor);
    doc.text(" EQUIPAMENTO & PROBLEMA", 15, yPosition + 5);

    yPosition += 12;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    doc.setFont("helvetica", "bold");
    doc.text("Modelo:", 15, yPosition);
    doc.setFont("helvetica", "normal");
    doc.text(ordem.modelo || "N/A", 45, yPosition);

    doc.setFont("helvetica", "bold");
    doc.text("Cor:", 110, yPosition);
    doc.setFont("helvetica", "normal");
    doc.text(ordem.cor || "N/A", 125, yPosition);

    yPosition += 8;

    if (ordem.defeito) {
      doc.setFont("helvetica", "bold");
      doc.text("Defeito Relatado:", 15, yPosition);
      doc.setFont("helvetica", "normal");
      yPosition = addTextWithWrap(ordem.defeito, 15, yPosition + 4, 180, 9);
    }

    if (ordem.diagnostico) {
      doc.setFont("helvetica", "bold");
      doc.text("Diagnostico Tecnico:", 15, yPosition);
      doc.setFont("helvetica", "normal");
      yPosition = addTextWithWrap(ordem.diagnostico, 15, yPosition + 4, 180, 9);
    }

    yPosition += 15;

    // Seção Serviço
    doc.rect(10, yPosition, 190, 45);
    doc.setFillColor(...lightGray);
    doc.rect(10, yPosition, 190, 8, "F");
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...secondaryColor);
    doc.text(" INFORMACOES DO SERVICO", 15, yPosition + 5);

    yPosition += 12;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    // Status com background colorido
    doc.setFont("helvetica", "bold");
    doc.text("Status:", 15, yPosition);
    doc.setFont("helvetica", "normal");

    const statusColors: { [key: string]: [number, number, number] } = {
      aguardando: [255, 193, 7],
      em_andamento: [0, 123, 255],
      concluido: [40, 167, 69],
      entregue: [40, 167, 69],
      cancelado: [220, 53, 69],
    };

    const statusColor = statusColors[ordem.status] || [108, 117, 125];
    doc.setFillColor(...statusColor);
    doc.roundedRect(40, yPosition - 3, 35, 6, 2, 2, "F");
    doc.setTextColor(...white);
    doc.text(statusLabel || ordem.status, 42, yPosition);
    doc.setTextColor(0, 0, 0);

    doc.setFont("helvetica", "bold");
    doc.text("Prioridade:", 110, yPosition);
    doc.setFont("helvetica", "normal");
    doc.text(prioridadeLabel || ordem.prioridade, 150, yPosition);

    yPosition += 8;
    doc.setFont("helvetica", "bold");
    doc.text("Tecnico:", 15, yPosition);
    doc.setFont("helvetica", "normal");
    doc.text(ordem.tecnico_responsavel || "A definir", 45, yPosition);

    if (ordem.prazo) {
      doc.setFont("helvetica", "bold");
      doc.text("Prazo:", 110, yPosition);
      doc.setFont("helvetica", "normal");
      doc.text(
        new Date(ordem.prazo).toLocaleDateString("pt-BR"),
        135,
        yPosition
      );
    }

    yPosition += 8;

    // Valor destacado
    if (ordem.valor) {
      doc.setFillColor(255, 248, 225);
      doc.roundedRect(12, yPosition - 2, 90, 8, 2, 2, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(138, 109, 59);
      doc.text("Valor:", 15, yPosition + 2);
      doc.text(
        new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
        }).format(ordem.valor),
        35,
        yPosition + 2
      );
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
    }

    if (formaPagamentoLabel) {
      doc.setFont("helvetica", "bold");
      doc.text("Pagamento:", 110, yPosition + 2);
      doc.setFont("helvetica", "normal");
      doc.text(formaPagamentoLabel, 155, yPosition + 2);
    }

    yPosition += 20;

    // Garantia (se houver)
    if (ordem.garantia) {
      doc.setFillColor(...success);
      doc.roundedRect(10, yPosition, 190, 12, 3, 3, "F");
      doc.setTextColor(...white);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("*** GARANTIA INCLUIDA ***", 15, yPosition + 6);
      doc.text(
        `Periodo: ${ordem.periodo_garantia || "Conforme contrato"}`,
        110,
        yPosition + 6
      );
      yPosition += 18;
      doc.setTextColor(0, 0, 0);
    }

    // Observações
    if (ordem.observacoes) {
      doc.setDrawColor(...borderColor);
      doc.rect(10, yPosition, 190, 30);
      doc.setFillColor(...lightGray);
      doc.rect(10, yPosition, 190, 8, "F");
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...secondaryColor);
      doc.text(" OBSERVACOES", 15, yPosition + 5);

      yPosition += 12;
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      yPosition = addTextWithWrap(ordem.observacoes, 15, yPosition, 180, 9);
      yPosition += 15;
    }

    // Termos e condições
    yPosition += 5;
    if (yPosition > 210) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFillColor(248, 249, 250);
    doc.rect(10, yPosition, 190, 40, "F");
    doc.setDrawColor(...borderColor);
    doc.rect(10, yPosition, 190, 40);

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...secondaryColor);
    doc.text(" TERMOS E CONDICOES", 15, yPosition + 8);

    yPosition += 15;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");

    const termos = [
      "• Este documento e obrigatorio para retirada do equipamento.",
      "• Equipamentos nao retirados em 90 dias serao considerados abandonados.",
      "• A garantia e valida apenas para o defeito descrito nesta ordem.",
      "• Nao nos responsabilizamos por dados perdidos durante o reparo.",
      "• O cliente declara que o equipamento nao possui bloqueios ou senhas.",
    ];

    termos.forEach((termo, index) => {
      doc.text(termo, 15, yPosition + index * 4);
    });

    // Assinaturas
    yPosition += 35;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);

    // Linhas para assinatura
    doc.setDrawColor(0, 0, 0);
    doc.line(15, yPosition, 90, yPosition);
    doc.line(120, yPosition, 195, yPosition);

    doc.text("Assinatura do Cliente", 35, yPosition + 6);
    doc.text("Autorizada Cell", 145, yPosition + 6);
    doc.text("Data: ___/___/______", 35, yPosition + 12);
    doc.text("Luiz Felipe Oliveira", 140, yPosition + 12);

    // Rodapé
    const footerY = 280;
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(1);
    doc.line(10, footerY, 200, footerY);

    doc.setFontSize(7);
    doc.setTextColor(...secondaryColor);
    doc.text(
      `Documento gerado automaticamente em ${new Date().toLocaleString("pt-BR")}`,
      15,
      footerY + 4
    );
    doc.text(
      "Autorizada Cell - Assistencia Tecnica Especializada",
      15,
      footerY + 8
    );

    // Salvar o PDF
    const nomeArquivo = `OS_${ordem.id.toString().padStart(4, "0")}_${ordem.modelo?.replace(/[^a-zA-Z0-9]/g, "_") || "equipamento"}.pdf`;
    doc.save(nomeArquivo);
  }
}
