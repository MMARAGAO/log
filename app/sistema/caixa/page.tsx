"use client";

import { useState, useEffect, useMemo } from "react";
import { Button, Spinner, Card, CardBody } from "@heroui/react";
import {
  ClockIcon,
  LockOpenIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { fetchTable } from "@/lib/fetchTable";
import { insertTable } from "@/lib/insertTable";
import { updateTable } from "@/lib/updateTable";
import { useAuthStore } from "@/store/authZustand";
import toast, { Toaster } from "react-hot-toast";
import { currencyToNumber } from "@/utils/maskInput";

// Importa componentes modulares e tipos
import CaixaAbertoCard from "@/components/caixa/CaixaAbertoCard";
import LojaFechadaCard from "@/components/caixa/LojaFechadaCard";
import AbrirCaixaModal from "@/components/caixa/AbrirCaixaModal";
import FecharCaixaModal from "@/components/caixa/FecharCaixaModal";
import DetalhesCaixaModal from "@/components/caixa/DetalhesCaixaModal";
import HistoricoCaixaModal from "@/components/caixa/HistoricoCaixaModal";
import FiltroCaixaData from "@/components/caixa/FiltroCaixaData";
import SangriaModal from "@/components/caixa/SangriaModal";
import CancelarSangriaModal from "@/components/caixa/CancelarSangriaModal";
import { CaixaPDFGenerator } from "@/components/caixa/CaixaPDFGenerator";
import type {
  CaixaAberto,
  Venda,
  Loja,
  ResumoVendas,
  FormAbrir,
  FormFechar,
  Sangria,
  FormSangria,
} from "@/components/caixa/types";

function getErrorMessage(error: any): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

// Funções auxiliares para trabalhar com datas no fuso horário do Brasil
function getDateInBrazilTimezone(date?: string | Date): Date {
  const d = date ? new Date(date) : new Date();
  const brazilDate = new Date(
    d.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" })
  );
  return brazilDate;
}

function getDateStringInBrazil(date?: string | Date): string {
  // Use Intl with timezone to extract date parts directly (avoids parsing
  // issues caused by toLocaleString -> new Date conversions).
  const d = date ? new Date(date) : new Date();
  const formatter = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(d);
  const year = parts.find((p) => p.type === "year")?.value || "0000";
  const month = parts.find((p) => p.type === "month")?.value || "01";
  const day = parts.find((p) => p.type === "day")?.value || "01";

  return `${year}-${month}-${day}`;
}

function getISOStringInBrazil(): string {
  // Cria um formatter para o horário do Brasil
  const formatter = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(new Date());
  const date: Record<string, string> = {};
  parts.forEach((part) => {
    date[part.type] = part.value;
  });

  // Monta o timestamp no formato ISO com timezone do Brasil
  return `${date.year}-${date.month}-${date.day}T${date.hour}:${date.minute}:${date.second}-03:00`;
}

export default function CaixaPage() {
  // Estados principais
  const [caixasAbertos, setCaixasAbertos] = useState<CaixaAberto[]>([]);
  const [caixasFechadosHoje, setCaixasFechadosHoje] = useState<Set<number>>(
    new Set()
  );
  const [vendasPorLoja, setVendasPorLoja] = useState<Record<number, Venda[]>>(
    {}
  );
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [historicoCaixa, setHistoricoCaixa] = useState<CaixaAberto[]>([]);
  const [devolucoes, setDevolucoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Estados dos modais
  const [modalAbrir, setModalAbrir] = useState(false);
  const [modalFechar, setModalFechar] = useState(false);
  const [modalDetalhes, setModalDetalhes] = useState(false);
  const [modalHistorico, setModalHistorico] = useState(false);
  const [modalSangria, setModalSangria] = useState(false);
  const [modalCancelarSangria, setModalCancelarSangria] = useState(false);

  // Estados dos formulários
  const [formAbrir, setFormAbrir] = useState<FormAbrir>({
    loja_id: "",
    valor_inicial: "",
    observacoes_abertura: "",
  });

  const [formFechar, setFormFechar] = useState<FormFechar>({
    valor_final: "",
    observacoes_fechamento: "",
  });

  const [formSangria, setFormSangria] = useState<FormSangria>({
    valor: "",
    motivo: "",
  });

  // Estado para controlar qual caixa/loja está selecionado
  const [caixaSelecionado, setCaixaSelecionado] = useState<CaixaAberto | null>(
    null
  );
  const [lojaHistorico, setLojaHistorico] = useState<number | null>(null);

  // Estado para sangrias
  const [sangriasPorCaixa, setSangriasPorCaixa] = useState<
    Record<number, Sangria[]>
  >({});
  const [sangriaSelecionada, setSangriaSelecionada] = useState<Sangria | null>(
    null
  );
  const [motivoCancelamento, setMotivoCancelamento] = useState("");

  // Estados para filtro de data
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  // Permissões
  const { user } = useAuthStore();
  const acessos = user?.permissoes?.acessos as any;
  const permCaixa = acessos?.caixa;
  const canViewCaixa = !!permCaixa?.ver_caixa;
  const canOpenCaixa = !!permCaixa?.abrir_caixa;
  const canCloseCaixa = !!permCaixa?.fechar_caixa;
  // Usa permissão específica ou permite se puder fechar caixa
  const canCancelSangria = !!permCaixa?.cancelar_sangria || canCloseCaixa;

  // Filtrar lojas com base nas permissões do usuário
  const lojasDisponiveis = useMemo(() => {
    const lojaIdUsuario = user?.permissoes?.loja_id;

    // Se loja_id é null ou undefined, usuário tem acesso a todas as lojas
    if (lojaIdUsuario === null || lojaIdUsuario === undefined) {
      return lojas;
    }

    // Caso contrário, filtra apenas a loja do usuário
    return lojas.filter((loja) => loja.id === lojaIdUsuario);
  }, [lojas, user?.permissoes?.loja_id]);

  // Carrega dados iniciais
  useEffect(() => {
    if (canViewCaixa) {
      loadAllData();
      // Verifica caixas para fechar automaticamente ao carregar a página
      fecharCaixasAutomaticamente();
    }
  }, [canViewCaixa]);

  // Auto-refresh a cada 30 segundos
  useEffect(() => {
    if (!canViewCaixa) return;

    const interval = setInterval(() => {
      loadAllCaixas();
      loadAllVendas();
    }, 30000);

    return () => clearInterval(interval);
  }, [canViewCaixa]);

  // Monitora mudança de dia para fechar caixas automaticamente
  useEffect(() => {
    if (!canViewCaixa) return;

    let ultimaDataVerificada = getDateStringInBrazil();

    // Verifica a cada 1 minuto se o dia mudou
    const interval = setInterval(() => {
      const dataAtual = getDateStringInBrazil();

      if (dataAtual !== ultimaDataVerificada) {
        console.log(
          `📅 Dia mudou de ${ultimaDataVerificada} para ${dataAtual}`
        );
        ultimaDataVerificada = dataAtual;

        // Fecha caixas automaticamente
        fecharCaixasAutomaticamente();
      }
    }, 60000); // Verifica a cada 1 minuto

    return () => clearInterval(interval);
  }, [canViewCaixa, lojas]);

  // Função para carregar todos os dados
  async function loadAllData() {
    setLoadingInitial(true);
    try {
      await Promise.all([
        loadLojas(),
        loadAllCaixas(),
        loadAllVendas(),
        loadAllSangrias(),
        loadAllDevolucoes(),
      ]);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar dados iniciais");
    } finally {
      setLoadingInitial(false);
    }
  }

  // Carrega lojas
  async function loadLojas() {
    try {
      const data = await fetchTable("lojas");
      setLojas(data || []);
    } catch (error) {
      console.error("Erro ao carregar lojas:", error);
      toast.error("Erro ao carregar lojas");
    }
  }

  // Carrega todos os caixas abertos
  async function loadAllCaixas() {
    try {
      const data = await fetchTable("caixa");
      const hoje = getDateStringInBrazil();

      const abertos =
        data?.filter((c: CaixaAberto) => c.status === "aberto") || [];
      setCaixasAbertos(abertos);

      // Identifica lojas com caixa fechado hoje
      const fechadosHoje = new Set<number>();
      data?.forEach((c: CaixaAberto) => {
        const dataAberturaCaixa = getDateStringInBrazil(c.data_abertura);
        if (c.status === "fechado" && dataAberturaCaixa === hoje) {
          fechadosHoje.add(c.loja_id);
        }
      });
      setCaixasFechadosHoje(fechadosHoje);
    } catch (error) {
      console.error("Erro ao carregar caixas:", error);
      toast.error("Erro ao carregar caixas");
    }
  }

  // Carrega todas as vendas do dia
  async function loadAllVendas() {
    try {
      // Buscar vendas (agora com pagamento_detalhes diretamente na tabela)
      const vendasData = await fetchTable("vendas");

      const hoje = getDateStringInBrazil();

      // Considera vendas que possuem data_pagamento no mesmo dia do caixa.
      // Inclui vendas que foram marcadas como 'devolvido' no dia (data_pagamento definida).
      // Exclui apenas vendas explicitamente canceladas.
      const vendasHoje =
        (vendasData || []).filter((v: Venda) => {
          if (!v.data_pagamento) return false;
          if (v.status_pagamento === "cancelado") return false;
          const dataPagamento = getDateStringInBrazil(v.data_pagamento);
          return dataPagamento === hoje;
        }) || [];

      // Normalizar estrutura de vendas
      const vendasEnriquecidas = vendasHoje.map((v: any) => {
        return {
          ...v,
          itens: Array.isArray(v.itens) ? v.itens : v.itens || [],
          // pagamento_detalhes já vem do banco de dados como JSONB
          pagamento_detalhes: v.pagamento_detalhes || null,
        } as Venda;
      });

      // Agrupa vendas por loja
      const porLoja: Record<number, Venda[]> = {};
      vendasEnriquecidas.forEach((venda: Venda) => {
        if (!porLoja[venda.loja_id]) {
          porLoja[venda.loja_id] = [];
        }
        porLoja[venda.loja_id].push(venda);
      });

      setVendasPorLoja(porLoja);
    } catch (error) {
      console.error("Erro ao carregar vendas:", error);
      toast.error("Erro ao carregar vendas");
    }
  }

  // Carrega todas as devoluções
  async function loadAllDevolucoes() {
    try {
      const data = await fetchTable("devolucoes");
      setDevolucoes(data || []);
    } catch (error) {
      console.error("Erro ao carregar devoluções:", error);
      toast.error("Erro ao carregar devoluções");
    }
  }

  // Carrega todas as sangrias
  async function loadAllSangrias() {
    try {
      const data = await fetchTable("sangrias");
      const hoje = getDateStringInBrazil();

      // Filtra sangrias de hoje
      const sangriasHoje =
        data?.filter((s: Sangria) => {
          const dataSangria = getDateStringInBrazil(s.data_sangria);
          return dataSangria === hoje;
        }) || [];

      // Agrupa sangrias por caixa
      const porCaixa: Record<number, Sangria[]> = {};
      sangriasHoje.forEach((sangria: Sangria) => {
        if (!porCaixa[sangria.caixa_id]) {
          porCaixa[sangria.caixa_id] = [];
        }
        porCaixa[sangria.caixa_id].push(sangria);
      });

      setSangriasPorCaixa(porCaixa);
    } catch (error) {
      console.error("Erro ao carregar sangrias:", error);
      toast.error("Erro ao carregar sangrias");
    }
  }

  // Verifica se já existe um caixa (aberto ou fechado) na data de hoje para a loja
  async function verificarCaixaExistenteHoje(
    lojaId: number
  ): Promise<CaixaAberto | null> {
    try {
      const data = await fetchTable("caixa");
      const hoje = getDateStringInBrazil();

      // Busca caixa da loja que foi aberto hoje
      const caixaHoje = data?.find((c: CaixaAberto) => {
        const dataAberturaCaixa = getDateStringInBrazil(c.data_abertura);
        return c.loja_id === lojaId && dataAberturaCaixa === hoje;
      });

      return caixaHoje || null;
    } catch (error) {
      console.error("Erro ao verificar caixa existente:", error);
      return null;
    }
  }

  // Fecha automaticamente caixas abertos de dias anteriores
  async function fecharCaixasAutomaticamente() {
    try {
      const data = await fetchTable("caixa");
      const hoje = getDateStringInBrazil();

      // Busca caixas abertos de dias anteriores
      const caixasParaFechar =
        data?.filter((c: CaixaAberto) => {
          const dataAberturaCaixa = getDateStringInBrazil(c.data_abertura);
          return c.status === "aberto" && dataAberturaCaixa < hoje;
        }) || [];

      if (caixasParaFechar.length === 0) {
        return; // Nenhum caixa para fechar
      }

      console.log(
        `🔒 Fechando automaticamente ${caixasParaFechar.length} caixa(s) de dias anteriores...`
      );

      // Fecha cada caixa automaticamente
      const promises = caixasParaFechar.map(async (caixa: CaixaAberto) => {
        // Calcula o valor final baseado no valor inicial
        // Em um fechamento automático, consideramos que não houve contagem manual
        const valorFinal = caixa.valor_inicial || 0;

        const updateData = {
          status: "fechado",
          data_fechamento: getISOStringInBrazil(),
          valor_final: valorFinal,
          observacoes_fechamento: `⏰ Fechamento automático às 00:00 - Caixa não foi fechado manualmente no dia ${getDateStringInBrazil(caixa.data_abertura)}`,
        };

        await updateTable("caixa", caixa.id, updateData);

        const loja = lojas.find((l) => l.id === caixa.loja_id);
        console.log(
          `✅ Caixa da loja "${loja?.nome || caixa.loja_id}" fechado automaticamente`
        );
      });

      await Promise.all(promises);

      toast.success(
        `${caixasParaFechar.length} caixa(s) ${caixasParaFechar.length === 1 ? "foi fechado" : "foram fechados"} automaticamente`,
        { duration: 5000 }
      );

      // Recarrega os dados
      await loadAllCaixas();
    } catch (error) {
      console.error("Erro ao fechar caixas automaticamente:", error);
    }
  }

  // Carrega histórico de uma loja específica
  async function loadHistoricoCaixa(lojaId: number) {
    try {
      const data = await fetchTable("caixa");
      const historico = data
        ?.filter((c: CaixaAberto) => c.loja_id === lojaId)
        .sort(
          (a: CaixaAberto, b: CaixaAberto) =>
            new Date(b.data_abertura).getTime() -
            new Date(a.data_abertura).getTime()
        );
      setHistoricoCaixa(historico || []);
      setLojaHistorico(lojaId);
    } catch (error) {
      console.error("Erro ao carregar histórico:", error);
      toast.error("Erro ao carregar histórico");
    }
  }

  // Calcula resumo de vendas por loja
  // Gera um resumo (ResumoVendas) a partir de uma lista de vendas.
  // A lista recebida JÁ está filtrada por data_pagamento
  function computeResumoFromList(vendas: Venda[]): ResumoVendas {
    // Separar vendas por status
    const vendasPagas = vendas.filter((v) => v.status_pagamento === "pago");
    const vendasDevolvidas = vendas.filter(
      (v) => v.status_pagamento === "devolvido"
    );

    // Processar devoluções para determinar quais contam no caixa
    let vendasDevolvidasComCredito: Venda[] = [];
    let vendasDevolvidasSemCredito: Venda[] = [];
    let valorDevolvidoSemCredito = 0;

    vendasDevolvidas.forEach((vendaDevolvida) => {
      const devolucao = devolucoes.find(
        (d: any) => d.id_venda === vendaDevolvida.id
      );

      if (devolucao) {
        if (devolucao.credito_aplicado) {
          // COM crédito: dinheiro ficou no caixa, conta normalmente
          vendasDevolvidasComCredito.push(vendaDevolvida);
        } else {
          // SEM crédito: dinheiro foi devolvido, subtrai do caixa
          vendasDevolvidasSemCredito.push(vendaDevolvida);
          valorDevolvidoSemCredito += Number(
            devolucao.valor_total_devolvido || 0
          );
        }
      }
    });

    // Total de vendas = pagas + devolvidas COM crédito
    const totalVendas = vendasPagas.length + vendasDevolvidasComCredito.length;

    // Calcular valor bruto: vendas pagas + devolvidas com crédito
    let valorBrutoVendas = vendasPagas.reduce((acc, v) => {
      const val = (v as any).valor_total ?? (v as any).total_liquido ?? 0;
      return acc + Number(val || 0);
    }, 0);

    valorBrutoVendas += vendasDevolvidasComCredito.reduce((acc, v) => {
      const val = (v as any).valor_total ?? (v as any).total_liquido ?? 0;
      return acc + Number(val || 0);
    }, 0);

    // Valor real do caixa = Vendas (pagas + devolvidas com crédito) - Devoluções sem Crédito
    const valorTotalVendas = valorBrutoVendas - valorDevolvidoSemCredito;
    const valorTotalDevolvido = valorDevolvidoSemCredito;
    const totalDevolvidas = vendasDevolvidasSemCredito.length;

    // Inicializa acumuladores
    let valorDinheiro = 0;
    let valorPix = 0;
    let valorCartaoDebito = 0;
    let valorCartaoCredito = 0;
    let valorTransferencia = 0;
    let valorBoleto = 0;
    let valorCrediario = 0;
    let valorFiado = 0;

    // Processar formas de pagamento: vendas PAGAS + devolvidas COM crédito
    const vendasParaProcessar = [...vendasPagas, ...vendasDevolvidasComCredito];

    vendasParaProcessar.forEach((v: Venda) => {
      const valorVenda = Number(
        (v as any).valor_total ?? (v as any).total_liquido ?? 0
      );

      // Se existir detalhe de pagamento (pagamentos mistos), somar por chave
      const detalhes: any = (v as any).pagamento_detalhes;
      if (
        detalhes &&
        typeof detalhes === "object" &&
        Object.keys(detalhes).length > 0
      ) {
        // Somar cada forma de pagamento dos detalhes
        Object.entries(detalhes).forEach(([key, val]) => {
          const valor = Number(val || 0);
          if (valor <= 0) return;

          const k = key.toLowerCase();
          if (k === "dinheiro") valorDinheiro += valor;
          else if (k === "pix") valorPix += valor;
          else if (k === "debito" || k === "débito") valorCartaoDebito += valor;
          else if (k === "credito" || k === "crédito")
            valorCartaoCredito += valor;
          else if (k === "carteira_digital") valorCartaoCredito += valor;
          else if (k === "transferencia" || k === "transferência")
            valorTransferencia += valor;
          else if (k === "boleto") valorBoleto += valor;
          else if (k === "crediario" || k === "crediário")
            valorCrediario += valor;
          else if (k === "fiado") valorFiado += valor;
          else valorDinheiro += valor; // fallback para formas desconhecidas
        });

        // Verificar se há diferença (tolerância de 1 centavo)
        const somaDetalhes = Object.values(detalhes).reduce(
          (acc: number, val) => acc + Number(val || 0),
          0
        );
        const restante = valorVenda - somaDetalhes;
        if (Math.abs(restante) > 0.01) {
          // Se há diferença significativa, adicionar/subtrair da forma principal
          const forma = (v.forma_pagamento || "").toLowerCase();
          if (forma.includes("fiad")) valorFiado += restante;
          else if (forma.includes("credi")) valorCrediario += restante;
          else if (forma.includes("boleto")) valorBoleto += restante;
          else if (forma.includes("transfer")) valorTransferencia += restante;
          else if (forma.includes("pix")) valorPix += restante;
          else valorDinheiro += restante; // fallback
        }
      } else {
        // FALLBACK: Não há detalhes, usar forma_pagamento (vendas antigas)
        const forma = (v.forma_pagamento || "").toLowerCase();
        if (forma.includes("dinheiro")) valorDinheiro += valorVenda;
        else if (forma.includes("pix")) valorPix += valorVenda;
        else if (
          forma.includes("débito") ||
          forma.includes("debito") ||
          forma.includes("cartão de débito")
        )
          valorCartaoDebito += valorVenda;
        else if (
          forma.includes("crédito") ||
          forma.includes("credito") ||
          forma.includes("cartão de crédito")
        )
          valorCartaoCredito += valorVenda;
        else if (forma.includes("transfer")) valorTransferencia += valorVenda;
        else if (forma.includes("boleto")) valorBoleto += valorVenda;
        else if (forma.includes("credi")) valorCrediario += valorVenda;
        else if (forma.includes("fiad")) valorFiado += valorVenda;
        else valorDinheiro += valorVenda; // fallback
      }
    });

    // Subtrair devoluções SEM crédito das formas de pagamento
    vendasDevolvidasSemCredito.forEach((vendaDevolvida: Venda) => {
      const devolucao = devolucoes.find(
        (d: any) => d.id_venda === vendaDevolvida.id
      );

      if (devolucao) {
        const valorDevolvido = Number(devolucao.valor_total_devolvido || 0);
        const forma = (vendaDevolvida.forma_pagamento || "").toLowerCase();

        // Subtrair da forma de pagamento correspondente
        if (forma.includes("dinheiro")) valorDinheiro -= valorDevolvido;
        else if (forma.includes("pix")) valorPix -= valorDevolvido;
        else if (
          forma.includes("débito") ||
          forma.includes("debito") ||
          forma.includes("cartão de débito")
        )
          valorCartaoDebito -= valorDevolvido;
        else if (
          forma.includes("crédito") ||
          forma.includes("credito") ||
          forma.includes("cartão de crédito")
        )
          valorCartaoCredito -= valorDevolvido;
        else if (forma.includes("transfer"))
          valorTransferencia -= valorDevolvido;
        else if (forma.includes("boleto")) valorBoleto -= valorDevolvido;
        else if (forma.includes("credi")) valorCrediario -= valorDevolvido;
        else if (forma.includes("fiad")) valorFiado -= valorDevolvido;
        else valorDinheiro -= valorDevolvido; // fallback
      }
    });

    return {
      totalVendas,
      valorTotalVendas,
      valorDinheiro,
      valorPix,
      valorCartaoDebito,
      valorCartaoCredito,
      valorTransferencia,
      valorBoleto,
      valorCrediario,
      valorFiado,
      ticketMedio: totalVendas > 0 ? valorTotalVendas / totalVendas : 0,
      totalDevolvidas,
      valorTotalDevolvido,
    };
  }

  function getResumoVendas(lojaId: number, dataCaixa?: string): ResumoVendas {
    let vendas = vendasPorLoja[lojaId] || [];
    if (dataCaixa) {
      vendas = vendas.filter((v: Venda) => {
        if (!v.data_pagamento) return false;
        return getDateStringInBrazil(v.data_pagamento) === dataCaixa;
      });
    }
    return computeResumoFromList(vendas);
  }

  // Função auxiliar para obter vendas de uma loja
  function getVendasDaLoja(lojaId: number, dataCaixa?: string): Venda[] {
    let vendas = vendasPorLoja[lojaId] || [];
    if (dataCaixa) {
      vendas = vendas.filter((v: Venda) => {
        if (!v.data_pagamento) return false;
        return getDateStringInBrazil(v.data_pagamento) === dataCaixa;
      });
    }
    return vendas;
  }

  // Função auxiliar para obter sangrias de um caixa
  function getSangriasDoCaixa(caixaId: number): Sangria[] {
    return sangriasPorCaixa[caixaId] || [];
  }

  // Filtra caixas por data
  function filtrarCaixasPorData(caixas: CaixaAberto[]): CaixaAberto[] {
    if (!dataInicio && !dataFim) return caixas;

    return caixas.filter((caixa) => {
      const dataAberturaCaixa = getDateStringInBrazil(caixa.data_abertura);

      if (dataInicio && dataFim) {
        return dataAberturaCaixa >= dataInicio && dataAberturaCaixa <= dataFim;
      } else if (dataInicio) {
        return dataAberturaCaixa >= dataInicio;
      } else if (dataFim) {
        return dataAberturaCaixa <= dataFim;
      }

      return true;
    });
  }

  // Função para gerar PDF de um caixa do histórico
  async function handleGerarPDFHistorico(caixa: CaixaAberto) {
    try {
      const loja = lojas.find((l) => l.id === caixa.loja_id);
      if (!loja) {
        toast.error("Loja não encontrada");
        return;
      }

      // Buscar vendas do dia do caixa
      const dataVendas = await fetchTable("vendas");
      const dataCaixa = getDateStringInBrazil(caixa.data_abertura);

      // Considera apenas vendas que foram pagas no mesmo dia do caixa
      // Buscar vendas do dia do caixa: qualquer venda que tenha data_pagamento
      // coincidente com a data do caixa (inclui 'devolvido' se data_pagamento foi setada).
      const vendasDoCaixa =
        dataVendas?.filter((v: Venda) => {
          if (!v.data_pagamento) return false;
          if (v.status_pagamento === "cancelado") return false;
          const dataPagamento = getDateStringInBrazil(v.data_pagamento);
          return v.loja_id === caixa.loja_id && dataPagamento === dataCaixa;
        }) || [];

      // Buscar sangrias do caixa
      const dataSangrias = await fetchTable("sangrias");
      const sangriasDoCaixa =
        dataSangrias?.filter((s: Sangria) => s.caixa_id === caixa.id) || [];

      // Calcular resumo das vendas (suporta pagamentos mistos via pagamento_detalhes)
      const resumo = computeResumoFromList(vendasDoCaixa);

      CaixaPDFGenerator.gerar({
        caixa,
        loja,
        resumo,
        vendas: vendasDoCaixa,
        sangrias: sangriasDoCaixa,
      });
      toast.success("PDF gerado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Erro ao gerar PDF");
    }
  }

  // Handler para abrir caixa
  async function handleAbrirCaixa() {
    if (!formAbrir.loja_id || !formAbrir.valor_inicial) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setLoading(true);
    try {
      const lojaId = Number(formAbrir.loja_id);

      // Verifica se já existe um caixa para esta loja hoje
      const caixaExistente = await verificarCaixaExistenteHoje(lojaId);

      if (caixaExistente) {
        if (caixaExistente.status === "aberto") {
          toast.error("Já existe um caixa aberto para esta loja hoje!");
          setLoading(false);
          return;
        } else if (caixaExistente.status === "fechado") {
          // Caixa fechado encontrado - oferecer opção de reabrir
          const confirmarReabertura = window.confirm(
            `Já existe um caixa fechado para esta loja hoje.\n\n` +
              `Deseja reabrir este caixa?\n\n` +
              `⚠️ Ao reabrir, o caixa voltará ao estado aberto e poderá registrar novas vendas.`
          );

          if (!confirmarReabertura) {
            setLoading(false);
            return;
          }

          // Reabrir o caixa existente
          const valorInicial = currencyToNumber(formAbrir.valor_inicial);
          const updateData = {
            status: "aberto",
            data_fechamento: null,
            valor_final: null,
            observacoes_fechamento: null,
            // Atualiza o valor inicial com o novo valor informado
            valor_inicial: valorInicial,
            // Adiciona observação sobre a reabertura
            observacoes_abertura: formAbrir.observacoes_abertura
              ? `${caixaExistente.observacoes_abertura || ""}\n\n[REABERTO] ${formAbrir.observacoes_abertura}`
              : `${caixaExistente.observacoes_abertura || ""}\n\n[REABERTO em ${new Date().toLocaleString("pt-BR")}]`,
          };

          await updateTable("caixa", caixaExistente.id, updateData);
          toast.success("Caixa reaberto com sucesso!");

          setModalAbrir(false);
          setFormAbrir({
            loja_id: "",
            valor_inicial: "",
            observacoes_abertura: "",
          });

          await loadAllCaixas();
          setLoading(false);
          return;
        }
      }

      // Se não existe caixa, cria um novo
      const valorInicial = currencyToNumber(formAbrir.valor_inicial);

      const newCaixa = {
        loja_id: lojaId,
        usuario_id: user?.id,
        data_abertura: getISOStringInBrazil(),
        valor_inicial: valorInicial,
        status: "aberto",
        observacoes_abertura: formAbrir.observacoes_abertura || null,
      };

      await insertTable("caixa", newCaixa);
      toast.success("Caixa aberto com sucesso!");

      setModalAbrir(false);
      setFormAbrir({
        loja_id: "",
        valor_inicial: "",
        observacoes_abertura: "",
      });

      await loadAllCaixas();
    } catch (error) {
      console.error("Erro ao abrir caixa:", error);
      toast.error(`Erro ao abrir caixa: ${getErrorMessage(error)}`);
    } finally {
      setLoading(false);
    }
  }

  // Handler para fechar caixa
  async function handleFecharCaixa() {
    if (!caixaSelecionado || !formFechar.valor_final) {
      toast.error("Informe o valor final do caixa");
      return;
    }

    setLoading(true);
    try {
      const valorFinal = currencyToNumber(formFechar.valor_final);

      const updateData = {
        status: "fechado",
        data_fechamento: getISOStringInBrazil(),
        valor_final: valorFinal,
        observacoes_fechamento: formFechar.observacoes_fechamento || null,
      };

      await updateTable("caixa", caixaSelecionado.id, updateData);
      toast.success("Caixa fechado com sucesso!");

      setModalFechar(false);
      setFormFechar({
        valor_final: "",
        observacoes_fechamento: "",
      });
      setCaixaSelecionado(null);

      await loadAllCaixas();
    } catch (error) {
      console.error("Erro ao fechar caixa:", error);
      toast.error(`Erro ao fechar caixa: ${getErrorMessage(error)}`);
    } finally {
      setLoading(false);
    }
  }

  // Handler para fazer sangria
  async function handleSangria() {
    if (!caixaSelecionado || !formSangria.valor || !formSangria.motivo.trim()) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setLoading(true);
    try {
      const valorSangria = currencyToNumber(formSangria.valor);
      const dataHoraBrasil = getISOStringInBrazil();

      console.log("🕐 Criando sangria com data/hora:", dataHoraBrasil);

      const novaSangria = {
        caixa_id: caixaSelecionado.id,
        valor: valorSangria,
        motivo: formSangria.motivo,
        data_sangria: dataHoraBrasil,
        usuario_id: user?.id,
        status: "ativa",
      };

      await insertTable("sangrias", novaSangria);
      toast.success("Sangria registrada com sucesso!");

      setModalSangria(false);
      setFormSangria({
        valor: "",
        motivo: "",
      });
      setCaixaSelecionado(null);

      await loadAllSangrias();
    } catch (error) {
      console.error("Erro ao registrar sangria:", error);
      toast.error(`Erro ao registrar sangria: ${getErrorMessage(error)}`);
    } finally {
      setLoading(false);
    }
  }

  // Handler para abrir modal de cancelar sangria
  function handleAbrirCancelarSangria(sangriaId: number) {
    const sangria = Object.values(sangriasPorCaixa)
      .flat()
      .find((s) => s.id === sangriaId);

    if (!sangria) {
      toast.error("Sangria não encontrada");
      return;
    }

    if (sangria.status === "cancelada") {
      toast.error("Esta sangria já foi cancelada");
      return;
    }

    setSangriaSelecionada(sangria);
    setMotivoCancelamento("");
    setModalCancelarSangria(true);
  }

  // Handler para confirmar cancelamento da sangria
  async function handleConfirmarCancelarSangria() {
    if (!sangriaSelecionada || !motivoCancelamento.trim()) {
      toast.error("É necessário informar o motivo do cancelamento");
      return;
    }

    setLoading(true);
    try {
      const dataHoraCancelamento = getISOStringInBrazil();

      console.log("🕐 Cancelando sangria com data/hora:", dataHoraCancelamento);

      const updateData = {
        status: "cancelada",
        motivo_cancelamento: motivoCancelamento.trim(),
        data_cancelamento: dataHoraCancelamento,
        usuario_cancelamento_id: user?.id,
      };

      await updateTable("sangrias", sangriaSelecionada.id, updateData);
      toast.success("Sangria cancelada com sucesso!");

      setModalCancelarSangria(false);
      setSangriaSelecionada(null);
      setMotivoCancelamento("");

      await loadAllSangrias();
    } catch (error) {
      console.error("Erro ao cancelar sangria:", error);
      toast.error(`Erro ao cancelar sangria: ${getErrorMessage(error)}`);
    } finally {
      setLoading(false);
    }
  }

  // Verifica permissão
  if (!canViewCaixa) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-danger-200">
          <CardBody className="text-center py-12">
            <ExclamationTriangleIcon className="w-16 h-16 text-danger mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Acesso Negado</h2>
            <p className="text-danger text-sm mb-4">
              Você não possui permissão para visualizar o Caixa.
            </p>
          </CardBody>
        </Card>
      </div>
    );
  }

  // Loading inicial
  if (loadingInitial) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-96">
          <Spinner size="lg" label="Carregando caixas..." />
        </div>
      </div>
    );
  }

  // Aplica filtros
  const caixasFiltrados = filtrarCaixasPorData(caixasAbertos);

  return (
    <div className="container mx-auto p-6">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">💰 Gerenciamento de Caixa</h1>
          <p className="text-default-500 mt-1">
            Visualização de todos os caixas das lojas
          </p>
        </div>
      </div>

      {/* Filtro por Data */}
      <FiltroCaixaData
        dataInicio={dataInicio}
        dataFim={dataFim}
        onDataInicioChange={setDataInicio}
        onDataFimChange={setDataFim}
        onLimpar={() => {
          setDataInicio("");
          setDataFim("");
        }}
        totalFiltrados={caixasFiltrados.length}
        totalGeral={caixasAbertos.length}
      />

      {/* Seção: Caixas Abertos */}
      {caixasFiltrados.length > 0 && (
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <LockOpenIcon className="w-6 h-6 text-success" />
            <h2 className="text-2xl font-bold">
              Caixas Abertos ({caixasFiltrados.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {caixasFiltrados.map((caixa) => (
              <CaixaAbertoCard
                key={caixa.id}
                caixa={caixa}
                loja={lojas.find((l) => l.id === caixa.loja_id)}
                resumo={getResumoVendas(
                  caixa.loja_id,
                  getDateStringInBrazil(caixa.data_abertura)
                )}
                sangrias={getSangriasDoCaixa(caixa.id)}
                canCloseCaixa={canCloseCaixa}
                onVerDetalhes={() => {
                  setCaixaSelecionado(caixa);
                  setModalDetalhes(true);
                }}
                onFazerSangria={() => {
                  setCaixaSelecionado(caixa);
                  setFormSangria({
                    valor: "",
                    motivo: "",
                  });
                  setModalSangria(true);
                }}
                onFecharCaixa={() => {
                  setCaixaSelecionado(caixa);
                  setFormFechar({
                    valor_final: "",
                    observacoes_fechamento: "",
                  });
                  setModalFechar(true);
                }}
                onVerHistorico={() => {
                  loadHistoricoCaixa(caixa.loja_id);
                  setModalHistorico(true);
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Seção: Lojas com Caixa Fechado */}
      {lojas.filter((loja) => !caixasAbertos.find((c) => c.loja_id === loja.id))
        .length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <ClockIcon className="w-6 h-6 text-default-400" />
            <h2 className="text-2xl font-bold">
              Lojas com Caixa Fechado (
              {
                lojas.filter(
                  (loja) => !caixasAbertos.find((c) => c.loja_id === loja.id)
                ).length
              }
              )
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {lojasDisponiveis
              .filter(
                (loja) => !caixasAbertos.find((c) => c.loja_id === loja.id)
              )
              .map((loja) => (
                <LojaFechadaCard
                  key={loja.id}
                  loja={loja}
                  canOpenCaixa={canOpenCaixa}
                  hasCaixaFechadoHoje={caixasFechadosHoje.has(loja.id)}
                  onAbrirCaixa={() => {
                    setFormAbrir({
                      loja_id: loja.id.toString(),
                      valor_inicial: "",
                      observacoes_abertura: "",
                    });
                    setModalAbrir(true);
                  }}
                  onVerHistorico={() => {
                    loadHistoricoCaixa(loja.id);
                    setModalHistorico(true);
                  }}
                />
              ))}
          </div>
        </div>
      )}

      {/* Mensagem quando não há lojas */}
      {lojas.length === 0 && (
        <Card>
          <CardBody className="text-center py-12">
            <ExclamationTriangleIcon className="w-16 h-16 text-warning mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              Nenhuma loja cadastrada
            </h2>
            <p className="text-default-500">
              Cadastre lojas para começar a gerenciar os caixas.
            </p>
          </CardBody>
        </Card>
      )}

      {/* Modal: Abrir Caixa */}
      <AbrirCaixaModal
        isOpen={modalAbrir}
        onClose={() => {
          setModalAbrir(false);
          setFormAbrir({
            loja_id: "",
            valor_inicial: "",
            observacoes_abertura: "",
          });
        }}
        lojas={lojasDisponiveis.filter(
          (loja) => !caixasAbertos.find((c) => c.loja_id === loja.id)
        )}
        formData={formAbrir}
        onFormChange={(field, value) =>
          setFormAbrir({ ...formAbrir, [field]: value })
        }
        onSubmit={handleAbrirCaixa}
        loading={loading}
      />

      {/* Modal: Fechar Caixa */}
      {caixaSelecionado && (
        <FecharCaixaModal
          isOpen={modalFechar}
          onClose={() => {
            setModalFechar(false);
            setCaixaSelecionado(null);
            setFormFechar({
              valor_final: "",
              observacoes_fechamento: "",
            });
          }}
          caixa={caixaSelecionado}
          loja={lojas.find((l) => l.id === caixaSelecionado.loja_id)}
          resumo={getResumoVendas(
            caixaSelecionado.loja_id,
            getDateStringInBrazil(caixaSelecionado.data_abertura)
          )}
          formData={formFechar}
          onFormChange={(field, value) =>
            setFormFechar({ ...formFechar, [field]: value })
          }
          onSubmit={handleFecharCaixa}
          loading={loading}
        />
      )}

      {/* Modal: Detalhes do Caixa */}
      {caixaSelecionado && (
        <DetalhesCaixaModal
          isOpen={modalDetalhes}
          onClose={() => {
            setModalDetalhes(false);
            setCaixaSelecionado(null);
          }}
          caixa={caixaSelecionado}
          loja={lojas.find((l) => l.id === caixaSelecionado.loja_id)}
          resumo={getResumoVendas(
            caixaSelecionado.loja_id,
            getDateStringInBrazil(caixaSelecionado.data_abertura)
          )}
          vendas={getVendasDaLoja(
            caixaSelecionado.loja_id,
            getDateStringInBrazil(caixaSelecionado.data_abertura)
          )}
          sangrias={getSangriasDoCaixa(caixaSelecionado.id)}
          onCancelarSangria={handleAbrirCancelarSangria}
          canCancelSangria={canCancelSangria}
        />
      )}

      {/* Modal: Sangria */}
      {caixaSelecionado && (
        <SangriaModal
          isOpen={modalSangria}
          onClose={() => {
            setModalSangria(false);
            setCaixaSelecionado(null);
            setFormSangria({
              valor: "",
              motivo: "",
            });
          }}
          caixa={caixaSelecionado}
          loja={lojas.find((l) => l.id === caixaSelecionado.loja_id)}
          form={formSangria}
          onChangeForm={(field, value) =>
            setFormSangria({ ...formSangria, [field]: value })
          }
          onSubmit={handleSangria}
          loading={loading}
        />
      )}

      {/* Modal: Histórico */}
      <HistoricoCaixaModal
        isOpen={modalHistorico}
        onClose={() => {
          setModalHistorico(false);
          setHistoricoCaixa([]);
          setLojaHistorico(null);
        }}
        historico={historicoCaixa}
        loja={lojas.find((l) => l.id === lojaHistorico)}
        onGerarPDF={handleGerarPDFHistorico}
      />

      {/* Modal: Cancelar Sangria */}
      <CancelarSangriaModal
        isOpen={modalCancelarSangria}
        onClose={() => {
          setModalCancelarSangria(false);
          setSangriaSelecionada(null);
          setMotivoCancelamento("");
        }}
        sangria={sangriaSelecionada}
        motivoCancelamento={motivoCancelamento}
        onMotivoChange={setMotivoCancelamento}
        onConfirmar={handleConfirmarCancelarSangria}
        loading={loading}
      />
    </div>
  );
}
