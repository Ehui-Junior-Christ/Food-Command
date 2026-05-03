package com.foodcommand.security;

import com.foodcommand.model.Role;
import com.foodcommand.model.User;
import com.foodcommand.repository.UserRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

@Component
public class OAuth2LoginSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private UserRepository userRepository;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");

        if (email == null) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Email not found from Google");
            return;
        }

        // Create user if not exists
        if (!userRepository.existsByEmail(email)) {
            User user = User.builder()
                    .email(email)
                    .fullName(name)
                    .password("") // No password for OAuth users
                    .role(Role.CLIENT)
                    .build();
            userRepository.save(user);
        }

        String token = jwtUtils.generateJwtToken(authentication);
        
        // Redirection vers la page d'accueil avec le token
        // Utilisation d'un chemin relatif pour que cela fonctionne en local ET en déploiement
        String targetUrl = UriComponentsBuilder.fromUriString("/index.html")
                .queryParam("token", token)
                .build().toUriString();

        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}
