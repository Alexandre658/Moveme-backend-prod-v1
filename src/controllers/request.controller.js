// requestController.js
import { db, adm } from '../config/firebaseConfig.js';
import Driver from '../../Driver.js';
import FareService from '../services/fare_service.js';
import TransactionRepository from '../services/transaction_Service.js';
import { calcularDistancia } from '../services/service_const.js';
import { getDocument, updateDocument } from '../services/firebaseService.js';
import { trackings } from '../services/trackingService.js';
import { sendPushNotification } from '../services/notificationService.js';
import { log } from 'console';

const fareService = new FareService();
const timers = {};

// Function to get polyline between two points
const getPolylineBetweenPoints = async (origin, destination) => {
  const googleApiKey = 'YOUR_GOOGLE_MAPS_API_KEY'; // Replace with your Google Maps API key

  try {
    const googleResponse = await fetch(
      `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&key=${googleApiKey}`
    );
    const googleData = await googleResponse.json();

    if (googleData.status === 'OK') {
      return googleData.routes[0].overview_polyline.points;
    }
    console.error('Google Maps API error:', googleData.status);
  } catch (error) {
    console.error('Error calling Google Maps API:', error);
  }

  try {
    const osrmUrl = `http://router.project-osrm.org/route/v1/driving/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?overview=full&geometries=polyline`;
    const osrmResponse = await fetch(osrmUrl);
    const osrmData = await osrmResponse.json();

    if (osrmData.code === 'Ok') {
      return osrmData.routes[0].geometry;
    }
    throw new Error('Could not get route between points using OSRM');
  } catch (error) {
    console.error('Error calling OSRM API:', error);
    throw new Error('Failed to get route between points');
  }
};

// Function to start trip recording
const startTripRecording = async (driverId, requestId) => {
  try {
    const admin = await adm();
    const database = await db();
    const tripRef = database.collection('trips').doc(requestId);
    await tripRef.set({
      startTime: admin.firestore().FieldValue.serverTimestamp(),
      requestId,
      status: 'ongoing',
    });

    await database.collection('races').doc(requestId).update({ tripId: requestId, status: 5 });

    timers[requestId] = setInterval(async () => {
      try {
        const vehiclePosition = trackings[driverId]?.position; 
        if (vehiclePosition) {
          await tripRef.collection('routes').doc().set({
            latitude: vehiclePosition.latitude,
            longitude: vehiclePosition.longitude,
            speed: vehiclePosition.speed,
            timestamp: admin.firestore().FieldValue.serverTimestamp(),
          });
          console.log(`Route recorded for trip: ${requestId}`);
        } else {
          console.error('Vehicle position not found for driver:', driverId);
        }
      } catch (error) {
        console.error('Error recording route:', error);
      }
    }, 60000);

    return requestId;
  } catch (error) {
    console.error('Error starting trip recording:', error);
    throw new Error('Failed to start trip recording');
  }
};

// Function to handle request creation
export const createRequest = async (req, res) => {
  const { driverId, requestId, driverDetails, documentId } = req.body;

  if (!driverId || !requestId || !documentId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const database = await db();
    const documentData = await getDocument('races', documentId);
    if (!documentData.originLatitude || !documentData.originLongitude) {
      return res.status(400).json({ error: 'Origin latitude and longitude are required' });
    }

    const origin = { latitude: documentData.originLatitude, longitude: documentData.originLongitude };
    const driver = new Driver(driverDetails);
    const vehiclePosition = trackings[driverId]?.position;
    const polyline = vehiclePosition ? await getPolylineBetweenPoints(vehiclePosition, origin) : '';

    const requestData = {
      driverId,
      status: 'pending',
      driver: driver.toJson(),
      document: documentData,
      polyline,
      documentId: documentId,
    };

    await database.collection('requests').doc(requestId).set(requestData);

    clients.forEach((client) => client.emit('driverRequest', { driverId, requestId, driver: driver.toJson(), document: documentData, polyline }));
    res.json({ message: 'Request sent to all clients', request: requestData });
  } catch (error) {
    console.error('Error creating request:', error);
    res.status(500).json({ error: 'Failed to create request' });
  }
};

