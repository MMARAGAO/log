import { createClient } from "@supabase/supabase-js";
import XLSX from "xlsx"; // ✅ Importação correta para Node 22+

const supabase = createClient(
  "https://yyqpqkajqukqkmrgzgsu.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5cXBxa2FqcXVrcWttcmd6Z3N1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDk5OTM2NSwiZXhwIjoyMDcwNTc1MzY1fQ.cAs4EdyJ2COWl5d8cL2nY_S8qgPzAUuZRzoJ0Q_bTbA"
);

const LOJA_ID = 3;
const USUARIO_ID = "f54dcc42-edbe-4527-a61f-3a4c8e6892cd";

const workbook = XLSX.readFile("estoque.xlsx");
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(sheet);

function limparPreco(valor) {
  if (valor === null || valor === undefined || valor === "") return 0;
  const str = String(valor).trim().replace(",", ".");
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

async function importarEstoque() {
  console.log(`📦 Iniciando importação de ${data.length} produtos...`);

  for (const item of data) {
    const descricao = item["DESCRIÇÃO"]?.trim() || "";
    const marca = item["MARCA"]?.trim() || ""; // ✅ Permite vazio
    const preco_compra = limparPreco(item["PREÇO COMPRA"]);
    const preco_venda = limparPreco(item["PREÇO VENDA"]);
    const qtd_total = Number(item["QTD TOTAL"] || 0);
    const minimo = Number(item["QNT ESTOQUE MINIMO"] || 0);

    // ✅ Só ignora se NÃO tiver descrição
    if (!descricao) {
      console.warn(`⚠️ Linha ignorada (sem descrição):`, item);
      continue;
    }

    if (preco_compra > 100000 || preco_venda > 100000) {
      console.warn(
        `⚠️ Valor suspeito detectado em "${descricao}": compra=${preco_compra}, venda=${preco_venda}`
      );
      continue;
    }

    const { data: estoqueData, error: estoqueError } = await supabase
      .from("estoque")
      .insert([
        {
          descricao,
          marca: marca || null, // ✅ Envia null se vazio
          preco_compra,
          preco_venda,
          minimo,
          usuario_id: USUARIO_ID,
        },
      ])
      .select("id")
      .single();

    if (estoqueError) {
      console.error(`❌ Erro ao inserir "${descricao}":`, estoqueError.message);
      continue;
    }

    const produto_id = estoqueData.id;

    const { error: lojaError } = await supabase.from("estoque_lojas").insert([
      {
        produto_id,
        loja_id: LOJA_ID,
        quantidade: qtd_total,
        usuario_id: USUARIO_ID,
      },
    ]);

    if (lojaError) {
      console.error(
        `❌ Erro ao vincular "${descricao}" à loja:`,
        lojaError.message
      );
      continue;
    }

    console.log(
      `✅ ${descricao}${marca ? ` [${marca}]` : ""} — Compra: R$ ${preco_compra.toFixed(
        2
      )}, Venda: R$ ${preco_venda.toFixed(2)}, Qtd: ${qtd_total}`
    );
  }

  console.log("🎉 Importação concluída com sucesso!");
}

importarEstoque();
