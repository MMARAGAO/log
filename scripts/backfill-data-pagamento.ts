/**
 * Script de Backfill: data_pagamento em vendas antigas
 *
 * Este script preenche o campo data_pagamento para vendas que já foram pagas
 * mas não têm esse campo preenchido (foram pagas antes do campo existir).
 *
 * Como executar:
 * 1. Abra o console do navegador na página de Vendas
 * 2. Cole este código completo
 * 3. Execute: await backfillDataPagamento()
 *
 * OU
 *
 * Execute via Node.js com o Supabase client configurado
 */

import { supabase } from "@/lib/supabaseClient";

interface Venda {
  id: number;
  status_pagamento: string;
  data_pagamento?: string | null;
  data_venda: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Função principal de backfill
 */
export async function backfillDataPagamento(
  dryRun: boolean = false
): Promise<void> {
  console.log("=".repeat(60));
  console.log("🔄 BACKFILL: data_pagamento em vendas antigas");
  console.log("=".repeat(60));
  console.log(
    `Modo: ${dryRun ? "🔍 DRY RUN (simulação)" : "✍️ EXECUÇÃO REAL"}`
  );
  console.log("");

  try {
    // 1. Buscar todas as vendas pagas sem data_pagamento
    console.log("📊 Buscando vendas pagas sem data_pagamento...");

    const { data: vendasSemData, error: fetchError } = await supabase
      .from("vendas")
      .select(
        "id, status_pagamento, data_pagamento, data_venda, created_at, updated_at"
      )
      .eq("status_pagamento", "pago")
      .is("data_pagamento", null);

    if (fetchError) {
      console.error("❌ Erro ao buscar vendas:", fetchError);
      throw fetchError;
    }

    if (!vendasSemData || vendasSemData.length === 0) {
      console.log("✅ Nenhuma venda encontrada sem data_pagamento!");
      console.log(
        "   Todas as vendas pagas já têm data de pagamento registrada."
      );
      return;
    }

    console.log(
      `📦 Encontradas ${vendasSemData.length} vendas pagas sem data_pagamento`
    );
    console.log("");

    // 2. Processar cada venda e determinar a melhor data
    const updates: Array<{
      id: number;
      data_pagamento: string;
      fonte: string;
    }> = [];

    vendasSemData.forEach((venda: Venda) => {
      let dataPagamento: string;
      let fonte: string;

      // Preferência:
      // 1º: updated_at (mais provável ser a data do último pagamento)
      // 2º: created_at
      // 3º: data_venda (fallback)

      if (venda.updated_at) {
        dataPagamento = venda.updated_at;
        fonte = "updated_at";
      } else if (venda.created_at) {
        dataPagamento = venda.created_at;
        fonte = "created_at";
      } else {
        dataPagamento = venda.data_venda;
        fonte = "data_venda";
      }

      updates.push({
        id: venda.id,
        data_pagamento: dataPagamento,
        fonte,
      });
    });

    // 3. Agrupar por fonte para estatísticas
    const estatisticas = updates.reduce(
      (acc, update) => {
        acc[update.fonte] = (acc[update.fonte] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    console.log("📈 Estatísticas de origem da data_pagamento:");
    Object.entries(estatisticas).forEach(([fonte, count]) => {
      console.log(`   • ${fonte}: ${count} venda(s)`);
    });
    console.log("");

    // 4. Exibir preview das primeiras 5 atualizações
    console.log("🔍 Preview das primeiras atualizações:");
    updates.slice(0, 5).forEach((update) => {
      const venda = vendasSemData.find((v: Venda) => v.id === update.id);
      console.log(`   Venda #${update.id}:`);
      console.log(
        `     └─ data_pagamento será: ${new Date(update.data_pagamento).toLocaleString("pt-BR")}`
      );
      console.log(`     └─ origem: ${update.fonte}`);
      console.log(
        `     └─ data_venda original: ${new Date(venda!.data_venda).toLocaleString("pt-BR")}`
      );
    });

    if (updates.length > 5) {
      console.log(`   ... e mais ${updates.length - 5} vendas`);
    }
    console.log("");

    // 5. Se for dry run, parar aqui
    if (dryRun) {
      console.log("🔍 DRY RUN: Nenhuma alteração foi feita no banco de dados.");
      console.log(`   ${updates.length} venda(s) seriam atualizadas.`);
      console.log("");
      console.log("💡 Para executar as alterações, rode:");
      console.log("   await backfillDataPagamento(false)");
      return;
    }

    // 6. Executar atualizações em lotes de 100
    console.log("✍️ Iniciando atualização no banco de dados...");
    const batchSize = 100;
    let sucessos = 0;
    let erros = 0;

    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize);

      console.log(
        `   Processando lote ${Math.floor(i / batchSize) + 1}/${Math.ceil(updates.length / batchSize)}...`
      );

      // Atualizar cada venda do lote
      const promises = batch.map(async (update) => {
        const { error } = await supabase
          .from("vendas")
          .update({ data_pagamento: update.data_pagamento })
          .eq("id", update.id);

        if (error) {
          console.error(
            `   ❌ Erro ao atualizar venda #${update.id}:`,
            error.message
          );
          return false;
        }
        return true;
      });

      const results = await Promise.all(promises);
      sucessos += results.filter((r) => r).length;
      erros += results.filter((r) => !r).length;
    }

    console.log("");
    console.log("=".repeat(60));
    console.log("✅ BACKFILL CONCLUÍDO");
    console.log("=".repeat(60));
    console.log(`📊 Resultados:`);
    console.log(`   • Total processado: ${updates.length}`);
    console.log(`   • Sucessos: ${sucessos}`);
    console.log(`   • Erros: ${erros}`);
    console.log("");

    if (erros === 0) {
      console.log("🎉 Todas as vendas foram atualizadas com sucesso!");
      console.log("   Recarregue a página para ver as alterações refletidas.");
    } else {
      console.warn(`⚠️ ${erros} venda(s) não puderam ser atualizadas.`);
      console.log("   Verifique os logs de erro acima.");
    }
  } catch (error) {
    console.error("");
    console.error("=".repeat(60));
    console.error("❌ ERRO FATAL NO BACKFILL");
    console.error("=".repeat(60));
    console.error(error);
    throw error;
  }
}

// Exportar também uma versão que pode ser colada no console
if (typeof window !== "undefined") {
  (window as any).backfillDataPagamento = backfillDataPagamento;
  console.log("✅ Função backfillDataPagamento() disponível no console");
  console.log("");
  console.log("📝 Como usar:");
  console.log(
    "   1. Para simular (dry run): await backfillDataPagamento(true)"
  );
  console.log("   2. Para executar: await backfillDataPagamento(false)");
}
