package com.foodcommand.controller;

import com.foodcommand.dto.ForgotPasswordRequest;
import com.foodcommand.dto.ResetPasswordRequest;
import com.foodcommand.service.PasswordResetService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/auth")
public class PasswordResetController {

    @Autowired
    private PasswordResetService passwordResetService;

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        try {
            passwordResetService.initiatePasswordReset(request.getEmail());
            return ResponseEntity.ok("Un code OTP a été envoyé à votre adresse email.");
        } catch (Exception e) {
            // Pour des raisons de sécurité, on peut renvoyer OK même si l'email n'existe pas,
            // mais ici l'utilisateur demande explicitement la vérification.
            return ResponseEntity.badRequest().body("Erreur: " + e.getMessage());
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        try {
            passwordResetService.resetPassword(request.getEmail(), request.getOtp(), request.getNewPassword());
            return ResponseEntity.ok("Votre mot de passe a été réinitialisé avec succès.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Erreur: " + e.getMessage());
        }
    }
}
