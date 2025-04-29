import firebaseConfig from './src/config/firebaseConfig.js';

async function testPeakHourService() {
  try {
    console.log('Inicializando Firebase...');
    await firebaseConfig();
    console.log('Firebase inicializado com sucesso!');
    
    // Importar o serviço de horário de pico após inicializar o Firebase
    console.log('Importando o serviço de horário de pico...');
    const { peakHourService } = await import('./src/services/peak_hour_service.js');
    console.log('Serviço de horário de pico importado com sucesso!');
    
    // Verificar se o serviço está funcionando
    console.log('Verificando o status do horário de pico...');
    const status = peakHourService.getPeakStatus('Angola', 'Luanda', 'Luanda');
    console.log('Status do horário de pico:', status);
    
  } catch (error) {
    console.error('Erro ao testar o serviço de horário de pico:', error);
  }
}

testPeakHourService(); 