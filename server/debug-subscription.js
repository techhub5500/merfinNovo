require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');

// Schema de Assinatura (mesmo do serverOperacional.js)
const subscriptionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    stripeCustomerId: { type: String, required: true },
    stripeSubscriptionId: { type: String, required: true },
    status: { type: String, enum: ['pendente', 'ativo', 'cancelado', 'expirado'], default: 'pendente' },
    plano: { type: String, enum: ['basico', 'premium', 'empresarial'], required: true },
    validoAte: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const Subscription = mongoose.model('Subscription', subscriptionSchema);

async function debugSubscription() {
    try {
        console.log('🔍 Conectando ao MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Conectado!\n');
        
        console.log('📊 Listando TODAS as assinaturas no banco:\n');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        const assinaturas = await Subscription.find({});
        
        if (assinaturas.length === 0) {
            console.log('❌ NENHUMA assinatura encontrada no banco!');
        } else {
            console.log(`✅ ${assinaturas.length} assinatura(s) encontrada(s):\n`);
            
            assinaturas.forEach((assinatura, index) => {
                console.log(`\n📌 ASSINATURA #${index + 1}:`);
                console.log('   User ID:', assinatura.userId);
                console.log('   Stripe Customer ID:', assinatura.stripeCustomerId);
                console.log('   Stripe Subscription ID:', assinatura.stripeSubscriptionId);
                console.log('   ⭐ STATUS:', assinatura.status);
                console.log('   Plano:', assinatura.plano);
                console.log('   Válido até:', assinatura.validoAte);
                console.log('   Criado em:', assinatura.createdAt);
                console.log('   Atualizado em:', assinatura.updatedAt);
                console.log('   ─────────────────────────────────────────────────────────────────────');
            });
        }
        
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        
        console.log('💡 INSTRUÇÕES:');
        console.log('1. Copie o "Stripe Subscription ID" da assinatura acima');
        console.log('2. Cancele essa assinatura no Stripe Dashboard');
        console.log('3. Observe os logs do webhook no terminal do servidor');
        console.log('4. Execute este script novamente para verificar se o status foi atualizado\n');
        
    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Conexão fechada');
        process.exit(0);
    }
}

debugSubscription();
