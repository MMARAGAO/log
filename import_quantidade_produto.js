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
const DEFAULT_FILE = "CONTAGEM _LOJA _FEIRA.xls";
const LOJA_NOME = "Loja Feira"; // nome da loja que será atualizada
const LOJA_ID = 1; // ID da Loja Feira
const USUARIO_ID = "09bd7a75-a3d0-4bfd-ae03-a3db30a721be";
const USUARIO_NOME = "Sistema de Importação";

function limparPreco(valor) {
  if (valor === null || valor === undefined || valor === "") return 0;

  // Remove espaços, R$, e converte vírgula para ponto
  const str = String(valor)
    .trim()
    .replace(/R\$/g, "")
    .replace(/\s+/g, "")
    .replace(",", ".");

  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

// Função para registrar no histórico de estoque
async function registrarHistorico(
  produtoId,
  lojaId,
  qtdAnterior,
  qtdNova,
  tipoOperacao,
  observacao
) {
  try {
    const qtdAlterada = qtdNova - qtdAnterior;

    // Não registrar se não houve mudança
    if (qtdAlterada === 0) {
      return;
    }

    const { error } = await supabase.from("estoque_historico").insert([
      {
        produto_id: produtoId,
        loja_id: lojaId,
        quantidade_anterior: qtdAnterior,
        quantidade_nova: qtdNova,
        quantidade_alterada: qtdAlterada,
        tipo_operacao: tipoOperacao,
        usuario_id: USUARIO_ID,
        usuario_nome: USUARIO_NOME,
        observacao: observacao,
      },
    ]);

    if (error) {
      console.error(`⚠️ Erro ao registrar histórico:`, error.message);
    } else {
      console.log(`📝 Histórico registrado: ${qtdAnterior} → ${qtdNova}`);
    }
  } catch (err) {
    console.error(`⚠️ Erro ao registrar histórico:`, err.message);
  }
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

  // estado interativo que permite aplicar a mesma escolha para todos
  let globalUpdateMode = null; // null | 'replaceAll' | 'incrementAll'
  let globalCreateMode = false; // false | true (criar todos os produtos automaticamente)
  let globalInsertMode = false; // false | true (inserir todos automaticamente)
  let globalPriceUpdateMode = false; // false | true (atualizar todos os preços automaticamente)

  const askYesNo = async (question, allowAll = false) => {
    const suffix = allowAll ? " [s/N/T (Todos)]: " : " [s/N]: ";
    const answer = await rl.question(`${question}${suffix}`);
    if (!answer) return false;
    const a = answer.trim().toLowerCase();
    if (a === "t" || a === "todos" || a === "all") return "all";
    return a === "s" || a === "y" || a === "sim" || a === "yes";
  };
  // estado interativo que permite aplicar a mesma escolha para todos
  // let globalUpdateMode = null; // null | 'replaceAll' | 'incrementAll'

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
    if (a === "i") return "increment";
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
    if (al === "inc" || al === "increment" || al === "+") return "increment";
    return false;
  };

  console.log(`🏪 Importando para a loja: ${LOJA_NOME} (ID: ${LOJA_ID})\n`);

  for (const item of data) {
    const descricao = (item["DESCRIÇÃO"] || item["DESCRICAO"] || "")
      .toString()
      .trim();
    const qtd_total = Number(
      item["QTD TOTAL"] ||
        item["QTD"] ||
        item["QTD_TOTAL"] ||
        item["QNT TOTAL"] ||
        0
    );
    const preco_compra = limparPreco(
      item["PREÇO COMPRA"] || item["PRECO COMPRA"] || item["PREÇO COMRA"] || 0
    );
    const preco_venda = limparPreco(
      item["PREÇO VENDA"] || item["PRECO VENDA"] || 0
    );

    if (!descricao) {
      console.warn(`⚠️ Linha ignorada (sem descrição):`, item);
      continue;
    }

    console.log(`\n📦 Processando: ${descricao}`);
    console.log(
      `   Quantidade: ${qtd_total} | Compra: R$ ${preco_compra} | Venda: R$ ${preco_venda}`
    );

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

      let criar = globalCreateMode;
      if (!globalCreateMode) {
        criar = await askYesNo(
          `Deseja criar o produto '${descricao}' no estoque e vinculá-lo à loja ${LOJA_NOME} com quantidade ${qtd_total}?`,
          true
        );

        if (criar === "all") {
          globalCreateMode = true;
          criar = true;
          console.log(
            "✅ Modo: CRIAR TODOS os produtos automaticamente ativado!"
          );
        }
      }

      if (!criar) {
        console.log(`⏭ Pulando '${descricao}' (não criado).`);
        continue;
      }

      // Criar produto COM os preços da planilha
      const { data: novoProd, error: errInsertProd } = await supabase
        .from("estoque")
        .insert([
          {
            descricao,
            marca: null,
            preco_compra: preco_compra,
            preco_venda: preco_venda,
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
      console.log(
        `   💰 Preços: Compra R$ ${preco_compra} | Venda R$ ${preco_venda}`
      );
    } else {
      // Produto já existe - atualizar preços se necessário
      const { data: produtoAtual, error: errProduto } = await supabase
        .from("estoque")
        .select("preco_compra, preco_venda")
        .eq("id", produto.id)
        .single();

      if (!errProduto && produtoAtual) {
        const precosAtuais = {
          compra: Number(produtoAtual.preco_compra || 0),
          venda: Number(produtoAtual.preco_venda || 0),
        };

        const precosNovos = {
          compra: preco_compra,
          venda: preco_venda,
        };

        // Verificar se os preços são diferentes
        if (
          precosAtuais.compra !== precosNovos.compra ||
          precosAtuais.venda !== precosNovos.venda
        ) {
          let atualizarPrecos = globalPriceUpdateMode;

          if (!globalPriceUpdateMode) {
            atualizarPrecos = await askYesNo(
              `Produto '${descricao}' tem preços diferentes:\n` +
                `  Atual: Compra R$ ${precosAtuais.compra} | Venda R$ ${precosAtuais.venda}\n` +
                `  Novo:  Compra R$ ${precosNovos.compra} | Venda R$ ${precosNovos.venda}\n` +
                `Deseja atualizar os preços?`,
              true
            );

            if (atualizarPrecos === "all") {
              globalPriceUpdateMode = true;
              atualizarPrecos = true;
              console.log(
                "✅ Modo: ATUALIZAR TODOS os preços automaticamente ativado!"
              );
            }
          }

          if (atualizarPrecos) {
            const { error: errUpdate } = await supabase
              .from("estoque")
              .update({
                preco_compra: precosNovos.compra,
                preco_venda: precosNovos.venda,
                updatedat: new Date().toISOString(),
              })
              .eq("id", produto.id);

            if (errUpdate) {
              console.error(`❌ Erro ao atualizar preços:`, errUpdate.message);
            } else {
              console.log(`✅ Preços atualizados para '${descricao}'`);
            }
          }
        }
      }
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
        .update({
          quantidade: newQtd,
          usuario_id: USUARIO_ID,
          updatedat: new Date().toISOString(),
        })
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

      // Registrar no histórico
      const tipoOp =
        action === "increment" ? "entrada_estoque" : "ajuste_manual";
      const obs =
        action === "increment"
          ? `Importação de planilha - Incremento de ${qtd_total} unidades`
          : `Importação de planilha - Substituição de quantidade`;

      await registrarHistorico(
        produto_id,
        LOJA_ID,
        currentQtd,
        newQtd,
        tipoOp,
        obs
      );
    } else {
      // criar registro na loja — pedir confirmação antes de inserir
      let confirmarIns = globalInsertMode;

      if (!globalInsertMode) {
        confirmarIns = await askYesNo(
          `Produto: '${descricao}' não tem registro nesta loja. Inserir quantidade ${qtd_total} para a loja ${LOJA_NOME}?`,
          true
        );

        if (confirmarIns === "all") {
          globalInsertMode = true;
          confirmarIns = true;
          console.log("✅ Modo: INSERIR TODOS automaticamente ativado!");
        }
      }

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

      // Registrar no histórico (apenas se quantidade > 0)
      if (qtd_total > 0) {
        await registrarHistorico(
          produto_id,
          LOJA_ID,
          0,
          qtd_total,
          "entrada_estoque",
          "Importação de planilha - Primeira entrada"
        );
      }
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
