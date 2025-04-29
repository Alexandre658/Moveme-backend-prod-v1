import admin from 'firebase-admin';
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Se estiver usando ES6 (com "type": "module" no package.json), este bloco substitui __dirname.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Caminho absoluto para o arquivo serviceAccountKey.json
const serviceAccountPath = path.join(__dirname, './firebase/serviceAccountKey.json');

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

      // Ler o arquivo de credenciais do Firebase
      const serviceAccount = JSON.parse(await readFile(serviceAccountPath));

      // Inicializar o Firebase Admin SDK
      const app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: "https://movemeclient-ddfbd-default-rtdb.asia-southeast1.firebasedatabase.app",
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
    ...admin,
    auth: () => ({
      ...admin.auth(),
      createCustomToken: (uid) => admin.auth().createCustomToken(uid),
      getUserByEmail: (email) => admin.auth().getUserByEmail(email),
      updateUser: (uid, data) => admin.auth().updateUser(uid, data),
      updateUserByEmail: (email, data) => admin.auth().updateUserByEmail(email, data),
      updateUserByPhoneNumber: (phoneNumber, data) => admin.auth().updateUserByPhoneNumber(phoneNumber, data),
      updateUserByUid: (uid, data) => admin.auth().updateUserByUid(uid, data),
      deleteUser: (uid) => admin.auth().deleteUser(uid),
      deleteUserByEmail: (email) => admin.auth().deleteUserByEmail(email),
      deleteUserByPhoneNumber: (phoneNumber) => admin.auth().deleteUserByPhoneNumber(phoneNumber),
      deleteUserByUid: (uid) => admin.auth().deleteUserByUid(uid), 
    }),
    firestore: () => ({
      ...admin.firestore(),
     
      Timestamp: admin.firestore.Timestamp,
      FieldValue: admin.firestore.FieldValue
    })
  };
};
