import { MailService } from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  console.warn('SENDGRID_API_KEY environment variable is not set - email functionality will be disabled');
}

const mailService = new MailService();
if (process.env.SENDGRID_API_KEY) {
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
}

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.log('Email would be sent:', params);
    return true; // Return success for testing when API key is not configured
  }

  try {
    await mailService.send({
      to: params.to,
      from: params.from,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}

export function generateAccessEmail(userEmail: string, accessLink: string, username: string, password: string) {
  const subject = 'AEGIS Professional Care - Portal Access Credentials';
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: hsl(45, 76%, 40%); margin-bottom: 10px;">AEGIS Professional Care</h1>
        <p style="color: #666; font-size: 16px;">Professional Home Health Care Management</p>
      </div>
      
      <div style="background-color: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
        <h2 style="color: #333; margin-bottom: 20px;">Portal Access Credentials</h2>
        <p style="color: #555; font-size: 16px; margin-bottom: 20px;">
          You have been granted access to the AEGIS Professional Care portal. Use the credentials below to log in:
        </p>
        
        <div style="background-color: white; padding: 20px; border-radius: 6px; border-left: 4px solid hsl(45, 76%, 40%);">
          <p style="margin: 0 0 10px 0;"><strong>Username:</strong> ${username}</p>
          <p style="margin: 0 0 15px 0;"><strong>Password:</strong> ${password}</p>
          <p style="margin: 0;"><strong>Portal Link:</strong> <a href="${accessLink}" style="color: hsl(45, 76%, 40%);">${accessLink}</a></p>
        </div>
      </div>
      
      <div style="text-align: center; margin-bottom: 25px;">
        <a href="${accessLink}" 
           style="background-color: hsl(45, 76%, 40%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
          Access Portal
        </a>
      </div>
      
      <div style="border-top: 1px solid #ddd; padding-top: 20px; text-align: center; color: #666; font-size: 14px;">
        <p style="margin: 0 0 5px 0;">AEGIS Professional Care</p>
        <p style="margin: 0;">Professional Home Health Care Services</p>
      </div>
    </div>
  `;
  
  const text = `
AEGIS Professional Care - Portal Access Credentials

You have been granted access to the AEGIS Professional Care portal.

Username: ${username}
Password: ${password}
Portal Link: ${accessLink}

Access the portal at: ${accessLink}

AEGIS Professional Care
Professional Home Health Care Services
  `;
  
  return { subject, html, text };
}