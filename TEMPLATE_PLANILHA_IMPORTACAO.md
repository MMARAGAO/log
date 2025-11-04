# Template de Planilha para Importação

## 📝 Instruções

1. Copie o conteúdo abaixo para uma nova planilha Excel
2. Preencha os dados dos seus produtos
3. Salve como `.xls` ou `.xlsx`
4. Execute o script de importação

## 📋 Template (copiar para Excel)

```
DESCRIÇÃO	PREÇO COMPRA	PREÇO VENDA	QNT TOTAL
BORRACHINHA PARA LENTE DA CAMERA	R$ 0,15	R$ 5,00	800
FLEX AURICULAR ORIGINAL IPHONE 11 (CAIXINHA)	R$ 16,00	R$ 25,00	51
FLEX AURICULAR ORIGINAL IPHONE 11 PRO MAX (CAIXINHA)	R$ 30,00	R$ 40,00	13
FLEX AURICULAR ORIGINAL IPHONE 12 PRO MAX (CAIXINHA)	R$ 30,00	R$ 50,00	14
FLEX AURICULAR ORIGINAL IPHONE X (CAIXINHA)	R$ 16,00	R$ 30,00	19
```

## ✅ Regras de Preenchimento

### Coluna DESCRIÇÃO

- **Obrigatória**
- Texto livre
- Use o nome completo e descritivo do produto
- Evite caracteres especiais problemáticos
- Exemplo: `FLEX AURICULAR ORIGINAL IPHONE 11`

### Coluna PREÇO COMPRA

- **Obrigatória** (ou deixe 0)
- Formatos aceitos:
  - `R$ 16,00`
  - `16.00`
  - `16,00`
  - `16`
- O script converte automaticamente

### Coluna PREÇO VENDA

- **Obrigatória** (ou deixe 0)
- Mesmos formatos do PREÇO COMPRA
- Deve ser maior ou igual ao preço de compra

### Coluna QNT TOTAL

- **Obrigatória**
- Apenas números inteiros
- Não use decimais
- Exemplo: `800`, `51`, `0`

## ⚠️ Observações

1. **Cabeçalho:** A primeira linha deve conter os nomes das colunas exatamente como mostrado
2. **Ordem:** As colunas podem estar em qualquer ordem
3. **Vazios:** Linhas vazias serão ignoradas
4. **Duplicados:** Se houver produtos com mesma descrição, apenas o primeiro será considerado

## 🎯 Variações de Nome de Coluna Aceitas

O script aceita diferentes variações:

| Coluna Padrão  | Variações Aceitas               |
| -------------- | ------------------------------- |
| `DESCRIÇÃO`    | `DESCRICAO`                     |
| `PREÇO COMPRA` | `PRECO COMPRA`, `PREÇO COMRA`   |
| `PREÇO VENDA`  | `PRECO VENDA`                   |
| `QNT TOTAL`    | `QTD TOTAL`, `QTD`, `QTD_TOTAL` |

## 📊 Exemplo Real de Planilha

**ANTES (planilha):**

```
DESCRIÇÃO                                    PREÇO COMPRA  PREÇO VENDA  QNT TOTAL
Tela LCD iPhone 12                           R$ 150,00     R$ 280,00    25
Bateria iPhone 11                            R$ 45,00      R$ 80,00     50
Conector de Carga Type-C                     R$ 2,50       R$ 10,00     200
```

**DEPOIS (banco de dados):**

```sql
-- Tabela: estoque
id  | descricao                      | preco_compra | preco_venda
----|--------------------------------|--------------|-------------
123 | Tela LCD iPhone 12             | 150.00       | 280.00
124 | Bateria iPhone 11              | 45.00        | 80.00
125 | Conector de Carga Type-C       | 2.50         | 10.00

-- Tabela: estoque_lojas (LOJA_ID = 4 "ESTOQUE")
id  | produto_id | loja_id | quantidade
----|------------|---------|------------
456 | 123        | 4       | 25
457 | 124        | 4       | 50
458 | 125        | 4       | 200

-- Tabela: estoque_historico
id  | produto_id | loja_id | qtd_ant | qtd_nova | tipo_operacao
----|------------|---------|---------|----------|----------------
789 | 123        | 4       | 0       | 25       | entrada_estoque
790 | 124        | 4       | 0       | 50       | entrada_estoque
791 | 125        | 4       | 0       | 200      | entrada_estoque
```

## 🚀 Próximos Passos

1. ✅ Criar planilha com seus dados
2. ✅ Salvar como `.xls` ou `.xlsx`
3. ✅ Configurar variáveis no script (LOJA_ID, USUARIO_ID)
4. ✅ Executar: `node import_quantidade_produto.js`
5. ✅ Acompanhar prompts e confirmar ações
6. ✅ Verificar resultado no sistema web

## 💡 Dicas

- **Teste primeiro:** Use uma planilha pequena (2-3 produtos) para testar
- **Backup:** Faça backup do banco antes de importar grandes volumes
- **Descrições únicas:** Evite produtos com nomes idênticos
- **Incremental:** Use `--increment` se estiver somando ao estoque existente
- **Preços:** Sempre verifique se os preços estão corretos antes de confirmar
