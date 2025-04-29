import {db}  from '../config/firebaseConfig.js';

export const getDocument = async (collection, id) => {
  const docRef = db().collection(collection).doc(id);
  const doc = await docRef.get();
  if (!doc.exists) {
    throw new Error('Documento não encontrado');
  }
  return doc.data();
};

export const updateDocument = async (collection, id, data) => {
  const docRef = db().collection(collection).doc(id);
  await docRef.update(data);
};
