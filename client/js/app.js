// Função auxiliar para fazer requisições autenticadas
async function fetchAPI(url, options = {}) {
    const token = localStorage.getItem('merfin_token');
    
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`http://localhost:5000${url}`, {
        ...options,
        headers
    });
    
    if (response.status === 401) {
        // Token inválido, fazer logout
        localStorage.removeItem('merfin_token');
        localStorage.removeItem('merfin_user');
        showAuthModal();
        throw new Error('Não autenticado');
    }
    
    return response;
}

// Sidebar toggle handler
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;
    const isCollapsed = sidebar.classList.toggle('collapsed');
    try {
        localStorage.setItem('merfin_sidebar_collapsed', isCollapsed ? '1' : '0');
    } catch (e) {
        // ignore storage errors (e.g., in private mode)
    }
}

// Sistema de Autenticação
function checkAuth() {
    const token = localStorage.getItem('merfin_token');
    if (!token) {
        showAuthModal();
        return false;
    }
    return true;
}

function showAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function hideAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function switchAuthMode(mode) {
    const loginForm = document.getElementById('login-form');
    const cadastroForm = document.getElementById('cadastro-form');
    const loginTab = document.getElementById('tab-login');
    const cadastroTab = document.getElementById('tab-cadastro');
    
    if (mode === 'login') {
        loginForm.style.display = 'block';
        cadastroForm.style.display = 'none';
        loginTab.classList.add('active');
        cadastroTab.classList.remove('active');
    } else {
        loginForm.style.display = 'none';
        cadastroForm.style.display = 'block';
        loginTab.classList.remove('active');
        cadastroTab.classList.add('active');
    }
}

function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const senha = document.getElementById('login-senha').value;
    
    if (!email || !senha) {
        alert('Por favor, preencha todos os campos.');
        return;
    }
    
    // Fazer requisição para o backend
    fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, senha })
    })
    .then(response => response.json())
    .then(data => {
        if (data.token) {
            // Salvar token e dados do usuário
            localStorage.setItem('merfin_token', data.token);
            localStorage.setItem('merfin_user', JSON.stringify(data.user));
            hideAuthModal();
            location.reload();
        } else {
            alert(data.error || 'Email ou senha incorretos.');
        }
    })
    .catch(error => {
        console.error('Erro no login:', error);
        alert('Erro ao fazer login. Tente novamente.');
    });
}

function handleCadastro(event) {
    event.preventDefault();
    
    const nome = document.getElementById('cadastro-nome').value;
    const email = document.getElementById('cadastro-email').value;
    const senha = document.getElementById('cadastro-senha').value;
    const confirmarSenha = document.getElementById('cadastro-confirmar-senha').value;
    
    if (!nome || !email || !senha || !confirmarSenha) {
        alert('Por favor, preencha todos os campos.');
        return;
    }
    
    if (senha !== confirmarSenha) {
        alert('As senhas não coincidem.');
        return;
    }
    
    if (senha.length < 6) {
        alert('A senha deve ter pelo menos 6 caracteres.');
        return;
    }
    
    // Fazer requisição para o backend
    fetch('http://localhost:5000/api/auth/cadastro', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ nome, email, senha })
    })
    .then(response => response.json())
    .then(data => {
        if (data.token) {
            // Salvar token e dados do usuário
            localStorage.setItem('merfin_token', data.token);
            localStorage.setItem('merfin_user', JSON.stringify(data.user));
            alert('Cadastro realizado com sucesso!');
            hideAuthModal();
            location.reload();
        } else {
            alert(data.error || 'Erro ao fazer cadastro.');
        }
    })
    .catch(error => {
        console.error('Erro no cadastro:', error);
        alert('Erro ao fazer cadastro. Tente novamente.');
    });
}

function logout() {
    if (confirm('Deseja realmente sair?')) {
        localStorage.removeItem('merfin_token');
        localStorage.removeItem('merfin_user');
        location.href = 'chat.html';
    }
}

