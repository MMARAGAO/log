# IMEIScannerModal

Componente modal para leitura de IMEI usando câmera com suporte a OCR e leitura de código de barras.

## Funcionalidades

- 📝 **Modo OCR**: Leitura de números IMEI usando Tesseract.js
- 📊 **Modo Código de Barras**: Leitura automática de códigos de barras usando ZXing
- 📷 **Controle de Câmera**: Ativação e gerenciamento de permissões de câmera
- ✨ **Interface Moderna**: Design responsivo com feedback visual em tempo real
- 🔍 **Validação Automática**: Verifica se o código lido possui 15 dígitos

## Uso

```tsx
import { IMEIScannerModal } from "@/components/aparelhos";

function MeuComponente() {
  const [isOpen, setIsOpen] = useState(false);

  const handleIMEIDetected = (imei: string) => {
    console.log("IMEI detectado:", imei);
    // Processar IMEI aqui
  };

  return (
    <>
      <Button onPress={() => setIsOpen(true)}>Escanear IMEI</Button>

      <IMEIScannerModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onIMEIDetected={handleIMEIDetected}
      />
    </>
  );
}
```

## Props

| Prop             | Tipo                     | Descrição                                   |
| ---------------- | ------------------------ | ------------------------------------------- |
| `isOpen`         | `boolean`                | Controla a visibilidade do modal            |
| `onClose`        | `() => void`             | Callback chamado ao fechar o modal          |
| `onIMEIDetected` | `(imei: string) => void` | Callback chamado quando um IMEI é detectado |

## Dependências

- `tesseract.js` - Para OCR de números
- `@zxing/browser` - Para leitura de códigos de barras
- `@heroui/react` - Componentes de UI
- `react-hot-toast` - Notificações

## Modos de Leitura

### Modo OCR

- Captura imagem da câmera
- Processa com Tesseract.js
- Extrai sequências de 15 dígitos
- Ideal para IMEIs impressos em etiquetas

### Modo Código de Barras

- Leitura contínua automática
- Foca na área retangular central
- Filtra apenas códigos com 15 dígitos
- Ideal para códigos de barras pequenos

## Dicas de Uso

- **Para códigos pequenos**: Aproxime BEM a câmera (5-10cm)
- **Iluminação**: Use boa iluminação para melhor leitura
- **Foco**: Aguarde a imagem ficar nítida antes de capturar
- **Limpeza**: Mantenha a lente da câmera limpa

## Fluxo de Funcionamento

1. Usuário abre o modal
2. Clica em "Ativar Câmera"
3. Permite acesso à câmera no navegador
4. Escolhe modo de leitura (OCR ou Barcode)
5. Posiciona o IMEI na área indicada
6. Clica no botão de captura (ou aguarda detecção automática)
7. IMEI é detectado e validado
8. Callback `onIMEIDetected` é chamado
9. Modal fecha automaticamente

## Tratamento de Erros

O componente trata diversos tipos de erros:

- **NotAllowedError**: Permissão de câmera negada
- **NotFoundError**: Nenhuma câmera encontrada
- **OverconstrainedError**: Resolução não suportada
- **NotSupportedError**: Câmera não suportada no navegador

## Personalização

O componente usa classes Tailwind e pode ser personalizado através do tema do projeto.

### Cores do Status

- 🟢 **Verde (Success)**: Câmera ativa
- 🟡 **Amarelo (Warning)**: Câmera inativa
- 🔴 **Vermelho (Danger)**: Erro

## Performance

- **OCR**: ~2-3 segundos para processar
- **Barcode**: Detecção em tempo real (<1 segundo)
- **Tamanho do bundle**: ~500KB (com dependências)

## Compatibilidade

- ✅ Chrome/Edge (recomendado)
- ✅ Firefox
- ✅ Safari (iOS 11+)
- ⚠️ Requer HTTPS para acesso à câmera

## Licença

Este componente faz parte do sistema de gestão de aparelhos.
