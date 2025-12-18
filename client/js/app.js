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