document.addEventListener('DOMContentLoaded', function () {
    // Verificar autenticação
    const isIndexPage = window.location.pathname.endsWith('index.html') || 
                        window.location.pathname.endsWith('/') ||
                        window.location.pathname === '/';
    
    if (!isIndexPage) {
        checkAuth();
        // Verificar se é primeira vez após login
        checkFirstLogin();
    }
    
    // Sidebar
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        try {
            const stored = localStorage.getItem('merfin_sidebar_collapsed');
            if (stored === '1') sidebar.classList.add('collapsed');
        } catch (e) {
            // ignore
        }
    }
    
    // Event listeners para autenticação
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    const cadastroForm = document.getElementById('cadastro-form');
    if (cadastroForm) {
        cadastroForm.addEventListener('submit', handleCadastro);
    }
    
    const tabLogin = document.getElementById('tab-login');
    if (tabLogin) {
        tabLogin.addEventListener('click', () => switchAuthMode('login'));
    }
    
    const tabCadastro = document.getElementById('tab-cadastro');
    if (tabCadastro) {
        tabCadastro.addEventListener('click', () => switchAuthMode('cadastro'));
    }
});

// ========== MODAL DE ONBOARDING (PRIMEIRA VEZ) ==========

let currentOnboardingStep = 0;
const totalOnboardingSteps = 4;

async function checkFirstLogin() {
    try {
        const response = await fetchAPI('/api/perfil');
        if (response.ok) {
            const perfil = await response.json();
            
            // Se é primeira vez, mostrar modal de onboarding
            if (perfil.isFirstLogin === true) {
                showOnboardingModal();
            }
        }
    } catch (error) {
        console.error('Erro ao verificar primeira vez:', error);
    }
}

function showOnboardingModal() {
    // Criar modal se não existir
    if (!document.getElementById('onboarding-modal')) {
        createOnboardingModal();
    }
    
    const modal = document.getElementById('onboarding-modal');
    modal.style.display = 'flex';
    currentOnboardingStep = 0;
    showOnboardingStep(0);
}

