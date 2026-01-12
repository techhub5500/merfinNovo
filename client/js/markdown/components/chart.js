/**
 * COMPONENTE: CHART (Gráficos Interativos)
 * 
 * Renderiza gráficos usando Chart.js
 * Sintaxe: @chart[tipo=line,titulo=Meu Gráfico]{...dados JSON...}@/chart
 */

class ChartComponent {
    constructor() {
        this.chartInstances = new Map();
    }
    
    /**
     * Renderiza o componente de gráfico
     * @param {Object} block - Bloco com dados do gráfico
     * @returns {string} HTML
     */
    render(block) {
        try {
            console.log('📊 ChartComponent.render() chamado');
            console.log('📦 Block recebido:', block);
            console.log('📄 Content:', block.content);
            
            // Parsear dados JSON
            const data = JSON.parse(block.content);
            const attrs = block.attributes;
            
            console.log('✅ JSON parseado:', data);
            console.log('🏷️ Atributos:', attrs);
            
            // Gerar ID único
            const chartId = `chart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            
            console.log('🆔 Chart ID gerado:', chartId);
            
            // Criar HTML container
            const html = `
                <div class="mrm-chart-container" data-chart-id="${chartId}">
                    ${attrs.titulo ? `<h4 class="mrm-chart-title">${attrs.titulo}</h4>` : ''}
                    <div class="mrm-chart-wrapper">
                        <canvas id="${chartId}" width="400" height="200"></canvas>
                    </div>
                </div>
            `;
            
            console.log('📋 HTML gerado:', html);
            
            // Tentar renderizar com retry (máximo 10 tentativas em 5 segundos)
            this.renderChartWithRetry(chartId, attrs, data, 0);
            
            return html;
            
        } catch (error) {
            console.error('❌ Erro ao renderizar chart:', error);
            console.error('Stack:', error.stack);
            return `<div class="mrm-error">Erro ao renderizar gráfico: ${error.message}</div>`;
        }
    }
    
    /**
     * Tenta renderizar o gráfico com retry
     */
    renderChartWithRetry(chartId, attrs, data, attempt) {
        const maxAttempts = 30; // Aumentado para 30 tentativas (15 segundos)
        const retryDelay = 500; // 500ms entre tentativas
        
        console.log(`🔄 Tentativa ${attempt + 1}/${maxAttempts} de renderizar: ${chartId}`);
        
        const ctx = document.getElementById(chartId);
        const container = document.querySelector(`[data-chart-id="${chartId}"]`);
        
        console.log(`   Canvas encontrado: ${!!ctx}`);
        console.log(`   Container encontrado: ${!!container}`);
        
        if (!ctx) {
            if (attempt < maxAttempts - 1) {
                console.log(`⏳ Canvas não encontrado, tentando novamente em ${retryDelay}ms...`);
                setTimeout(() => {
                    this.renderChartWithRetry(chartId, attrs, data, attempt + 1);
                }, retryDelay);
            } else {
                console.error(`❌ Canvas não encontrado após ${maxAttempts} tentativas (${maxAttempts * retryDelay / 1000}s): ${chartId}`);
                console.error(`   Isso significa que o HTML nunca foi inserido no DOM pela função addBotMessageTyping()`);
            }
            return;
        }
        
        // Canvas encontrado, renderizar
        console.log(`✅ Canvas encontrado na tentativa ${attempt + 1}!`);
        this.renderChart(chartId, attrs, data);
    }
    
    /**
     * Renderiza o gráfico no canvas
     */
    renderChart(chartId, attrs, data) {
        const ctx = document.getElementById(chartId);
        
        if (!ctx) {
            console.error(`❌ Canvas não encontrado: ${chartId}`);
            return;
        }
        
        // Verificar se Chart.js está disponível
        if (typeof Chart === 'undefined') {
            console.error('❌ Chart.js não está carregado');
            ctx.parentElement.innerHTML = '<p class="mrm-error">Chart.js não disponível</p>';
            return;
        }
        
        console.log('✅ Chart.js disponível, iniciando renderização...');
        
        try {
            const chartType = attrs.tipo || 'line';
            
            console.log('🎯 Tipo de gráfico:', chartType);
            console.log('📊 Dados completos:', JSON.stringify(data, null, 2));
            
            // Configurações padrão
            const config = {
                type: chartType,
                data: data,
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    aspectRatio: 2,
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top',
                            labels: {
                                color: '#fff',
                                font: {
                                    family: 'Poppins',
                                    size: 12
                                },
                                usePointStyle: true,
                                padding: 15
                            }
                        },
                        tooltip: {
                            enabled: true,
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            titleColor: '#fff',
                            bodyColor: '#fff',
                            borderColor: 'rgba(255, 255, 255, 0.2)',
                            borderWidth: 1,
                            padding: 12,
                            displayColors: true,
                            callbacks: {
                                label: function(context) {
                                    let label = context.dataset.label || '';
                                    if (label) {
                                        label += ': ';
                                    }
                                    
                                    const value = context.parsed.y || context.parsed;
                                    
                                    // Formatar como moeda se for valor financeiro
                                    if (attrs.formato === 'moeda') {
                                        label += new Intl.NumberFormat('pt-BR', {
                                            style: 'currency',
                                            currency: 'BRL'
                                        }).format(value);
                                    } else {
                                        label += value;
                                    }
                                    
                                    return label;
                                }
                            }
                        }
                    },
                    scales: this.getScalesConfig(chartType, attrs)
                }
            };
            
            console.log('⚙️ Config do Chart.js:', JSON.stringify(config, null, 2));
            
            // Criar gráfico
            console.log('🚀 Criando instância do Chart...');
            const chart = new Chart(ctx, config);
            
            console.log('✅ Instância criada:', chart);
            
            // Armazenar instância
            this.chartInstances.set(chartId, chart);
            
            console.log(`🎉 Gráfico renderizado com sucesso: ${chartId} (${chartType})`);
            
        } catch (error) {
            console.error('❌ Erro ao criar gráfico:', error);
            console.error('❌ Stack completo:', error.stack);
            ctx.parentElement.innerHTML = `<p class="mrm-error">Erro ao criar gráfico: ${error.message}</p>`;
        }
    }
    
    /**
     * Retorna configuração de escalas baseado no tipo
     */
    getScalesConfig(chartType, attrs) {
        // Gráficos que não usam escalas
        if (['pie', 'doughnut', 'polarArea'].includes(chartType)) {
            return {};
        }
        
        const config = {
            x: {
                ticks: {
                    color: '#a0a0a0',
                    font: {
                        family: 'Poppins',
                        size: 11
                    }
                },
                grid: {
                    color: 'rgba(255, 255, 255, 0.05)',
                    drawBorder: false
                }
            },
            y: {
                ticks: {
                    color: '#a0a0a0',
                    font: {
                        family: 'Poppins',
                        size: 11
                    },
                    callback: function(value) {
                        // Formatar como moeda se especificado
                        if (attrs.formato === 'moeda') {
                            return new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                                minimumFractionDigits: 0
                            }).format(value);
                        }
                        return value;
                    }
                },
                grid: {
                    color: 'rgba(255, 255, 255, 0.05)',
                    drawBorder: false
                },
                beginAtZero: true
            }
        };
        
        return config;
    }
    
    /**
     * Destroi um gráfico
     */
    destroy(chartId) {
        const chart = this.chartInstances.get(chartId);
        if (chart) {
            chart.destroy();
            this.chartInstances.delete(chartId);
            console.log(`🗑️ Gráfico destruído: ${chartId}`);
        }
    }
    
    /**
     * Destroi todos os gráficos
     */
    destroyAll() {
        this.chartInstances.forEach((chart, id) => {
            chart.destroy();
        });
        this.chartInstances.clear();
        console.log('🗑️ Todos os gráficos destruídos');
    }
}

// Exportar
if (typeof window !== 'undefined') {
    window.ChartComponent = ChartComponent;
}
