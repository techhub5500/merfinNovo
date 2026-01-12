/**
 * INICIALIZADOR DO MRM (Merfin Rich Markup)
 * 
 * Registra todos os componentes e substitui a função renderMarkdown
 * Usar este arquivo após carregar todos os componentes
 */

(function() {
    console.log('🚀 Inicializando MRM...');
    
    // Verificar dependências
    if (typeof MRMParser === 'undefined') {
        console.error('❌ MRMParser não encontrado! Certifique-se de carregar mrm-parser.js primeiro.');
        return;
    }
    
    // Criar instância global do parser
    window.mrmParser = new MRMParser();
    
    // Registrar componentes disponíveis
    const componentsToRegister = [
        { name: 'chart', class: 'ChartComponent' },
        { name: 'card', class: 'CardComponent' },
        { name: 'progress', class: 'ProgressComponent' }
        // Adicionar mais componentes aqui conforme implementar
    ];
    
    componentsToRegister.forEach(({ name, class: className }) => {
        if (typeof window[className] !== 'undefined') {
            const instance = new window[className]();
            window.mrmParser.registerComponent(name, instance);
        } else {
            console.warn(`⚠️ Componente ${className} não encontrado, pulando registro de ${name}`);
        }
    });
    
    // Substituir função global renderMarkdown para usar MRM
    if (typeof window.renderMarkdown !== 'undefined') {
        console.log('📝 Substituindo renderMarkdown() pelo MRM Parser');
        
        // Backup da função original
        window.renderMarkdownOriginal = window.renderMarkdown;
        
        // Nova função que usa MRM
        window.renderMarkdown = function(text) {
            try {
                return window.mrmParser.parse(text);
            } catch (error) {
                console.error('❌ Erro no MRM, usando fallback:', error);
                return window.renderMarkdownOriginal ? window.renderMarkdownOriginal(text) : text;
            }
        };
    } else {
        // Criar função renderMarkdown se não existir
        window.renderMarkdown = function(text) {
            return window.mrmParser.parse(text);
        };
    }
    
    console.log('✅ MRM inicializado com sucesso!');
    console.log('📦 Componentes registrados:', Array.from(window.mrmParser.components.keys()).join(', '));
    
    // Adicionar CSS dos componentes se não existir
    if (!document.getElementById('mrm-base-styles')) {
        const style = document.createElement('style');
        style.id = 'mrm-base-styles';
        style.textContent = `
            /* Base Styles for MRM Components */
            .mrm-content {
                width: 100%;
            }
            
            .mrm-error {
                padding: 12px 16px;
                background: rgba(231, 76, 60, 0.1);
                border-left: 4px solid #e74c3c;
                border-radius: 4px;
                color: #e74c3c;
                font-family: 'Poppins', sans-serif;
                font-size: 14px;
                margin: 12px 0;
            }
            
            .mrm-chart-container {
                margin: 20px 0;
                padding: 16px;
                background: rgba(255, 255, 255, 0.02);
                border-radius: 12px;
                border: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            .mrm-chart-title {
                margin: 0 0 16px 0;
                font-family: 'Poppins', sans-serif;
                font-size: 16px;
                font-weight: 600;
                color: var(--color-text-primary, #fff);
            }
            
            .mrm-chart-wrapper {
                position: relative;
                width: 100%;
                min-height: 300px;
            }
            
            /* Animações suaves */
            .mrm-card,
            .mrm-progress-container,
            .mrm-chart-container {
                animation: fadeInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            }
            
            @keyframes fadeInUp {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            /* Responsividade */
            @media (max-width: 600px) {
                .mrm-chart-wrapper {
                    min-height: 200px;
                }
                
                .mrm-card,
                .mrm-progress-container {
                    padding: 12px 14px;
                }
            }
        `;
        document.head.appendChild(style);
        console.log('🎨 Estilos base do MRM adicionados');
    }
    
    // Adicionar método helper global para testar MRM
    window.testMRM = function() {
        const testText = `
# Teste do MRM

Este é um teste do **Merfin Rich Markup**.

@card[tipo=sucesso,icone=✓]
**Sistema carregado com sucesso!**
Todos os componentes estão funcionando corretamente.
@/card

@progress[valor=7500,meta=10000,label=Meta de Testes]

## Markdown Normal

Você também pode usar *markdown* normal junto com os componentes especiais.

- Item 1
- Item 2
- Item 3
        `;
        
        const result = window.mrmParser.parse(testText);
        console.log('🧪 Resultado do teste:', result);
        return result;
    };
    
    console.log('💡 Dica: Execute testMRM() no console para ver o sistema em ação!');
    
})();
