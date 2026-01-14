/**
 * PLANEJADOR FINANCEIRO - LÓGICA FRONTEND
 * Sistema interativo de planejamento financeiro com IA
 */

class PlanejadorFinanceiro {
    constructor() {
        this.ativo = false;
        this.objetivo = '';
        this.perguntas = [];
        this.respostas = {};
        this.planejamentoAtual = null;
        this.contexto = {
            tipo: '',
            objetivo: '',
            perguntas: [],
            respostas: [],
            etapa: 'inicial' // inicial, coletando_dados, analisando, completo
        };
    }

    // Inicializar planejador
    init() {
        console.log('🎯 Inicializando Planejador Financeiro...');
        this.criarCardInicial();
        this.observarMudancasNoChat();
    }

    // Criar card de entrada no chat
    criarCardInicial() {
        // Verificar se já existe card
        if (document.getElementById('planner-entry-card')) return;

        const card = document.createElement('div');
        card.id = 'planner-entry-card';
        card.className = 'planner-card';
        card.innerHTML = `
            <div class="card-financeiro">
                <header class="card-header">
                    <span class="header-title">PLANEJAMENTO FINANCEIRO</span>
                    <div class="header-icon">
                        <i class="fa-solid fa-bullseye"></i>
                    </div>
                </header>

                <main class="card-content">
                    
                    
                    <div class="objetivos-lista">
                        <div class="objetivo-item">
                            <div class="icon-container">
                                <i class="fa-solid fa-plane"></i>
                            </div>
                            <div class="objetivo-info">
                                <div class="objetivo-topo">
                                    <span>Planeje suas viagens</span>
                                </div>
                            </div>
                        </div>

                        <div class="objetivo-item">
                            <div class="icon-container">
                                <i class="fa-solid fa-house"></i>
                            </div>
                            <div class="objetivo-info">
                                <div class="objetivo-topo">
                                    <span>Planeje a entrada do apê</span>
                                </div>
                            </div>
                        </div>

                        <div class="objetivo-item">
                            <div class="icon-container">
                                <i class="fa-solid fa-car"></i>
                            </div>
                            <div class="objetivo-info">
                                <div class="objetivo-topo">
                                    <span>planeje a troca do carro</span>
                                </div>
                            </div>
                        </div>

                        <!-- CTA button placed as a grid item but not wrapped as a card -->
                        <button class="btn-gerenciar objetivo-cta-button">PLANEJAR <i class="fa-solid fa-arrow-right"></i></button>
                    </div>
                </main>

                <footer class="card-footer">
                </footer>
            </div>
        `;
        
        // Inserir no slot dedicado dentro do container de cards
        const plannerSlot = document.getElementById('planner-card-slot');
        if (plannerSlot) {
            plannerSlot.appendChild(card);
        } else {
            // Fallback: inserir no placeholder diretamente
            const placeholder = document.getElementById('chat-placeholder');
            if (placeholder) {
                placeholder.appendChild(card);
            }
        }

        // Vincular ativação do planejador somente ao botão "Começar"
        const btn = card.querySelector('.btn-gerenciar');
        if (btn) {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.ativarPlanejador();
            });
        }
    }

    // Observar mudanças no chat para esconder/mostrar card
    observarMudancasNoChat() {
        const messagesContainer = document.getElementById('messages');
        if (!messagesContainer) return;

        const observer = new MutationObserver(() => {
            const card = document.getElementById('planner-entry-card');
            if (!card) return;

            // Contar mensagens reais (não placeholder, não card)
            const mensagensReais = messagesContainer.querySelectorAll('.message').length;
            
            // Se há mensagens e não está no modo planejador, esconder card
            if (mensagensReais > 0 && !this.ativo) {
                card.style.display = 'none';
            } else if (mensagensReais === 0 && !this.ativo) {
                card.style.display = 'block';
            }
        });

        observer.observe(messagesContainer, { childList: true, subtree: true });
    }

    // Ativar modo planejador
    ativarPlanejador() {
        console.log('🎯 Ativando modo planejador...');
        this.ativo = true;
        this.contexto.etapa = 'inicial';

        // Esconder card de entrada
        const card = document.getElementById('planner-entry-card');
        if (card) card.style.display = 'none';

        // Esconder placeholder
        const placeholder = document.querySelector('.chat-placeholder');
        if (placeholder) {
            placeholder.style.display = 'none';
        }

        // Criar botão de sair
        this.criarBotaoSair();

        // Notificar usuário
        mostrarNotificacao('Modo planejador ativado! Descreva seu objetivo.', 'success');
    }

    // Criar botão de sair simples
    criarBotaoSair() {
        // Verificar se já existe
        if (document.getElementById('planner-exit-btn')) return;

        const btnSair = document.createElement('button');
        btnSair.id = 'planner-exit-btn';
        btnSair.className = 'planner-exit-btn';
        btnSair.innerHTML = '<i class="fas fa-times"></i> Sair do Planejador';
        btnSair.onclick = () => this.sairPlanejador();

        // Adicionar no body (fixo no canto)
        document.body.appendChild(btnSair);
    }

    // Sair do modo planejador
    sairPlanejador() {
        mostrarConfirmacao('Deseja sair do planejador? O progresso será perdido.', (confirmado) => {
            if (!confirmado) return;

            console.log('🚪 Saindo do modo planejador...');
            this.ativo = false;
            this.objetivo = '';
            this.perguntas = [];
            this.respostas = {};
            this.planejamentoAtual = null;
            this.contexto = {
                tipo: '',
                objetivo: '',
                perguntas: [],
                respostas: [],
                etapa: 'inicial'
            };

            // Remover botão de sair
            const btnSair = document.getElementById('planner-exit-btn');
            if (btnSair) btnSair.remove();

            // Mostrar placeholder novamente se não houver mensagens
            const messages = document.getElementById('messages');
            const placeholder = document.querySelector('.chat-placeholder');
            if (messages && messages.children.length === 0 && placeholder) {
                placeholder.style.display = 'flex';
            }

            // Limpar mensagens
            const messagesContainer = document.getElementById('messages');
            if (messagesContainer) {
                messagesContainer.innerHTML = `
                    <div class="chat-placeholder">
                        <div class="placeholder-icon">💬</div>
                        <div class="placeholder-text">Pergunte sobre suas finanças</div>
                        <div class="placeholder-examples">
                            <div class="example">Quanto gastei este mês?</div>
                            <div class="example">Qual meu saldo atual?</div>
                            <div class="example">Analise minhas finanças</div>
                        </div>
                    </div>
                `;
            }

            // Recriar card
            this.criarCardInicial();

            mostrarNotificacao('Planejador encerrado', 'info');
        });
    }

    // Processar primeira mensagem (objetivo)
    async processarObjetivo(mensagem) {
        console.log('🎯 Processando objetivo:', mensagem);
        this.objetivo = mensagem;
        this.contexto.objetivo = mensagem;
        this.contexto.etapa = 'coletando_dados';

        try {
            // Enviar para IA gerar perguntas
            const response = await fetch(`${window.AGENT_API_URL}/api/planner/generate-questions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('merfin_token')}`
                },
                body: JSON.stringify({
                    objetivo: mensagem,
                    contexto: this.contexto,
                    dataAtual: new Date().toISOString().split('T')[0] // YYYY-MM-DD
                })
            });

            if (!response.ok) {
                throw new Error('Erro ao gerar perguntas');
            }

            const data = await response.json();
            console.log('📋 Perguntas geradas:', data);

            this.perguntas = data.perguntas;
            this.contexto.perguntas = data.perguntas.map(p => p.question);
            this.contexto.tipo = data.tipo || 'geral';

            // Renderizar perguntas
            this.renderizarPerguntas(data.perguntas, data.descricao);

        } catch (error) {
            console.error('❌ Erro ao processar objetivo:', error);
            mostrarNotificacao('Erro ao gerar perguntas. Tente novamente.', 'error');
        }
    }

    // Renderizar perguntas interativas
    renderizarPerguntas(perguntas, descricao) {
        const messagesContainer = document.getElementById('messages');
        if (!messagesContainer) return;

        const container = document.createElement('div');
        container.className = 'planner-questions-container';
        container.innerHTML = `
            <div class="planner-questions-header">
                <span class="planner-questions-header-icon">📝</span>
                <div class="planner-questions-header-text">
                    <h3>Responda às perguntas</h3>
                    <p>${descricao || 'Para criar um planejamento preciso, preciso de algumas informações'}</p>
                </div>
            </div>
            <div class="planner-progress-badge">
                <i class="fas fa-clipboard-list"></i>
                <span>0 de ${perguntas.length} respondidas</span>
            </div>
            <form id="planner-questions-form">
                ${perguntas.map((pergunta, index) => this.renderizarPergunta(pergunta, index)).join('')}
                <button type="submit" class="planner-submit-btn">
                    <i class="fas fa-paper-plane"></i> Enviar Respostas
                </button>
            </form>
        `;

        messagesContainer.appendChild(container);

        // Adicionar event listeners
        this.adicionarEventListeners();

        // Scroll suave
        setTimeout(() => {
            container.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }

    // Renderizar uma pergunta individual
    renderizarPergunta(pergunta, index) {
        const { question, description, type, options, placeholder, required } = pergunta;

        let inputHTML = '';

        switch (type) {
            case 'text':
                inputHTML = `
                    <input 
                        type="text" 
                        class="planner-input" 
                        id="question-${index}"
                        name="question-${index}"
                        placeholder="${placeholder || 'Digite sua resposta'}"
                        ${required ? 'required' : ''}
                    />
                `;
                break;

            case 'number':
                inputHTML = `
                    <input 
                        type="number" 
                        class="planner-input" 
                        id="question-${index}"
                        name="question-${index}"
                        placeholder="${placeholder || 'Digite um número'}"
                        ${required ? 'required' : ''}
                    />
                `;
                break;

            case 'date':
                inputHTML = `
                    <input 
                        type="date" 
                        class="planner-input" 
                        id="question-${index}"
                        name="question-${index}"
                        ${required ? 'required' : ''}
                    />
                `;
                break;

            case 'textarea':
                inputHTML = `
                    <textarea 
                        class="planner-textarea" 
                        id="question-${index}"
                        name="question-${index}"
                        placeholder="${placeholder || 'Descreva com detalhes'}"
                        ${required ? 'required' : ''}
                    ></textarea>
                `;
                break;

            case 'select':
                inputHTML = `
                    <select 
                        class="planner-select" 
                        id="question-${index}"
                        name="question-${index}"
                        ${required ? 'required' : ''}
                    >
                        <option value="">Selecione uma opção</option>
                        ${options.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
                    </select>
                `;
                break;

            case 'choice':
                inputHTML = `
                    <div class="planner-options" data-question="${index}">
                        ${options.map((opt, optIndex) => `
                            <div class="planner-option" data-value="${opt}" data-index="${optIndex}">
                                <div class="planner-option-radio"></div>
                                <span>${opt}</span>
                            </div>
                        `).join('')}
                    </div>
                    <input type="hidden" id="question-${index}" name="question-${index}" ${required ? 'required' : ''} />
                `;
                break;

            default:
                inputHTML = `
                    <input 
                        type="text" 
                        class="planner-input" 
                        id="question-${index}"
                        name="question-${index}"
                        placeholder="${placeholder || 'Digite sua resposta'}"
                    />
                `;
        }

        return `
            <div class="planner-question">
                <label class="planner-question-label" for="question-${index}">
                    ${question}
                    ${required ? '<span class="planner-question-required">*</span>' : ''}
                </label>
                ${description ? `<p class="planner-question-description">${description}</p>` : ''}
                ${inputHTML}
            </div>
        `;
    }

    // Adicionar event listeners
    adicionarEventListeners() {
        // Opções de múltipla escolha
        document.querySelectorAll('.planner-option').forEach(option => {
            option.addEventListener('click', () => {
                const container = option.closest('.planner-options');
                const questionIndex = container.dataset.question;
                const value = option.dataset.value;

                // Remover seleção anterior
                container.querySelectorAll('.planner-option').forEach(opt => {
                    opt.classList.remove('selected');
                });

                // Selecionar atual
                option.classList.add('selected');

                // Atualizar input hidden
                const hiddenInput = document.getElementById(`question-${questionIndex}`);
                if (hiddenInput) {
                    hiddenInput.value = value;
                }

                // Atualizar progresso
                this.atualizarProgresso();
            });
        });

        // Inputs de texto/número/data
        document.querySelectorAll('.planner-input, .planner-textarea, .planner-select').forEach(input => {
            input.addEventListener('input', () => this.atualizarProgresso());
            input.addEventListener('change', () => this.atualizarProgresso());
        });

        // Formulário
        const form = document.getElementById('planner-questions-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.enviarRespostas(form);
            });
        }
    }

    // Atualizar progresso de respostas
    atualizarProgresso() {
        const totalPerguntas = this.perguntas.length;
        let respondidas = 0;

        this.perguntas.forEach((_, index) => {
            const input = document.getElementById(`question-${index}`);
            if (input && input.value && input.value.trim() !== '') {
                respondidas++;
            }
        });

        const badge = document.querySelector('.planner-progress-badge span');
        if (badge) {
            badge.textContent = `${respondidas} de ${totalPerguntas} respondidas`;
        }
    }

    // Enviar respostas para IA
    async enviarRespostas(form) {
        console.log('📤 Enviando respostas...');

        // Coletar respostas
        const respostas = [];
        this.perguntas.forEach((pergunta, index) => {
            const input = document.getElementById(`question-${index}`);
            if (input) {
                respostas.push({
                    pergunta: pergunta.question,
                    resposta: input.value
                });
                this.respostas[pergunta.question] = input.value;
            }
        });

        this.contexto.respostas = respostas;
        this.contexto.etapa = 'analisando';

        // Desabilitar botão
        const submitBtn = form.querySelector('.planner-submit-btn');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analisando...';
        }

        try {
            // Enviar para IA processar e gerar planejamento
            const response = await fetch(`${window.AGENT_API_URL}/api/planner/create-plan`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('merfin_token')}`
                },
                body: JSON.stringify({
                    objetivo: this.objetivo,
                    perguntas: this.perguntas,
                    respostas: respostas,
                    contexto: this.contexto,
                    dataAtual: new Date().toISOString().split('T')[0] // YYYY-MM-DD
                })
            });

            if (!response.ok) {
                throw new Error('Erro ao criar planejamento');
            }

            const data = await response.json();
            console.log('✅ Planejamento criado:', data);

            // Remover container de perguntas
            const container = document.querySelector('.planner-questions-container');
            if (container) container.remove();

            // Exibir planejamento
            this.exibirPlanejamento(data.planejamento);

            this.contexto.etapa = 'completo';

        } catch (error) {
            console.error('❌ Erro ao enviar respostas:', error);
            mostrarNotificacao('Erro ao criar planejamento. Tente novamente.', 'error');

            // Reabilitar botão
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar Respostas';
            }
        }
    }

    // Exibir planejamento final
    exibirPlanejamento(planejamento) {
        const messagesContainer = document.getElementById('messages');
        if (!messagesContainer) return;

        const resultDiv = document.createElement('div');
        resultDiv.className = 'message bot planner-result';
        resultDiv.innerHTML = `
            <div class="planner-result-header">
                <div class="planner-result-icon">✨</div>
                <h2 class="planner-result-title">Seu Planejamento Está Pronto!</h2>
                <p class="planner-result-subtitle">${this.objetivo}</p>
            </div>
            <div class="planner-result-content">
                ${this.formatarPlanejamento(planejamento)}
            </div>
        `;

        messagesContainer.appendChild(resultDiv);

        // Scroll suave
        setTimeout(() => {
            resultDiv.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }, 100);

        mostrarNotificacao('Planejamento concluído com sucesso!', 'success');
    }

    // Formatar planejamento em HTML
    formatarPlanejamento(texto) {
        // Usar marked.js se disponível, senão formatação básica
        if (typeof marked !== 'undefined') {
            return marked.parse(texto);
        }

        // Formatação básica
        return texto
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>');
    }

    // Verificar se está no modo planejador
    isAtivo() {
        return this.ativo;
    }

    // Obter contexto atual
    getContexto() {
        return this.contexto;
    }
}

// Instância global
const planejador = new PlanejadorFinanceiro();

// Exportar para uso global
window.planejador = planejador;

// Inicializar quando DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => planejador.init());
} else {
    planejador.init();
}

console.log('✅ Planejador Financeiro carregado');
