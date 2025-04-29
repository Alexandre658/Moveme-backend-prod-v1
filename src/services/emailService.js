import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

/**
 * Helper function to encode password for SMTP
 * @param {string} password - The password to encode
 * @returns {string} - The encoded password
 */
function encodePassword(password) {
  return encodeURIComponent(password);
}

/**
 * Enviar um código de verificação por e-mail.
 * @param {string} email - O e-mail do destinatário.
 * @param {string} codigoVerificacao - O código de verificação gerado.
 * @returns {Object} - Objeto com status de sucesso ou erro.
 */
class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass:  process.env.EMAIL_PASS,
        method: 'PLAIN'
      },
       
      tls: {
        rejectUnauthorized: false
      },
      debug: true, // Enable debug logging
      logger: true // Enable logger
    });
  }

  async sendPasswordResetEmail(email, resetToken) {
    try {
      const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
      
      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Redefinir sua senha 🔑',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <img src="${process.env.LOGO_URL}" alt="Logo" style="max-width: 150px; margin-bottom: 20px;"/>
            
            <h2 style="color: #333;">Redefinir sua senha 🔑</h2>
            
            <p style="color: #666; margin-bottom: 20px;">
              Precisa redefinir sua senha?<br/>
              Não há problema. Basta clicar no botão abaixo para começar.
            </p>

            <div style="margin: 30px 0;">
              <a href="${resetLink}" 
                 style="background-color: #0066FF; 
                        color: white; 
                        padding: 12px 24px; 
                        text-decoration: none; 
                        border-radius: 4px;
                        display: inline-block;">
                Redefinir minha senha
              </a>
            </div>

            <p style="color: #666; font-size: 14px;">
              Este link é válido por 10 minutos.<br/>
              Se você não solicitou a mudança de sua senha, por favor, ignore este email.
            </p>

             <!-- Footer Links -->
            <div style="margin-top: 40px; font-size: 12px; color: #000000;">
              <div style="margin-bottom: 16px;">
                <a href="${process.env.HELP_CENTER_URL}" style="color: #0066FF; text-decoration: none; margin-right: 20px;">Central de ajuda</a>
                <a href="${process.env.PRIVACY_URL}" style="color: #0066FF; text-decoration: none; margin-right: 20px;">Privacidade</a>
                <a href="${process.env.TERMS_URL}" style="color: #0066FF; text-decoration: none; margin-right: 20px;">Termos</a>
                <a href="${process.env.EMAIL_PREFERENCES_URL}" style="color: #0066FF; text-decoration: none;">Preferências de e-mail</a>
              </div>
             
              <p style="margin: 16px 0;">© Moveme ${new Date().getFullYear()}</p>
              <p style="margin: 0;">Moveme.com</p>
              
              <!-- Social Media Icons -->
              <div style="margin-top: 16px;">
                <a href="${process.env.FACEBOOK_URL}" style="margin-right: 12px;">
                  <img src="${process.env.FACEBOOK_ICON}" alt="Facebook" style="height: 24px;"/>
                </a>
                <a href="${process.env.INSTAGRAM_URL}">
                  <img src="${process.env.INSTAGRAM_ICON}" alt="Instagram" style="height: 24px;"/>
                </a>
              </div>
            </div>
          </div>
        `
      };

      const info = await this.transporter.sendMail(mailOptions);
     // logger.info('Password reset email sent:', info.messageId);
      return info;
    } catch (error) {
     // logger.error('Error sending password reset email:', error);
     // throw new AppError('Failed to send password reset email', 500);
     throw error;
       
    }
  }

  async sendPasswordChangedEmail(email, name) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Sua senha foi alterada',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #fff; padding: 20px;">
            <!-- Logo -->
            <div style="text-align: left; margin-bottom: 30px;">
              <img src="${process.env.LOGO_URL}" alt="Logo" style="height: 40px;"/>
            </div>

            <!-- Título Principal -->
            <h1 style="color: #000; font-size: 24px; margin-bottom: 20px;">
              Sua senha foi alterada
            </h1>

            <!-- Saudação e Mensagem -->
            <div style="margin-bottom: 30px; color: #666;">
              <p style="margin-bottom: 15px;">Olá, ${name}</p>
              <p style="margin-bottom: 15px;">
                A senha cadastrada no seu aplicativo foi alterada.
              </p>
              <p style="margin-bottom: 15px;">
                Caso não tenha pedido essa alteração, entre em contato conosco o mais rápido possível.
              </p>
            </div>

            <!-- Assinatura -->
            <div style="margin-top: 40px; color: #666;">
              <p style="margin-bottom: 10px;">Abraços,</p>
              <p style="margin-bottom: 30px;">Equipe ${process.env.APP_NAME}</p>
            </div>

            <!-- Aviso de Email Automático -->
            <div style="font-size: 12px; color: #666; margin-top: 30px; padding-top: 30px; border-top: 1px solid #eee;">
              <p style="margin-bottom: 10px;">
                Por favor, pedimos que você não responda esse e-mail, pois se trata de uma mensagem automática e não é possível dar continuidade com seu atendimento por aqui.
              </p>
            </div>

            <!-- Rodapé -->
            <div style="margin-top: 30px; font-size: 12px; color: #666;">
              <p style="margin-bottom: 10px;">
                Caso ainda tenha dúvidas, acesse Me Ajuda diretamente no seu aplicativo.
              </p>
              <p style="margin-bottom: 10px;">
                ${process.env.COMPANY_NAME} - ${process.env.COMPANY_ADDRESS}
              </p>
            </div>
          </div>
        `
      };

      const info = await this.transporter.sendMail(mailOptions);
     // logger.info('Password changed confirmation email sent:', info.messageId);
      return info;
    } catch (error) {
     // logger.error('Error sending password changed confirmation email:', error);
     // throw new AppError('Failed to send password changed confirmation email', 500);
     throw error;
    }
  }

  async sendWelcomeEmail(email, name) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Obrigado por se cadastrar na Moveme!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(to bottom, #2A89F6, #45B2FB); color: white;">
            <!-- Mapa Preview Section -->
            <div style="margin-bottom: 20px; border-radius: 12px; overflow: hidden;">
              <img src="${process.env.WELCOME_MAP_PREVIEW}" alt="Preview do mapa" style="width: 100%; height: auto;"/>
            </div>

            <!-- Welcome Message -->
            <h1 style="color: white; font-size: 32px; margin-bottom: 16px;">
              Obrigado por se cadastrar na Moveme!
            </h1>

            <!-- Description -->
            <p style="color: white; font-size: 16px; line-height: 1.5; margin-bottom: 24px;">
              A moveme é um aplicativo para smartphones que conecta você a um motorista para realizar viagens de forma rápida, confiavél e econômica, sempre que você precisar.
            </p>

            <!-- Open App Button -->
            <a href="${process.env.APP_DEEP_LINK}" 
               style="display: inline-block;
                      background-color: white;
                      color: #2A89F6;
                      padding: 16px 24px;
                      text-decoration: none;
                      border-radius: 8px;
                      font-weight: bold;
                      margin-bottom: 32px;">
              Abrir o aplicativo
            </a>

            <!-- App Store Links -->
            <div style="margin-bottom: 32px;">
              <a href="${process.env.APP_STORE_URL}" style="display: inline-block; margin-right: 16px;">
                <img src="${process.env.APP_STORE_BADGE}" alt="Download on the App Store" style="height: 40px;"/>
              </a>
              <a href="${process.env.PLAY_STORE_URL}" style="display: inline-block;">
                <img src="${process.env.PLAY_STORE_BADGE}" alt="Get it on Google Play" style="height: 40px;"/>
              </a>
            </div>

            <!-- Footer Links -->
            <div style="margin-top: 40px; font-size: 12px; color: white;">
              <div style="margin-bottom: 16px;">
                <a href="${process.env.HELP_CENTER_URL}" style="color: white; text-decoration: none; margin-right: 20px;">Central de ajuda</a>
                <a href="${process.env.PRIVACY_URL}" style="color: white; text-decoration: none; margin-right: 20px;">Privacidade</a>
                <a href="${process.env.TERMS_URL}" style="color: white; text-decoration: none; margin-right: 20px;">Termos</a>
                <a href="${process.env.EMAIL_PREFERENCES_URL}" style="color: white; text-decoration: none;">Preferências de e-mail</a>
              </div>
              <div style="margin-bottom: 16px;">
                <a href="${process.env.CANCEL_SUBSCRIPTION_URL}" style="color: white; text-decoration: none;">Cancelar assinatura</a>
              </div>
              <p style="margin: 16px 0;">© Moveme ${new Date().getFullYear()}</p>
              <p style="margin: 0;">Moveme.com</p>
              
              <!-- Social Media Icons -->
              <div style="margin-top: 16px;">
                <a href="${process.env.FACEBOOK_URL}" style="margin-right: 12px;">
                  <img src="${process.env.FACEBOOK_ICON}" alt="Facebook" style="height: 24px;"/>
                </a>
                <a href="${process.env.INSTAGRAM_URL}">
                  <img src="${process.env.INSTAGRAM_ICON}" alt="Instagram" style="height: 24px;"/>
                </a>
              </div>
            </div>
          </div>
        `
      };

      const info = await this.transporter.sendMail(mailOptions);
    //  logger.info('Welcome email sent:', info.messageId);
      return info;
    } catch (error) {
    //  logger.error('Error sending welcome email:', error);
    //  throw new AppError('Failed to send welcome email', 500);
    throw error;
    }
  }

  async sendMarketingEmail(users, campaign) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: users.map(user => user.email).join(','),
        subject: campaign.subject,
        html: campaign.content
      };

      await this.transporter.sendMail(mailOptions);
     // logger.info(`Marketing email sent to ${users.length} users`);
    } catch (error) {
     // logger.error(`Error sending marketing email: ${error.message}`);
      throw error;
    }
  }

  async sendCustomEmail(to, subject, content) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject,
        html: content
      };

      await this.transporter.sendMail(mailOptions);
    //  logger.info(`Custom email sent to ${to}`);
    } catch (error) {
     // logger.error(`Error sending custom email to ${to}: ${error.message}`);
      throw error;
    }
  }

  async sendAccessCodeEmail(email, name, code) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Seu código de acesso',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <!-- Logo -->
            <div style="margin-bottom: 30px;">
              <img src="${process.env.LOGO_URL}" alt="Moveme" style="height: 30px;"/>
            </div>

            <!-- Título e Código -->
            <h1 style="color: #333; font-size: 24px; margin-bottom: 20px;">
              Seu código de acesso é:
            </h1>
            
            <div style="margin: 30px 0;">
              <span style="color: #0066FF; font-size: 32px; font-weight: bold; letter-spacing: 2px;">
                ${code}
              </span>
            </div>

            <!-- Mensagem -->
            <div style="color: #666; margin-bottom: 30px;">
              <p style="margin-bottom: 15px;">Olá ${name},</p>
              <p style="margin-bottom: 15px;">
                Por favor, retorne ao seu aplicativo e insira o código acima para confirmar sua identidade.
              </p>
              <p style="margin-bottom: 15px;">
                Abraços,<br/>
                Equipe Moveme
              </p>
            </div>

            <!-- Aviso -->
            <div style="color: #666; font-size: 12px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
              <p>Esse email é enviado automaticamente e não recebe respostas.</p>
              <p>Precisa de ajuda? <a href="${process.env.HELP_URL}" style="color: #0066FF; text-decoration: none;">Fale conosco</a></p>
            </div>

            <!-- Footer -->
            <div style="margin-top: 40px; font-size: 12px; color: #999;">
              <div style="margin-bottom: 10px;">
                <a href="${process.env.HELP_CENTER_URL}" style="color: #666; text-decoration: none; margin-right: 20px;">Central de ajuda</a>
                <a href="${process.env.PRIVACY_URL}" style="color: #666; text-decoration: none; margin-right: 20px;">Privacidade</a>
                <a href="${process.env.TERMS_URL}" style="color: #666; text-decoration: none; margin-right: 20px;">Termos</a>
                <a href="${process.env.EMAIL_PREFERENCES_URL}" style="color: #666; text-decoration: none;">Preferências de e-mail</a>
              </div>
              <p style="margin-bottom: 5px;">© Moveme ${new Date().getFullYear()}</p>
              <p style="margin: 0;">Moveme.com</p>
            </div>
          </div>
        `
      };

      const info = await this.transporter.sendMail(mailOptions);
    //  logger.info('Access code email sent:', info.messageId);
      return info;
    } catch (error) {
      //logger.error('Error sending access code email:', error);
    ///  throw new AppError('Erro ao enviar código de acesso por email', 500);
    throw error;
  }
  }

  async sendRideReceiptEmail(email, rideData) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Recibo da sua viagem Moveme',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <!-- Logo -->
            <div style="margin-bottom: 30px;">
              <img src="${process.env.LOGO_URL}" alt="Moveme" style="height: 30px;"/>
            </div>

            <!-- Valor Total -->
            <div style="text-align: center; margin-bottom: 30px;">
              <p style="color: #666; font-size: 14px; margin-bottom: 8px;">Seus ganhos</p>
              <h1 style="color: #0066FF; font-size: 32px; margin: 0;">
                Kz ${rideData.totalEarnings.toLocaleString('pt-AO', { minimumFractionDigits: 2 })}
              </h1>
            </div>

            <!-- Detalhes da Viagem -->
            <div style="margin-bottom: 30px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
                <div>
                  <p style="color: #666; font-size: 14px; margin-bottom: 4px;">Duração</p>
                  <p style="color: #333; font-size: 16px; margin: 0;">${rideData.duration}</p>
                </div>
                <div>
                  <p style="color: #666; font-size: 14px; margin-bottom: 4px;">Distância</p>
                  <p style="color: #333; font-size: 16px; margin: 0;">${rideData.distance} km</p>
                </div>
              </div>
            </div>

            <!-- Informações Adicionais -->
            <div style="border-bottom: 1px solid #eee; margin-bottom: 20px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 16px;">
                <p style="color: #333; margin: 0;">Tipo de veículo</p>
                <p style="color: #333; margin: 0;">${rideData.vehicleType}</p>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 16px;">
                <p style="color: #333; margin: 0;">Horário da solicitação</p>
                <p style="color: #333; margin: 0;">${rideData.requestTime}</p>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 16px;">
                <p style="color: #333; margin: 0;">Data da solicitação</p>
                <p style="color: #333; margin: 0;">${rideData.requestDate}</p>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 16px;">
                <p style="color: #333; margin: 0;">Pontos ganhos</p>
                <p style="color: #333; margin: 0;">${rideData.pointsEarned} ponto</p>
              </div>
            </div>

            <!-- Detalhamento dos Valores -->
            <div style="margin-bottom: 30px;">
              <h2 style="color: #333; font-size: 18px; margin-bottom: 16px;">Seus ganhos</h2>
              <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                <p style="color: #333; margin: 0;">Valor</p>
                <p style="color: #333; margin: 0;">Kz ${rideData.fareAmount.toLocaleString('pt-AO', { minimumFractionDigits: 2 })}</p>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                <p style="color: #333; margin: 0;">Seus ganhos</p>
                <p style="color: #333; margin: 0;">Kz ${rideData.driverEarnings.toLocaleString('pt-AO', { minimumFractionDigits: 2 })}</p>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                <p style="color: #333; margin: 0;">Taxas de terceiros</p>
                <p style="color: #333; margin: 0;">Kz ${rideData.thirdPartyFees.toLocaleString('pt-AO', { minimumFractionDigits: 2 })}</p>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding-top: 12px; border-top: 1px solid #eee;">
                <p style="color: #333; font-weight: bold; margin: 0;">Saldo da viagem</p>
                <p style="color: #333; font-weight: bold; margin: 0;">Kz ${rideData.tripBalance.toLocaleString('pt-AO', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>

            <!-- Footer Links -->
            <div style="margin-top: 40px; font-size: 12px; color: #999;">
              <div style="margin-bottom: 10px;">
                <a href="${process.env.HELP_CENTER_URL}" style="color: #666; text-decoration: none; margin-right: 20px;">Central de ajuda</a>
                <a href="${process.env.PRIVACY_URL}" style="color: #666; text-decoration: none; margin-right: 20px;">Privacidade</a>
                <a href="${process.env.TERMS_URL}" style="color: #666; text-decoration: none; margin-right: 20px;">Termos</a>
                <a href="${process.env.EMAIL_PREFERENCES_URL}" style="color: #666; text-decoration: none;">Preferências de e-mail</a>
              </div>
              <div style="margin-bottom: 16px;">
                <a href="${process.env.CANCEL_SUBSCRIPTION_URL}" style="color: #666; text-decoration: none;">Cancelar assinatura</a>
              </div>
              <p style="margin-bottom: 5px;">© Moveme ${new Date().getFullYear()}</p>
              <p style="margin: 0;">Moveme.com</p>
              
              <!-- Social Media Icons -->
              <div style="margin-top: 16px;">
                <a href="${process.env.FACEBOOK_URL}" style="margin-right: 12px;">
                  <img src="${process.env.FACEBOOK_ICON}" alt="Facebook" style="height: 24px;"/>
                </a>
                <a href="${process.env.INSTAGRAM_URL}">
                  <img src="${process.env.INSTAGRAM_ICON}" alt="Instagram" style="height: 24px;"/>
                </a>
              </div>
            </div>
          </div>
        `
      };

      const info = await this.transporter.sendMail(mailOptions);
      ///logger.info('Ride receipt email sent:', info.messageId);
      return info;
    } catch (error) {
     // logger.error('Error sending ride receipt email:', error);
     // throw new AppError('Erro ao enviar recibo da viagem por email', 500);
     throw error;
    }
  }

  async enviarEmailVerificacao(email, codigo) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Verificação de Email - Moveme',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <!-- Logo -->
            <div style="margin-bottom: 30px;">
              <img src="${process.env.LOGO_URL}" alt="Moveme" style="height: 30px;"/>
            </div>

            <!-- Título e Código -->
            <h1 style="color: #333; font-size: 24px; margin-bottom: 20px;">
              Seu código de verificação é:
            </h1>
            
            <div style="margin: 30px 0;">
              <span style="color: #0066FF; font-size: 32px; font-weight: bold; letter-spacing: 2px;">
                ${codigo}
              </span>
            </div>

            <!-- Mensagem -->
            <div style="color: #666; margin-bottom: 30px;">
              <p style="margin-bottom: 15px;">
                Por favor, insira este código no aplicativo para verificar seu email.
              </p>
              <p style="margin-bottom: 15px;">
                Este código expira em 10 minutos.
              </p>
              <p style="margin-bottom: 15px;">
                Abraços,<br/>
                Equipe Moveme
              </p>
            </div>

            <!-- Aviso -->
            <div style="color: #666; font-size: 12px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
              <p>Esse email é enviado automaticamente e não recebe respostas.</p>
              <p>Precisa de ajuda? <a href="${process.env.HELP_URL}" style="color: #0066FF; text-decoration: none;">Fale conosco</a></p>
            </div>

            <!-- Footer -->
            <div style="margin-top: 40px; font-size: 12px; color: #999;">
              <div style="margin-bottom: 10px;">
                <a href="${process.env.HELP_CENTER_URL}" style="color: #666; text-decoration: none; margin-right: 20px;">Central de ajuda</a>
                <a href="${process.env.PRIVACY_URL}" style="color: #666; text-decoration: none; margin-right: 20px;">Privacidade</a>
                <a href="${process.env.TERMS_URL}" style="color: #666; text-decoration: none; margin-right: 20px;">Termos</a>
                <a href="${process.env.EMAIL_PREFERENCES_URL}" style="color: #666; text-decoration: none;">Preferências de e-mail</a>
              </div>
              <p style="margin-bottom: 5px;">© Moveme ${new Date().getFullYear()}</p>
              <p style="margin: 0;">Moveme.com</p>
            </div>
          </div>
        `
      };

      const info = await this.transporter.sendMail(mailOptions);
      //logger.info('Email verification code sent:', info.messageId);
      return info;
    } catch (error) {
      //logger.error('Error sending verification email:', error);
      //throw new AppError('Erro ao enviar email de verificação', 500);

      throw error;
    }
  }

  async sendPasswordResetNotificationEmail(email, name) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Problemas para entrar no App Move Me?',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #000000; color: #FFFFFF; padding: 20px;">
            <!-- Logo -->
            <div style="margin-bottom: 30px;">
              <img src="${process.env.LOGO_URL}" alt="Moveme" style="height: 30px;"/>
            </div>

            <!-- Conteúdo -->
            <div style="margin-bottom: 30px;">
              <h2 style="color: #FFFFFF; margin-bottom: 20px;">Olá ${name},</h2>
              
              <p style="color: #FFFFFF; margin-bottom: 20px; line-height: 1.5;">
                Lamentamos em saber que você está tendo problemas para entrar no App Move Me. 
                Recebemos uma mensagem informando que você esqueceu sua senha. 
                Se foi você, pode recuperar o acesso à sua conta ou redefinir a senha agora.
              </p>

              <!-- Botão -->
              <div style="margin: 30px 0;">
                <a href="${process.env.PASSWORD_RESET_URL}" 
                   style="display: inline-block;
                          background-color: #0066FF;
                          color: white;
                          padding: 15px 30px;
                          text-decoration: none;
                          border-radius: 5px;
                          font-weight: bold;">
                  Redefina sua senha
                </a>
              </div>

              <!-- Aviso de Segurança -->
              <p style="color: #FFFFFF; margin-bottom: 20px; line-height: 1.5;">
                Se você não solicitou um link de login ou redefinição de senha, ignore esta mensagem e 
                <a href="${process.env.HELP_URL}" style="color: #0066FF; text-decoration: none;">saiba mais sobre por que você pode tê-la recebido</a>
              </p>
              
              <p style="color: #FFFFFF; margin-bottom: 30px; line-height: 1.5;">
                Somente as pessoas que souberem sua senha do App Move Me ou clicarem no link de login 
                neste e-mail poderão entrar na sua conta.
              </p>
            </div>

            <!-- Footer -->
            <div style="margin-top: 40px; text-align: left;">
              <p style="color: #FFFFFF; margin-bottom: 5px;">from</p>
              <img src="${process.env.LOGO_URL}" alt="Moveme" style="height: 20px; margin-bottom: 20px;"/>
              
              <p style="color: #FFFFFF; font-size: 12px; margin-bottom: 10px;">
                Esta mensagem foi enviada para ${email} e destina-se a ${name}. 
                Não é você? <a href="${process.env.REMOVE_EMAIL_URL}" style="color: #0066FF; text-decoration: none;">Remova seu e-mail desta conta</a>
              </p>
            </div>
          </div>
        `
      };

      const info = await this.transporter.sendMail(mailOptions);
      return info;
    } catch (error) {
      throw error;
    }
  }
}

const emailServiceInstance = new EmailService();
export const emailService = emailServiceInstance;
export const { enviarEmailVerificacao } = emailServiceInstance;
export default emailServiceInstance;
