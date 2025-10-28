import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const supabase = createClient(
  "https://yyqpqkajqukqkmrgzgsu.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5cXBxa2FqcXVrcWttcmd6Z3N1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDk5OTM2NSwiZXhwIjoyMDcwNTc1MzY1fQ.cAs4EdyJ2COWl5d8cL2nY_S8qgPzAUuZRzoJ0Q_bTbA"
);

async function corrigirPrecosInteligente() {
  console.log("🔍 Buscando produtos para verificação...");
  const { data: produtos, error } = await supabase.from("estoque").select("*");

  if (error) {
    console.error("❌ Erro ao buscar produtos:", error.message);
    return;
  }

  const corrigidos = [];

  for (const p of produtos) {
    const { id, descricao, preco_compra, preco_venda } = p;
    let novoCompra = preco_compra;
    let novoVenda = preco_venda;
    let alterado = false;

    const razao = preco_venda / (preco_compra || 1);

    // 🧩 Detecta se algum valor é suspeito
    const compraSuspeita = preco_compra > 20000;
    const vendaSuspeita = preco_venda > 20000;
    const relacaoAbsurda = razao > 50 || razao < 0.2;

    if (compraSuspeita || vendaSuspeita || relacaoAbsurda) {
      // Caso 1: só o preço de compra parece errado
      if (compraSuspeita && !vendaSuspeita) {
        novoCompra = +(preco_compra / 100).toFixed(2);
        alterado = true;
      }
      // Caso 2: só o preço de venda parece errado
      else if (vendaSuspeita && !compraSuspeita) {
        novoVenda = +(preco_venda / 100).toFixed(2);
        alterado = true;
      }
      // Caso 3: ambos são muito altos → divide os dois
      else if (compraSuspeita && vendaSuspeita) {
        novoCompra = +(preco_compra / 100).toFixed(2);
        novoVenda = +(preco_venda / 100).toFixed(2);
        alterado = true;
      }
      // Caso 4: relação absurda → corrige o lado mais provável
      else if (relacaoAbsurda) {
        if (razao > 50) {
          // venda está muito alta
          novoVenda = +(preco_venda / 100).toFixed(2);
        } else if (razao < 0.2) {
          // compra está muito alta
          novoCompra = +(preco_compra / 100).toFixed(2);
        }
        alterado = true;
      }
    }

    if (alterado) {
      const { error: updateError } = await supabase
        .from("estoque")
        .update({
          preco_compra: novoCompra,
          preco_venda: novoVenda,
        })

        .eq("id", id);

      if (!updateError) {
        corrigidos.push({
          id,
          descricao,
          preco_compra_antigo: preco_compra,
          preco_venda_antigo: preco_venda,
          preco_compra_corrigido: novoCompra,
          preco_venda_corrigido: novoVenda,
        });
        console.log(`✅ Corrigido: ${descricao}`);
      } else {
        console.error(`❌ Erro ao corrigir ${descricao}:`, updateError.message);
      }
    }
  }

  fs.writeFileSync(
    "ajustes_inteligentes.json",
    JSON.stringify(corrigidos, null, 2)
  );
  console.log(
    `\n🎯 Ajustes finalizados: ${corrigidos.length} produtos corrigidos.`
  );
}

corrigirPrecosInteligente();
