import { createClient } from "@supabase/supabase-js";
import XLSX from "xlsx";

const supabase = createClient(
  "https://yyqpqkajqukqkmrgzgsu.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5cXBxa2FqcXVrcWttcmd6Z3N1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDk5OTM2NSwiZXhwIjoyMDcwNTc1MzY1fQ.cAs4EdyJ2COWl5d8cL2nY_S8qgPzAUuZRzoJ0Q_bTbA"
);

const USUARIO_ID = "f54dcc42-edbe-4527-a61f-3a4c8e6892cd";

const workbook = XLSX.readFile("clientes.xls");
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(sheet);

function limparTelefone(valor) {
  if (!valor) return null;
  // Remove todos os caracteres não numéricos
  const telefone = String(valor).replace(/\D/g, "");
  return telefone.length > 0 ? telefone : null;
}

function limparCPFCNPJ(valor) {
  if (!valor) return null;
  const str = String(valor).trim();
  // Se for o placeholder padrão, retorna null
  if (str === "___.___.___-__" || str === "__.___.___/____-__") return null;
  // Remove caracteres especiais
  const limpo = str.replace(/[.\-\/]/g, "");
  return limpo.length >= 11 ? limpo : null;
}

function extrairEndereco(enderecoCompleto) {
  if (!enderecoCompleto) return null;
  // Remove espaços extras e retorna o endereço limpo
  return enderecoCompleto.trim() || null;
}

function limparEmail(valor) {
  if (!valor) return null;
  const email = String(valor).trim().toLowerCase();
  // Validação básica de email
  if (email.includes("@") && email.includes(".")) {
    return email;
  }
  return null;
}

async function importarClientes() {
  console.log(`👥 Iniciando importação de ${data.length} clientes...`);

  let importados = 0;
  let erros = 0;
  let ignorados = 0;

  for (const item of data) {
    const nome = item["Nome"]?.trim() || "";
    const telefone = limparTelefone(item["Telefones"]);
    const email = limparEmail(item["Email"]);
    const doc = limparCPFCNPJ(item["CPF / CNPJ"]);
    const endereco = extrairEndereco(
      item["Casamento Aniversário"] || item["Casamento"] || item["Aniversário"]
    );

    // ✅ Só ignora se NÃO tiver nome
    if (!nome || nome === "Nome") {
      // Ignora cabeçalho e linhas vazias
      ignorados++;
      continue;
    }

    // Verificar se já existe cliente com mesmo documento (se houver doc)
    if (doc) {
      const { data: clienteExistente } = await supabase
        .from("clientes")
        .select("id, nome")
        .eq("doc", doc)
        .maybeSingle();

      if (clienteExistente) {
        console.warn(
          `⚠️ Cliente "${nome}" já existe (Doc: ${doc}). Ignorando...`
        );
        ignorados++;
        continue;
      }
    }

    // Inserir cliente
    const { data: clienteData, error: clienteError } = await supabase
      .from("clientes")
      .insert([
        {
          nome,
          telefone,
          email,
          doc,
          endereco,
          whatsapp: telefone ? true : false, // Marca como WhatsApp se tiver telefone
          credito: 0, // Crédito inicial zerado
          usuario_id: USUARIO_ID,
        },
      ])
      .select("id, nome")
      .single();

    if (clienteError) {
      console.error(`❌ Erro ao inserir "${nome}":`, clienteError.message);
      erros++;
      continue;
    }

    importados++;
    console.log(
      `✅ ${clienteData.nome}${telefone ? ` - Tel: ${telefone}` : ""}${
        doc ? ` - Doc: ${doc}` : ""
      }`
    );
  }

  console.log("\n" + "=".repeat(60));
  console.log(`🎉 Importação concluída!`);
  console.log(`✅ Importados: ${importados}`);
  console.log(`⚠️ Ignorados: ${ignorados}`);
  console.log(`❌ Erros: ${erros}`);
  console.log("=".repeat(60));
}

importarClientes();
