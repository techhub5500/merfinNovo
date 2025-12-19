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
        prazo: Number
    },
    metaLongo: {
        descricao: String,
        valor: Number,
        prazo: Number
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

// ========== ROTA DE STATUS ==========

app.get('/api/status', (req, res) => {
    res.json({ 
        status: 'online', 
        message: 'Servidor Operacional Merfin rodando',
        database: mongoose.connection.readyState === 1 ? 'conectado' : 'desconectado'
    });
});

// ========== INICIAR SERVIDOR ==========

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Servidor Operacional rodando na porta ${PORT}`);
    console.log(`📊 API Status: http://localhost:${PORT}/api/status`);
    console.log(`🌐 Frontend: http://localhost:${PORT}/html/chat.html`);
    console.log(`💡 Acesse o Merfin em: http://localhost:${PORT}/html/index.html`);
});
