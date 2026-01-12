/**
 * COMPONENTE: PROGRESS (Barras de Progresso)
 * 
 * Renderiza barras de progresso para metas
 * Sintaxe: @progress[valor=7500,meta=10000,label=Fundo de Emergência]
 */

class ProgressComponent {
    render(block) {
        const attrs = block.attributes;
        
        const valor = parseFloat(attrs.valor || 0);
        const meta = parseFloat(attrs.meta || 100);
        const label = attrs.label || 'Progresso';
        const showValues = attrs.mostrarValores !== false;
        
        // Calcular percentual
        const percentual = Math.min(Math.round((valor / meta) * 100), 100);
        
        // Determinar cor baseado no progresso
        let barColor = '#e74c3c'; // vermelho
        if (percentual >= 75) {
            barColor = '#27ae60'; // verde
        } else if (percentual >= 50) {
            barColor = '#f39c12'; // laranja
        } else if (percentual >= 25) {
            barColor = '#3498db'; // azul
        }
        
        // Formatar valores como moeda
        const formatarMoeda = (v) => {
            return new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            }).format(v);
        };
        
        const html = `
            <div class="mrm-progress-container" style="
                margin: 20px 0;
                padding: 16px;
                background: rgba(255, 255, 255, 0.03);
                border-radius: 10px;
                border: 1px solid rgba(255, 255, 255, 0.1);
            ">
                <div class="mrm-progress-header" style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 10px;
                ">
                    <span class="mrm-progress-label" style="
                        font-weight: 600;
                        color: var(--color-text-primary, #fff);
                        font-size: 14px;
                    ">${label}</span>
                    <span class="mrm-progress-percentage" style="
                        font-weight: 700;
                        color: ${barColor};
                        font-size: 16px;
                    ">${percentual}%</span>
                </div>
                
                <div class="mrm-progress-bar-container" style="
                    width: 100%;
                    height: 24px;
                    background: rgba(0, 0, 0, 0.3);
                    border-radius: 12px;
                    overflow: hidden;
                    position: relative;
                    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
                ">
                    <div class="mrm-progress-bar" style="
                        height: 100%;
                        width: ${percentual}%;
                        background: linear-gradient(90deg, ${barColor} 0%, ${this.lightenColor(barColor)} 100%);
                        border-radius: 12px;
                        transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
                        position: relative;
                        overflow: hidden;
                    ">
                        <div style="
                            position: absolute;
                            top: 0;
                            left: 0;
                            right: 0;
                            bottom: 0;
                            background: linear-gradient(90deg, 
                                transparent 0%, 
                                rgba(255, 255, 255, 0.2) 50%, 
                                transparent 100%);
                            animation: shimmer 2s infinite;
                        "></div>
                    </div>
                </div>
                
                ${showValues ? `
                    <div class="mrm-progress-values" style="
                        display: flex;
                        justify-content: space-between;
                        margin-top: 8px;
                        font-size: 12px;
                        color: var(--color-text-secondary, #a0a0a0);
                    ">
                        <span>Atual: <strong style="color: var(--color-text-primary, #fff);">${formatarMoeda(valor)}</strong></span>
                        <span>Meta: <strong style="color: var(--color-text-primary, #fff);">${formatarMoeda(meta)}</strong></span>
                    </div>
                ` : ''}
            </div>
        `;
        
        // Adicionar animação shimmer se ainda não existir
        this.addShimmerAnimation();
        
        return html;
    }
    
    /**
     * Clareia uma cor hex
     */
    lightenColor(hex) {
        // Converter hex para RGB
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        
        // Clarear 20%
        const newR = Math.min(255, Math.round(r + (255 - r) * 0.2));
        const newG = Math.min(255, Math.round(g + (255 - g) * 0.2));
        const newB = Math.min(255, Math.round(b + (255 - b) * 0.2));
        
        return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
    }
    
    /**
     * Adiciona animação CSS shimmer
     */
    addShimmerAnimation() {
        if (document.getElementById('mrm-progress-animations')) {
            return;
        }
        
        const style = document.createElement('style');
        style.id = 'mrm-progress-animations';
        style.textContent = `
            @keyframes shimmer {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
            }
        `;
        document.head.appendChild(style);
    }
}

// Exportar
if (typeof window !== 'undefined') {
    window.ProgressComponent = ProgressComponent;
}