// Function to cancel a race
export const cancelRace = async (req, res) => {
  const { requestId } = req.params;

  try {
    const database = await db();
    const requestDoc = await database.collection('requests').doc(requestId).get();
    if (!requestDoc.exists) {
      await updateDocument('races', requestId, { status: 7 });
      return res.status(404).json({ error: 'Request not found' });
    }

    const requestData = requestDoc.data();
    requestData.status = 'Cancelled';
    await database.collection('requests').doc(requestId).update({ status: 'Cancelled' });

    clients.forEach((client) => client.emit('requestResponse', { requestId, response: 'Cancelled' }));
    res.json({ message: 'Request cancelled', request: requestData });
  } catch (error) {
    console.error('Error cancelling request:', error);
    res.status(500).json({ error: 'Failed to cancel request' });
  }
};

// Function to accept a request
export const acceptRequest = async (req, res) => {
  const { requestId } = req.params;
  const { driverId } = req.body;

  try {
    const database = await db();
    const requestDoc = await database.collection('races').doc(requestId).get();
    if (!requestDoc.exists) {
      return res.status(404).json({ error: 'races not found' });
    }
    const UsertDoc = await database.collection('users').doc(driverId).get(); 
    const {vehicleSelected} = UsertDoc.data();
    const requestData = requestDoc.data();
    
    // Get the client's FCM token from the request document
    const clientToken = requestData.fcmToken;
    
    if (clientToken) {
      // Send push notification to the client
      await sendPushNotification(
        clientToken,
        'MoveMe',
        `Seu pedido foi aceito! O motorista ${UsertDoc.data().name} 
        está a caminho com o veículo ${vehicleSelected.brand} ${vehicleSelected.model} 
        (${vehicleSelected.registration}) de cor ${vehicleSelected.color}.`
      );
    }

    await database.collection('races').doc(requestId).update({ 
      driver: UsertDoc.data(),
      status: 2, 
      assigned: driverId, 
      requestId,
      vehicle: vehicleSelected 
    });
    await database.collection('users').doc(driverId).update({ tripId: requestId }); 
     
    clients.forEach((client) => client.emit('requestResponse', { requestId, response: 'accepted' }));
    res.json({ message: 'Request accepted', result: requestData });
  } catch (error) {
    console.error('Error accepting request:', error);
    res.status(500).json({ error: 'Failed to accept request' });
  }
};

// Function to deny a request
export const denyRequest = async (req, res) => {
  const { requestId } = req.params;

  try {
    const database = await db();
    const requestDoc = await database.collection('requests').doc(requestId).get();
    if (!requestDoc.exists) {
      await updateDocument('races', requestId, { status: 1 });
      clients.forEach((client) => client.emit('requestResponse', { requestId, response: 'denied' }));
      return res.status(404).json({ error: 'Request not found' });
    }

    const requestData = requestDoc.data();
    requestData.status = 'denied';
    await database.collection('requests').doc(requestId).update(requestData);

    clients.forEach((client) => client.emit('requestResponse', { requestId, response: 'denied' }));
    res.json({ message: 'Request denied' });
  } catch (error) {
    console.error('Error denying request:', error);
    res.status(500).json({ error: 'Failed to deny request' });
  }
};

// Função auxiliar para apagar as conversas de uma corrida
const deleteChatMessages = async (userDriver, userCliente) => {
  try {
    const database = await db();
    // Buscar todas as conversas entre o motorista e o cliente
    const chatsRef = database.collection('chats');
    const querySnapshot = await chatsRef
      .where('userDriver', '==', userDriver)
      .where('userCliente', '==', userCliente)
      .get();

    // Apagar cada mensagem encontrada
    const batch = database.batch();
    querySnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`Chat messages deleted for driver ${userDriver} and client ${userCliente}`);
  } catch (error) {
    console.error('Error deleting chat messages:', error);
  }
};

