/**
 * @typedef {Object} IAuthService
 * @property {function(string, string): Promise<{success: boolean, message?: string, error?: string}>} sendVerificationCode
 * @property {function(string, string): Promise<{success: boolean, message?: string, error?: string, token?: string, user?: object}>} verifyCode
 * @property {function(string, string): Promise<{success: boolean, message?: string, error?: string}>} addEmailWithVerification
 * @property {function(string, string): Promise<{success: boolean, message?: string, error?: string}>} verifyEmailCode
 */

export {};