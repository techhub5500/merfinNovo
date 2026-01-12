/**
 * COMPONENTE: CARD (Cards Informativos)
 * 
 * Renderiza cards destacados com ícones e cores
 * Sintaxe: @card[tipo=sucesso,icone=✓]Conteúdo do card@/card
 * 
 * Tipos: sucesso, alerta, erro, info, neutro
 */

class CardComponent {
    constructor() {
        this.types = {
            sucesso: {
                color: '#27ae60',
                bgColor: 'rgba(39, 174, 96, 0.1)',
                borderColor: 'rgba(39, 174, 96, 0.3)',
                icon: '✓'
            },
            alerta: {
                color: '#f39c12',
                bgColor: 'rgba(243, 156, 18, 0.1)',
                borderColor: 'rgba(243, 156, 18, 0.3)',
                icon: '⚠'
            },
            erro: {
                color: '#e74c3c',
                bgColor: 'rgba(231, 76, 60, 0.1)',
                borderColor: 'rgba(231, 76, 60, 0.3)',
                icon: '✕'
            },
            info: {
                color: '#3498db',
                bgColor: 'rgba(52, 152, 219, 0.1)',
                borderColor: 'rgba(52, 152, 219, 0.3)',
                icon: 'ℹ'
            },
            neutro: {
                color: '#95a5a6',
                bgColor: 'rgba(149, 165, 166, 0.1)',
                borderColor: 'rgba(149, 165, 166, 0.3)',
                icon: '●'
            }
        };
    }
    
    render(block) {
        const attrs = block.attributes;
        const tipo = attrs.tipo || 'neutro';
        const config = this.types[tipo] || this.types.neutro;
        
        // Usar ícone customizado ou padrão
        const icon = attrs.icone || config.icon;
        
        // Processar conteúdo com markdown
        let content = block.content;
        if (typeof marked !== 'undefined') {
            try {
                content = marked.parse(content);
            } catch (e) {
                console.warn('Erro ao processar markdown no card:', e);
            }
        }
        
        const html = `
            <div class="mrm-card mrm-card-${tipo}" style="
                background: ${config.bgColor};
                border-left: 4px solid ${config.borderColor};
                padding: 16px 20px;
                border-radius: 8px;
                margin: 16px 0;
                display: flex;
                gap: 12px;
                align-items: flex-start;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            ">
                <div class="mrm-card-icon" style="
                    font-size: 24px;
                    color: ${config.color};
                    flex-shrink: 0;
                    line-height: 1;
                ">${icon}</div>
                <div class="mrm-card-content" style="
                    flex: 1;
                    color: var(--color-text-primary, #fff);
                    line-height: 1.6;
                ">
                    ${content}
                </div>
            </div>
        `;
        
        return html;
    }
}

// Exportar
if (typeof window !== 'undefined') {
    window.CardComponent = CardComponent;
}
