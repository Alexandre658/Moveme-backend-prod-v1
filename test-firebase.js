import firebaseConfig from './src/config/firebaseConfig.js';

async function testFirebase() {
  try {
    console.log('Inicializando Firebase...');
    const app = await firebaseConfig();
    console.log('Firebase inicializado com sucesso!');
    
    // Verificar se o Firestore está funcionando
    const { db } = await import('./src/config/firebaseConfig.js');
    const firestore = db();
    console.log('Firestore acessado com sucesso!');
    
    // Verificar se o arquivo serviceAccountKey.json existe
    const { readFile } = await import('fs/promises');
    const { fileURLToPath } = await import('url');
    const { dirname, join } = await import('path');
    
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const serviceAccountPath = join(__dirname, './src/config/firebase/serviceAccountKey.json');
    
    try {
      await readFile(serviceAccountPath);
      console.log('Arquivo serviceAccountKey.json encontrado!');
    } catch (error) {
      console.error('Erro ao ler o arquivo serviceAccountKey.json:', error);
    }
    
  } catch (error) {
    console.error('Erro ao inicializar Firebase:', error);
  }
}

testFirebase(); 