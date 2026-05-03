package com.foodcommand.controller;

import com.foodcommand.dto.JwtResponse;
import com.foodcommand.dto.LoginRequest;
import com.foodcommand.dto.SignupRequest;
import com.foodcommand.dto.UpdateProfileRequest;
import com.foodcommand.dto.UserProfileResponse;
import com.foodcommand.model.User;
import com.foodcommand.repository.UserRepository;
import com.foodcommand.security.JwtUtils;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    @Autowired
    AuthenticationManager authenticationManager;

    @Autowired
    UserRepository userRepository;

    @Autowired
    PasswordEncoder encoder;

    @Autowired
    JwtUtils jwtUtils;

    @PostMapping("/signin")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(loginRequest.getEmail().trim().toLowerCase(), loginRequest.getPassword().trim()));

            SecurityContextHolder.getContext().setAuthentication(authentication);
            String jwt = jwtUtils.generateJwtToken(authentication);

            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            User user = userRepository.findByEmail(userDetails.getUsername()).get();

            return ResponseEntity.ok(new JwtResponse(jwt,
                    user.getId(),
                    userDetails.getUsername(),
                    user.getRole().name()));
        } catch (Exception e) {
            return ResponseEntity.status(401).body("Erreur: " + e.getMessage());
        }
    }

    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@Valid @RequestBody SignupRequest signUpRequest) {
        if (userRepository.existsByEmail(signUpRequest.getEmail())) {
            return ResponseEntity
                    .badRequest()
                    .body("Error: Email is already in use!");
        }

        User user = User.builder()
                .email(signUpRequest.getEmail())
                .password(encoder.encode(signUpRequest.getPassword()))
                .fullName(signUpRequest.getFullName())
                .phone(signUpRequest.getPhone())
                .role(signUpRequest.getRole())
                .build();

        userRepository.save(user);

        return ResponseEntity.ok("User registered successfully!");
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser() {
        String email = getAuthenticatedEmail();
        if (email == null) {
            return ResponseEntity.status(401).body("Not authenticated");
        }

        return userRepository.findByEmail(email)
                .map(user -> ResponseEntity.ok(UserProfileResponse.from(user)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/me")
    public ResponseEntity<?> updateProfile(@RequestBody UpdateProfileRequest updateData) {
        String email = getAuthenticatedEmail();
        if (email == null) {
            return ResponseEntity.status(401).body("Not authenticated");
        }

        return userRepository.findByEmail(email)
                .map(user -> {
                    if (updateData.getFullName() != null) {
                        user.setFullName(updateData.getFullName().trim());
                    }
                    if (updateData.getPhone() != null) {
                        user.setPhone(updateData.getPhone().trim());
                    }
                    if (updateData.getAddress() != null) {
                        user.setAddress(updateData.getAddress().trim());
                    }
                    if (updateData.getProfileImageUrl() != null) {
                        user.setProfileImageUrl(updateData.getProfileImageUrl());
                    }
                    userRepository.save(user);
                    return ResponseEntity.ok(UserProfileResponse.from(user));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    private String getAuthenticatedEmail() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication instanceof AnonymousAuthenticationToken) {
            return null;
        }
        return authentication.getName();
    }
}
