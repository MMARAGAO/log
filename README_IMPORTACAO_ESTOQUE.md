# 📦 Script de Importação de Estoque

## 🎯 Objetivo

Script para importar dados de uma planilha Excel para o sistema de estoque, incluindo:

- ✅ Criação/atualização de produtos
- ✅ Atualização de preços de compra e venda
- ✅ Gerenciamento de quantidade por loja
- ✅ Registro automático no histórico de alterações

## 📋 Formato da Planilha

A planilha deve conter as seguintes colunas:

| Coluna         | Descrição        | Exemplo                           |
| -------------- | ---------------- | --------------------------------- |
| `DESCRIÇÃO`    | Nome do produto  | FLEX AURICULAR ORIGINAL IPHONE 11 |
| `PREÇO COMPRA` | Preço de custo   | R$ 16,00                          |
| `PREÇO VENDA`  | Preço de revenda | R$ 25,00                          |
| `QNT TOTAL`    | Quantidade total | 51                                |

### Exemplo de Planilha

```
DESCRIÇÃO                                          PREÇO COMPRA  PREÇO VENDA  QNT TOTAL
BORRACHINHA PARA LENTE DA CAMERA                   R$ 0,15       R$ 5,00      800
FLEX AURICULAR ORIGINAL IPHONE 11 (CAIXINHA)       R$ 16,00      R$ 25,00     51
FLEX AURICULAR ORIGINAL IPHONE 11 PRO MAX          R$ 30,00      R$ 40,00     13
```

## ⚙️ Configuração

### Variáveis no Script

```javascript
const DEFAULT_FILE = "CONTAGEM_DE_FLEX.xls"; // Nome do arquivo padrão
const LOJA_NOME = "ESTOQUE"; // Nome da loja
const LOJA_ID = 4; // ID da loja ESTOQUE
const USUARIO_ID = "09bd7a75-..."; // UUID do usuário
const USUARIO_NOME = "Sistema de Importação"; // Nome para histórico
```

**IMPORTANTE:** Altere estas variáveis conforme sua necessidade antes de executar!

## 🚀 Como Usar

### 1. Preparar Planilha

Salve sua planilha Excel no mesmo diretório do script com o nome `CONTAGEM_DE_FLEX.xls` (ou o nome configurado em `DEFAULT_FILE`).

### 2. Instalar Dependências

```bash
npm install
```

### 3. Executar o Script

#### Modo Padrão (pergunta antes de atualizar)

```bash
node import_quantidade_produto.js
```

#### Usando arquivo específico

```bash
node import_quantidade_produto.js minha_planilha.xls
```

#### Modo Incremento (soma quantidades automaticamente)

```bash
node import_quantidade_produto.js --increment
# ou
node import_quantidade_produto.js -i
```

## 🔄 Fluxo de Trabalho

### Para cada linha da planilha:

```
1. 📖 Lê dados: descrição, preços, quantidade
   ↓
2. 🔍 Busca produto por descrição (case-insensitive)
   ↓
3. ❓ Produto existe?
   ├─ ❌ NÃO → Pergunta se deve criar
   │           ├─ Sim → Cria produto com preços
   │           └─ Não → Pula para próximo
   │
   └─ ✅ SIM → Verifica preços
               ├─ Diferentes? → Pergunta se atualiza
               └─ Iguais → Continua
   ↓
4. 🏪 Verifica estoque na loja
   ├─ ❌ Não existe → Pergunta se insere
   │                  └─ Insere + Registra histórico
   │
   └─ ✅ Existe → Pergunta ação:
                  ├─ (r) Substituir quantidade
                  ├─ (i) Incrementar (somar)
                  ├─ (R) Substituir TUDO (aplica para todos)
                  ├─ (I) Incrementar TUDO (aplica para todos)
                  └─ Enter → Cancelar
   ↓
5. 📝 Registra no histórico (se houver mudança)
   ↓
6. ✅ Próxima linha
```

## 💬 Opções Interativas

Durante a execução, você verá prompts como:

### 1. Criar Produto Novo

```
⚠️ Produto não encontrado no estoque: 'BORRACHINHA PARA LENTE'
Deseja criar o produto 'BORRACHINHA PARA LENTE' no estoque
e vinculá-lo à loja ESTOQUE com quantidade 800? [s/N]:
```

### 2. Atualizar Preços

```
Produto 'FLEX AURICULAR IPHONE 11' tem preços diferentes:
  Atual: Compra R$ 15 | Venda R$ 20
  Novo:  Compra R$ 16 | Venda R$ 25
Deseja atualizar os preços? [s/N]:
```

### 3. Atualizar Quantidade

