import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

// Promessa que resolve quando o Firebase estiver inicializado
let firebaseInitPromise = null;

export default async function firebaseConfig() {
  if (firebaseInitPromise) {
    return firebaseInitPromise;
  }

  firebaseInitPromise = new Promise(async (resolve, reject) => {
    try {
      // Verifica se o Firebase já foi inicializado
      if (admin.apps.length > 0) {
        console.log('Firebase já foi inicializado.');
        resolve(admin.app());
        return;
      }

      // Verificar se todas as variáveis de ambiente necessárias estão definidas
      const requiredEnvVars = ['FIREBASE_PROJECT_ID', 'FIREBASE_PRIVATE_KEY', 'FIREBASE_CLIENT_EMAIL'];
      const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
      
      if (missingVars.length > 0) {
        throw new Error(`Variáveis de ambiente necessárias não definidas: ${missingVars.join(', ')}`);
      }

      // Criar objeto de credenciais a partir das variáveis de ambiente
      const serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL
      };

      // Inicializar o Firebase Admin SDK
      const app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`
      });

      console.log('Firebase configurado com sucesso.');
      resolve(app);
    } catch (error) {
      console.error('Erro ao configurar o Firebase:', error);
      reject(new Error('Falha na inicialização do Firebase'));
    }
  });

  return firebaseInitPromise;
}

// Função para verificar se o Firebase foi inicializado
export function isFirebaseInitialized() {
  return admin.apps.length > 0;
}

export const admMessaging = async () => {
  await firebaseInitPromise;
  return admin.messaging();
};

export const db = async () => {
  await firebaseInitPromise;
  return admin.firestore();
};

export const adm = async () => {
  await firebaseInitPromise;
  return {
    auth: () => admin.auth(),
    firestore: () => ({
      ...admin.firestore(),
      Timestamp: admin.firestore.Timestamp,
      FieldValue: {
        serverTimestamp: () => admin.firestore.FieldValue.serverTimestamp()
      }
    })
  };
};
