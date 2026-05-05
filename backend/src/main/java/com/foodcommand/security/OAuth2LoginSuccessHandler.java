package com.foodcommand.security;

import com.foodcommand.model.Role;
import com.foodcommand.model.User;
import com.foodcommand.repository.UserRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
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

    @Value("${app.frontend.url:http://127.0.0.1:5500}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
        org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken authToken = 
                (org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken) authentication;
        String registrationId = authToken.getAuthorizedClientRegistrationId();
        
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        
        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");
        String picture = oAuth2User.getAttribute("picture");
        String providerId = oAuth2User.getName(); // Usually the sub or id

        // Specific mapping for Facebook
        if ("facebook".equals(registrationId)) {
            email = oAuth2User.getAttribute("email");
            name = oAuth2User.getAttribute("name");
            picture = getFacebookPicture(oAuth2User);
        } else if ("apple".equals(registrationId)) {
            // Apple mapping is different
            email = oAuth2User.getAttribute("email");
            name = oAuth2User.getAttribute("name");
            // Apple doesn't provide picture easily
        }

        if (email == null) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Email not found from " + registrationId);
            return;
        }

        com.foodcommand.model.AuthProvider provider = com.foodcommand.model.AuthProvider.valueOf(registrationId.toUpperCase());

        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            user = User.builder()
                    .email(email)
                    .fullName(name)
                    .profileImageUrl(picture)
                    .password("") // Social users don't have a local password
                    .role(Role.CLIENT)
                    .provider(provider)
                    .providerId(providerId)
                    .build();
            userRepository.save(user);
        } else {
            boolean changed = false;
            if ((user.getFullName() == null || user.getFullName().isBlank()) && name != null) {
                user.setFullName(name);
                changed = true;
            }
            if ((user.getProfileImageUrl() == null || user.getProfileImageUrl().isBlank()) && picture != null) {
                user.setProfileImageUrl(picture);
                changed = true;
            }
            // Update provider if it was local or different (optional policy)
            if (user.getProvider() == com.foodcommand.model.AuthProvider.LOCAL) {
                user.setProvider(provider);
                user.setProviderId(providerId);
                changed = true;
            }
            if (changed) {
                userRepository.save(user);
            }
        }

        String token = jwtUtils.generateJwtToken(authentication);
        String normalizedFrontendUrl = frontendUrl.endsWith("/")
                ? frontendUrl.substring(0, frontendUrl.length() - 1)
                : frontendUrl;

        String targetUrl = UriComponentsBuilder.fromUriString(normalizedFrontendUrl + "/index.html")
                .queryParam("token", token)
                .build().toUriString();

        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }

    private String getFacebookPicture(OAuth2User user) {
        if (user.getAttribute("picture") instanceof java.util.Map) {
            java.util.Map<String, Object> pictureObj = user.getAttribute("picture");
            if (pictureObj.containsKey("data")) {
                java.util.Map<String, Object> dataObj = (java.util.Map<String, Object>) pictureObj.get("data");
                if (dataObj.containsKey("url")) {
                    return (String) dataObj.get("url");
                }
            }
        }
        return null;
    }
}
