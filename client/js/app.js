// ========== SISTEMA DE NOTIFICAÇÕES CUSTOMIZADAS ==========
function mostrarNotificacao(mensagem, tipo = 'info') {
    // Tipos: 'success', 'error', 'warning', 'info'
    const cores = {
        success: { bg: '#27ae60', icon: '✓' },
        error: { bg: '#e74c3c', icon: '✕' },
        warning: { bg: '#f39c12', icon: '⚠' },
        info: { bg: '#3498db', icon: 'ℹ' }
    };
    
    const config = cores[tipo] || cores.info;
    
    const notificacao = document.createElement('div');
    notificacao.style.cssText = `
        position: fixed;
        top: 24px;
        right: 24px;
        background: ${config.bg};
        color: white;
        padding: 16px 24px;
        border-radius: 10px;
        font-family: 'Crimson Text', serif;
        font-size: 16px;
        font-weight: 500;
        letter-spacing: 0.7px;
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.6);
        z-index: 10001;
        display: flex;
        align-items: center;
        gap: 12px;
        max-width: 400px;
        animation: slideInRight 0.3s ease, slideOutRight 0.3s ease 2.7s;
        opacity: 1;
        transform: translateX(0);
    `;
    
    notificacao.innerHTML = `
        <span style="font-size: 20px; font-weight: bold;">${config.icon}</span>
        <span>${mensagem}</span>
    `;
    
    // Adicionar animações CSS
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideInRight {
                from {
                    transform: translateX(400px);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            @keyframes slideOutRight {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(400px);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notificacao);
    
    // Remover após 3 segundos
    setTimeout(() => {
        if (notificacao.parentElement) {
            notificacao.remove();
        }
    }, 3000);
}

// Sistema de confirmação customizado
function mostrarConfirmacao(mensagem, callback) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.75);
        backdrop-filter: blur(8px);
        z-index: 10002;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.2s ease;
    `;
    
    const modal = document.createElement('div');
    modal.style.cssText = `
        background: var(--color-surface, #1e1e1e);
        border-radius: 16px;
        padding: 32px;
        max-width: 450px;
        width: 90%;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        animation: slideUp 0.3s ease;
    `;
    
    modal.innerHTML = `
        <div style="text-align: center; margin-bottom: 24px;">
            <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
            <div style="color: var(--color-text-primary, white); font-family: 'Crimson Text', serif; font-size: 18px; line-height: 1.6; font-weight: 500; letter-spacing: 0.7px;">
                ${mensagem}
            </div>
        </div>
        <div style="display: flex; gap: 12px;">
            <button id="btn-cancelar" style="
                flex: 1;
                padding: 14px;
                border: 1px solid var(--color-border, #333);
                border-radius: 8px;
                background: var(--color-surface-elevated, #252525);
                color: var(--color-text-primary, white);
                font-family: 'Crimson Text', serif;
                font-size: 16px;
                font-weight: 600;
                letter-spacing: 0.7px;
                cursor: pointer;
                transition: all 0.3s ease;
            ">Cancelar</button>
            <button id="btn-confirmar" style="
                flex: 1;
                padding: 14px;
                border: none;
                border-radius: 8px;
                background: #e74c3c;
                color: white;
                font-family: 'Crimson Text', serif;
                font-size: 16px;
                font-weight: 600;
                letter-spacing: 0.7px;
                cursor: pointer;
                transition: all 0.3s ease;
            ">Confirmar</button>
        </div>
    `;
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    const btnCancelar = modal.querySelector('#btn-cancelar');
    const btnConfirmar = modal.querySelector('#btn-confirmar');
    
    btnCancelar.onmouseover = () => btnCancelar.style.background = 'var(--color-hover, #292929)';
    btnCancelar.onmouseout = () => btnCancelar.style.background = 'var(--color-surface-elevated, #252525)';
    
    btnConfirmar.onmouseover = () => {
        btnConfirmar.style.background = '#c0392b';
        btnConfirmar.style.transform = 'translateY(-2px)';
        btnConfirmar.style.boxShadow = '0 4px 12px rgba(231, 76, 60, 0.4)';
    };
    btnConfirmar.onmouseout = () => {
        btnConfirmar.style.background = '#e74c3c';
        btnConfirmar.style.transform = 'translateY(0)';
        btnConfirmar.style.boxShadow = 'none';
    };
    
    btnCancelar.onclick = () => {
        overlay.remove();
        callback(false);
    };
    
    btnConfirmar.onclick = () => {
        overlay.remove();
        callback(true);
    };
    
    overlay.onclick = (e) => {
        if (e.target === overlay) {
            overlay.remove();
            callback(false);
        }
    };
}

// Modal de problema na assinatura com suporte WhatsApp
function mostrarModalAssinaturaProblema(data) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.85);
        backdrop-filter: blur(10px);
        z-index: 10003;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.3s ease;
    `;
    
    const modal = document.createElement('div');
    modal.style.cssText = `
        background: linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%);
        border-radius: 20px;
        padding: 40px;
        max-width: 500px;
        width: 90%;
        box-shadow: 0 25px 70px rgba(0, 0, 0, 0.7);
        border: 1px solid rgba(255, 255, 255, 0.1);
        animation: slideUp 0.4s ease;
    `;
    
    // Determinar ícone e cor baseado no tipo de erro
    let icon = '⚠️';
    let iconColor = '#f39c12';
    
    if (data.type === 'assinatura_cancelada') {
        icon = '🚫';
        iconColor = '#e74c3c';
    } else if (data.type === 'assinatura_expirada') {
        icon = '⏰';
        iconColor = '#e67e22';
    } else if (data.type === 'pagamento_pendente') {
        icon = '💳';
        iconColor = '#3498db';
    }
    
    modal.innerHTML = `
        <div style="text-align: center; margin-bottom: 30px;">
            <div style="font-size: 64px; margin-bottom: 20px; animation: pulse 2s ease-in-out infinite;">${icon}</div>
            <h2 style="color: ${iconColor}; font-family: 'Crimson Text', serif; font-size: 28px; font-weight: 700; margin-bottom: 15px; letter-spacing: 0.5px;">
                ${data.error}
            </h2>
            <p style="color: var(--color-text-primary, white); font-family: 'Crimson Text', serif; font-size: 18px; line-height: 1.7; font-weight: 400; letter-spacing: 0.5px; margin-bottom: 25px;">
                ${data.message}
            </p>
            <div style="background: rgba(52, 152, 219, 0.1); border-left: 4px solid #3498db; padding: 15px; border-radius: 8px; margin-bottom: 25px; text-align: left;">
                <p style="color: var(--color-text-secondary, #ccc); font-size: 14px; margin: 0;">
                    <strong style="color: #3498db;">💡 Precisa de ajuda?</strong><br>
                    Nossa equipe de suporte está pronta para te ajudar a resolver este problema!
                </p>
            </div>
        </div>
        
        <div style="display: flex; flex-direction: column; gap: 12px;">
            <a href="${data.whatsappLink}" 
               target="_blank"
               id="btn-whatsapp-support"
               style="
                   flex: 1;
                   padding: 16px 24px;
                   border: none;
                   border-radius: 12px;
                   background: linear-gradient(135deg, #25D366, #128C7E);
                   color: white;
                   font-family: 'Crimson Text', serif;
                   font-size: 18px;
                   font-weight: 700;
                   letter-spacing: 0.7px;
                   cursor: pointer;
                   transition: all 0.3s ease;
                   text-decoration: none;
                   display: flex;
                   align-items: center;
                   justify-content: center;
                   gap: 12px;
                   box-shadow: 0 4px 15px rgba(37, 211, 102, 0.3);
               ">
                <span style="font-size: 24px;">📱</span>
                <span>Falar com Suporte</span>
            </a>
            
            <button id="btn-ver-planos" style="
                flex: 1;
                padding: 14px 24px;
                border: 2px solid var(--color-border, #444);
                border-radius: 12px;
                background: transparent;
                color: var(--color-text-primary, white);
                font-family: 'Crimson Text', serif;
                font-size: 16px;
                font-weight: 600;
                letter-spacing: 0.7px;
                cursor: pointer;
                transition: all 0.3s ease;
            ">Ver Planos</button>
        </div>
        
        <p style="text-align: center; color: var(--color-text-tertiary, #888); font-size: 13px; margin-top: 20px;">
            WhatsApp: <strong style="color: #25D366;">(11) 91538-1876</strong>
        </p>
    `;
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    // Adicionar animação de pulse ao ícone
    if (!document.getElementById('assinatura-problema-styles')) {
        const style = document.createElement('style');
        style.id = 'assinatura-problema-styles';
        style.textContent = `
            @keyframes pulse {
                0%, 100% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.1); opacity: 0.8; }
            }
        `;
        document.head.appendChild(style);
    }
    
    const btnWhatsapp = modal.querySelector('#btn-whatsapp-support');
    const btnPlanos = modal.querySelector('#btn-ver-planos');
    
    // Hover no botão WhatsApp
    btnWhatsapp.onmouseover = () => {
        btnWhatsapp.style.transform = 'translateY(-3px) scale(1.02)';
        btnWhatsapp.style.boxShadow = '0 6px 20px rgba(37, 211, 102, 0.5)';
    };
    btnWhatsapp.onmouseout = () => {
        btnWhatsapp.style.transform = 'translateY(0) scale(1)';
        btnWhatsapp.style.boxShadow = '0 4px 15px rgba(37, 211, 102, 0.3)';
    };
    
    // Hover no botão Ver Planos
    btnPlanos.onmouseover = () => {
        btnPlanos.style.background = 'rgba(255, 255, 255, 0.05)';
        btnPlanos.style.borderColor = 'var(--color-primary, #3498db)';
    };
    btnPlanos.onmouseout = () => {
        btnPlanos.style.background = 'transparent';
        btnPlanos.style.borderColor = 'var(--color-border, #444)';
    };
    
    // Click no botão Ver Planos
    btnPlanos.onclick = () => {
        overlay.remove();
        window.location.href = data.redirectTo || '/html/planos.html';
    };
    
    // Fechar ao clicar fora (opcional - remova se quiser forçar o usuário a escolher)
    overlay.onclick = (e) => {
        if (e.target === overlay) {
            overlay.remove();
            window.location.href = data.redirectTo || '/html/planos.html';
        }
    };
}

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
    
    // Verificar se é erro de assinatura (403)
    if (response.status === 403) {
        const data = await response.json();
        
        // Se requer contato com suporte, mostrar modal especial
        if (data.contactSupport) {
            mostrarModalAssinaturaProblema(data);
        } else {
            // Apenas mostrar notificação e redirecionar
            mostrarNotificacao(data.message, 'warning');
            setTimeout(() => {
                window.location.href = data.redirectTo;
            }, 2000);
        }
        
        throw new Error(data.error || 'Assinatura necessária');
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
    console.log('🔄 Mudando modo de autenticação para:', mode);
    
    const loginForm = document.getElementById('login-form');
    const cadastroForm = document.getElementById('cadastro-form');
    const loginTab = document.getElementById('tab-login');
    const cadastroTab = document.getElementById('tab-cadastro');
    
    console.log('Elementos encontrados:', {
        loginForm: !!loginForm,
        cadastroForm: !!cadastroForm,
        loginTab: !!loginTab,
        cadastroTab: !!cadastroTab
    });
    
    if (!loginForm || !cadastroForm || !loginTab || !cadastroTab) {
        console.error('❌ Elementos do modal não encontrados!');
        return;
    }
    
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
    
    console.log('✅ Modo alterado com sucesso');
}

// Função removida - a verificação de assinatura é feita pelo middleware no backend


function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const senha = document.getElementById('login-senha').value;
    
    if (!email || !senha) {
        mostrarNotificacao('Por favor, preencha todos os campos.', 'warning');
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
        } else {
            mostrarNotificacao(data.error || 'Email ou senha incorretos.', 'error');
        }
    })
    .catch(error => {
        console.error('Erro no login:', error);
        mostrarNotificacao('Erro ao fazer login. Tente novamente.', 'error');
    });
}

