# 🐛 GUIA DE DEPURAÇÃO MRM

## O que foi adicionado

Adicionei logs detalhados em todo o sistema MRM para identificar onde o problema está ocorrendo.

---

## Como usar

### 1️⃣ Abra o Console do Navegador
- Pressione **F12**
- Clique na aba **Console**

### 2️⃣ Limpe o console
```javascript
clear();
```

### 3️⃣ Envie a mensagem no chat
**Exemplo:** "Coloque em um gráfico quanto gastei nos últimos 2 meses"

### 4️⃣ Observe os logs

Você verá uma sequência de logs como esta:

```
🔍 MRM Parser iniciando...
📝 Texto recebido (primeiros 200 chars): ...
📦 N blocos extraídos: [...]
🔨 Processando bloco 1/N: markdown
🔨 Processando bloco 2/N: chart
📊 ChartComponent.render() chamado
📦 Block recebido: {...}
📄 Content: {...}
✅ JSON parseado: {...}
🏷️ Atributos: {...}
🆔 Chart ID gerado: chart-...
📋 HTML gerado: <div class="mrm-chart-container">...
⏰ Timeout executado, tentando renderizar chart: chart-...
🎨 renderChart() chamado para: chart-...
✅ Canvas encontrado: <canvas id="chart-...">
✅ Chart.js disponível, versão: 4.4.0
🎯 Tipo de gráfico: bar
📊 Dados completos: {...}
⚙️ Config do Chart.js: {...}
🚀 Criando instância do Chart...
✅ Instância criada: Chart {...}
🎉 Gráfico renderizado com sucesso: chart-... (bar)
```

---

## 🔴 Possíveis Erros e Soluções

### ERRO 1: "❌ Canvas não encontrado no DOM"
**Causa:** O HTML não foi inserido no DOM antes do timeout  
**Solução:** Timeout já aumentado para 500ms

### ERRO 2: "❌ Chart.js não está carregado"
**Causa:** CDN do Chart.js não carregou  
**Solução:** 
1. Verificar Network (F12 > Network)
2. Procurar por `chart.js` - deve estar 200 OK
3. Se falhar, adicionar manualmente:
```html
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
```

### ERRO 3: "❌ Erro ao parsear JSON"
**Causa:** A IA retornou JSON inválido  
**Solução:** Verificar o que a IA realmente retornou

### ERRO 4: Nenhum log aparece
**Causa:** MRM não está sendo carregado  
**Solução:** Verificar se os scripts estão no HTML:
```html
<script src="../js/markdown/mrm-parser.js"></script>
<script src="../js/markdown/components/chart.js"></script>
<script src="../js/markdown/mrm-init.js"></script>
```

---

## 📋 Checklist de Depuração

Execute no console:

```javascript
// 1. Verificar se MRM está carregado
console.log('MRM Parser:', window.mrmParser);

// 2. Verificar componentes registrados
console.log('Componentes:', Array.from(window.mrmParser.components.keys()));

// 3. Verificar Chart.js
console.log('Chart.js:', typeof Chart !== 'undefined' ? Chart.version : 'NÃO CARREGADO');

// 4. Verificar renderMarkdown
console.log('renderMarkdown:', typeof window.renderMarkdown);

// 5. Testar MRM manualmente
const teste = `
@chart[tipo=bar,titulo=Teste Manual]
{
  "labels": ["A", "B", "C"],
  "datasets": [{
    "label": "Dados",
    "data": [10, 20, 15],
    "backgroundColor": "#ff6b9d"
  }]
}
@/chart
`;

const resultado = window.renderMarkdown(teste);
console.log('Resultado:', resultado);

// 6. Inserir no DOM para testar
const messagesDiv = document.getElementById('messages');
if (messagesDiv) {
    const div = document.createElement('div');
    div.className = 'message bot';
    div.innerHTML = resultado;
    messagesDiv.appendChild(div);
    console.log('✅ Mensagem de teste inserida no chat');
}
```

---

## 🎯 O que esperar

Se tudo estiver funcionando:

1. **Logs no console:** Toda a sequência de 🔍 → 📊 → 🎉
2. **No chat:** Área do gráfico aparece
3. **Gráfico visível:** Barras/linhas renderizadas
4. **Interativo:** Hover mostra valores

---

## 📸 Informações para me enviar

Se ainda não funcionar, me envie:

1. **Print do console** com todos os logs
2. **Print do Network** (F12 > Network) mostrando `chart.js`
3. **Resposta exata da IA** (copie o texto completo)
4. **Print da área do gráfico** no chat

---

## 🔧 Teste Rápido

Cole isso no console para testar imediatamente:

```javascript
// Teste completo
(function() {
    console.log('=== TESTE MRM ===');
    
    // 1. Verificações
    console.log('✓ MRM Parser:', !!window.mrmParser);
    console.log('✓ Chart.js:', typeof Chart !== 'undefined');
    console.log('✓ renderMarkdown:', typeof window.renderMarkdown);
    console.log('✓ Componentes:', window.mrmParser ? Array.from(window.mrmParser.components.keys()) : 'N/A');
    
    // 2. Teste de renderização
    const textoTeste = `
@chart[tipo=bar,titulo=Teste de Depuração,formato=moeda]
{
  "labels": ["Dezembro", "Janeiro"],
  "datasets": [{
    "label": "Gastos",
    "data": [4310, 3700],
    "backgroundColor": "#ff6b9d"
  }]
}
@/chart

**Teste completo do sistema MRM**
    `;
    
    console.log('Renderizando teste...');
    const html = window.renderMarkdown(textoTeste);
    console.log('HTML gerado:', html.substring(0, 200) + '...');
    
    // 3. Inserir no chat
    const messages = document.getElementById('messages');
    if (messages) {
        const div = document.createElement('div');
        div.className = 'message bot';
        div.innerHTML = html;
        messages.appendChild(div);
        messages.scrollTop = messages.scrollHeight;
        console.log('✅ Mensagem de teste inserida! Aguarde 500ms...');
        
        setTimeout(() => {
            console.log('=== VERIFICAÇÃO FINAL ===');
            const canvas = div.querySelector('canvas');
            console.log('Canvas encontrado?', !!canvas);
            if (canvas) {
                console.log('Canvas ID:', canvas.id);
                console.log('Canvas width:', canvas.width);
                console.log('Canvas height:', canvas.height);
            }
        }, 1000);
    } else {
        console.error('❌ Elemento #messages não encontrado');
    }
})();
```

---

## ✅ Status Esperado

Após o teste, você deve ver:

```
=== TESTE MRM ===
✓ MRM Parser: true
✓ Chart.js: true
✓ renderMarkdown: function
✓ Componentes: ["chart", "card", "progress"]
Renderizando teste...
HTML gerado: <div class="mrm-content">...
✅ Mensagem de teste inserida! Aguarde 500ms...
[... logs do MRM ...]
=== VERIFICAÇÃO FINAL ===
Canvas encontrado? true
Canvas ID: chart-xxxxx
Canvas width: 400
Canvas height: 200
```

Se qualquer ✓ estiver `false`, identifiquei o problema!
