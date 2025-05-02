import { sendSMS } from './smsService.js';
import { db, adm } from '../config/firebaseConfig.js'
import emailServiceInstance from './emailService.js';
import { IAuthService } from '../interfaces/IAuthService.js';
import { AuthenticationError, ValidationError, DatabaseError, ServiceError, validateParams } from '../utils/errors.js';
import admin from 'firebase-admin';

// Validation schema for parameters
const validationSchemas = {
  sendVerificationCode: {
    phone: {
      type: 'string',
      required: true,
      pattern: /^\+?[1-9]\d{1,14}$/ // E.164 format
    },
    entityKey: {
      type: 'string',
      required: true
    }
  },
  verifyCode: {
    phone: {
      type: 'string',
      required: true,
      pattern: /^\+?[1-9]\d{1,14}$/
    },
    insertedCode: {
      type: 'string',
      required: true,
      minLength: 4,
      maxLength: 6
    }
  },
  addEmailWithVerification: {
    uid: {
      type: 'string',
      required: true
    },
    email: {
      type: 'string',
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    }
  },
  addPhoneWithVerification: {
    uid: {
      type: 'string',
      required: true
    },
    phone: {
      type: 'string',
      required: true,
      pattern: /^\+?[1-9]\d{1,14}$/
    },
    entityKey: {
      type: 'string',
      required: true
    }
  },
  verifyEmailCode: {
    email: {
      type: 'string',
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    insertedCode: {
      type: 'string',
      required: true,
      minLength: 6,
      maxLength: 6
    }
  }
};

/**
 * Authentication service implementation
 * @implements {IAuthService}
 */
export class AuthService extends IAuthService {
  constructor() {
    super();
  }

  /**
   * Sends a verification code and saves it to Firestore.
   * @param {string} phone - User's phone number.
   * @param {string} entityKey - SMS API key.
   * @returns {Promise<{success: boolean, message?: string, error?: string}>}
   * @throws {ValidationError} If parameters are invalid
   * @throws {ServiceError} If there's an error sending SMS
   * @throws {DatabaseError} If there's an error saving to database
   */
  async sendVerificationCode(phone) {
    validateParams({ phone }, validationSchemas.sendVerificationCode);

    try {
      const verificationCode = Math.floor(1000 + Math.random() * 9000).toString();
      const message = `Your verification code is: ${verificationCode}`;
      
      const sendResult = await sendSMS(phone, message);
      if (!sendResult.success) {
        throw new ServiceError('Failed to send verification code');
      }

      const expirationTime = new Date();
      expirationTime.setMinutes(expirationTime.getMinutes() + 5);

      try {
        const dbInstance = await db();
        const admInstance = await adm();
        
        await dbInstance.collection('checks').doc(phone).set({
          code: verificationCode,
          phone,
          expirationTime: admInstance.firestore().Timestamp.fromDate(expirationTime),
          verified: false,
          createdAt: admInstance.firestore().FieldValue.serverTimestamp(),
        });
      } catch (dbError) {
        console.error('Error saving to database:', dbError);
        throw new DatabaseError('Error saving verification code');
      }

      // Set timer to remove expired code
      setTimeout(async () => {
        try {
          const dbInstance = await db();
          const doc = await dbInstance.collection('checks').doc(phone).get();
          if (doc.exists && !doc.data().verified) {
            await dbInstance.collection('checks').doc(phone).delete();
            console.log(`Code for ${phone} expired and removed.`);
          }
        } catch (error) {
          console.error('Error removing expired code:', error);
        }
      }, 5 * 60 * 1000);

      return { success: true, message: 'Verification code sent successfully' };
    } catch (error) {
      if (error instanceof ServiceError || error instanceof DatabaseError) {
        throw error;
      }
      console.error('Unexpected error:', error);
      throw new DatabaseError('Error processing request');
    }
  }

  /**
   * Verify if the verification code entered by the user is valid.
   * @param {string} phone - User's phone number.
   * @param {string} insertedCode - Code entered by the user.
   * @returns {Promise<{success: boolean, message?: string, error?: string, token?: string, user?: object}>}
   * @throws {ValidationError} If parameters are invalid
   * @throws {AuthenticationError} If code is invalid or expired
   * @throws {DatabaseError} If there's an error accessing database
   */
  async verifyCode(phone, insertedCode) {
    try {
      validateParams({ phone, insertedCode }, validationSchemas.verifyCode);

      const dbInstance = await db();
      const doc = await dbInstance.collection('checks').doc(phone).get();

      if (!doc.exists) {
        throw new AuthenticationError('Verification code not found or expired');
      }

      const { code, verified, expirationTime } = doc.data();

      if (verified) {
        throw new AuthenticationError('Code has already been verified');
      }

      const now = new Date();
      if (now > expirationTime.toDate()) {
        await dbInstance.collection('checks').doc(phone).delete();
        throw new AuthenticationError('Code expired');
      }

      if (code === insertedCode) {
        await dbInstance.collection('checks').doc(phone).update({
          verified: true,
        });

        try {
          const admInstance = await adm();
          let userRecord;
          
          try {
            userRecord = await admInstance.auth().getUserByPhoneNumber(phone);
            const userDocRef = admInstance.firestore().collection('users').doc(userRecord.uid);
            await userDocRef.update({
              isPhoneVerified: true,
              phone: phone
            });
          } catch (error) {
            if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-phone-number') {
              userRecord = await admInstance.auth().createUser({
                phoneNumber: phone,
              });
              await admInstance.firestore().collection('users').doc(userRecord.uid).set({
                isPhoneVerified: true,
                phone: phone
              });
            } else {
              throw error;
            }
          }

          const token = await admInstance.auth().createCustomToken(userRecord.uid);

          return {
            success: true,
            message: userRecord.metadata.creationTime
              ? 'Login successful'
              : 'Account created and login successful',
            token,
            user: userRecord,
          };
        } catch (authError) {
          throw new AuthenticationError('Error authenticating/creating account');
        }
      } else {
        throw new AuthenticationError('Incorrect verification code');
      }
    } catch (error) {
      if (error instanceof ValidationError || error instanceof AuthenticationError) {
        throw error;
      }
      throw new DatabaseError('Error verifying verification code');
    }
  }

  /**
   * Add or update user's email in Firebase Authentication and Firestore and send a verification code by email.
   * @param {string} uid - User's ID in Firebase Authentication.
   * @param {string} email - Email to be added or updated.
   * @returns {Promise<{success: boolean, message?: string, error?: string}>}
   * @throws {ValidationError} If parameters are invalid
   * @throws {ServiceError} If there's an error sending email
   * @throws {DatabaseError} If there's an error saving to database
   */
  async addEmailWithVerification(uid, email) {
    try {
      validateParams({ uid, email }, validationSchemas.addEmailWithVerification);

      const adminInstance = await adm();
      
      // Update email in Firebase Authentication
      await adminInstance.auth().updateUser(uid, {
        email,
      });

      // Update email in Firestore
      const userDocRef = adminInstance.firestore().collection('users').doc(uid);
      const userDoc = await userDocRef.get();

      if (userDoc.exists) {
        await userDocRef.update({
          email: email,
          isEmailVerified: false, // Set to false until verification is complete
        });
      } else {
        await userDocRef.set({
          email: email,
          isEmailVerified: false,
        });
      }

      const {name} = userDoc.data();

      // Generate 6-digit verification code
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

      // Send verification code by email
      const sendResult = await emailServiceInstance.sendAccessCodeEmail(email, name, verificationCode);

      if (!sendResult.success) {
        throw new ServiceError('Failed to send verification code by email');
      }

      // Save verification code in Firestore with expiration time
      const expirationTime = new Date();
      expirationTime.setMinutes(expirationTime.getMinutes() + 15); // Expires in 15 minutes

      await adminInstance.firestore().collection('checks').doc(email).set({
        code: verificationCode,
        expirationTime,
        verified: false,
        createdAt: adminInstance.firestore().FieldValue.serverTimestamp(),
      });

      return { success: true, message: 'Email updated and verification code sent' };
    } catch (error) {
      if (error instanceof ValidationError || error instanceof ServiceError) {
        throw error;
      }
      throw new DatabaseError('Error updating email or sending verification code');
    }
  }

  /**
   * Send a verification code by email.
   * @param {string} email - Email to send verification code to.
   * @returns {Promise<{success: boolean, message?: string, error?: string}>}
   * @throws {ValidationError} If email is invalid
   * @throws {ServiceError} If there's an error sending email
   * @throws {DatabaseError} If there's an error saving to database
   */
  async sendAccessCodeEmail(email, name) {
    try {
      const adminInstance = await adm();
      validateParams({ email, name }, validationSchemas.addEmailWithVerification);

      // Generate 6-digit verification code
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

      // Send verification code by email
      const sendResult = await emailServiceInstance.sendAccessCodeEmail(email, name, verificationCode); 
      const {messageId} = sendResult;
      if (!messageId) {
        throw new ServiceError('Failed to send verification code');
      }

      // Save verification code in Firestore with expiration time
      const expirationTime = new Date();
      expirationTime.setMinutes(expirationTime.getMinutes() + 15); // Expires in 15 minutes

      const dbInstance = await db();
      await dbInstance.collection('checks').doc(email).set({
        code: verificationCode,
        expirationTime: admin.firestore.Timestamp.fromDate(expirationTime),
        verified: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return { success: true, message: 'Verification code sent' };
    } catch (error) {
      console.error('Error in sendAccessCodeEmail:', error);
      if (error instanceof ValidationError || error instanceof ServiceError) {
        throw error;
      }
      throw new DatabaseError('Error updating email or sending verification code');
    }
  }

  /**
   * Add or update user's phone number in Firebase Authentication and Firestore and send verification code.
   * @param {string} uid - User's ID in Firebase Authentication.
   * @param {string} phone - Phone number to be added or updated.
   * @param {string} entityKey - SMS API key to send the code.
   * @returns {Promise<{success: boolean, message?: string, error?: string}>}
   * @throws {ValidationError} If parameters are invalid
   * @throws {ServiceError} If there's an error sending SMS
   * @throws {DatabaseError} If there's an error saving to database
   */
  async addPhoneWithVerification(uid, phone, entityKey) {
    try {
      validateParams({ uid, phone, entityKey }, validationSchemas.addPhoneWithVerification);
      const dbInstance = await db();
      const admInstance = await adm();
      // Update phone in Firebase Authentication
      await admInstance.auth().updateUser(uid, {
        phoneNumber: phone,
      });

      // Update phone in Firestore
      const userDocRef = admInstance.firestore().collection('users').doc(uid);
      const userDoc = await userDocRef.get();

      if (userDoc.exists) {
        await userDocRef.update({
          phone: phone,
          isPhoneVerified: false,  // Set to false until verification is done
        });
      } else {
        await userDocRef.set({
          phone: phone,
          isPhoneVerified: false, // Set to false until verification is done
        });
      }

      // Send verification code to updated phone
      const sendResult = await this.sendVerificationCode(phone, entityKey);

      if (sendResult.success) {
        return { success: true, message: 'Phone updated and verification code sent successfully' };
      } else {
        throw new ServiceError('Phone updated, but failed to send verification code');
      }
    } catch (error) {
      if (error instanceof ValidationError || error instanceof ServiceError) {
        throw error;
      }
      throw new DatabaseError('Error updating phone or sending verification code');
    }
  }

  /**
   * Verify the verification code sent to user's email.
   * @param {string} email - User's email.
   * @param {string} insertedCode - Verification code entered by the user.
   * @returns {Promise<{success: boolean, message?: string, error?: string}>}
   * @throws {ValidationError} If parameters are invalid
   * @throws {AuthenticationError} If code is invalid or expired
   * @throws {DatabaseError} If there's an error accessing database
   */
  async verifyEmailCode(email, insertedCode) {
    try {
      validateParams({ email, insertedCode }, validationSchemas.verifyEmailCode);
      const dbInstance = await db();
      const admInstance = await adm();
      // Find document in Firestore
      const doc = await dbInstance.collection('checks').doc(email).get();

      if (!doc.exists) {
        throw new AuthenticationError('Verification code not found or expired');
      }

      const { code, verified, expirationTime } = doc.data();

      // Check if code has already been used
      if (verified) {
        throw new AuthenticationError('Code has already been verified');
      }

      // Check if code has expired
      const now = new Date();
      if (now > expirationTime.toDate()) {
        await dbInstance.collection('checks').doc(email).delete(); // Remove expired code
        throw new AuthenticationError('Code expired');
      }

      // Check if entered code is correct
      if (code === insertedCode) {
        // Update status to verified
        await dbInstance.collection('checks').doc(email).update({
          verified: true,
        });

        // Update verification status in user document in Firestore
        const userDocRef = dbInstance.collection('users').where('email', '==', email).limit(1);
        const userDoc = await userDocRef.get();
        
        const token = await admInstance.auth().createCustomToken(userDoc.docs[0].id);
        await dbInstance.collection('users').doc(userDoc.docs[0].id).update({
          isEmailVerified: true,
          email: email,
        });
        
        return { success: true, message: 'Email verified successfully', token: token, user: userDoc.docs[0].data() };
      } else {
        throw new AuthenticationError('Incorrect verification code');
      }
    } catch (error) {
      if (error instanceof ValidationError || error instanceof AuthenticationError) {
        if(error.message === 'Verification code not found or expired'){
          return { success: false, message: 'Verification code not found or expired' };
        }
        if(error.message === 'Code has already been verified'){
          return { success: false, message: 'Code has already been verified' };
        }
        if(error.message === 'Code expired'){
          return { success: false, message: 'Code expired' };
        }
        if(error.message === 'Incorrect verification code'){
          return { success: false, message: 'Incorrect verification code' };
        }
        
        throw error;
      }
      throw new DatabaseError('Error verifying email code');
    }
  }
}

// Export service instance
export const authService = new AuthService();