function handleCadastro(event) {
    event.preventDefault();
    
    const nome = document.getElementById('cadastro-nome').value;
    const email = document.getElementById('cadastro-email').value;
    const senha = document.getElementById('cadastro-senha').value;
    const confirmarSenha = document.getElementById('cadastro-confirmar-senha').value;
    const planoSelecionado = document.querySelector('input[name="plano"]:checked')?.value;
    
    if (!nome || !email || !senha || !confirmarSenha) {
        mostrarNotificacao('Por favor, preencha todos os campos.', 'warning');
        return;
    }
    
    if (senha !== confirmarSenha) {
        mostrarNotificacao('As senhas não coincidem.', 'warning');
        return;
    }
    
    if (senha.length < 6) {
        mostrarNotificacao('A senha deve ter pelo menos 6 caracteres.', 'warning');
        return;
    }
    
    if (!planoSelecionado) {
        mostrarNotificacao('Por favor, selecione um plano.', 'warning');
        return;
    }
    
    // Salvar dados do cadastro temporariamente no localStorage
    const dadosCadastro = {
        nome,
        email,
        senha,
        plano: planoSelecionado,
        timestamp: Date.now()
    };
    
    localStorage.setItem('merfin_cadastro_pendente', JSON.stringify(dadosCadastro));
    
    // Buscar o link de pagamento do plano selecionado
    fetch('http://localhost:5000/api/pagamentos/planos')
        .then(response => response.json())
        .then(data => {
            if (data.success && data.planos[planoSelecionado]) {
                const linkPagamento = data.planos[planoSelecionado].link;
                
                // Adicionar email e plano como parâmetros na URL
                const url = new URL(linkPagamento);
                url.searchParams.append('client_reference_id', email);
                url.searchParams.append('prefilled_email', email);
                
                // Adicionar return_url para indicar retorno do Stripe
                const returnUrl = window.location.origin + window.location.pathname + '?from_stripe=true';
                
                // Informar ao usuário
                mostrarNotificacao('💳 Redirecionando para pagamento...', 'info');
                
                // Redirecionar para o pagamento em nova aba
                window.open(url.toString(), '_blank');
                
                // Mostrar mensagem na página atual
                setTimeout(() => {
                    const msg = document.createElement('div');
                    msg.style.cssText = 'position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: #2a5298; color: white; padding: 15px 30px; border-radius: 8px; z-index: 10000; box-shadow: 0 4px 12px rgba(0,0,0,0.3); text-align: center;';
                    msg.innerHTML = '💳 Complete o pagamento na nova aba<br><small>Após pagar, recarregue esta página</small>';
                    document.body.appendChild(msg);
                }, 1000);
            } else {
                mostrarNotificacao('Erro ao carregar informações do plano. Tente novamente.', 'error');
            }
        })
        .catch(error => {
            console.error('Erro ao buscar plano:', error);
            mostrarNotificacao('Erro ao processar pagamento. Tente novamente.', 'error');
        });
}