// Function to finish a request
export const finishRequest = async (req, res) => {
  const { token } = req.user;
  const { requestId } = req.params;
  const { correctPosition } = req.body;

  if (!token) return res.status(400).json({ error: 'Invalid token' });
  if (correctPosition.latitude < -90 || correctPosition.latitude > 90 || correctPosition.longitude < -180 || correctPosition.longitude > 180) {
    return res.status(400).json({ error: 'Invalid coordinates' });
  }
  if (!requestId) return res.status(400).json({ error: 'Invalid request ID' });

  try {
    const admin = await adm();
    const database = await db();
    const endTime = admin.firestore().FieldValue.serverTimestamp();
    const documentData = await getDocument('races', requestId);

    if(documentData.status == 6){
      // Get the client's FCM token from the request document
      const clientToken = documentData.fcmToken;
      
      if (clientToken) {
        // Send push notification to the client
        await sendPushNotification(
          clientToken,
          'MoveMe',
          `Sua viagem foi concluída! Obrigado por escolher o MoveMe.`
        );
      }

      clients.forEach((client) => client.emit('rideFinished', { documentData }));
      return res.status(200).json({ message: 'Ride finished', result: raceData });
    }
 
    if (!documentData.startTime) return res.status(400).json({ error: 'Start time not found' });

    const travelTimeMinutes = Math.round((new Date()- documentData.startTime) / 60000);
    
    const distance = calcularDistancia(correctPosition.latitude, correctPosition.longitude, documentData.originLatitude, documentData.originLongitude);
    const price = fareService.calculateFare((distance/1000), 0, { vehicleCateg: documentData.vehicleCategory });
   
    const driverBalance = price - fareService.calculateDriverBalance(price, documentData.vehicleCategory.tarifaBase / 100);

    try {
      const transactionRepository = new TransactionRepository({ baseUrl: 'https://movemewallet.onrender.com', token });
      await transactionRepository.updateAmount(driverBalance, 'debit');
    } catch (error) {
      console.error('Error updating driver balance:', error);
      // Continue with the ride finish process even if the transaction fails
      // The transaction can be retried later
    }

    const raceData = {price, status: 6, endTime, travelTimeMinutes, destinationLatitude: correctPosition.latitude, destinationLongitude: correctPosition.longitude };
    await database.collection('races').doc(requestId).update(raceData);
    await database.collection('users').doc(documentData.userdriverId).update({ tripId: null,});
    try{
      await database.collection('requests').doc(requestId).update({ status: 'finished', endTime });
      if (requestId) await database.collection('trips').doc(requestId).update({ end_time: endTime });
    }
    catch(ex){
      log(ex);
    }

    // Apagar as conversas entre o motorista e o cliente
    if (documentData.userdriverId && documentData.userCliente) {
      await deleteChatMessages(documentData.userdriverId, documentData.userCliente);
    }

    // Get the client's FCM token from the request document
    const clientToken = documentData.fcmToken;
    
    if (clientToken) {
      // Send push notification to the client
      await sendPushNotification(
        clientToken,
        'MoveMe',
        `Sua viagem foi concluída! Tempo de viagem: ${travelTimeMinutes} minutos. Valor total: ${price} AOA. Obrigado por escolher o MoveMe.`
      );
    }

    const documentDataF = await getDocument('races', requestId);
    clients.forEach((client) => client.emit('rideFinished', { requestId, travelTimeMinutes }));
    res.json({ message: 'Ride finished', result: documentDataF });
  } catch (error) {
    console.error('Error finishing ride:', error);
    res.status(500).json({ error: 'Failed to finish ride' });
  }
};

// Function to handle driver arrival notification
export const arrivedRequest = async (req, res) => {
  const { requestId } = req.params;

  try {
    const database = await db();
    const requestDoc = await database.collection('requests').doc(requestId).get();
    if (!requestDoc.exists) return res.status(404).json({ error: 'Request not found' });

    await database.collection('requests').doc(requestId).update({ status: 'arrived' });
    await updateDocument('races', requestId, { status: 4 });

    clients.forEach((client) => client.emit('driverArrived', { requestId }));
    res.json({ message: 'Driver arrived' });
  } catch (error) {
    console.error('Error updating race status:', error);
    res.status(500).json({ error: 'Failed to update race status' });
  }
};

// Function to start the race
export const startTheRaceRequest = async (req, res) => {
  const { requestId } = req.params;
  const { vehicleId } = req.body;

  try {
    const database = await db();
    const requestDoc = await database.collection('requests').doc(requestId).get();
    if (!requestDoc.exists) return res.status(404).json({ error: 'Request not found' });

    await database.collection('requests').doc(requestId).update({ status: 'startTheRace' });
    const tripId = await startTripRecording(vehicleId, requestId);

    clients.forEach((client) => client.emit('driverStartTheRace', { requestId, tripId }));
    res.json({ message: 'Driver started the race and route recording began', tripId });
  } catch (error) {
    console.error('Error starting the race or recording route:', error);
    res.status(500).json({ error: 'Failed to start the race or record route' });
  }
};