function hideOnboardingModal() {
    const modal = document.getElementById('onboarding-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function createOnboardingModal() {
    const modalHTML = `
        <div id="onboarding-modal" class="onboarding-modal">
            <div class="onboarding-content">
                <div class="onboarding-header">
                    <h2>Bem-vindo ao Merfin! 🎉</h2>
                    <p>Vamos configurar seu perfil para personalizar sua experiência</p>
                    <div class="progress-bar">
                        <div class="progress-fill" id="onboarding-progress"></div>
                    </div>
                    <div class="step-indicator">
                        <span class="current-step">1</span> / <span class="total-steps">4</span>
                    </div>
                </div>
                
                <div class="onboarding-body">
                    <!-- Etapa 1: Informações Pessoais -->
                    <div class="onboarding-step" data-step="0">
                        <h3>📋 Informações Pessoais</h3>
                        <div class="form-group">
                            <label for="onb-nome">Nome Completo</label>
                            <input type="text" id="onb-nome" placeholder="Digite seu nome">
                        </div>
                        <div class="form-group">
                            <label for="onb-idade">Idade</label>
                            <input type="number" id="onb-idade" placeholder="Digite sua idade">
                        </div>
                        <div class="form-group">
                            <label for="onb-profissao">Profissão</label>
                            <input type="text" id="onb-profissao" placeholder="Digite sua profissão">
                        </div>
                        <div class="form-group-inline">
                            <div class="form-group">
                                <label for="onb-cidade">Cidade</label>
                                <input type="text" id="onb-cidade" placeholder="Cidade">
                            </div>
                            <div class="form-group">
                                <label for="onb-estado">Estado</label>
                                <input type="text" id="onb-estado" placeholder="UF">
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="onb-sobre">Nos conte mais sobre você</label>
                            <textarea id="onb-sobre" rows="3" placeholder="Escreva um pouco sobre você..."></textarea>
                        </div>
                    </div>
                    
                    <!-- Etapa 2: Objetivos Financeiros -->
                    <div class="onboarding-step" data-step="1" style="display: none;">
                        <h3>🎯 Objetivos Financeiros</h3>
                        <div class="form-group">
                            <label for="onb-fundo-emergencia">Fundo de Emergência Desejado (R$)</label>
                            <input type="number" id="onb-fundo-emergencia" placeholder="0,00" step="0.01">
                        </div>
                        <div class="form-group">
                            <label for="onb-prazo-fundo">Prazo para Atingir o Fundo (meses)</label>
                            <input type="number" id="onb-prazo-fundo" placeholder="0">
                        </div>
                        
                        <h4>Meta de Curto Prazo</h4>
                        <div class="form-group">
                            <label for="onb-meta-curto-desc">Descrição</label>
                            <input type="text" id="onb-meta-curto-desc" placeholder="Ex: Viagem, compra de equipamento">
                        </div>
                        <div class="form-group">
                            <label for="onb-meta-curto-valor">Valor Estimado (R$)</label>
                            <input type="number" id="onb-meta-curto-valor" placeholder="0,00" step="0.01">
                        </div>
                        <div class="form-group">
                            <label for="onb-meta-curto-prazo">Prazo (meses)</label>
                            <input type="number" id="onb-meta-curto-prazo" placeholder="0">
                        </div>
                        
                        <h4>Meta de Longo Prazo</h4>
                        <div class="form-group">
                            <label for="onb-meta-longo-desc">Descrição</label>
                            <input type="text" id="onb-meta-longo-desc" placeholder="Ex: Aposentadoria, casa própria">
                        </div>
                        <div class="form-group">
                            <label for="onb-meta-longo-valor">Valor Estimado (R$)</label>
                            <input type="number" id="onb-meta-longo-valor" placeholder="0,00" step="0.01">
                        </div>
                        <div class="form-group">
                            <label for="onb-meta-longo-prazo">Prazo (anos)</label>
                            <input type="number" id="onb-meta-longo-prazo" placeholder="0">
                        </div>
                    </div>
                    
                    <!-- Etapa 3: Patrimônio -->
                    <div class="onboarding-step" data-step="2" style="display: none;">
                        <h3>💰 Patrimônio Atual</h3>
                        <p class="step-description">Informe os valores aproximados dos seus ativos</p>
                        
                        <div class="patrimonio-grid">
                            <div class="form-group">
                                <label for="onb-pat-acoes">Ações</label>
                                <input type="number" id="onb-pat-acoes" placeholder="0,00" step="0.01" data-tipo="acoes">
                            </div>
                            <div class="form-group">
                                <label for="onb-pat-fundos">Fundos de Investimento</label>
                                <input type="number" id="onb-pat-fundos" placeholder="0,00" step="0.01" data-tipo="fundos">
                            </div>
                            <div class="form-group">
                                <label for="onb-pat-tesouro">Tesouro Direto</label>
                                <input type="number" id="onb-pat-tesouro" placeholder="0,00" step="0.01" data-tipo="tesouro">
                            </div>
                            <div class="form-group">
                                <label for="onb-pat-cdb">CDB/LCI/LCA</label>
                                <input type="number" id="onb-pat-cdb" placeholder="0,00" step="0.01" data-tipo="cdb">
                            </div>
                            <div class="form-group">
                                <label for="onb-pat-poupanca">Poupança</label>
                                <input type="number" id="onb-pat-poupanca" placeholder="0,00" step="0.01" data-tipo="poupanca">
                            </div>
                            <div class="form-group">
                                <label for="onb-pat-imoveis">Imóveis</label>
                                <input type="number" id="onb-pat-imoveis" placeholder="0,00" step="0.01" data-tipo="imoveis">
                            </div>
                            <div class="form-group">
                                <label for="onb-pat-veiculos">Veículos</label>
                                <input type="number" id="onb-pat-veiculos" placeholder="0,00" step="0.01" data-tipo="veiculos">
                            </div>
                            <div class="form-group">
                                <label for="onb-pat-cripto">Criptomoedas</label>
                                <input type="number" id="onb-pat-cripto" placeholder="0,00" step="0.01" data-tipo="cripto">
                            </div>
                            <div class="form-group">
                                <label for="onb-pat-previdencia">Previdência Privada</label>
                                <input type="number" id="onb-pat-previdencia" placeholder="0,00" step="0.01" data-tipo="previdencia">
                            </div>
                            <div class="form-group">
                                <label for="onb-pat-outros">Outros</label>
                                <input type="number" id="onb-pat-outros" placeholder="0,00" step="0.01" data-tipo="outros">
                            </div>
                        </div>
                        
                        <div class="patrimonio-total">
                            <strong>Patrimônio Total:</strong> 
                            <span id="onb-patrimonio-total">R$ 0,00</span>
                        </div>
                    </div>
                    
                    <!-- Etapa 4: Dependentes -->
                    <div class="onboarding-step" data-step="3" style="display: none;">
                        <h3>👨‍👩‍👧‍👦 Dependentes e Renda Familiar</h3>
                        <div class="form-group">
                            <label for="onb-num-dependentes">Número de Dependentes</label>
                            <input type="number" id="onb-num-dependentes" placeholder="0" min="0">
                        </div>
                        <div class="form-group">
                            <label for="onb-unica-renda">É a única renda da família?</label>
                            <select id="onb-unica-renda">
                                <option value="">Selecione</option>
                                <option value="sim">Sim</option>
                                <option value="nao">Não</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="onb-renda-conjugue">Renda do Cônjuge (R$)</label>
                            <input type="number" id="onb-renda-conjugue" placeholder="0,00" step="0.01">
                            <small>Deixe em branco se não aplicável</small>
                        </div>
                        
                        <div class="onboarding-summary">
                            <h4>✅ Quase lá!</h4>
                            <p>Após finalizar, você poderá começar a usar o Merfin para gerenciar suas finanças de forma inteligente.</p>
                        </div>
                    </div>
                </div>
                
                <div class="onboarding-footer">
                    <button type="button" class="btn-secondary" id="onb-btn-prev" onclick="prevOnboardingStep()">
                        Anterior
                    </button>
                    <button type="button" class="btn-skip" id="onb-btn-skip" onclick="skipOnboarding()">
                        Pular por Agora
                    </button>
                    <button type="button" class="btn-primary" id="onb-btn-next" onclick="nextOnboardingStep()">
                        Próximo
                    </button>
                    <button type="button" class="btn-primary" id="onb-btn-finish" onclick="finishOnboarding()" style="display: none;">
                        Finalizar
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Adicionar event listeners para calcular patrimônio total
    const patrimonioInputs = document.querySelectorAll('#onboarding-modal [data-tipo]');
    patrimonioInputs.forEach(input => {
        input.addEventListener('input', calculateOnboardingPatrimonio);
    });
}

function showOnboardingStep(step) {
    const steps = document.querySelectorAll('.onboarding-step');
    steps.forEach((stepEl, index) => {
        stepEl.style.display = index === step ? 'block' : 'none';
    });
    
    // Atualizar indicadores
    document.querySelector('.current-step').textContent = step + 1;
    const progress = ((step + 1) / totalOnboardingSteps) * 100;
    document.getElementById('onboarding-progress').style.width = progress + '%';
    
    // Controlar botões
    const btnPrev = document.getElementById('onb-btn-prev');
    const btnNext = document.getElementById('onb-btn-next');
    const btnFinish = document.getElementById('onb-btn-finish');
    
    btnPrev.style.display = step === 0 ? 'none' : 'inline-block';
    btnNext.style.display = step === totalOnboardingSteps - 1 ? 'none' : 'inline-block';
    btnFinish.style.display = step === totalOnboardingSteps - 1 ? 'inline-block' : 'none';
}

function nextOnboardingStep() {
    if (currentOnboardingStep < totalOnboardingSteps - 1) {
        currentOnboardingStep++;
        showOnboardingStep(currentOnboardingStep);
    }
}

function prevOnboardingStep() {
    if (currentOnboardingStep > 0) {
        currentOnboardingStep--;
        showOnboardingStep(currentOnboardingStep);
    }
}

function calculateOnboardingPatrimonio() {
    const inputs = document.querySelectorAll('#onboarding-modal [data-tipo]');
    let total = 0;
    
    inputs.forEach(input => {
        const value = parseFloat(input.value) || 0;
        total += value;
    });
    
    document.getElementById('onb-patrimonio-total').textContent = 
        `R$ ${total.toFixed(2).replace('.', ',')}`;
}

function skipOnboarding() {
    if (confirm('Tem certeza que deseja pular? Você pode preencher seu perfil depois.')) {
        saveOnboardingData(true); // Salvar como não primeira vez mesmo sem dados
    }
}

async function finishOnboarding() {
    await saveOnboardingData(false);
}

async function saveOnboardingData(skipMode = false) {
    const perfilData = {
        isFirstLogin: false, // Marcar como não sendo mais primeira vez
        nome: document.getElementById('onb-nome').value || '',
        idade: document.getElementById('onb-idade').value || '',
        profissao: document.getElementById('onb-profissao').value || '',
        cidade: document.getElementById('onb-cidade').value || '',
        estado: document.getElementById('onb-estado').value || '',
        sobre: document.getElementById('onb-sobre').value || '',
        fundoEmergencia: document.getElementById('onb-fundo-emergencia').value || 0,
        prazoFundo: document.getElementById('onb-prazo-fundo').value || 0,
        metaCurto: {
            descricao: document.getElementById('onb-meta-curto-desc').value || '',
            valor: document.getElementById('onb-meta-curto-valor').value || 0,
            prazo: document.getElementById('onb-meta-curto-prazo').value || 0
        },
        metaLongo: {
            descricao: document.getElementById('onb-meta-longo-desc').value || '',
            valor: document.getElementById('onb-meta-longo-valor').value || 0,
            prazo: document.getElementById('onb-meta-longo-prazo').value || 0
        },
        patrimonio: {},
        numDependentes: document.getElementById('onb-num-dependentes').value || 0,
        unicaRenda: document.getElementById('onb-unica-renda').value || '',
        rendaConjugue: document.getElementById('onb-renda-conjugue').value || 0
    };
    
    // Salvar patrimônio
    const patrimonioInputs = document.querySelectorAll('#onboarding-modal [data-tipo]');
    patrimonioInputs.forEach(input => {
        const tipo = input.dataset.tipo;
        const valor = parseFloat(input.value) || 0;
        perfilData.patrimonio[tipo] = valor;
    });
    
    try {
        const response = await fetchAPI('/api/perfil', {
            method: 'POST',
            body: JSON.stringify(perfilData)
        });
        
        if (response.ok) {
            hideOnboardingModal();
            if (!skipMode) {
                alert('Perfil configurado com sucesso! Bem-vindo ao Merfin! 🎉');
            }
        } else {
            throw new Error('Erro ao salvar perfil');
        }
    } catch (error) {
        console.error('Erro ao salvar onboarding:', error);
        alert('Erro ao salvar perfil. Tente novamente.');
    }
}

// ========== GERENCIAMENTO DE HISTÓRICO DE CONVERSAS ==========

let conversaAtualId = null;
let conversas = [];

// Inicializar sistema de histórico
async function initChatHistory() {
    await carregarConversas();
}

// Carregar lista de conversas
async function carregarConversas() {
    try {
        const response = await fetchAPI('/api/conversas');
        conversas = await response.json();
        console.log('📚 Conversas carregadas:', conversas.length);
    } catch (error) {
        console.error('Erro ao carregar conversas:', error);
    }
}

// Abrir modal de histórico
function abrirModalHistorico() {
    // Remover modal existente se houver
    const existingModal = document.getElementById('modal-historico');
    if (existingModal) existingModal.remove();
    
    const modal = criarModalHistorico();
    document.body.appendChild(modal);
    renderizarListaConversas();
    
    // Animação de entrada
    setTimeout(() => modal.classList.add('show'), 10);
}

// Criar modal de histórico
function criarModalHistorico() {
    const modal = document.createElement('div');
    modal.id = 'modal-historico';
    modal.className = 'modal-historico';
    
    modal.innerHTML = `
        <div class="modal-historico-content">
            <div class="modal-historico-header">
                <h2><i class="fas fa-history"></i> Histórico de Conversas</h2>
                <button class="btn-fechar-modal" onclick="fecharModalHistorico()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="modal-historico-busca">
                <i class="fas fa-search"></i>
                <input 
                    type="text" 
                    id="busca-conversa" 
                    placeholder="Buscar conversa..."
                    oninput="filtrarConversas(this.value)"
                >
            </div>
            
            <div class="modal-historico-acoes">
                <button class="btn-nova-conversa" onclick="criarNovaConversa()">
                    <i class="fas fa-plus"></i> Nova Conversa
                </button>
            </div>
            
            <div class="modal-historico-lista" id="lista-conversas">
                <!-- Lista será renderizada aqui -->
            </div>
        </div>
    `;
    
    // Fechar ao clicar fora
    modal.onclick = (e) => {
        if (e.target === modal) fecharModalHistorico();
    };
    
    return modal;
}

// Renderizar lista de conversas
function renderizarListaConversas(filtro = '') {
    const lista = document.getElementById('lista-conversas');
    if (!lista) return;
    
    const conversasFiltradas = conversas.filter(c => 
        c.titulo.toLowerCase().includes(filtro.toLowerCase())
    );
    
    if (conversasFiltradas.length === 0) {
        lista.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-comments"></i>
                <p>${filtro ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa ainda'}</p>
                <button class="btn-nova-conversa" onclick="criarNovaConversa()">
                    <i class="fas fa-plus"></i> Iniciar primeira conversa
                </button>
            </div>
        `;
        return;
    }
    
    lista.innerHTML = conversasFiltradas.map(conversa => `
        <div class="conversa-item ${conversa.id === conversaAtualId ? 'ativa' : ''}" 
             data-conversa-id="${conversa.id}">
            <div class="conversa-info" data-conversa-id="${conversa.id}">
                <div class="conversa-titulo">
                    <i class="fas fa-comment-dots"></i>
                    <span>${conversa.titulo}</span>
                </div>
                <div class="conversa-meta">
                    <span class="conversa-mensagens">
                        <i class="fas fa-message"></i> ${conversa.numMensagens} mensagens
                    </span>
                    <span class="conversa-data">
                        ${formatarDataRelativa(conversa.ultimaMensagem)}
                    </span>
                </div>
            </div>
            <div class="conversa-acoes">
                <button class="btn-icon btn-editar" data-conversa-id="${conversa.id}" title="Editar título">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon btn-deletar" data-conversa-id="${conversa.id}" title="Deletar">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
    
    // Adicionar event listeners após renderizar
    setTimeout(() => {
        // Click nas conversas
        document.querySelectorAll('.conversa-info').forEach(el => {
            el.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                const conversaId = this.getAttribute('data-conversa-id');
                if (conversaId) {
                    console.log('🖱️ Clique na conversa:', conversaId);
                    carregarConversa(conversaId);
                }
            });
        });
        
        // Botões de editar
        document.querySelectorAll('.btn-editar').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                const conversaId = this.getAttribute('data-conversa-id');
                if (conversaId) editarTitulo(conversaId);
            });
        });
        
        // Botões de deletar
        document.querySelectorAll('.btn-deletar').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                const conversaId = this.getAttribute('data-conversa-id');
                if (conversaId) deletarConversa(conversaId);
            });
        });
    }, 50);
}

// Filtrar conversas
function filtrarConversas(filtro) {
    renderizarListaConversas(filtro);
}

// Criar nova conversa
async function criarNovaConversa() {
    try {
        const response = await fetchAPI('/api/conversas', {
            method: 'POST',
            body: JSON.stringify({ titulo: 'Nova Conversa' })
        });
        
        const data = await response.json();
        conversaAtualId = data.conversa._id;
        
        // Limpar chat atual
        const chatMessages = document.getElementById('messages');
        if (chatMessages) chatMessages.innerHTML = '';
        
        await carregarConversas();
        fecharModalHistorico();
        
        showNotification('Nova conversa criada!', 'success');
    } catch (error) {
        console.error('Erro ao criar conversa:', error);
        showNotification('Erro ao criar conversa', 'error');
    }
}

// Iniciar novo chat (limpa a tela sem criar conversa no banco ainda)
function iniciarNovoChat() {
    conversaAtualId = null;
    const chatMessages = document.getElementById('messages');
    if (chatMessages) {
        chatMessages.innerHTML = '';
    }
    showNotification('Novo chat iniciado!', 'success');
}

// Variável para debounce do carregamento
let carregarConversaTimeout = null;
let carregandoConversa = false;

// Carregar conversa específica
async function carregarConversa(conversaId) {
    // Debounce - evitar múltiplos cliques
    if (carregarConversaTimeout) {
        console.log('⏳ Aguardando debounce...');
        return;
    }
    
    // Evitar carregamento simultâneo
    if (carregandoConversa) {
        console.log('⏳ Já está carregando uma conversa...');
        return;
    }
    
    // Validar ID
    if (!conversaId || conversaId === 'undefined' || conversaId === 'null') {
        console.error('❌ ID de conversa inválido:', conversaId);
        showNotification('Erro: ID de conversa inválido', 'error');
        return;
    }
    
    carregarConversaTimeout = setTimeout(() => {
        carregarConversaTimeout = null;
    }, 1000);
    
    carregandoConversa = true;
    
    try {
        console.log('🔄 Carregando conversa:', conversaId);
        showNotification('Carregando conversa...', 'info');
        
        const response = await fetchAPI(`/api/conversas/${conversaId}`);
        
        // Verificar se a resposta foi bem-sucedida
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
            throw new Error(errorData.error || `Erro HTTP ${response.status}`);
        }
        
        const conversa = await response.json();
        
        console.log('📦 Conversa recebida:', {
            id: conversa._id,
            titulo: conversa.titulo,
            numMensagens: conversa.mensagens?.length || 0
        });
        
        // Validar estrutura da conversa
        if (!conversa || !conversa.mensagens) {
            throw new Error('Estrutura de conversa inválida');
        }
        
        conversaAtualId = conversaId;
        
        // Limpar chat atual
        const chatMessages = document.getElementById('messages');
        if (!chatMessages) {
            console.error('❌ Elemento messages não encontrado');
            throw new Error('Elemento de mensagens não encontrado');
        }
        
        chatMessages.innerHTML = '';
        
        // Renderizar mensagens
        if (Array.isArray(conversa.mensagens) && conversa.mensagens.length > 0) {
            console.log('📝 Renderizando', conversa.mensagens.length, 'mensagens...');
            
            conversa.mensagens.forEach((msg, index) => {
                if (!msg.conteudo) {
                    console.warn('⚠️ Mensagem sem conteúdo no índice', index);
                    return;
                }
                
                const el = document.createElement('div');
                el.className = `message ${msg.tipo === 'user' ? 'user' : 'bot'}`;
                el.innerText = msg.conteudo;
                chatMessages.appendChild(el);
            });
            
            console.log('✅ Mensagens renderizadas com sucesso!');
        } else {
            console.log('⚠️ Conversa vazia - sem mensagens');
        }
        
        // Scroll para o final
        setTimeout(() => {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }, 100);
        
        fecharModalHistorico();
        showNotification('Conversa carregada!', 'success');
        
    } catch (error) {
        console.error('❌ Erro ao carregar conversa:', error);
        showNotification('Erro: ' + error.message, 'error');
    } finally {
        carregandoConversa = false;
    }
}

// Editar título da conversa
async function editarTitulo(conversaId) {
    const conversa = conversas.find(c => c.id === conversaId);
    if (!conversa) return;
    
    const novoTitulo = prompt('Novo título da conversa:', conversa.titulo);
    if (!novoTitulo || novoTitulo === conversa.titulo) return;
    
    try {
        await fetchAPI(`/api/conversas/${conversaId}/titulo`, {
            method: 'PATCH',
            body: JSON.stringify({ titulo: novoTitulo })
        });
        
        await carregarConversas();
        renderizarListaConversas();
        showNotification('Título atualizado!', 'success');
    } catch (error) {
        console.error('Erro ao editar título:', error);
        showNotification('Erro ao editar título', 'error');
    }
}

// Deletar conversa
async function deletarConversa(conversaId) {
    if (!confirm('Tem certeza que deseja deletar esta conversa?')) return;
    
    try {
        await fetchAPI(`/api/conversas/${conversaId}`, {
            method: 'DELETE'
        });
        
        if (conversaAtualId === conversaId) {
            conversaAtualId = null;
            const chatMessages = document.getElementById('messages');
            if (chatMessages) chatMessages.innerHTML = '';
        }
        
        await carregarConversas();
        renderizarListaConversas();
        showNotification('Conversa deletada!', 'success');
    } catch (error) {
        console.error('Erro ao deletar conversa:', error);
        showNotification('Erro ao deletar conversa', 'error');
    }
}

// Salvar mensagem na conversa atual
async function salvarMensagemNaConversa(tipo, conteudo, sectionsUsed = [], timeframe = null) {
    try {
        // Se não há conversa atual, criar uma
        if (!conversaAtualId) {
            const response = await fetchAPI('/api/conversas', {
                method: 'POST',
                body: JSON.stringify({ titulo: conteudo.substring(0, 50) })
            });
            const data = await response.json();
            conversaAtualId = data.conversa._id;
        }
        
        // Adicionar mensagem
        await fetchAPI(`/api/conversas/${conversaAtualId}/mensagem`, {
            method: 'POST',
            body: JSON.stringify({ tipo, conteudo, sectionsUsed, timeframe })
        });
        
        console.log('💾 Mensagem salva na conversa:', conversaAtualId);
    } catch (error) {
        console.error('Erro ao salvar mensagem:', error);
    }
}

// Fechar modal
function fecharModalHistorico() {
    const modal = document.getElementById('modal-historico');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    }
}

// Formatar data relativa
function formatarDataRelativa(data) {
    const agora = new Date();
    const dataMsg = new Date(data);
    const diffMs = agora - dataMsg;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHoras = Math.floor(diffMs / 3600000);
    const diffDias = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins} min atrás`;
    if (diffHoras < 24) return `${diffHoras}h atrás`;
    if (diffDias === 1) return 'Ontem';
    if (diffDias < 7) return `${diffDias} dias atrás`;
    
    return dataMsg.toLocaleDateString('pt-BR');
}

// Notificação toast
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Mostrar
    setTimeout(() => notification.classList.add('show'), 10);
    
    // Remover após 3 segundos
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