function logout() {
    mostrarConfirmacao('Deseja realmente sair?', (confirmado) => {
        if (confirmado) {
            localStorage.removeItem('merfin_token');
            localStorage.removeItem('merfin_user');
            location.href = 'chat.html';
        }
    });
}

// Verificar se usuário voltou do pagamento
async function verificarRetornoPagamento() {
    const cadastroPendente = localStorage.getItem('merfin_cadastro_pendente');
    
    // Se não tem dados pendentes, não fazer nada
    if (!cadastroPendente) {
        return;
    }
    
    // Se tem dados pendentes, verificar se já passou tempo suficiente (mínimo 3 segundos)
    const dados = JSON.parse(cadastroPendente);
    const tempoDecorrido = Date.now() - dados.timestamp;
    
    // Se foi criado há menos de 3 segundos, ainda está sendo processado
    if (tempoDecorrido < 3000) {
        console.log('⏳ Aguardando processamento do pagamento...');
        return;
    }
    
    // Verificar se não expirou (máx 2 horas)
    if (tempoDecorrido > 7200000) {
        console.log('⌛ Dados de cadastro expiraram');
        localStorage.removeItem('merfin_cadastro_pendente');
        return;
    }
    
    // Tentar finalizar cadastro
    console.log('🔍 Tentando finalizar cadastro...');
    
    // Mostrar botão para o usuário clicar se quiser tentar agora
    const existingBtn = document.getElementById('btn-finalizar-cadastro');
    if (!existingBtn) {
        const btnFinalizar = document.createElement('button');
        btnFinalizar.id = 'btn-finalizar-cadastro';
        btnFinalizar.style.cssText = `
            position: fixed;
            top: 24px;
            right: 24px;
            background: linear-gradient(135deg, #27ae60, #2ecc71);
            color: white;
            padding: 18px 32px;
            border: none;
            border-radius: 10px;
            cursor: pointer;
            z-index: 10000;
            font-family: 'Crimson Text', serif;
            font-size: 16px;
            font-weight: 600;
            letter-spacing: 0.7px;
            box-shadow: 0 6px 16px rgba(39, 174, 96, 0.4);
            transition: all 0.3s ease;
            animation: pulse 2s ease-in-out infinite;
        `;
        btnFinalizar.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px;">
                <span style="font-size: 20px;">✓</span>
                <div style="text-align: left;">
                    <div style="font-size: 16px; font-weight: 600;">Completei o pagamento!</div>
                    <div style="font-size: 12px; font-weight: 400; opacity: 0.9;">Clique para finalizar cadastro</div>
                </div>
            </div>
        `;
        btnFinalizar.onmouseover = () => {
            btnFinalizar.style.transform = 'translateY(-2px)';
            btnFinalizar.style.boxShadow = '0 8px 20px rgba(39, 174, 96, 0.5)';
        };
        btnFinalizar.onmouseout = () => {
            btnFinalizar.style.transform = 'translateY(0)';
            btnFinalizar.style.boxShadow = '0 6px 16px rgba(39, 174, 96, 0.4)';
        };
        btnFinalizar.onclick = () => finalizarCadastroManual();
        document.body.appendChild(btnFinalizar);
        
        // Adicionar animação de pulse
        if (!document.getElementById('btn-finalizar-styles')) {
            const style = document.createElement('style');
            style.id = 'btn-finalizar-styles';
            style.textContent = `
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.85; }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // Se tem dados pendentes, finalizar cadastro
    if (cadastroPendente) {
        const dados = JSON.parse(cadastroPendente);
        
        // Verificar se não expirou (máx 2 horas)
        if (Date.now() - dados.timestamp > 7200000) {
            localStorage.removeItem('merfin_cadastro_pendente');
            return;
        }
        
        // Mostrar notificação de processamento
        mostrarNotificacao('⏳ Verificando pagamento...', 'info');
        
        // Aguardar 5 segundos para o webhook processar
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        try {
            // Tentar finalizar cadastro
            const response = await fetch('http://localhost:5000/api/pagamentos/finalizar-cadastro', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(dados)
            });
            
            const data = await response.json();
            
            if (data.success && data.token) {
                // Cadastro concluído com sucesso
                localStorage.setItem('merfin_token', data.token);
                localStorage.setItem('merfin_user', JSON.stringify(data.user));
                localStorage.removeItem('merfin_cadastro_pendente');
                
                processingMsg.textContent = '✅ Pagamento confirmado! Redirecionando...';
                processingMsg.style.background = '#27ae60';
                
                setTimeout(() => {
                    window.location.href = 'chat.html';
                }, 1500);
            } else {
                // Pagamento ainda não processado
                processingMsg.textContent = '⚠️ Pagamento não encontrado. Complete o pagamento para continuar.';
                processingMsg.style.background = '#e74c3c';
                
                setTimeout(() => {
                    processingMsg.remove();
                }, 5000);
            }
        } catch (error) {
            console.error('Erro ao verificar pagamento:', error);
            processingMsg.textContent = '❌ Erro ao verificar pagamento. Tente fazer login.';
            processingMsg.style.background = '#e74c3c';
            
            setTimeout(() => {
                processingMsg.remove();
            }, 5000);
        }
    }
}

