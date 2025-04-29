import { emailService } from '../services/emailService.js';

async function testEmail() {
    try {
        console.log('Iniciando teste de envio de email...');
        
        const testEmail = 'alexandrelisboa845@gmail.com'; // Email para teste
        const testName = 'Alexandre'; // Nome para teste
        
        // Testando o envio de email de boas-vindas
        const result = await emailService.sendWelcomeEmail(testEmail, testName);
        
        console.log('Email enviado com sucesso!');
        console.log('Detalhes:', result);
    } catch (error) {
        console.error('Erro ao enviar email:', error);
    }
}

// Executar o teste
testEmail(); 