import nodemailer from 'nodemailer';

// Create transporter
const createTransporter = () => {
  const port = Number(process.env.SMTP_PORT || 587);
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port,
    secure: port === 465, // true for 465, false for 587/25
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

// Send OTP Email
export const sendOTPEmail = async (email, otp, purpose = 'verification') => {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log(`\n📧 [EMAIL SERVICE] ${purpose === 'verification' ? 'VERIFICATION' : 'PASSWORD RESET'} OTP for ${email}: ${otp}`);
      console.log('⚠️  SMTP not configured. Configure in .env for production.\n');
      return { success: true, message: 'OTP logged to console (SMTP not configured)' };
    }

    console.log(`\n📧 [SMTP Config] Host: ${process.env.SMTP_HOST}, Port: ${process.env.SMTP_PORT}, User: ${process.env.SMTP_USER}`);
    
    const transporter = createTransporter();

    // Optional: verify connection when SMTP creds are provided
    console.log('🔍 Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified');
    
    const subject = purpose === 'verification' 
      ? 'Verify Your Email - ATPL CRM'
      : 'Reset Your Password - ATPL CRM';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .otp-box { background: white; border: 2px dashed #667eea; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
          .otp-code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 ${purpose === 'verification' ? 'Email Verification' : 'Password Reset'}</h1>
          </div>
          <div class="content">
            <h2>Hello!</h2>
            <p>${purpose === 'verification' 
              ? 'Thank you for registering with ATPL CRM. Please use the OTP below to verify your email address:'
              : 'We received a request to reset your password. Use the OTP below to proceed:'
            }</p>
            
            <div class="otp-box">
              <div class="otp-code">${otp}</div>
            </div>
            
            <p><strong>This OTP is valid for 10 minutes.</strong></p>
            <p>If you didn't request this, please ignore this email.</p>
            
            <div class="footer">
              <p>© ${new Date().getFullYear()} ATPL CRM. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    console.log(`📤 Sending OTP email to: ${email}`);
    const info = await transporter.sendMail({
      from: `"ATPL CRM" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: email,
      subject,
      html
    });

    console.log(`✅ Email sent successfully. Message ID: ${info.messageId}\n`);
    return { success: true, message: 'OTP sent successfully' };
  } catch (error) {
    console.error('❌ Email sending error:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      response: error.response,
      responseCode: error.responseCode
    });
    return { success: false, message: `OTP email failed: ${error.message || 'Unknown error'}` };
  }
};

// Send Welcome Email
export const sendWelcomeEmail = async (email, firstName, role) => {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return { success: true, message: 'Welcome email skipped (SMTP not configured)' };
    }

    const transporter = createTransporter();
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to ATPL CRM!</h1>
          </div>
          <div class="content">
            <h2>Hello ${firstName}!</h2>
            <p>Your account has been successfully created with the role of <strong>${role}</strong>.</p>
            <p>You can now log in and start managing your business operations efficiently.</p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" class="button">Go to Login</a>
            <p>If you have any questions, feel free to reach out to our support team.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"ATPL CRM" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: email,
      subject: 'Welcome to ATPL CRM',
      html
    });

    return { success: true, message: 'Welcome email sent' };
  } catch (error) {
    console.error('Welcome email error:', error);
    // Don't throw error for welcome email
    return { success: false, message: 'Welcome email failed' };
  }
};