```
Produto: 'FLEX AURICULAR IPHONE 11' — quantidade atual: 40.
  (r) Substituir por 51  |  (i) Somar => 40 + 51 = 91
  (R) Substituir Tudo  |  (I) Somar Tudo  |  Enter = cancelar
Escolha:
```

**Opções:**

- `r` - Substituir quantidade (51)
- `i` - Incrementar (40 + 51 = 91)
- `R` - Substituir para TODOS os próximos produtos
- `I` - Incrementar para TODOS os próximos produtos
- `Enter` - Cancelar esta alteração

### 4. Inserir em Nova Loja

```
Produto: 'FLEX AURICULAR IPHONE X' não tem registro nesta loja.
Inserir quantidade 19 para a loja ESTOQUE? [s/N]:
```

## 📊 Saída do Console

```
📦 Iniciando importação de 5 linhas do arquivo CONTAGEM_DE_FLEX.xls...
🏪 Importando para a loja: ESTOQUE (ID: 4)

📦 Processando: BORRACHINHA PARA LENTE DA CAMERA
   Quantidade: 800 | Compra: R$ 0.15 | Venda: R$ 5
✅ Produto criado: 'BORRACHINHA PARA LENTE DA CAMERA' (id=123)
   💰 Preços: Compra R$ 0.15 | Venda R$ 5
➕ Inserido 'BORRACHINHA PARA LENTE DA CAMERA' na loja ESTOQUE — Qtd: 800
📝 Histórico registrado: 0 → 800

📦 Processando: FLEX AURICULAR ORIGINAL IPHONE 11 (CAIXINHA)
   Quantidade: 51 | Compra: R$ 16 | Venda: R$ 25
🔁 Atualizado 'FLEX AURICULAR ORIGINAL IPHONE 11' (produto_id=45) — 40 -> 51
📝 Histórico registrado: 40 → 51

🎉 Processo finalizado.
```

## 📝 Histórico de Alterações

Todas as alterações são registradas na tabela `estoque_historico`:

- **Tipo de Operação:**

  - `entrada_estoque` - Importação inicial ou incremento
  - `ajuste_manual` - Substituição de quantidade

- **Campos Registrados:**
  - Produto e loja
  - Quantidade anterior e nova
  - Quantidade alterada (+/-)
  - Usuário e data/hora
  - Observação descritiva

## ⚠️ Observações Importantes

1. **Backup:** Sempre faça backup do banco antes de importar grandes volumes
2. **Service Role:** O script usa a chave de service role - **nunca compartilhe**
3. **Descrição única:** A busca é por descrição - certifique-se de que são únicas
4. **Confirmação:** O script pede confirmação para cada ação (a menos que use --increment)
5. **Case-insensitive:** A busca ignora maiúsculas/minúsculas
6. **Formato de preço:** Aceita "R$ 10,50", "10.50", "10,50", etc.

## 🔧 Solução de Problemas

### Erro: "Não foi possível localizar a loja"

- Verifique se `LOJA_ID = 4` está correto
- Confirme que a loja existe no banco: `SELECT * FROM lojas WHERE id = 4;`

### Erro: "Erro ao criar produto"

- Verifique se `USUARIO_ID` é válido
- Confirme permissões RLS na tabela `estoque`

### Erro: "Erro ao registrar histórico"

- Verifique se a migration `estoque_historico` foi executada
- Confirme que as foreign keys estão corretas

### Planilha não lida corretamente

- Salve como `.xls` ou `.xlsx`
- Verifique se os nomes das colunas estão corretos
- Remova linhas em branco no início

## 📚 Exemplos de Uso

### Importação inicial (criando produtos)

```bash
node import_quantidade_produto.js produtos_novos.xls
# Responder 's' para criar produtos
# Responder 's' para inserir quantidades
```

### Atualização de estoque existente

```bash
node import_quantidade_produto.js contagem_mensal.xls
# Escolher (r) para substituir quantidade
# Ou (i) para adicionar ao estoque existente
```

### Importação rápida (soma tudo automaticamente)

```bash
node import_quantidade_produto.js entrada_fornecedor.xls --increment
# Não pede confirmação, soma todas as quantidades
```

## 🎯 Resultado Esperado

Após a execução:

- ✅ Produtos criados/atualizados na tabela `estoque`
- ✅ Preços atualizados (se confirmado)
- ✅ Quantidades atualizadas na tabela `estoque_lojas`
- ✅ Histórico completo registrado em `estoque_historico`
- ✅ Interface web mostrará os dados atualizados
- ✅ Botão "Ver Histórico" mostrará as alterações

## 📞 Suporte

Se encontrar problemas:

1. Verifique os logs no console
2. Confirme as configurações das variáveis
3. Teste com uma planilha pequena primeiro (2-3 linhas)
4. Verifique se a migration do histórico foi aplicada
