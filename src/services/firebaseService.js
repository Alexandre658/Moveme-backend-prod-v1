import {db}  from '../config/firebaseConfig.js';

export const getDocument = async (collection, id) => {
  try {
    const database = await db();
    const docRef = database.collection(collection).doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      throw new Error('Documento não encontrado');
    }
    return doc.data();
  } catch (error) {
    console.error('Error getting document:', error);
    throw new Error('Failed to get document from database');
  }
};

export const updateDocument = async (collection, id, data) => {
  try {
    const database = await db();
    const docRef = database.collection(collection).doc(id);
    await docRef.update(data);
  } catch (error) {
    console.error('Error updating document:', error);
    throw new Error('Failed to update document in database');
  }
};
