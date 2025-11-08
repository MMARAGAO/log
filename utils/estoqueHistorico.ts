/**
 * Função utilitária para registrar histórico de alterações de estoque
 * Deve ser usada por TODOS os módulos que alteram estoque_lojas
 */

import { insertTable } from "@/lib/insertTable";

export interface RegistrarHistoricoEstoqueParams {
  produtoId: number;
  lojaId: number;
  quantidadeAnterior: number;
  quantidadeNova: number;
  tipoOperacao:
    | "ajuste_manual"
    | "venda"
    | "devolucao"
    | "transferencia"
    | "entrada_estoque"
    | "rma";
  usuarioId?: string;
  usuarioNome?: string;
  observacao?: string;
}

export async function registrarHistoricoEstoque(
  params: RegistrarHistoricoEstoqueParams
): Promise<void> {
  try {
    // Verificar se o usuário está autenticado
    if (!params.usuarioId) {
      console.warn("⚠️ Usuário não autenticado, pulando registro de histórico");
      return;
    }

    const quantidadeAlterada =
      params.quantidadeNova - params.quantidadeAnterior;

    // Se não houve alteração, não registrar
    if (quantidadeAlterada === 0) {
      console.log("⏭️ Quantidade não mudou, pulando registro de histórico");
      return;
    }

    const historicoData = {
      produto_id: params.produtoId,
      loja_id: params.lojaId,
      quantidade_anterior: params.quantidadeAnterior,
      quantidade_nova: params.quantidadeNova,
      quantidade_alterada: quantidadeAlterada,
      tipo_operacao: params.tipoOperacao,
      usuario_id: params.usuarioId,
      usuario_nome: params.usuarioNome || "Sistema",
      observacao: params.observacao || null,
    };

    console.log("📝 Registrando histórico de estoque:", historicoData);

    await insertTable("estoque_historico", historicoData);

    console.log("✅ Histórico de estoque registrado com sucesso");
  } catch (error) {
    console.error("❌ Erro ao registrar histórico de estoque:", error);
    console.error("❌ Detalhes do erro:", JSON.stringify(error, null, 2));
    // Não bloqueia a operação principal, apenas loga o erro
  }
}
