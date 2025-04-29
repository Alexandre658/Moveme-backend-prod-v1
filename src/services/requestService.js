import { db } from '../config/firebaseConfig.js';

// Banco de dados em memória
let requests = {};

// Função para salvar os dados no Firestore
const saveToFirestore = async () => {
    try {
        const requestsCollection = db().collection('requests');
        const batch = db().batch();
        Object.entries(requests).forEach(([id, requests]) => {
            const docRef = requestsCollection.doc(id);
            batch.set(docRef, requests);
        });
        await batch.commit();
        console.log('Dados sincronizados com o Firestore.');
    } catch (error) {
        console.error('Erro ao salvar no Firestore:', error);
    }
};

// Função para carregar os dados do Firestore
const loadFromFirestore = async () => {
    try {
        const snapshot = await db().collection('requests').get();
        snapshot.forEach((doc) => {
            requests[doc.id] = doc.data();
        });
        console.log('Dados carregados do Firestore:', requests);
    } catch (error) {
        console.error('Erro ao carregar dados do Firestore:', error);
    }
};

// Função para adicionar um novo pedido
const addRequest = (id, requestData) => {
    const newRequest = {
        ...requestData,
        createdAt: new Date().toISOString(),  // Adiciona a data do pedido
        status: 'pending'                     // Inicializa o status como "pending"
    };
    requests[id] = newRequest;
    saveToFirestore();  // Sincroniza com o Firestore após a adição
};

// Função para atualizar o status de um pedido (aceitar ou rejeitar)
const updateRequestStatus = (id, status) => {
    if (requests[id]) {
        requests[id].status = status;  // Atualiza o status do pedido
        saveToFirestore();  // Sincroniza com o Firestore após a atualização
    } else {
        console.error(`Pedido com ID ${id} não encontrado.`);
    }
};

// Inicializa a aplicação carregando os dados do Firestore
const init = async () => {

    await loadFromFirestore();
};




// Exporte a função de adicionar pedido e o objeto requests
export { addRequest, updateRequestStatus, requests };
