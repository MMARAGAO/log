"use client";

import { useState, useEffect } from "react";
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
import { CaixaPDFGenerator } from "@/components/caixa/CaixaPDFGenerator";
import type {
  CaixaAberto,
  Venda,
  Loja,
  ResumoVendas,
  FormAbrir,
  FormFechar,
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
  const brazilDate = getDateInBrazilTimezone(date);
  return brazilDate.toISOString().split("T")[0];
}

function getISOStringInBrazil(): string {
  const brazilDate = getDateInBrazilTimezone();
  const year = brazilDate.getFullYear();
  const month = String(brazilDate.getMonth() + 1).padStart(2, "0");
  const day = String(brazilDate.getDate()).padStart(2, "0");
  const hours = String(brazilDate.getHours()).padStart(2, "0");
  const minutes = String(brazilDate.getMinutes()).padStart(2, "0");
  const seconds = String(brazilDate.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

export default function CaixaPage() {
  // Estados principais
  const [caixasAbertos, setCaixasAbertos] = useState<CaixaAberto[]>([]);
  const [vendasPorLoja, setVendasPorLoja] = useState<Record<number, Venda[]>>(
    {}
  );
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [historicoCaixa, setHistoricoCaixa] = useState<CaixaAberto[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Estados dos modais
  const [modalAbrir, setModalAbrir] = useState(false);
  const [modalFechar, setModalFechar] = useState(false);
  const [modalDetalhes, setModalDetalhes] = useState(false);
  const [modalHistorico, setModalHistorico] = useState(false);

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

  // Estado para controlar qual caixa/loja está selecionado
  const [caixaSelecionado, setCaixaSelecionado] = useState<CaixaAberto | null>(
    null
  );
  const [lojaHistorico, setLojaHistorico] = useState<number | null>(null);

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

  // Carrega dados iniciais
  useEffect(() => {
    if (canViewCaixa) {
      loadAllData();
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

  // Função para carregar todos os dados
  async function loadAllData() {
    setLoadingInitial(true);
    try {
      await Promise.all([loadLojas(), loadAllCaixas(), loadAllVendas()]);
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
      const abertos =
        data?.filter((c: CaixaAberto) => c.status === "aberto") || [];
      setCaixasAbertos(abertos);
    } catch (error) {
      console.error("Erro ao carregar caixas:", error);
      toast.error("Erro ao carregar caixas");
    }
  }

  // Carrega todas as vendas do dia
  async function loadAllVendas() {
    try {
      const data = await fetchTable("vendas");
      const hoje = getDateStringInBrazil();

      const vendasHoje =
        data?.filter((v: Venda) => {
          const dataVenda = getDateStringInBrazil(v.data_venda);
          return dataVenda === hoje;
        }) || [];

      // Agrupa vendas por loja
      const porLoja: Record<number, Venda[]> = {};
      vendasHoje.forEach((venda: Venda) => {
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
  function getResumoVendas(lojaId: number): ResumoVendas {
    const vendas = vendasPorLoja[lojaId] || [];
    const totalVendas = vendas.length;
    const valorTotalVendas = vendas.reduce(
      (acc, v) => acc + (v.valor_total || 0),
      0
    );

    return {
      totalVendas,
      valorTotalVendas,
      valorDinheiro: vendas
        .filter((v) => v.forma_pagamento === "Dinheiro")
        .reduce((acc, v) => acc + v.valor_total, 0),
      valorPix: vendas
        .filter((v) => v.forma_pagamento === "PIX")
        .reduce((acc, v) => acc + v.valor_total, 0),
      valorCartaoDebito: vendas
        .filter((v) => v.forma_pagamento === "Cartão de Débito")
        .reduce((acc, v) => acc + v.valor_total, 0),
      valorCartaoCredito: vendas
        .filter((v) => v.forma_pagamento === "Cartão de Crédito")
        .reduce((acc, v) => acc + v.valor_total, 0),
      valorTransferencia: vendas
        .filter((v) => v.forma_pagamento === "Transferência")
        .reduce((acc, v) => acc + v.valor_total, 0),
      valorBoleto: vendas
        .filter((v) => v.forma_pagamento === "Boleto")
        .reduce((acc, v) => acc + v.valor_total, 0),
      valorCrediario: vendas
        .filter((v) => v.forma_pagamento === "Crediário")
        .reduce((acc, v) => acc + v.valor_total, 0),
      valorFiado: vendas
        .filter((v) => v.forma_pagamento === "Fiado")
        .reduce((acc, v) => acc + v.valor_total, 0),
      ticketMedio: totalVendas > 0 ? valorTotalVendas / totalVendas : 0,
    };
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
      const data = await fetchTable("vendas");
      const dataCaixa = getDateStringInBrazil(caixa.data_abertura);

      const vendasDoCaixa =
        data?.filter((v: Venda) => {
          const dataVenda = getDateStringInBrazil(v.data_venda);
          return v.loja_id === caixa.loja_id && dataVenda === dataCaixa;
        }) || [];

      // Calcular resumo das vendas
      const totalVendas = vendasDoCaixa.length;
      const valorTotalVendas = vendasDoCaixa.reduce(
        (acc: number, v: Venda) => acc + (v.valor_total || 0),
        0
      );

      const resumo: ResumoVendas = {
        totalVendas,
        valorTotalVendas,
        valorDinheiro: vendasDoCaixa
          .filter((v: Venda) => v.forma_pagamento === "Dinheiro")
          .reduce((acc: number, v: Venda) => acc + v.valor_total, 0),
        valorPix: vendasDoCaixa
          .filter((v: Venda) => v.forma_pagamento === "PIX")
          .reduce((acc: number, v: Venda) => acc + v.valor_total, 0),
        valorCartaoDebito: vendasDoCaixa
          .filter((v: Venda) => v.forma_pagamento === "Cartão de Débito")
          .reduce((acc: number, v: Venda) => acc + v.valor_total, 0),
        valorCartaoCredito: vendasDoCaixa
          .filter((v: Venda) => v.forma_pagamento === "Cartão de Crédito")
          .reduce((acc: number, v: Venda) => acc + v.valor_total, 0),
        valorTransferencia: vendasDoCaixa
          .filter((v: Venda) => v.forma_pagamento === "Transferência")
          .reduce((acc: number, v: Venda) => acc + v.valor_total, 0),
        valorBoleto: vendasDoCaixa
          .filter((v: Venda) => v.forma_pagamento === "Boleto")
          .reduce((acc: number, v: Venda) => acc + v.valor_total, 0),
        valorCrediario: vendasDoCaixa
          .filter((v: Venda) => v.forma_pagamento === "Crediário")
          .reduce((acc: number, v: Venda) => acc + v.valor_total, 0),
        valorFiado: vendasDoCaixa
          .filter((v: Venda) => v.forma_pagamento === "Fiado")
          .reduce((acc: number, v: Venda) => acc + v.valor_total, 0),
        ticketMedio: totalVendas > 0 ? valorTotalVendas / totalVendas : 0,
      };

      CaixaPDFGenerator.gerar({ caixa, loja, resumo });
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
      const valorInicial = currencyToNumber(formAbrir.valor_inicial);

      const newCaixa = {
        loja_id: Number(formAbrir.loja_id),
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
                resumo={getResumoVendas(caixa.loja_id)}
                canCloseCaixa={canCloseCaixa}
                onVerDetalhes={() => {
                  setCaixaSelecionado(caixa);
                  setModalDetalhes(true);
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
            {lojas
              .filter(
                (loja) => !caixasAbertos.find((c) => c.loja_id === loja.id)
              )
              .map((loja) => (
                <LojaFechadaCard
                  key={loja.id}
                  loja={loja}
                  canOpenCaixa={canOpenCaixa}
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
        lojas={lojas.filter(
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
          resumo={getResumoVendas(caixaSelecionado.loja_id)}
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
          resumo={getResumoVendas(caixaSelecionado.loja_id)}
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
    </div>
  );
}
