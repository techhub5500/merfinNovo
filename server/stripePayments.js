const express = require('express');
const router = express.Router();
require('dotenv').config({ path: __dirname + '/.env' });

// Importar o Stripe (será necessário instalar: npm install stripe)
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Variável para armazenar os models (será preenchida quando o módulo for carregado)
let User, Subscription;

// Função para inicializar os models após serem exportados
const initModels = () => {
    const models = require('./serverOperacional').models;
    User = models.User;
    Subscription = models.Subscription;
};

// Tentar carregar os models (pode falhar na primeira vez, mas será resolvido após o carregamento completo)
setTimeout(initModels, 100);

// ========== CONFIGURAÇÃO DOS PLANOS ==========
// Links de pagamento configurados no Stripe
const PLANOS = {
    mensal: {
        nome: 'Plano Mensal',
        preco: 'R$ 20,00/mês',
        precoNumerico: 20.00,
        link: process.env.STRIPE_PAYMENT_LINK_MENSAL,
        recursos: [
            '✅ Gestão financeira completa',
            '✅ Chat com IA personalizada',
            '✅ Relatórios mensais',
            '✅ Suporte por email'
        ]
    },
    anual: {
        nome: 'Plano Anual',
        preco: 'R$ 190,00/ano',
        precoNumerico: 190.00,
        economia: 'R$ 50,00',
        link: process.env.STRIPE_PAYMENT_LINK_ANUAL,
        recursos: [
            '✅ Tudo do Plano Mensal',
            '🎁 Economize R$ 50,00/ano',
            '✅ Relatórios avançados',
            '✅ Suporte prioritário'
        ]
    }
};

// ========== ROTA: OBTER PLANOS DISPONÍVEIS ==========
router.get('/planos', (req, res) => {
    try {
        res.json({
            success: true,
            planos: PLANOS
        });
    } catch (error) {
        console.error('❌ Erro ao buscar planos:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar planos disponíveis'
        });
    }
});

// ========== ROTA: VERIFICAR STATUS DA ASSINATURA DO USUÁRIO ==========
router.get('/status/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Validar userId
        if (!userId || userId === 'undefined' || userId === 'null') {
            return res.status(400).json({
                success: false,
                error: 'UserId inválido'
            });
        }
        
        // Garantir que os models estão carregados
        if (!Subscription) initModels();
        
        const assinatura = await Subscription.findOne({ userId });
        
        if (!assinatura) {
            return res.json({
                success: true,
                status: 'sem_assinatura',
                message: 'Usuário não possui assinatura'
            });
        }

        res.json({
            success: true,
            status: assinatura.status,
            plano: assinatura.plano,
            validoAte: assinatura.validoAte,
            stripeSubscriptionId: assinatura.stripeSubscriptionId
        });
    } catch (error) {
        console.error('❌ Erro ao verificar status:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao verificar status da assinatura'
        });
    }
});

