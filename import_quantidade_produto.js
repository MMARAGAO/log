import { createClient } from "@supabase/supabase-js";
import XLSX from "xlsx"; // ✅ Importação correta para Node
import readline from "node:readline/promises";
import { stdin, stdout } from "node:process";

// ATENÇÃO: este script usa a SERVICE ROLE key para permitir writes.
// Mantenha em ambiente seguro.
const supabase = createClient(
  "https://yyqpqkajqukqkmrgzgsu.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5cXBxa2FqcXVrcWttcmd6Z3N1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDk5OTM2NSwiZXhwIjoyMDcwNTc1MzY1fQ.cAs4EdyJ2COWl5d8cL2nY_S8qgPzAUuZRzoJ0Q_bTbA"
);

// Configurações padrão — você pode alterar via CLI
const DEFAULT_FILE = "CONTAGEM_DE_FLEX.xls";
const LOJA_NOME = "atacado"; // nome da loja que será atualizada
const USUARIO_ID = "09bd7a75-a3d0-4bfd-ae03-a3db30a721be";

function limparPreco(valor) {
  if (valor === null || valor === undefined || valor === "") return 0;
  const str = String(valor).trim().replace(/\s+/g, "").replace(",", ".");
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

async function importarEstoque({ file = DEFAULT_FILE, increment = false }) {
  const workbook = XLSX.readFile(file);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet);

  console.log(
    `📦 Iniciando importação de ${data.length} linhas do arquivo ${file}...`
  );

  // Interface de prompt (reutilizada durante todo o processo)
  const rl = readline.createInterface({ input: stdin, output: stdout });

  const askYesNo = async (question) => {
    const answer = await rl.question(`${question} [s/N]: `);
    if (!answer) return false;
    const a = answer.trim().toLowerCase();
    return a === "s" || a === "y" || a === "sim" || a === "yes";
  };
  // estado interativo que permite aplicar a mesma escolha para todos
  let globalUpdateMode = null; // null | 'replaceAll' | 'incrementAll'

  const askUpdateAction = async (descricao, currentQtd, proposedQtd) => {
    // se o usuário já escolheu aplicar a mesma ação para todos
    if (globalUpdateMode === "incrementAll") return "increment";
    if (globalUpdateMode === "replaceAll") return "replace";

    const prompt =
      `Produto: '${descricao}' — quantidade atual: ${currentQtd}.\n` +
      `  (r) Substituir por ${proposedQtd}  |  (i) Somar => ${currentQtd} + ${proposedQtd} = ${currentQtd + proposedQtd}\n` +
      `  (R) Substituir Tudo  |  (I) Somar Tudo  |  Enter ou qualquer outra tecla = cancelar`;

    const ans = await rl.question(`${prompt}\nEscolha: `);
    if (!ans) return false;
    const a = ans.trim();
    if (a === "r") return "replace";
    i;
    if (a === "R") {
      globalUpdateMode = "replaceAll";
      return "replace";
    }
    if (a === "I") {
      globalUpdateMode = "incrementAll";
      return "increment";
    }
    // aceitar respostas em texto (pt/en)
    const al = a.toLowerCase();
    if (al === "s" || al === "sim" || al === "y" || al === "yes")
      return "replace";
    if (al === "i" || al === "inc" || al === "increment" || al === "+")
      return "increment";
    return false;
  };
  // Buscar loja pelo nome
  const { data: lojas, error: lojaErr } = await supabase
    .from("lojas")
    .select("id,nome")
    .ilike("nome", LOJA_NOME)
    .limit(1);

  if (lojaErr || !lojas || lojas.length === 0) {
    console.error(
      `❌ Não foi possível localizar a loja '${LOJA_NOME}':`,
      lojaErr?.message || "não encontrada"
    );
    rl.close();
    return;
  }

  const LOJA_ID = lojas[0].id;

  for (const item of data) {
    const descricao = (item["DESCRIÇÃO"] || item["DESCRICAO"] || "")
      .toString()
      .trim();
    const qtd_total = Number(
      item["QTD TOTAL"] || item["QTD"] || item["QTD_TOTAL"] || 0
    );

    if (!descricao) {
      console.warn(`⚠️ Linha ignorada (sem descrição):`, item);
      continue;
    }

    // Buscar produto existente pelo campo descricao (primeiro tenta igualdade exata, depois ilike)
    let produto = null;

    const { data: encontradoEq, error: errEq } = await supabase
      .from("estoque")
      .select("id")
      .eq("descricao", descricao)
      .limit(1);

    if (errEq) {
      console.error(`❌ Erro ao buscar produto '${descricao}':`, errEq.message);
      continue;
    }

    if (encontradoEq && encontradoEq.length > 0) {
      produto = encontradoEq[0];
    } else {
      // fallback case-insensitive
      const { data: encontradoIlike, error: errIlike } = await supabase
        .from("estoque")
        .select("id,descricao")
        .ilike("descricao", descricao)
        .limit(1);

      if (errIlike) {
        console.error(
          `❌ Erro ao buscar (ilike) produto '${descricao}':`,
          errIlike.message
        );
        continue;
      }

      if (encontradoIlike && encontradoIlike.length > 0)
        produto = encontradoIlike[0];
    }

    if (!produto) {
      // Produto não encontrado — perguntar se deve criar
      console.warn(`⚠️ Produto não encontrado no estoque: '${descricao}'`);
      const criar = await askYesNo(
        `Deseja criar o produto '${descricao}' no estoque e vinculá-lo à loja ${LOJA_NOME} com quantidade ${qtd_total}?`
      );

      if (!criar) {
        console.log(`⏭ Pulando '${descricao}' (não criado).`);
        continue;
      }

      // Criar produto mínimo (sem preços) antes de vincular
      const { data: novoProd, error: errInsertProd } = await supabase
        .from("estoque")
        .insert([
          {
            descricao,
            marca: null,
            preco_compra: 0,
            preco_venda: 0,
            minimo: 0,
            usuario_id: USUARIO_ID,
          },
        ])
        .select("id")
        .single();

      if (errInsertProd || !novoProd) {
        console.error(
          `❌ Erro ao criar produto '${descricao}':`,
          errInsertProd?.message || "sem resposta"
        );
        continue;
      }

      produto = { id: novoProd.id };
      console.log(`✅ Produto criado: '${descricao}' (id=${produto.id})`);
    }

    const produto_id = produto.id;

    // Verificar se já existe registro em estoque_lojas
    const { data: lojaRegistro, error: regErr } = await supabase
      .from("estoque_lojas")
      .select("id,quantidade")
      .eq("produto_id", produto_id)
      .eq("loja_id", LOJA_ID)
      .limit(1);

    if (regErr) {
      console.error(
        `❌ Erro ao consultar estoque_lojas para produto ${produto_id}:`,
        regErr.message
      );
      continue;
    }

    const existe = lojaRegistro && lojaRegistro.length > 0;

    if (existe) {
      const currentQtd = Number(lojaRegistro[0].quantidade || 0);
      const proposedQtdReplace = qtd_total;
      const proposedQtdIncrement = currentQtd + qtd_total;

      // se --increment foi passado globalmente, aplicamos increment sem perguntar
      let action = null;
      if (increment) action = "increment";
      else action = await askUpdateAction(descricao, currentQtd, qtd_total);

      if (!action) {
        console.log(`⏭ Atualização cancelada para '${descricao}'.`);
        continue;
      }

      const newQtd =
        action === "increment" ? proposedQtdIncrement : proposedQtdReplace;

      const { error: updErr } = await supabase
        .from("estoque_lojas")
        .update({ quantidade: newQtd, usuario_id: USUARIO_ID })
        .eq("id", lojaRegistro[0].id);

      if (updErr) {
        console.error(
          `❌ Erro ao atualizar quantidade para '${descricao}':`,
          updErr.message
        );
        continue;
      }

      console.log(
        `🔁 Atualizado '${descricao}' (produto_id=${produto_id}) — ${currentQtd} -> ${newQtd}`
      );
    } else {
      // criar registro na loja — pedir confirmação antes de inserir
      const confirmarIns = await askYesNo(
        `Produto: '${descricao}' não tem registro nesta loja. Inserir quantidade ${qtd_total} para a loja ${LOJA_NOME}?`
      );

      if (!confirmarIns) {
        console.log(`⏭ Inserção cancelada para '${descricao}'.`);
        continue;
      }

      const { error: insErr } = await supabase.from("estoque_lojas").insert([
        {
          produto_id,
          loja_id: LOJA_ID,
          quantidade: qtd_total,
          usuario_id: USUARIO_ID,
        },
      ]);

      if (insErr) {
        console.error(
          `❌ Erro ao inserir estoque_lojas para '${descricao}':`,
          insErr.message
        );
        continue;
      }

      console.log(
        `➕ Inserido '${descricao}' na loja ${LOJA_NOME} — Qtd: ${qtd_total}`
      );
    }
  }

  rl.close();
  console.log("🎉 Processo finalizado.");
}

// CLI simples: node import_quantidade_produto.js [arquivo] [--increment]
const argv = process.argv.slice(2);
const fileArg = argv.find((a) => !a.startsWith("--"));
const increment = argv.includes("--increment") || argv.includes("-i");

importarEstoque({ file: fileArg || DEFAULT_FILE, increment }).catch((err) => {
  console.error("Erro inesperado:", err);
  process.exit(1);
});
