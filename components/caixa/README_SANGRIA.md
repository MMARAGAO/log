# Sistema de Sangria do Caixa

## Visão Geral

O sistema de sangria permite registrar retiradas de dinheiro do caixa durante o expediente, mantendo um controle detalhado de todas as movimentações.

## Funcionalidades Implementadas

### 1. Registro de Sangria

- **Botão "Sangria"** no card do caixa aberto
- **Modal de Sangria** com campos:
  - Valor da sangria (R$)
  - Motivo/observações (obrigatório)
- Validação de campos obrigatórios
- Registro automático de data/hora e usuário

### 2. Visualização de Sangrias

#### Modal de Detalhes do Caixa

- Seção dedicada "💸 Sangrias Realizadas"
- Lista de todas as sangrias do caixa
- Para cada sangria exibe:
  - Motivo
  - Data e hora
  - Valor (em vermelho com sinal negativo)
- Total de sangrias realizado

#### PDF do Caixa

- Seção "[$] Sangrias Realizadas"
- Tabela com colunas:
  - Data/Hora
  - Motivo
  - Valor
- Total de sangrias em destaque
- Incluso tanto no PDF do caixa aberto quanto no histórico

### 3. Banco de Dados

#### Tabela `sangrias`

```sql
CREATE TABLE sangrias (
  id SERIAL PRIMARY KEY,
  caixa_id INTEGER NOT NULL REFERENCES caixa(id),
  valor NUMERIC(10,2) NOT NULL,
  motivo TEXT NOT NULL,
  data_sangria TIMESTAMP NOT NULL,
  usuario_id UUID REFERENCES usuarios(uuid),
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Índices Recomendados

```sql
CREATE INDEX idx_sangrias_caixa_id ON sangrias(caixa_id);
CREATE INDEX idx_sangrias_data ON sangrias(data_sangria);
```

### 4. Logs Automáticos

As sangrias são registradas automaticamente no sistema de logs através do `insertTable()`, incluindo:

- Usuário que realizou
- Valor
- Motivo
- Caixa vinculado
- Timestamp

## Arquivos Modificados/Criados

### Novos Componentes

- `components/caixa/SangriaModal.tsx` - Modal para registrar sangrias

### Componentes Modificados

- `components/caixa/types.ts` - Adicionadas interfaces `Sangria` e `FormSangria`
- `components/caixa/CaixaAbertoCard.tsx` - Adicionado botão "Sangria"
- `components/caixa/DetalhesCaixaModal.tsx` - Seção de sangrias
- `components/caixa/CaixaPDFGenerator.tsx` - Seção de sangrias no PDF

### Página Principal

- `app/sistema/caixa/page.tsx` - Lógica de sangrias:
  - Estado `sangriasPorCaixa`
  - Estado `modalSangria` e `formSangria`
  - Função `loadAllSangrias()`
  - Função `handleSangria()`
  - Função `getSangriasDoCaixa()`
  - Atualizado `handleGerarPDFHistorico()` para incluir sangrias

## Fluxo de Uso

1. **Registrar Sangria**

   - Usuário clica no botão "Sangria" no card do caixa aberto
   - Preenche o valor e motivo no modal
   - Sistema valida e salva no banco
   - Toast de sucesso é exibido
   - Lista de sangrias é atualizada

2. **Visualizar Sangrias**

   - No modal de detalhes do caixa
   - No PDF exportado
   - Em ambos os casos, mostra lista completa e total

3. **Logs**
   - Todas as sangrias ficam registradas na tabela `logs`
   - Possível auditar quem, quando e quanto foi retirado

## Validações

- Valor deve ser maior que zero
- Motivo é obrigatório (não pode ser vazio)
- Sangria só pode ser feita em caixa aberto
- Usuário deve estar autenticado

## Benefícios

- ✅ Controle preciso de retiradas de dinheiro
- ✅ Histórico completo de movimentações
- ✅ Rastreabilidade (quem, quando, quanto, por quê)
- ✅ Integração com PDF para relatórios
- ✅ Logs automáticos para auditoria
- ✅ Interface intuitiva e validações robustas

## Próximas Melhorias (Opcional)

- [ ] Relatório consolidado de sangrias por período
- [ ] Gráficos de sangrias por motivo
- [ ] Exportação de sangrias para Excel
- [ ] Limite de valor por sangria (configurável)
- [ ] Aprovação de sangrias acima de certo valor
- [ ] Dashboard com total de sangrias do dia/mês

## Exemplos de Uso

### Cenários Comuns

- Pagamento de fornecedor em dinheiro
- Troco para outro caixa
- Depósito bancário
- Pagamento de despesas operacionais
- Compra de mercadorias em espécie

### Motivos Sugeridos

- "Depósito bancário - Banco do Brasil"
- "Pagamento fornecedor XYZ"
- "Troco para caixa 2"
- "Despesas operacionais - conta de luz"
- "Compra de mercadorias"