// ========== WEBHOOK: RECEBER EVENTOS DO STRIPE ==========
// NOTA: O express.raw já foi aplicado no serverOperacional.js para esta rota
router.post('/webhook', async (req, res) => {
    const fs = require('fs');
    const logPath = __dirname + '/webhook-debug.log';
    const timestamp = new Date().toLocaleString('pt-BR');
    fs.appendFileSync(logPath, `\n[${timestamp}] WEBHOOK RECEBIDO\n`);
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔔 [WEBHOOK CHAMADO]', timestamp);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        // Verificar se o evento veio realmente do Stripe
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
        fs.appendFileSync(logPath, `[${timestamp}] Event Type: ${event.type}\n`);
        console.log('✅ [WEBHOOK RECEBIDO]', event.type);
    } catch (err) {
        fs.appendFileSync(logPath, `[${timestamp}] ERRO: ${err.message}\n`);
        console.error('❌ [WEBHOOK] Erro:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Garantir que os models estão carregados
    if (!Subscription || !User) initModels();

    // Processar os diferentes tipos de eventos
    try {
        console.log('🔍 [WEBHOOK DEBUG] Processando evento:', event.type);
        console.log('🔍 [WEBHOOK DEBUG] Event ID:', event.id);
        
        switch (event.type) {
            case 'checkout.session.completed':
                // Pagamento foi concluído com sucesso
                const session = event.data.object;
                console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.log('💳 [CHECKOUT COMPLETED] Pagamento concluído!');
                console.log('🆔 Session ID:', session.id);
                console.log('📧 Customer Email:', session.customer_email);
                console.log('� Customer Details Email:', session.customer_details?.email);
                console.log('🔗 Client Reference ID:', session.client_reference_id);
                console.log('💰 Amount Total:', session.amount_total / 100);
                console.log('🔍 Customer ID:', session.customer);
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
                
                // Extrair informações - priorizar customer_details.email
                const customerEmail = session.customer_details?.email || session.customer_email;
                const subscriptionId = session.subscription;
                const clientReferenceId = session.client_reference_id; // Email do cadastro pendente
                const emailToSearch = clientReferenceId || customerEmail;
                
                if (!emailToSearch) {
                    console.error('❌ Nenhum email encontrado no checkout session');
                    break;
                }
                
                // Verificar se é um novo cadastro
                let user = await User.findOne({ email: emailToSearch });
                
                if (user) {
                    // Determinar tipo de plano baseado no valor
                    const amount = session.amount_total / 100; // Stripe retorna em centavos
                    const tipoPiano = amount >= 190 ? 'premium' : 'basico'; // anual vs mensal
                    const validoAte = amount >= 190
                        ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // +365 dias
                        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);  // +30 dias
                    
                    // Criar ou atualizar assinatura
                    await Subscription.findOneAndUpdate(
                        { userId: user._id },
                        {
                            userId: user._id,
                            stripeCustomerId: session.customer,
                            stripeSubscriptionId: subscriptionId,
                            status: 'ativo',
                            plano: tipoPiano,
                            validoAte: validoAte,
                            updatedAt: new Date()
                        },
                        { upsert: true, new: true }
                    );
                    
                    console.log('✅ [WEBHOOK] Assinatura ativada:', user.email);
                } else {
                    console.log('ℹ️ [WEBHOOK] Aguardando cadastro via frontend');
                }
                break;

            case 'customer.subscription.created':
                // Nova assinatura criada
                const newSub = event.data.object;
                console.log('📝 Nova assinatura criada:', newSub.id);
                break;

            case 'customer.subscription.updated':
                // Assinatura atualizada (renovação, mudança de plano, etc)
                const updatedSub = event.data.object;
                console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.log('🔄 ASSINATURA ATUALIZADA');
                console.log('   Subscription ID:', updatedSub.id);
                console.log('   Status:', updatedSub.status);
                console.log('   Customer ID:', updatedSub.customer);
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
                
                const newStatus = updatedSub.status === 'active' ? 'ativo' : 
                                 updatedSub.status === 'canceled' ? 'cancelado' : 
                                 updatedSub.status === 'past_due' ? 'pendente' : 
                                 updatedSub.status === 'unpaid' ? 'pendente' : 'pendente';
                
                await Subscription.findOneAndUpdate(
                    { stripeSubscriptionId: updatedSub.id },
                    {
                        status: newStatus,
                        validoAte: new Date(updatedSub.current_period_end * 1000),
                        updatedAt: new Date()
                    }
                );
                
                console.log(`✅ Status da assinatura atualizado para: ${newStatus}`);
                break;

            case 'customer.subscription.deleted':
                // Assinatura cancelada/deletada
                const canceledSub = event.data.object;
                fs.appendFileSync(logPath, `[${timestamp}] 🚨 CANCELAMENTO DETECTADO: ${canceledSub.id}\n`);
                
                console.log('\n🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨');
                console.log('❌ ASSINATURA CANCELADA/DELETADA');
                console.log('   Subscription ID:', canceledSub.id);
                console.log('   Customer ID:', canceledSub.customer);
                console.log('   Motivo:', canceledSub.cancellation_details?.reason || 'Não especificado');
                
                console.log('\n🔍 Buscando assinatura no MongoDB...');
                const assinaturaAntes = await Subscription.findOne({ stripeSubscriptionId: canceledSub.id });
                
                if (assinaturaAntes) {
                    console.log('✅ Assinatura ENCONTRADA no banco:');
                    console.log('   Status ANTES:', assinaturaAntes.status);
                    console.log('   User ID:', assinaturaAntes.userId);
                    console.log('   Válido até:', assinaturaAntes.validoAte);
                } else {
                    console.error('❌ Assinatura NÃO ENCONTRADA no banco!');
                    console.log('🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨\n');
                    break;
                }
                
                console.log('\n💾 Atualizando status para CANCELADO...');
                fs.appendFileSync(logPath, `[${timestamp}] Atualizando MongoDB para cancelado...\n`);
                
                const updatedSubscription = await Subscription.findOneAndUpdate(
                    { stripeSubscriptionId: canceledSub.id },
                    {
                        status: 'cancelado',
                        updatedAt: new Date()
                    },
                    { new: true }
                );
                
                if (updatedSubscription) {
                    fs.appendFileSync(logPath, `[${timestamp}] ✅ MongoDB atualizado com sucesso! Status: ${updatedSubscription.status}\n`);
                    console.log('✅✅✅ ASSINATURA CANCELADA COM SUCESSO NO MONGODB!');
                    console.log('   Status DEPOIS:', updatedSubscription.status);
                    console.log('   User ID:', updatedSubscription.userId);
                    console.log('   ⚠️  O usuário será BLOQUEADO no próximo login ou requisição!');
                } else {
                    fs.appendFileSync(logPath, `[${timestamp}] ❌ FALHA ao atualizar MongoDB!\n`);
                    console.error('❌ FALHA ao atualizar assinatura!');
                }
                console.log('🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨\n');
                break;

            case 'invoice.payment_failed':
                // Falha no pagamento
                const failedInvoice = event.data.object;
                console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.log('⚠️ FALHA NO PAGAMENTO');
                console.log('   Invoice ID:', failedInvoice.id);
                console.log('   Subscription ID:', failedInvoice.subscription);
                console.log('   Customer ID:', failedInvoice.customer);
                console.log('   Valor:', failedInvoice.amount_due / 100, failedInvoice.currency.toUpperCase());
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
                
                await Subscription.findOneAndUpdate(
                    { stripeSubscriptionId: failedInvoice.subscription },
                    {
                        status: 'pendente',
                        updatedAt: new Date()
                    }
                );
                
                console.log('✅ Status da assinatura atualizado para: pendente');
                break;

            default:
                console.log(`⚪ Evento não tratado: ${event.type}`);
                console.log('   Event ID:', event.id);
        }

        console.log('\n✅ [WEBHOOK PROCESSADO COM SUCESSO]');
        res.json({ received: true });
    } catch (error) {
        console.error('❌ Erro ao processar webhook:', error);
        console.error('Stack:', error.stack);
        res.status(500).json({ error: 'Erro ao processar evento' });
        res.status(500).json({ error: 'Erro ao processar evento' });
    }
});

