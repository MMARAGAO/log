# 🧪 Guia de Teste - Sistema de Sangria

## ✅ Pré-requisitos

- [x] Tabela `sangrias` criada no banco de dados
- [x] Políticas RLS configuradas
- [x] Sistema compilando sem erros

## 📝 Passo a Passo para Testar

### 1️⃣ Abrir um Caixa

1. Acesse a página de Caixa
2. Clique em "Abrir Caixa" em uma loja
3. Preencha valor inicial (ex: R$ 500,00)
4. Confirme a abertura

### 2️⃣ Fazer uma Sangria

1. No card do caixa aberto, procure o botão **"Sangria"** (cor amarela/warning)
2. Clique no botão "Sangria"
3. No modal que abrir:
   - **Valor**: Digite um valor (ex: R$ 200,00)
   - **Motivo**: Digite um motivo (ex: "Depósito bancário")
4. Clique em "Confirmar Sangria"
5. ✅ Deve aparecer um toast verde: "Sangria registrada com sucesso!"

### 3️⃣ Visualizar Sangrias no Modal de Detalhes

1. Clique no botão **"Detalhes"** no card do caixa
2. Role até a seção **"💸 Sangrias Realizadas"**
3. Verifique se a sangria aparece com:
   - ✅ Motivo correto
   - ✅ Data e hora
   - ✅ Valor em vermelho com sinal negativo
   - ✅ Total de sangrias calculado

### 4️⃣ Verificar Sangria no PDF

1. No modal de detalhes, clique em **"Baixar PDF"**
2. Abra o PDF gerado
3. Procure a seção **"[$] Sangrias Realizadas"**
4. Verifique se a sangria aparece na tabela com:
   - ✅ Data/Hora
   - ✅ Motivo
   - ✅ Valor
   - ✅ Total destacado

### 5️⃣ Verificar no Histórico

1. Feche o caixa (ou teste com um caixa fechado)
2. Clique no ícone de relógio (histórico)
3. No histórico, clique em "Baixar PDF" de um caixa
4. ✅ Sangrias devem aparecer no PDF do histórico

### 6️⃣ Testar Validações

Tente fazer uma sangria inválida:

**Teste 1: Valor zero ou vazio**

1. Abra o modal de sangria
2. Deixe o valor vazio ou digite R$ 0,00
3. ✅ Botão "Confirmar Sangria" deve ficar desabilitado

**Teste 2: Motivo vazio**

1. Digite um valor válido
2. Deixe o motivo vazio
3. ✅ Botão "Confirmar Sangria" deve ficar desabilitado

**Teste 3: Valores corretos**

1. Digite valor válido (ex: R$ 100,00)
2. Digite motivo (ex: "Teste")
3. ✅ Botão deve ficar habilitado e permitir confirmar

## 🗄️ Verificar no Banco de Dados

### Consultar sangrias criadas:

```sql
SELECT * FROM sangrias ORDER BY data_sangria DESC;
```

### Consultar com detalhes (usando a view):

```sql
SELECT * FROM vw_sangrias_detalhado;
```

### Verificar total de sangrias de um caixa:

```sql
SELECT get_total_sangrias_caixa(1); -- Substitua 1 pelo ID do caixa
```

## 📊 Verificar Logs

As sangrias devem ser registradas automaticamente no sistema de logs:

1. Acesse a página de **Logs**
2. Filtre por módulo: **"Caixa"**
3. Procure por registros de INSERT na tabela **"sangrias"**
4. ✅ Deve mostrar:
   - Usuário que fez
   - Valor da sangria
   - Motivo
   - Timestamp

## 🔒 Testar Permissões (RLS)

### Teste de Loja Específica:

Se o usuário tem permissão apenas para uma loja específica:

1. Faça login com esse usuário
2. Tente fazer sangria em um caixa da loja dele
3. ✅ Deve funcionar
4. Tente ver sangrias de outras lojas
5. ✅ Não deve aparecer

### Teste de Admin:

Se o usuário é admin (loja_id = null):

1. ✅ Deve ver sangrias de todas as lojas
2. ✅ Deve poder fazer sangria em qualquer caixa

## 🐛 Problemas Comuns e Soluções

### ❌ Erro: "Sangria não foi salva"

**Solução:** Verifique se:

- Tabela `sangrias` existe no banco
- Políticas RLS estão ativas
- Usuário tem permissão na loja

### ❌ Sangrias não aparecem

**Solução:**

- Verifique se o caixa está correto
- Confirme se a data está sendo filtrada corretamente
- Verifique logs do console do navegador

### ❌ PDF não mostra sangrias

**Solução:**

- Verifique se as sangrias estão sendo passadas para o gerador de PDF
- Confirme se `getSangriasDoCaixa()` retorna dados

## ✨ Cenários de Teste Completos

### Cenário 1: Depósito Bancário

```
Valor: R$ 1.000,00
Motivo: Depósito bancário - Banco do Brasil - Agência 1234
```

### Cenário 2: Pagamento a Fornecedor

```
Valor: R$ 500,00
Motivo: Pagamento fornecedor XYZ - NF 12345
```

### Cenário 3: Troco

```
Valor: R$ 200,00
Motivo: Troco para caixa 2
```

### Cenário 4: Múltiplas Sangrias

1. Faça 3 sangrias no mesmo caixa
2. Verifique se todas aparecem na lista
3. Confirme se o total está correto
4. Gere o PDF e veja todas listadas

## ✅ Checklist Final

- [ ] Sangria salva no banco
- [ ] Toast de sucesso aparece
- [ ] Sangria aparece no modal de detalhes
- [ ] Total de sangrias calculado corretamente
- [ ] Sangria aparece no PDF do caixa
- [ ] Sangria aparece no PDF do histórico
- [ ] Logs registrados corretamente
- [ ] Validações funcionando
- [ ] RLS respeitando permissões
- [ ] Interface responsiva e bonita

## 🎉 Sucesso!

Se todos os itens acima funcionarem, o sistema de sangria está **100% operacional**! 🚀

---

**Dúvidas ou problemas?** Verifique:

1. Console do navegador (F12)
2. Logs do Supabase
3. Tabela `logs` no banco de dados
