package com.foodcommand.service;

import com.foodcommand.model.PasswordResetToken;
import com.foodcommand.model.User;
import com.foodcommand.repository.PasswordResetTokenRepository;
import com.foodcommand.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Random;

@Service
public class PasswordResetService {

    @Autowired
    private PasswordResetTokenRepository tokenRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private EmailService emailService;

    @Transactional
    public void initiatePasswordReset(String email) {
        User user = userRepository.findByEmail(email.toLowerCase().trim())
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé avec cet email."));

        // Delete existing token if any
        tokenRepository.deleteByUser(user);

        // Generate 6-digit OTP
        String otp = String.format("%06d", new Random().nextInt(999999));

        PasswordResetToken token = PasswordResetToken.builder()
                .token(otp)
                .user(user)
                .expiryDate(LocalDateTime.now().plusMinutes(10))
                .build();

        tokenRepository.save(token);

        // Send Email
        emailService.sendResetOtpEmail(user.getEmail(), otp);
    }

    @Transactional
    public void resetPassword(String email, String otp, String newPassword) {
        User user = userRepository.findByEmail(email.toLowerCase().trim())
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé."));

        PasswordResetToken token = tokenRepository.findByToken(otp)
                .filter(t -> t.getUser().equals(user))
                .orElseThrow(() -> new RuntimeException("Code OTP invalide."));

        if (token.isExpired()) {
            tokenRepository.delete(token);
            throw new RuntimeException("Le code OTP a expiré.");
        }

        // Update password
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // Delete token
        tokenRepository.delete(token);
    }
}
