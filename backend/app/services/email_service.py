import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional

from ..config import settings

logger = logging.getLogger(__name__)

class EmailService:
    """Service for sending email notifications"""
    
    def __init__(
        self,
        smtp_host: Optional[str] = None,
        smtp_port: Optional[int] = None,
        username: Optional[str] = None,
        password: Optional[str] = None,
        from_email: Optional[str] = None,
        from_name: Optional[str] = None
    ):
        self.smtp_host = smtp_host or settings.SMTP_HOST
        self.smtp_port = smtp_port or settings.SMTP_PORT
        self.username = username or settings.SMTP_USERNAME
        self.password = password or settings.SMTP_PASSWORD
        self.from_email = from_email or settings.SMTP_FROM_EMAIL
        self.from_name = from_name or settings.SMTP_FROM_NAME
    
    def _is_configured(self) -> bool:
        """Check if email service is properly configured"""
        return all([
            self.smtp_host,
            self.smtp_port,
            self.username,
            self.password,
            self.from_email
        ])
    
    async def send_email(
        self,
        to_email: str,
        subject: str,
        html_body: str,
        text_body: Optional[str] = None
    ) -> bool:
        """
        Send an email using SMTP.
        
        Args:
            to_email: Recipient email address
            subject: Email subject
            html_body: HTML email body
            text_body: Plain text email body (optional)
        
        Returns:
            True if email was sent successfully, False otherwise
        """
        if not self._is_configured():
            logger.warning("Email service not configured. Skipping email send.")
            return False
        
        try:
            # Create message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = f"{self.from_name} <{self.from_email}>"
            msg['To'] = to_email
            
            # Add text and HTML parts
            if text_body:
                part1 = MIMEText(text_body, 'plain')
                msg.attach(part1)
            
            part2 = MIMEText(html_body, 'html')
            msg.attach(part2)
            
            # Send email
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                server.login(self.username, self.password)
                server.send_message(msg)
            
            logger.info(f"Email sent successfully to {to_email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {e}", exc_info=True)
            return False
    
    async def send_inquiry_notification(
        self,
        inquiry_data: dict
    ) -> bool:
        """
        Send email notification to admin when new inquiry is received.
        
        Args:
            inquiry_data: Dictionary containing inquiry details
        
        Returns:
            True if email was sent successfully, False otherwise
        """
        if not settings.ADMIN_EMAIL:
            logger.warning("Admin email not configured. Skipping inquiry notification.")
            return False
        
        subject = f"New Inquiry: {inquiry_data.get('subject', 'No Subject')}"
        
        html_body = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <h2 style="color: #2c3e50;">New Inquiry Received</h2>
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
                    <p><strong>Name:</strong> {inquiry_data.get('name', 'N/A')}</p>
                    <p><strong>Email:</strong> {inquiry_data.get('email', 'N/A')}</p>
                    <p><strong>Phone:</strong> {inquiry_data.get('phone', 'N/A')}</p>
                    <p><strong>Subject:</strong> {inquiry_data.get('subject', 'N/A')}</p>
                    <p><strong>Message:</strong></p>
                    <p style="background-color: white; padding: 15px; border-left: 3px solid #3498db;">
                        {inquiry_data.get('message', 'N/A')}
                    </p>
                </div>
                <p style="color: #7f8c8d; font-size: 12px;">
                    This inquiry was submitted on {inquiry_data.get('created_at', 'N/A')}
                </p>
            </body>
        </html>
        """
        
        text_body = f"""
New Inquiry Received

Name: {inquiry_data.get('name', 'N/A')}
Email: {inquiry_data.get('email', 'N/A')}
Phone: {inquiry_data.get('phone', 'N/A')}
Subject: {inquiry_data.get('subject', 'N/A')}

Message:
{inquiry_data.get('message', 'N/A')}

This inquiry was submitted on {inquiry_data.get('created_at', 'N/A')}
        """
        
        return await self.send_email(
            to_email=settings.ADMIN_EMAIL,
            subject=subject,
            html_body=html_body,
            text_body=text_body
        )
    
    async def send_inquiry_confirmation(
        self,
        inquiry_data: dict
    ) -> bool:
        """
        Send confirmation email to customer after inquiry submission.
        
        Args:
            inquiry_data: Dictionary containing inquiry details
        
        Returns:
            True if email was sent successfully, False otherwise
        """
        customer_email = inquiry_data.get('email')
        if not customer_email:
            logger.warning("Customer email not provided. Skipping confirmation email.")
            return False
        
        subject = "Thank you for contacting New Delhi Electricals"
        
        html_body = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <h2 style="color: #2c3e50;">Thank You for Your Inquiry</h2>
                <p>Dear {inquiry_data.get('name', 'Customer')},</p>
                <p>We have received your inquiry and will get back to you as soon as possible.</p>
                
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
                    <h3 style="color: #2c3e50; margin-top: 0;">Your Inquiry Details:</h3>
                    <p><strong>Subject:</strong> {inquiry_data.get('subject', 'N/A')}</p>
                    <p><strong>Message:</strong></p>
                    <p style="background-color: white; padding: 15px; border-left: 3px solid #3498db;">
                        {inquiry_data.get('message', 'N/A')}
                    </p>
                </div>
                
                <p>Our team typically responds within 24-48 hours during business days.</p>
                
                <p>Best regards,<br>
                <strong>New Delhi Electricals Team</strong></p>
                
                <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
                <p style="color: #7f8c8d; font-size: 12px;">
                    If you have any urgent questions, please feel free to call us directly.
                </p>
            </body>
        </html>
        """
        
        text_body = f"""
Thank You for Your Inquiry

Dear {inquiry_data.get('name', 'Customer')},

We have received your inquiry and will get back to you as soon as possible.

Your Inquiry Details:
Subject: {inquiry_data.get('subject', 'N/A')}

Message:
{inquiry_data.get('message', 'N/A')}

Our team typically responds within 24-48 hours during business days.

Best regards,
New Delhi Electricals Team

---
If you have any urgent questions, please feel free to call us directly.
        """
        
        return await self.send_email(
            to_email=customer_email,
            subject=subject,
            html_body=html_body,
            text_body=text_body
        )

# Global email service instance
email_service = EmailService()