// ========== ROTA: FINALIZAR CADASTRO APÓS PAGAMENTO ==========
router.post('/finalizar-cadastro', async (req, res) => {
    console.log('\n🎯 [FINALIZAR CADASTRO] Iniciando processo...');
    
    try {
        const { nome, email, senha, plano, timestamp } = req.body;
        
        console.log('🎯 [CADASTRO] Finalizando:', email);
        
        if (!nome || !email || !senha || !plano) {
            console.error('❌ Dados incompletos');
            return res.status(400).json({
                success: false,
                error: 'Dados incompletos'
            });
        }
        
        // Garantir que os models estão carregados
        if (!User || !Subscription) initModels();
        
        // Verificar se usuário já existe
        let user = await User.findOne({ email });
        
        if (user) {
            // Verificar se tem assinatura ativa
            const assinatura = await Subscription.findOne({ userId: user._id });
            
            if (!assinatura) {
                console.log('❌ Usuário existe mas não tem assinatura ativa');
                console.log('🔍 Verificando pagamento no Stripe...');
                
                // Buscar no Stripe
                const customers = await stripe.customers.list({
                    email: email,
                    limit: 1
                });
                
                if (customers.data.length === 0) {
                    return res.json({
                        success: false,
                        error: 'Pagamento não encontrado. Por favor, complete o pagamento primeiro.'
                    });
                }
                
                // Criar assinatura se o pagamento foi confirmado
                const customer = customers.data[0];
                const subscriptions = await stripe.subscriptions.list({
                    customer: customer.id,
                    status: 'active',
                    limit: 1
                });
                
                if (subscriptions.data.length > 0) {
                    const sub = subscriptions.data[0];
                    const tipoPiano = plano === 'anual' ? 'premium' : 'basico';
                    const validoAte = new Date(sub.current_period_end * 1000);
                    
                    await Subscription.create({
                        userId: user._id,
                        stripeCustomerId: customer.id,
                        stripeSubscriptionId: sub.id,
                        status: 'ativo',
                        plano: tipoPiano,
                        validoAte: validoAte
                    });
                    
                    console.log('✅ Assinatura criada com sucesso');
                } else {
                    return res.json({
                        success: false,
                        error: 'Pagamento ainda não foi processado. Aguarde alguns segundos e tente novamente.'
                    });
                }
            }
            
            // Gerar token
            const jwt = require('jsonwebtoken');
            const token = jwt.sign(
                { userId: user._id },
                process.env.JWT_SECRET || 'merfin_secret_key_2025',
                { expiresIn: '7d' }
            );
            
            return res.json({
                success: true,
                token,
                user: {
                    id: user._id,
                    nome: user.nome,
                    email: user.email
                }
            });
        }
        
        // Usuário NÃO existe - criar novo
        
        // Buscar pagamento no Stripe pelo email
        const customers = await stripe.customers.list({
            email: email,
            limit: 1
        });
        
        if (customers.data.length === 0) {
            return res.json({
                success: false,
                error: 'Pagamento não encontrado. Por favor, complete o pagamento primeiro.'
            });
        }
        
        const customer = customers.data[0];
        
        // Verificar se tem subscription ativa
        const subscriptions = await stripe.subscriptions.list({
            customer: customer.id,
            status: 'active',
            limit: 1
        });
        
        if (subscriptions.data.length === 0) {
            return res.json({
                success: false,
                error: 'Pagamento ainda não foi processado. Aguarde alguns segundos e tente novamente.'
            });
        }
        
        const subscriptionId = subscriptions.data[0].id;
        
        // Buscar detalhes completos da assinatura
        console.log('🔍 Buscando detalhes completos da assinatura:', subscriptionId);
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        
        // O current_period_end está dentro de items.data[0]
        const subscriptionItem = subscription.items?.data?.[0];
        
        if (!subscriptionItem || !subscriptionItem.current_period_end) {
            console.error('❌ ERRO: Não foi possível obter current_period_end!');
            console.error('   Subscription items:', subscription.items);
            return res.status(500).json({
                success: false,
                error: 'Erro ao buscar dados da assinatura no Stripe'
            });
        }
        
        const validoAte = new Date(subscriptionItem.current_period_end * 1000);
        console.log('✅ Assinatura encontrada - Válido até:', validoAte.toLocaleString('pt-BR'));
        
        // Criar usuário no banco
        const bcrypt = require('bcryptjs');
        const senhaHash = await bcrypt.hash(senha, 10);
        
        user = await User.create({
            nome,
            email,
            senha: senhaHash,
            createdAt: new Date()
        });
        
        console.log('✅ Usuário criado com sucesso:', user._id);
        
        // Criar assinatura no banco usando os dados completos do Stripe
        const tipoPiano = plano === 'anual' ? 'premium' : 'basico';
        
        await Subscription.create({
            userId: user._id,
            stripeCustomerId: customer.id,
            stripeSubscriptionId: subscription.id,
            status: 'ativo',
            plano: tipoPiano,
            validoAte: validoAte
        });
        
        console.log('✅ Assinatura criada - Válido até:', validoAte.toLocaleString('pt-BR'));
        
        // Gerar token JWT
        const jwt = require('jsonwebtoken');
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET || 'merfin_secret_key_2025',
            { expiresIn: '7d' }
        );
        
        console.log('✅ Token gerado com sucesso\n');
        
        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                nome: user.nome,
                email: user.email
            }
        });
        
    } catch (error) {
        console.error('❌ Erro ao finalizar cadastro:', error);
        console.error('Stack:', error.stack);
        res.status(500).json({
            success: false,
            error: 'Erro ao finalizar cadastro: ' + error.message
        });
    }
});

// ========== ROTA: CANCELAR ASSINATURA ==========
router.post('/cancelar/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Garantir que os models estão carregados
        if (!Subscription) initModels();
        
        const assinatura = await Subscription.findOne({ userId });
        
        if (!assinatura || !assinatura.stripeSubscriptionId) {
            return res.status(404).json({
                success: false,
                message: 'Assinatura não encontrada'
            });
        }

        // Cancelar no Stripe
        await stripe.subscriptions.cancel(assinatura.stripeSubscriptionId);

        // Atualizar no banco
        assinatura.status = 'cancelado';
        assinatura.updatedAt = new Date();
        await assinatura.save();

        res.json({
            success: true,
            message: 'Assinatura cancelada com sucesso'
        });
    } catch (error) {
        console.error('❌ Erro ao cancelar assinatura:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao cancelar assinatura'
        });
    }
});

module.exports = router;
