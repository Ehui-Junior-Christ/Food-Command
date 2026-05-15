package com.foodcommand.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${app.mail.from:noreply@kazani-saas.com}")
    private String fromEmail;

    public void sendHtmlEmail(String to, String subject, String htmlBody) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            
            mailSender.send(message);
        } catch (MessagingException e) {
            throw new RuntimeException("Erreur lors de l'envoi de l'email : " + e.getMessage());
        }
    }

    public void sendResetOtpEmail(String to, String otp) {
        String subject = "🔑 Code de vérification Kazani";
        String htmlBody = " <div style=\"font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;\">" +
                " <h2 style=\"color: #FF5A5F; text-align: center;\">Kazani SaaS</h2>" +
                " <p>Bonjour,</p>" +
                " <p>Vous avez demandé la réinitialisation de votre mot de passe. Voici votre code de vérification à usage unique :</p>" +
                " <div style=\"background-color: #f8f9fa; border: 2px dashed #FF5A5F; padding: 20px; text-align: center; margin: 20px 0; border-radius: 10px;\">" +
                "   <span style=\"font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1e293b;\">" + otp + "</span>" +
                " </div>" +
                " <p style=\"color: #64748b; font-size: 14px;\">Ce code expirera dans <b>10 minutes</b>.</p>" +
                " <hr style=\"border: 0; border-top: 1px solid #eee; margin: 20px 0;\">" +
                " <p style=\"color: #94a3b8; font-size: 12px; text-align: center;\">Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail en toute sécurité.</p>" +
                " <p style=\"text-align: center; font-weight: bold; color: #1e293b;\">L'équipe Kazani</p>" +
                " </div>";
        
        sendHtmlEmail(to, subject, htmlBody);
    }
}
