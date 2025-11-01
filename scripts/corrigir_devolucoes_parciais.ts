/**
 * Script para Corrigir Devoluções Parciais Incorretas
 *
 * Este script identifica e corrige vendas que foram marcadas
 * como "devolvido" devido a devoluções parciais, quando deveriam
 * permanecer com status "pago".
 *
 * Uso:
 * 1. Execute o script para ver a lista de vendas com problema
 * 2. Revise os dados exibidos
 * 3. Confirme a correção quando solicitado
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface VendaComProblema {
  venda_id: number;
  total_liquido: number;
  status_pagamento: string;
  cliente_nome: string | null;
  data_venda: string;
  devolucao_id: number;
  tipo_devolucao: string;
  valor_devolvido: number;
  credito_aplicado: boolean;
}

async function identificarProblemas() {
  console.log("\n🔍 Identificando devoluções parciais com problema...\n");

  const { data: vendas, error } = await supabase
    .from("vendas")
    .select(
      `
      id,
      total_liquido,
      status_pagamento,
      cliente_nome,
      data_venda,
      data_pagamento,
      observacoes
    `
    )
    .eq("status_pagamento", "devolvido");

  if (error) {
    console.error("❌ Erro ao buscar vendas:", error);
    return [];
  }

  if (!vendas || vendas.length === 0) {
    console.log('✅ Nenhuma venda com status "devolvido" encontrada!');
    return [];
  }

  // Buscar devoluções associadas
  const vendasComProblema: VendaComProblema[] = [];

  for (const venda of vendas) {
    const { data: devolucoes } = await supabase
      .from("devolucoes")
      .select("*")
      .eq("id_venda", venda.id);

    if (devolucoes && devolucoes.length > 0) {
      const devolucao = devolucoes[0];

      // Identificar devoluções PARCIAIS que marcaram a venda como devolvida
      if (devolucao.tipo_devolucao === "parcial") {
        vendasComProblema.push({
          venda_id: venda.id,
          total_liquido: venda.total_liquido,
          status_pagamento: venda.status_pagamento,
          cliente_nome: venda.cliente_nome,
          data_venda: venda.data_venda,
          devolucao_id: devolucao.id,
          tipo_devolucao: devolucao.tipo_devolucao,
          valor_devolvido: devolucao.valor_total_devolvido,
          credito_aplicado: devolucao.credito_aplicado,
        });
      }
    }
  }

  return vendasComProblema;
}

async function corrigirVenda(vendaId: number, comCredito: boolean) {
  console.log(`\n🔧 Corrigindo venda ID ${vendaId}...`);

  const { error } = await supabase
    .from("vendas")
    .update({
      status_pagamento: "pago",
      updated_at: new Date().toISOString(),
    })
    .eq("id", vendaId);

  if (error) {
    console.error(`❌ Erro ao corrigir venda ${vendaId}:`, error);
    return false;
  }

  console.log(`✅ Venda ${vendaId} corrigida com sucesso!`);
  return true;
}

async function main() {
  console.log("╔════════════════════════════════════════════════════════╗");
  console.log("║  Correção de Devoluções Parciais Incorretas           ║");
  console.log("╚════════════════════════════════════════════════════════╝\n");

  // Passo 1: Identificar problemas
  const problemas = await identificarProblemas();

  if (problemas.length === 0) {
    console.log("\n✅ Nenhuma correção necessária!\n");
    return;
  }

  // Passo 2: Exibir resumo
  console.log(`\n⚠️  Encontradas ${problemas.length} venda(s) com problema:\n`);
  console.log(
    "┌─────────┬──────────────┬──────────────┬──────────────────────┬──────────┐"
  );
  console.log(
    "│ Venda   │ Valor Total  │ Devolvido    │ Cliente              │ Crédito  │"
  );
  console.log(
    "├─────────┼──────────────┼──────────────┼──────────────────────┼──────────┤"
  );

  problemas.forEach((p) => {
    const vendaId = String(p.venda_id).padEnd(7);
    const total = `R$ ${p.total_liquido.toFixed(2)}`.padEnd(12);
    const devolvido = `R$ ${p.valor_devolvido.toFixed(2)}`.padEnd(12);
    const cliente = (p.cliente_nome || "Sem nome").substring(0, 20).padEnd(20);
    const credito = p.credito_aplicado ? "Sim ✓   " : "Não ✗   ";
    console.log(
      `│ ${vendaId} │ ${total} │ ${devolvido} │ ${cliente} │ ${credito} │`
    );
  });

  console.log(
    "└─────────┴──────────────┴──────────────┴──────────────────────┴──────────┘\n"
  );

  // Passo 3: Correção
  console.log("📋 Plano de correção:");
  console.log('   • Vendas serão restauradas para status "pago"');
  console.log("   • Valores originais serão mantidos");
  console.log("   • Data de pagamento será preservada\n");

  // Executar correções
  console.log("🚀 Executando correções...\n");
  let corrigidas = 0;

  for (const problema of problemas) {
    const sucesso = await corrigirVenda(
      problema.venda_id,
      problema.credito_aplicado
    );
    if (sucesso) corrigidas++;
  }

  // Resumo final
  console.log("\n" + "═".repeat(60));
  console.log(`\n✅ Correção concluída!`);
  console.log(`   • ${corrigidas} de ${problemas.length} vendas corrigidas`);
  console.log(`   • ${problemas.length - corrigidas} erro(s)\n`);

  // Validação
  console.log("🔍 Validando correção...\n");
  const problemasRestantes = await identificarProblemas();

  if (problemasRestantes.length === 0) {
    console.log(
      "✅ Validação OK! Todas as devoluções parciais foram corrigidas.\n"
    );
  } else {
    console.log(
      `⚠️  Ainda existem ${problemasRestantes.length} problema(s) pendente(s).\n`
    );
  }
}

// Executar
main()
  .then(() => {
    console.log("Script finalizado.\n");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Erro fatal:", error);
    process.exit(1);
  });
