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
