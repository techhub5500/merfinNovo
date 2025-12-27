const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config({ path: __dirname + '/.env' });

// Debug: verificar se as variáveis estão sendo carregadas
console.log('🔍 Verificando variáveis de ambiente:');
console.log('MONGO_URI:', process.env.MONGO_URI ? '✅ Definida' : '❌ Indefinida');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✅ Definida' : '❌ Indefinida');
console.log('PORT:', process.env.PORT ? '✅ Definida' : '❌ Indefinida');

const app = express();

// Middlewares
app.use(cors());

// Log de todas as requisições (DEBUG)
app.use((req, res, next) => {
    console.log(`\n📨 [${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// ⚠️ IMPORTANTE: Webhook do Stripe precisa do body RAW
// Esta rota DEVE vir ANTES do express.json()
app.use('/api/pagamentos/webhook', express.raw({ type: 'application/json' }));

// Agora sim podemos usar express.json() para as outras rotas
app.use(express.json());

// Servir arquivos estáticos da pasta client
app.use(express.static(path.join(__dirname, '../client')));

// Conexão com MongoDB (versão atualizada - sem opções deprecadas)
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('✅ Conectado ao MongoDB com sucesso!');
    })
    .catch((error) => {
        console.error('❌ Erro ao conectar ao MongoDB:', error);
    });

// ========== SCHEMAS E MODELS ==========

// Schema de Usuário
const userSchema = new mongoose.Schema({
    nome: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    senha: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Schema de Perfil
const perfilSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isFirstLogin: { type: Boolean, default: true }, // Flag para verificar primeira vez
    nome: String,
    idade: Number,
    profissao: String,
    cidade: String,
    estado: String,
    sobre: String,
    fundoEmergencia: Number,
    prazoFundo: Number,
    metaCurto: {
        descricao: String,
        valor: Number,
        prazo: Number,
        progresso: { type: Number, default: 0 }, // Valor acumulado atual
        ultimaAtualizacao: { type: Date, default: Date.now }
    },
    metaLongo: {
        descricao: String,
        valor: Number,
        prazo: Number,
        progresso: { type: Number, default: 0 }, // Valor acumulado atual
        ultimaAtualizacao: { type: Date, default: Date.now }
    },
    patrimonio: {
        acoes: { type: Number, default: 0 },
        fundos: { type: Number, default: 0 },
        tesouro: { type: Number, default: 0 },
        cdb: { type: Number, default: 0 },
        poupanca: { type: Number, default: 0 },
        imoveis: { type: Number, default: 0 },
        veiculos: { type: Number, default: 0 },
        cripto: { type: Number, default: 0 },
        previdencia: { type: Number, default: 0 },
        outros: { type: Number, default: 0 }
    },
    numDependentes: Number,
    unicaRenda: String,
    rendaConjugue: Number,
    updatedAt: { type: Date, default: Date.now }
});

const Perfil = mongoose.model('Perfil', perfilSchema);

// Schema de Dívidas
const dividaSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    nome: { type: String, required: true },
    tipo: { type: String, required: true },
    valorTotal: { type: Number, required: true },
    numParcelas: { type: Number, required: true },
    dataFim: { type: Date, required: true },
    parcelas: [{
        numero: Number,
        data: Date,
        valor: Number,
        paga: { type: Boolean, default: false }
    }],
    createdAt: { type: Date, default: Date.now }
});

const Divida = mongoose.model('Divida', dividaSchema);

// Schema de Dados Financeiros Mensais
const financasMensaisSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    mesAno: { type: String, required: true }, // Formato: "YYYY-MM"
    receitas: [{
        data: { type: String, required: false }, // Alterado para String para manter formato YYYY-MM-DD
        descricao: String,
        categoria: String,
        subcategoria: String,
        valor: Number,
        status: String
    }],
    despesas: [{
        data: { type: String, required: false }, // Alterado para String para manter formato YYYY-MM-DD
        descricao: String,
        categoria: String,
        subcategoria: String,
        valor: Number,
        formaPagamento: String,
        status: String
    }],
    updatedAt: { type: Date, default: Date.now }
});

// Index composto para buscar por usuário e mês rapidamente
financasMensaisSchema.index({ userId: 1, mesAno: 1 }, { unique: true });

const FinancasMensais = mongoose.model('FinancasMensais', financasMensaisSchema);

// Schema de Notas
const notaSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    pagina: { type: Number, required: true },
    conteudo: { type: String, default: '' },
    updatedAt: { type: Date, default: Date.now }
});

const Nota = mongoose.model('Nota', notaSchema);

// Schema de Conversas do Chat
const conversaSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    titulo: { type: String, default: 'Nova Conversa' },
    mensagens: [{
        tipo: { type: String, enum: ['user', 'assistant'], required: true },
        conteudo: String,
        timestamp: { type: Date, default: Date.now },
        sectionsUsed: [String],
        timeframe: Object
    }],
    resumo: { type: String, default: '' },
    ultimoResumoAt: Date,
    palavrasResumo: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const Conversa = mongoose.model('Conversa', conversaSchema);

// Schema de Assinatura (Sistema de Pagamentos)
const subscriptionSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true,
        unique: true
    },
    stripeCustomerId: { 
        type: String, 
        required: true 
    },
    stripeSubscriptionId: { 
        type: String, 
        required: true 
    },
    status: { 
        type: String, 
        enum: ['pendente', 'ativo', 'cancelado', 'expirado'],
        default: 'pendente'
    },
    plano: {
        type: String,
        enum: ['basico', 'premium', 'empresarial'],
        required: true
    },
    validoAte: { 
        type: Date, 
        required: true 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
    updatedAt: { 
        type: Date, 
        default: Date.now 
    }
});

subscriptionSchema.index({ userId: 1 });
subscriptionSchema.index({ stripeSubscriptionId: 1 });

const Subscription = mongoose.model('Subscription', subscriptionSchema);

// ========== MIDDLEWARE DE AUTENTICAÇÃO ==========

const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
        return res.status(401).json({ error: 'Token não fornecido' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'merfin_secret_key_2025');
        req.userId = decoded.userId;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Token inválido' });
    }
};

// Middleware para verificar assinatura ativa
const checkSubscription = async (req, res, next) => {
    try {
        const assinatura = await Subscription.findOne({ userId: req.userId });
        
        // Se não tem assinatura
        if (!assinatura) {
            return res.status(403).json({ 
                error: 'Assinatura necessária',
                message: 'Você precisa ter uma assinatura ativa para acessar esta funcionalidade.',
                type: 'sem_assinatura',
                redirectTo: '/html/planos.html'
            });
        }

        // Se a assinatura está pendente (pagamento não processado ou falhou)
        if (assinatura.status === 'pendente') {
            return res.status(403).json({ 
                error: 'Assinatura pendente',
                message: 'Seu pagamento está pendente ou falhou. Por favor, regularize sua situação.',
                type: 'pagamento_pendente',
                contactSupport: true,
                whatsapp: '5511915381876',
                whatsappLink: 'https://wa.me/5511915381876?text=Olá!%20Preciso%20de%20ajuda%20com%20minha%20assinatura%20do%20Merfin.',
                redirectTo: '/html/planos.html'
            });
        }

        // Se a assinatura está cancelada
        if (assinatura.status === 'cancelado') {
            return res.status(403).json({ 
                error: 'Assinatura cancelada',
                message: 'Sua assinatura foi cancelada. Para continuar usando o Merfin, reative sua assinatura ou entre em contato com o suporte.',
                type: 'assinatura_cancelada',
                contactSupport: true,
                whatsapp: '5511915381876',
                whatsappLink: 'https://wa.me/5511915381876?text=Olá!%20Minha%20assinatura%20foi%20cancelada%20e%20preciso%20de%20ajuda.',
                redirectTo: '/html/planos.html'
            });
        }

        // Se a assinatura está expirada
        if (assinatura.status === 'expirado') {
            return res.status(403).json({ 
                error: 'Assinatura expirada',
                message: 'Sua assinatura expirou. Renove para continuar usando a plataforma.',
                type: 'assinatura_expirada',
                contactSupport: true,
                whatsapp: '5511915381876',
                whatsappLink: 'https://wa.me/5511915381876?text=Olá!%20Minha%20assinatura%20expirou%20e%20preciso%20de%20ajuda%20para%20renovar.',
                redirectTo: '/html/planos.html'
            });
        }

        // Verificar se a assinatura expirou (mesmo se marcada como ativo)
        if (assinatura.validoAte < new Date()) {
            assinatura.status = 'expirado';
            await assinatura.save();
            
            return res.status(403).json({ 
                error: 'Assinatura expirada',
                message: 'Sua assinatura expirou em ' + assinatura.validoAte.toLocaleDateString('pt-BR') + '. Renove para continuar.',
                type: 'assinatura_expirada',
                contactSupport: true,
                whatsapp: '5511915381876',
                whatsappLink: 'https://wa.me/5511915381876?text=Olá!%20Minha%20assinatura%20expirou%20e%20preciso%20renovar.',
                redirectTo: '/html/planos.html'
            });
        }

        // Assinatura ativa - permite acesso
        req.subscription = assinatura;
        next();
    } catch (error) {
        console.error('❌ Erro ao verificar assinatura:', error);
        return res.status(500).json({ error: 'Erro ao verificar assinatura' });
    }
};


// ========== ROTAS DE AUTENTICAÇÃO ==========

// Cadastro
app.post('/api/auth/cadastro', async (req, res) => {
    try {
        const { nome, email, senha } = req.body;

        // Validações
        if (!nome || !email || !senha) {
            return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
        }

        if (senha.length < 6) {
            return res.status(400).json({ error: 'A senha deve ter no mínimo 6 caracteres' });
        }

        // Verificar se o email já existe
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ error: 'Email já cadastrado' });
        }

        // Hash da senha
        const hashedPassword = await bcrypt.hash(senha, 10);

        // Criar usuário
        const user = new User({
            nome,
            email,
            senha: hashedPassword
        });

        await user.save();

        // Gerar token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET || 'merfin_secret_key_2025',
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'Usuário cadastrado com sucesso',
            token,
            user: {
                id: user._id,
                nome: user.nome,
                email: user.email
            }
        });

    } catch (error) {
        console.error('Erro no cadastro:', error);
        res.status(500).json({ error: 'Erro ao cadastrar usuário' });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, senha } = req.body;

        // Validações
        if (!email || !senha) {
            return res.status(400).json({ error: 'Email e senha são obrigatórios' });
        }

        // Buscar usuário
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Email ou senha incorretos' });
        }

        // Verificar senha
        const isPasswordValid = await bcrypt.compare(senha, user.senha);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Email ou senha incorretos' });
        }

        // Gerar token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET || 'merfin_secret_key_2025',
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Login realizado com sucesso',
            token,
            user: {
                id: user._id,
                nome: user.nome,
                email: user.email
            }
        });

    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ error: 'Erro ao realizar login' });
    }
});

// Verificar token
app.get('/api/auth/verify', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-senha');
        res.json({ user });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao verificar token' });
    }
});

// ========== ROTAS DE PERFIL ==========

// Buscar perfil do usuário
app.get('/api/perfil', authMiddleware, async (req, res) => {
    try {
        let perfil = await Perfil.findOne({ userId: req.userId });
        
        // Se não existir, criar um perfil vazio
        if (!perfil) {
            perfil = new Perfil({ 
                userId: req.userId,
                isFirstLogin: true // Marca como primeira vez
            });
            await perfil.save();
        }

        res.json(perfil);
    } catch (error) {
        console.error('Erro ao buscar perfil:', error);
        res.status(500).json({ error: 'Erro ao buscar perfil' });
    }
});

// Salvar/Atualizar perfil
app.post('/api/perfil', authMiddleware, async (req, res) => {
    try {
        const perfilData = req.body;
        perfilData.userId = req.userId;
        perfilData.updatedAt = new Date();
        
        // Marcar isFirstLogin como false após primeiro salvamento
        if (perfilData.isFirstLogin !== undefined) {
            perfilData.isFirstLogin = false;
        }

        const perfil = await Perfil.findOneAndUpdate(
            { userId: req.userId },
            perfilData,
            { new: true, upsert: true }
        );

        res.json({ message: 'Perfil salvo com sucesso', perfil });
    } catch (error) {
        console.error('Erro ao salvar perfil:', error);
        res.status(500).json({ error: 'Erro ao salvar perfil' });
    }
});

// ========== ROTAS DE DÍVIDAS ==========

// Buscar todas as dívidas do usuário
app.get('/api/dividas', authMiddleware, async (req, res) => {
    try {
        const dividas = await Divida.find({ userId: req.userId }).sort({ createdAt: -1 });
        res.json(dividas);
    } catch (error) {
        console.error('Erro ao buscar dívidas:', error);
        res.status(500).json({ error: 'Erro ao buscar dívidas' });
    }
});

// Criar nova dívida
app.post('/api/dividas', authMiddleware, async (req, res) => {
    try {
        const { nome, tipo, valorTotal, numParcelas, dataFim } = req.body;

        // Calcular parcelas
        const valorParcela = valorTotal / numParcelas;
        const dataFinal = new Date(dataFim);
        const parcelas = [];

        for (let i = 0; i < numParcelas; i++) {
            const data = new Date(dataFinal);
            data.setMonth(data.getMonth() - (numParcelas - 1 - i));
            
            parcelas.push({
                numero: i + 1,
                data: data,
                valor: valorParcela,
                paga: false
            });
        }

        const divida = new Divida({
            userId: req.userId,
            nome,
            tipo,
            valorTotal,
            numParcelas,
            dataFim: dataFinal,
            parcelas
        });

        await divida.save();

        res.status(201).json({ message: 'Dívida criada com sucesso', divida });
    } catch (error) {
        console.error('Erro ao criar dívida:', error);
        res.status(500).json({ error: 'Erro ao criar dívida' });
    }
});

// Atualizar status de parcela (paga/não paga)
app.patch('/api/dividas/:dividaId/parcela/:parcelaId', authMiddleware, async (req, res) => {
    try {
        const { dividaId, parcelaId } = req.params;
        const { paga } = req.body;

        const divida = await Divida.findOne({ _id: dividaId, userId: req.userId });
        
        if (!divida) {
            return res.status(404).json({ error: 'Dívida não encontrada' });
        }

        const parcela = divida.parcelas.id(parcelaId);
        if (!parcela) {
            return res.status(404).json({ error: 'Parcela não encontrada' });
        }

        parcela.paga = paga;
        await divida.save();

        res.json({ message: 'Parcela atualizada com sucesso', divida });
    } catch (error) {
        console.error('Erro ao atualizar parcela:', error);
        res.status(500).json({ error: 'Erro ao atualizar parcela' });
    }
});

// Deletar dívida
app.delete('/api/dividas/:dividaId', authMiddleware, async (req, res) => {
    try {
        const { dividaId } = req.params;

        const result = await Divida.deleteOne({ _id: dividaId, userId: req.userId });

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Dívida não encontrada' });
        }

        res.json({ message: 'Dívida deletada com sucesso' });
    } catch (error) {
        console.error('Erro ao deletar dívida:', error);
        res.status(500).json({ error: 'Erro ao deletar dívida' });
    }
});

// ========== ROTAS DE FINANÇAS MENSAIS ==========

// Buscar dados financeiros de um mês específico
app.get('/api/financas/:mesAno', authMiddleware, async (req, res) => {
    try {
        const { mesAno } = req.params; // Formato: "YYYY-MM"

        let financas = await FinancasMensais.findOne({ 
            userId: req.userId, 
            mesAno 
        });

        // Se não existir, criar registro vazio
        if (!financas) {
            financas = new FinancasMensais({
                userId: req.userId,
                mesAno,
                receitas: [],
                despesas: []
            });
            await financas.save();
        }

        res.json(financas);
    } catch (error) {
        console.error('Erro ao buscar finanças:', error);
        res.status(500).json({ error: 'Erro ao buscar finanças' });
    }
});

// Buscar múltiplos meses (para dashboard com filtros)
// IMPORTANTE: Esta rota deve vir ANTES de /api/financas/:mesAno
app.post('/api/financas/multiplos-meses', authMiddleware, async (req, res) => {
    try {
        const { meses } = req.body; // Array de strings: ["2025-12", "2025-11", ...]

        const financas = await FinancasMensais.find({
            userId: req.userId,
            mesAno: { $in: meses }
        });

        res.json(financas);
    } catch (error) {
        console.error('Erro ao buscar múltiplos meses:', error);
        res.status(500).json({ error: 'Erro ao buscar múltiplos meses' });
    }
});

// Salvar/Atualizar dados financeiros de um mês
app.post('/api/financas/:mesAno', authMiddleware, async (req, res) => {
    try {
        const { mesAno } = req.params;
        const { receitas, despesas } = req.body;

        const financas = await FinancasMensais.findOneAndUpdate(
            { userId: req.userId, mesAno },
            { 
                receitas, 
                despesas,
                updatedAt: new Date()
            },
            { new: true, upsert: true }
        );

        res.json({ message: 'Finanças salvas com sucesso', financas });
    } catch (error) {
        console.error('Erro ao salvar finanças:', error);
        res.status(500).json({ error: 'Erro ao salvar finanças' });
    }
});

// ========== ROTAS DE NOTAS ==========

// Buscar todas as notas do usuário
app.get('/api/notas', authMiddleware, async (req, res) => {
    try {
        const notas = await Nota.find({ userId: req.userId }).sort({ pagina: 1 });
        res.json(notas);
    } catch (error) {
        console.error('Erro ao buscar notas:', error);
        res.status(500).json({ error: 'Erro ao buscar notas' });
    }
});

// Buscar nota específica por página
app.get('/api/notas/:pagina', authMiddleware, async (req, res) => {
    try {
        const { pagina } = req.params;

        let nota = await Nota.findOne({ 
            userId: req.userId, 
            pagina: parseInt(pagina) 
        });

        // Se não existir, criar nota vazia
        if (!nota) {
            nota = new Nota({
                userId: req.userId,
                pagina: parseInt(pagina),
                conteudo: ''
            });
            await nota.save();
        }

        res.json(nota);
    } catch (error) {
        console.error('Erro ao buscar nota:', error);
        res.status(500).json({ error: 'Erro ao buscar nota' });
    }
});

// Salvar/Atualizar nota
app.post('/api/notas/:pagina', authMiddleware, async (req, res) => {
    try {
        const { pagina } = req.params;
        const { conteudo } = req.body;

        const nota = await Nota.findOneAndUpdate(
            { userId: req.userId, pagina: parseInt(pagina) },
            { 
                conteudo,
                updatedAt: new Date()
            },
            { new: true, upsert: true }
        );

        res.json({ message: 'Nota salva com sucesso', nota });
    } catch (error) {
        console.error('Erro ao salvar nota:', error);
        res.status(500).json({ error: 'Erro ao salvar nota' });
    }
});

// Deletar nota
app.delete('/api/notas/:pagina', authMiddleware, async (req, res) => {
    try {
        const { pagina } = req.params;

        const result = await Nota.deleteOne({ 
            userId: req.userId, 
            pagina: parseInt(pagina) 
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Nota não encontrada' });
        }

        res.json({ message: 'Nota deletada com sucesso' });
    } catch (error) {
        console.error('Erro ao deletar nota:', error);
        res.status(500).json({ error: 'Erro ao deletar nota' });
    }
});

// ========== ROTAS DE CONVERSAS (HISTÓRICO DE CHAT) ==========

// Buscar todas as conversas do usuário
app.get('/api/conversas', authMiddleware, async (req, res) => {
    try {
        const conversas = await Conversa.find({ userId: req.userId })
            .select('titulo resumo createdAt updatedAt mensagens')
            .sort({ updatedAt: -1 });
        
        res.json(conversas);
    } catch (error) {
        console.error('Erro ao buscar conversas:', error);
        res.status(500).json({ error: 'Erro ao buscar conversas' });
    }
});

// Buscar conversa específica por ID
app.get('/api/conversas/:conversaId', authMiddleware, async (req, res) => {
    const timestamp = new Date().toISOString();
    try {
        const { conversaId } = req.params;
        
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📥 [REQUISIÇÃO] GET /api/conversas/:conversaId');
        console.log('⏰ Timestamp:', timestamp);
        console.log('🆔 ConversaId recebido:', conversaId);
        console.log('👤 UserId do token:', req.userId);
        console.log('🔐 Token válido:', !!req.userId);
        
        // Validar se o ID é um ObjectId válido do MongoDB
        if (!mongoose.Types.ObjectId.isValid(conversaId)) {
            console.error('❌ [VALIDAÇÃO] ID não é um ObjectId válido do MongoDB');
            console.error('   Tipo recebido:', typeof conversaId);
            console.error('   Valor:', conversaId);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
            return res.status(400).json({ error: 'ID de conversa inválido' });
        }
        
        console.log('✅ [VALIDAÇÃO] ObjectId válido');
        console.log('🔍 [MONGODB] Iniciando busca no banco...');
        console.log('   Query: { _id:', conversaId, ', userId:', req.userId, '}');
        
        const conversa = await Conversa.findOne({ 
            _id: conversaId, 
            userId: req.userId 
        });
        
        if (!conversa) {
            console.error('❌ [MONGODB] Conversa NÃO encontrada no banco');
            console.error('   Possíveis causas:');
            console.error('   1. Conversa foi deletada');
            console.error('   2. ConversaId não existe');
            console.error('   3. UserId não corresponde (conversa de outro usuário)');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
            return res.status(404).json({ error: 'Conversa não encontrada' });
        }
        
        console.log('✅ [MONGODB] Conversa ENCONTRADA!');
        console.log('📊 [DADOS] Informações da conversa:');
        console.log('   ID:', conversa._id);
        console.log('   Título:', conversa.titulo);
        console.log('   Mensagens:', conversa.mensagens.length);
        console.log('   Criada em:', conversa.createdAt);
        console.log('   Atualizada em:', conversa.updatedAt);
        
        if (conversa.mensagens.length > 0) {
            console.log('📝 [MENSAGENS] Primeiras mensagens:');
            conversa.mensagens.slice(0, 3).forEach((msg, i) => {
                console.log(`   ${i + 1}. [${msg.tipo}] ${msg.conteudo.substring(0, 50)}...`);
            });
        }
        
        console.log('📤 [RESPOSTA] Enviando conversa para o cliente...');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        
        res.json(conversa);
    } catch (error) {
        console.error('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('💥 [ERRO CRÍTICO] Falha ao buscar conversa');
        console.error('📛 Tipo de erro:', error.name);
        console.error('💬 Mensagem:', error.message);
        console.error('📚 Stack trace:', error.stack);
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        res.status(500).json({ error: 'Erro ao buscar conversa: ' + error.message });
    }
});

// Criar nova conversa
app.post('/api/conversas', authMiddleware, async (req, res) => {
    try {
        const { titulo } = req.body;
        
        const conversa = new Conversa({
            userId: req.userId,
            titulo: titulo || 'Nova Conversa',
            mensagens: []
        });
        
        await conversa.save();
        
        res.status(201).json({ 
            message: 'Conversa criada com sucesso', 
            conversa 
        });
    } catch (error) {
        console.error('Erro ao criar conversa:', error);
        res.status(500).json({ error: 'Erro ao criar conversa' });
    }
});

// Adicionar mensagem a uma conversa
app.post('/api/conversas/:conversaId/mensagem', authMiddleware, async (req, res) => {
    try {
        const { conversaId } = req.params;
        const { tipo, conteudo, sectionsUsed, timeframe } = req.body;
        
        const conversa = await Conversa.findOne({ 
            _id: conversaId, 
            userId: req.userId 
        });
        
        if (!conversa) {
            return res.status(404).json({ error: 'Conversa não encontrada' });
        }
        
        conversa.mensagens.push({
            tipo,
            conteudo,
            sectionsUsed,
            timeframe,
            timestamp: new Date()
        });
        
        conversa.updatedAt = new Date();
        
        // Atualizar título automaticamente com a primeira mensagem do usuário
        if (conversa.mensagens.length === 1 && tipo === 'user') {
            conversa.titulo = conteudo.substring(0, 50) + (conteudo.length > 50 ? '...' : '');
        }
        
        await conversa.save();
        
        res.json({ 
            message: 'Mensagem adicionada com sucesso', 
            conversa 
        });
    } catch (error) {
        console.error('Erro ao adicionar mensagem:', error);
        res.status(500).json({ error: 'Erro ao adicionar mensagem' });
    }
});

// Atualizar título da conversa
app.patch('/api/conversas/:conversaId/titulo', authMiddleware, async (req, res) => {
    try {
        const { conversaId } = req.params;
        const { titulo } = req.body;
        
        const conversa = await Conversa.findOneAndUpdate(
            { _id: conversaId, userId: req.userId },
            { titulo, updatedAt: new Date() },
            { new: true }
        );
        
        if (!conversa) {
            return res.status(404).json({ error: 'Conversa não encontrada' });
        }
        
        res.json({ 
            message: 'Título atualizado com sucesso', 
            conversa 
        });
    } catch (error) {
        console.error('Erro ao atualizar título:', error);
        res.status(500).json({ error: 'Erro ao atualizar título' });
    }
});

// Deletar TODAS as conversas do usuário (deve vir ANTES da rota específica)
app.delete('/api/conversas', authMiddleware, async (req, res) => {
    console.log('🗑️ [DEBUG] DELETE /api/conversas chamado');
    try {
        const result = await Conversa.deleteMany({ userId: req.userId });
        
        res.json({ 
            message: 'Todas as conversas foram deletadas com sucesso',
            deletedCount: result.deletedCount
        });
    } catch (error) {
        console.error('Erro ao deletar todas as conversas:', error);
        res.status(500).json({ error: 'Erro ao deletar todas as conversas' });
    }
});

// Deletar conversa específica
app.delete('/api/conversas/:conversaId', authMiddleware, async (req, res) => {
    try {
        const { conversaId } = req.params;
        
        const result = await Conversa.deleteOne({ 
            _id: conversaId, 
            userId: req.userId 
        });
        
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Conversa não encontrada' });
        }
        
        res.json({ message: 'Conversa deletada com sucesso' });
    } catch (error) {
        console.error('Erro ao deletar conversa:', error);
        res.status(500).json({ error: 'Erro ao deletar conversa' });
    }
});

// Buscar resumo de uma conversa
app.get('/api/conversas/:conversaId/resumo', authMiddleware, async (req, res) => {
    try {
        const { conversaId } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(conversaId)) {
            return res.status(400).json({ error: 'ID de conversa inválido' });
        }
        
        const conversa = await Conversa.findOne({ 
            _id: conversaId, 
            userId: req.userId 
        }).select('resumo ultimoResumoAt palavrasResumo');
        
        if (!conversa) {
            return res.status(404).json({ error: 'Conversa não encontrada' });
        }
        
        res.json({
            resumo: conversa.resumo || '',
            ultimoResumoAt: conversa.ultimoResumoAt,
            palavrasResumo: conversa.palavrasResumo || 0
        });
    } catch (error) {
        console.error('Erro ao buscar resumo:', error);
        res.status(500).json({ error: 'Erro ao buscar resumo' });
    }
});

// Atualizar resumo de uma conversa
app.patch('/api/conversas/:conversaId/resumo', authMiddleware, async (req, res) => {
    try {
        const { conversaId } = req.params;
        const { resumo, palavrasResumo } = req.body;
        
        if (!mongoose.Types.ObjectId.isValid(conversaId)) {
            return res.status(400).json({ error: 'ID de conversa inválido' });
        }
        
        const conversa = await Conversa.findOneAndUpdate(
            { _id: conversaId, userId: req.userId },
            { 
                resumo,
                palavrasResumo: palavrasResumo || 0,
                ultimoResumoAt: new Date(),
                updatedAt: new Date()
            },
            { new: true }
        );
        
        if (!conversa) {
            return res.status(404).json({ error: 'Conversa não encontrada' });
        }
        
        console.log('📝 Resumo atualizado:', conversaId, '- Palavras:', palavrasResumo);
        
        res.json({ 
            message: 'Resumo atualizado com sucesso',
            resumo: conversa.resumo,
            palavrasResumo: conversa.palavrasResumo
        });
    } catch (error) {
        console.error('Erro ao atualizar resumo:', error);
        res.status(500).json({ error: 'Erro ao atualizar resumo' });
    }
});

// ========== ROTA DE STATUS ==========

app.get('/api/status', (req, res) => {
    res.json({ 
        status: 'online', 
        message: 'Servidor Operacional Merfin rodando',
        database: mongoose.connection.readyState === 1 ? 'conectado' : 'desconectado'
    });
});

// Rota de teste sem auth
app.get('/api/test', (req, res) => {
    res.json({ message: 'API funcionando', timestamp: new Date().toISOString() });
});

// ========== INTEGRAÇÃO COM SISTEMA DE PAGAMENTOS ==========

// Importar e usar as rotas de pagamento do Stripe
const stripePaymentsRouter = require('./stripePayments');

// Usar as rotas de pagamento (o webhook já está configurado dentro do stripePayments.js)
app.use('/api/pagamentos', stripePaymentsRouter);

// Exportar o modelo Subscription para uso no stripePayments.js
module.exports.models = {
    User,
    Subscription,
    Perfil,
    Divida,
    FinancasMensais,
    Nota,
    Conversa
};

// ========== INICIAR SERVIDOR ==========

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Servidor Operacional rodando na porta ${PORT}`);
    console.log(`📊 API Status: http://localhost:${PORT}/api/status`);
    console.log(`🌐 Frontend: http://localhost:${PORT}/html/chat.html`);
    console.log(`💡 Acesse o Merfin em: http://localhost:${PORT}/html/index.html`);
});