// Função para finalizar cadastro manualmente (quando usuário clica no botão)
async function finalizarCadastroManual() {
    const cadastroPendente = localStorage.getItem('merfin_cadastro_pendente');
    
    if (!cadastroPendente) {
        mostrarNotificacao('Nenhum cadastro pendente encontrado.', 'warning');
        return;
    }
    
    const dados = JSON.parse(cadastroPendente);
    
    // Mostrar mensagem de processamento
    const btn = document.getElementById('btn-finalizar-cadastro');
    if (btn) {
        btn.innerHTML = '<div style="display: flex; align-items: center; gap: 12px;"><span style="font-size: 20px;">⏳</span><span>Processando...</span></div>';
        btn.disabled = true;
        btn.style.opacity = '0.7';
    }
    
    mostrarNotificacao('🔍 Verificando pagamento no Stripe...', 'info');
    
    try {
        // Tentar finalizar cadastro
        const response = await fetch('http://localhost:5000/api/pagamentos/finalizar-cadastro', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dados)
        });
        
        const data = await response.json();
        
        if (data.success && data.token) {
            // Cadastro concluído com sucesso
            localStorage.setItem('merfin_token', data.token);
            localStorage.setItem('merfin_user', JSON.stringify(data.user));
            localStorage.removeItem('merfin_cadastro_pendente');
            
            mostrarNotificacao('✅ Cadastro concluído! Redirecionando...', 'success');
            
            if (btn) btn.remove();
            
            setTimeout(() => {
                window.location.href = 'chat.html';
            }, 1500);
        } else {
            // Pagamento ainda não processado
            mostrarNotificacao('⚠️ ' + (data.error || 'Pagamento não confirmado ainda. Aguarde alguns segundos e tente novamente.'), 'warning');
            
            if (btn) {
                btn.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <span style="font-size: 20px;">✓</span>
                        <div style="text-align: left;">
                            <div style="font-size: 16px; font-weight: 600;">Completei o pagamento!</div>
                            <div style="font-size: 12px; font-weight: 400; opacity: 0.9;">Clique para finalizar cadastro</div>
                        </div>
                    </div>
                `;
                btn.disabled = false;
                btn.style.opacity = '1';
            }
        }
    } catch (error) {
        console.error('Erro ao verificar pagamento:', error);
        mostrarNotificacao('❌ Erro ao verificar pagamento. Tente novamente.', 'error');
        
        if (btn) {
            btn.innerHTML = `
                <div style="display: flex; align-items: center; gap: 12px;">
                    <span style="font-size: 20px;">✓</span>
                    <div style="text-align: left;">
                        <div style="font-size: 16px; font-weight: 600;">Completei o pagamento!</div>
                        <div style="font-size: 12px; font-weight: 400; opacity: 0.9;">Clique para finalizar cadastro</div>
                    </div>
                </div>
            `;
            btn.disabled = false;
            btn.style.opacity = '1';
        }
    }
}

document.addEventListener('DOMContentLoaded', function () {
    console.log('🚀 DOMContentLoaded disparado');
    
    // Verificar se voltou do pagamento do Stripe
    verificarRetornoPagamento();
    
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
    
    // Função para adicionar event listeners dos modals (com retry)
    function setupAuthListeners(tentativa = 1) {
        console.log(`🔧 Tentativa ${tentativa} de configurar listeners de autenticação`);
        
        const loginForm = document.getElementById('login-form');
        const cadastroForm = document.getElementById('cadastro-form');
        const tabLogin = document.getElementById('tab-login');
        const tabCadastro = document.getElementById('tab-cadastro');
        
        console.log('📋 Elementos encontrados:', {
            loginForm: !!loginForm,
            cadastroForm: !!cadastroForm,
            tabLogin: !!tabLogin,
            tabCadastro: !!tabCadastro
        });
        
        if (loginForm) {
            loginForm.addEventListener('submit', handleLogin);
            console.log('✅ Listener de login adicionado');
        }
        
        if (cadastroForm) {
            cadastroForm.addEventListener('submit', handleCadastro);
            console.log('✅ Listener de cadastro adicionado');
        }
        
        if (tabLogin) {
            console.log('✅ Tab Login encontrada, adicionando listener');
            tabLogin.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🔵 TAB LOGIN CLICADO!');
                switchAuthMode('login');
            });
        } else {
            console.warn('⚠️ Tab Login NÃO encontrada');
        }
        
        if (tabCadastro) {
            console.log('✅ Tab Cadastro encontrada, adicionando listener');
            tabCadastro.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🟢 TAB CADASTRO CLICADO!');
                switchAuthMode('cadastro');
            });
        } else {
            console.warn('⚠️ Tab Cadastro NÃO encontrada');
        }
        
        // Se não encontrou os elementos e ainda tem tentativas, tenta novamente
        if ((!tabLogin || !tabCadastro) && tentativa < 3) {
            console.log('⏳ Aguardando 500ms para tentar novamente...');
            setTimeout(() => setupAuthListeners(tentativa + 1), 500);
        }
    }
    
    // Executar setup
    setupAuthListeners();
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
    mostrarConfirmacao('Tem certeza que deseja pular? Você pode preencher seu perfil depois.', (confirmado) => {
        if (confirmado) {
            saveOnboardingData(true); // Salvar como não primeira vez mesmo sem dados
        }
    });
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
                mostrarNotificacao('🎉 Perfil configurado com sucesso! Bem-vindo ao Merfin!', 'success');
            }
        } else {
            throw new Error('Erro ao salvar perfil');
        }
    } catch (error) {
        console.error('Erro ao salvar onboarding:', error);
        mostrarNotificacao('Erro ao salvar perfil. Tente novamente.', 'error');
    }
}

// ========== CONTROLE DO PLACEHOLDER DO CHAT ==========

// Função para controlar visibilidade do placeholder
function toggleChatPlaceholder(show = false) {
    const placeholder = document.getElementById('chat-placeholder');
    if (!placeholder) return;
    
    if (show) {
        placeholder.classList.remove('hidden');
    } else {
        placeholder.classList.add('hidden');
    }
}

// Verificar se deve mostrar o placeholder (quando não há mensagens)
function checkChatPlaceholder() {
    const messages = document.getElementById('messages');
    if (!messages) return;
    
    const hasMessages = messages.children.length > 0;
    toggleChatPlaceholder(!hasMessages);
}

// ========== GERENCIAMENTO DE HISTÓRICO DE CONVERSAS ==========

let conversaAtualId = null;
let conversas = [];

// Inicializar sistema de histórico
async function initChatHistory() {
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('🚀 SISTEMA DE HISTÓRICO DE CONVERSAS INICIADO');
    console.log('📅 Data:', new Date().toLocaleString('pt-BR'));
    console.log('═══════════════════════════════════════════════════════════\n');
    await carregarConversas();
    
    // Verificar se deve mostrar o placeholder inicialmente
    setTimeout(() => checkChatPlaceholder(), 100);
}

// Carregar lista de conversas
async function carregarConversas() {
    console.log('\n📚 [INIT] Carregando lista de conversas do servidor...');
    try {
        const response = await fetchAPI('/api/conversas');
        
        if (!response.ok) {
            console.error('❌ [INIT] Erro HTTP:', response.status, response.statusText);
            throw new Error(`Erro HTTP ${response.status}`);
        }
        
        conversas = await response.json();
        
        console.log('✅ [INIT] Conversas carregadas com sucesso!');
        console.log('   Total:', conversas.length);
        
        if (conversas.length > 0) {
            console.log('📋 [INIT] Primeiras conversas:');
            conversas.slice(0, 5).forEach((c, i) => {
                console.log(`   ${i + 1}. [ID: ${c.id}] ${c.titulo}`);
            });
        } else {
            console.log('⚠️ [INIT] Nenhuma conversa encontrada');
        }
    } catch (error) {
        console.error('💥 [INIT] Erro ao carregar conversas:', error.message);
        console.error('   Stack:', error.stack);
    }
}

// Abrir modal de histórico
function abrirModalHistorico() {
    console.log('\n🔓 [MODAL] Abrindo modal de histórico...');
    console.log('   Conversas em cache:', conversas.length);
    console.log('   ConversaAtualId:', conversaAtualId || '(nenhuma)');
    
    // Remover modal existente se houver
    const existingModal = document.getElementById('modal-historico');
    if (existingModal) {
        console.log('   Removendo modal anterior...');
        existingModal.remove();
    }
    
    const modal = criarModalHistorico();
    document.body.appendChild(modal);
    console.log('✅ [MODAL] Modal criado e adicionado ao DOM');
    
    renderizarListaConversas();
    
    // Animação de entrada
    setTimeout(() => {
        modal.classList.add('show');
        console.log('✨ [MODAL] Animação de entrada aplicada');
    }, 10);
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
                <button class="btn-apagar-todos" onclick="apagarTodosChats()">
                    <i class="fas fa-trash-alt"></i> Apagar Todos
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
    console.log('\n🎨 [RENDER] Iniciando renderização da lista de conversas');
    console.log('   Filtro aplicado:', filtro || '(nenhum)');
    console.log('   Total de conversas disponíveis:', conversas.length);
    
    const lista = document.getElementById('lista-conversas');
    if (!lista) {
        console.error('❌ [RENDER] Elemento #lista-conversas não encontrado no DOM!');
        return;
    }
    
    const conversasFiltradas = conversas.filter(c => 
        c.titulo.toLowerCase().includes(filtro.toLowerCase())
    );
    
    console.log('   Conversas após filtro:', conversasFiltradas.length);
    
    if (conversasFiltradas.length > 0) {
        console.log('📋 [RENDER] Lista de conversas a renderizar:');
        conversasFiltradas.forEach((c, i) => {
            console.log(`   ${i + 1}. [ID: ${c.id}] ${c.titulo} (${c.numMensagens} msgs)`);
        });
    }
    
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
    
    // Adicionar event listeners após renderizar (150ms garante DOM pronto)
    setTimeout(() => {
        const conversaItems = document.querySelectorAll('.conversa-item');
        const btnsEditar = document.querySelectorAll('.btn-editar');
        const btnsDeletar = document.querySelectorAll('.btn-deletar');
        
        console.log('📌 Anexando listeners:', {
            conversas: conversaItems.length,
            editButtons: btnsEditar.length,
            deleteButtons: btnsDeletar.length
        });
        
        // Validar se elementos existem
        if (conversaItems.length === 0) {
            console.error('❌ Nenhum elemento .conversa-item encontrado!');
            return;
        }
        
        // Click no CARD INTEIRO para abrir conversa
        conversaItems.forEach(el => {
            el.addEventListener('click', function(e) {
                // Não abrir se clicou em botão de ação
                if (e.target.closest('.btn-editar') || e.target.closest('.btn-deletar')) {
                    console.log('🚫 Clique em botão - não abre conversa');
                    return;
                }
                
                const conversaId = this.getAttribute('data-conversa-id');
                
                console.log('🖱️ Clique no card capturado!', {
                    conversaId: conversaId,
                    elemento: this.querySelector('.conversa-titulo span')?.textContent
                });
                
                if (conversaId && conversaId !== 'undefined' && conversaId !== 'null') {
                    carregarConversa(conversaId);
                } else {
                    console.error('❌ ID inválido no clique:', conversaId);
                    showNotification('Erro: ID de conversa inválido', 'error');
                }
            });
        });
        
        // Botões de editar (com stopPropagation para não abrir conversa)
        btnsEditar.forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation(); // Impede que o clique propague para o card
                const conversaId = this.getAttribute('data-conversa-id');
                console.log('✏️ Botão editar clicado:', conversaId);
                if (conversaId) editarTitulo(conversaId);
            });
        });
        
        // Botões de deletar (com stopPropagation para não abrir conversa)
        btnsDeletar.forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation(); // Impede que o clique propague para o card
                const conversaId = this.getAttribute('data-conversa-id');
                console.log('🗑️ Botão deletar clicado:', conversaId);
                if (conversaId) deletarConversa(conversaId);
            });
        });
        
        console.log('✅ Listeners anexados com sucesso!');
    }, 150);
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
    toggleChatPlaceholder(true); // Mostrar placeholder no novo chat
    showNotification('Novo chat iniciado!', 'success');
}

// Variável para debounce do carregamento
let carregarConversaTimeout = null;
let carregandoConversa = false;

// Carregar conversa específica
async function carregarConversa(conversaId) {
    console.log('\n🚀 [INÍCIO] Tentativa de carregar conversa:', conversaId);
    
    // Validar ID PRIMEIRO (antes de qualquer bloqueio)
    if (!conversaId || conversaId === 'undefined' || conversaId === 'null') {
        console.error('❌ [VALIDAÇÃO] ID inválido:', conversaId);
        showNotification('Erro: ID de conversa inválido', 'error');
        return;
    }
    
    // Evitar carregamento simultâneo
    if (carregandoConversa) {
        console.log('⏳ [LOCK] Já está carregando uma conversa, aguarde...');
        showNotification('Aguarde o carregamento atual...', 'info');
        return;
    }
    
    // Debounce mais curto (300ms em vez de 1 segundo)
    if (carregarConversaTimeout) {
        console.log('⏳ [DEBOUNCE] Clique muito rápido, aguarde 300ms...');
        return;
    }
    
    carregarConversaTimeout = setTimeout(() => {
        carregarConversaTimeout = null;
        console.log('✅ [DEBOUNCE] Liberado para próximo clique');
    }, 300);
    
    carregandoConversa = true;
    console.log('🔐 [LOCK] Ativado - carregando conversa');
    
    try {
        console.log('📡 [HTTP] Fazendo requisição para /api/conversas/' + conversaId);
        showNotification('Carregando conversa...', 'info');
        
        const response = await fetchAPI(`/api/conversas/${conversaId}`);
        
        console.log('📡 [HTTP] Status da resposta:', response.status, response.statusText);
        
        // Verificar se a resposta foi bem-sucedida
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
            console.error('❌ [HTTP] Erro na resposta:', errorData);
            throw new Error(errorData.error || `Erro HTTP ${response.status}`);
        }
        
        const conversa = await response.json();
        
        console.log('📦 [DADOS] Conversa recebida:', {
            id: conversa._id,
            titulo: conversa.titulo,
            numMensagens: conversa.mensagens?.length || 0,
            primeiraMsg: conversa.mensagens?.[0]?.conteudo?.substring(0, 50)
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
            console.log('📝 [RENDER] Renderizando', conversa.mensagens.length, 'mensagens...');
            
            let mensagensRenderizadas = 0;
            conversa.mensagens.forEach((msg, index) => {
                if (!msg.conteudo) {
                    console.warn('⚠️ [RENDER] Mensagem sem conteúdo no índice', index);
                    return;
                }
                
                const el = document.createElement('div');
                el.className = `message ${msg.tipo === 'user' ? 'user' : 'bot'}`;
                el.innerText = msg.conteudo;
                chatMessages.appendChild(el);
                mensagensRenderizadas++;
            });
            
            console.log('✅ [RENDER] ' + mensagensRenderizadas + ' mensagens renderizadas com sucesso!');
        } else {
            console.log('⚠️ [RENDER] Conversa vazia - sem mensagens');
        }
        
        // Scroll para o final
        setTimeout(() => {
            chatMessages.scrollTop = chatMessages.scrollHeight;
            console.log('📜 [SCROLL] Posicionado no final do chat');
        }, 100);
        
        console.log('❌ [MODAL] Fechando modal de histórico...');
        fecharModalHistorico();
        
        // Esconder placeholder se há mensagens carregadas
        if (conversa.mensagens && conversa.mensagens.length > 0) {
            toggleChatPlaceholder(false);
        }
        
        console.log('✅ [SUCESSO] Conversa carregada completamente!\n');
        showNotification('Conversa carregada!', 'success');
        
    } catch (error) {
        console.error('❌ [ERRO] Falha ao carregar conversa:', {
            conversaId: conversaId,
            erro: error.message,
            stack: error.stack
        });
        showNotification('Erro: ' + error.message, 'error');
    } finally {
        carregandoConversa = false;
        console.log('🔓 [LOCK] Liberado - carregamento finalizado\n');
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
    mostrarConfirmacao('Tem certeza que deseja deletar esta conversa?', async (confirmado) => {
        if (!confirmado) return;
        
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
    });
}

// Apagar todas as conversas
async function apagarTodosChats() {
    mostrarConfirmacao('⚠️ ATENÇÃO: Esta ação irá deletar TODAS as suas conversas permanentemente. Tem certeza?', async (confirmado) => {
        if (!confirmado) return;
        
        try {
            const response = await fetchAPI('/api/conversas', {
                method: 'DELETE'
            });
            
            const data = await response.json();
            
            // Limpar conversa atual
            conversaAtualId = null;
            const chatMessages = document.getElementById('messages');
            if (chatMessages) chatMessages.innerHTML = '';
            
            // Limpar lista local
            conversas = [];
            renderizarListaConversas();
            
            showNotification(`Todas as conversas foram deletadas! (${data.deletedCount} conversas)`, 'success');
        } catch (error) {
            console.error('Erro ao apagar todos os chats:', error);
            showNotification('Erro ao apagar todos os chats', 'error');
        }
    });
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

