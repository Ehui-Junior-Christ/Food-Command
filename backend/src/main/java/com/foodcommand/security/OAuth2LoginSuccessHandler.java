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

    private static final org.slf4j.Logger logger = org.slf4j.LoggerFactory.getLogger(OAuth2LoginSuccessHandler.class);

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private UserRepository userRepository;

    @Value("${app.frontend.url:http://localhost:8080}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
        logger.info("=== OAuth2 Login SUCCESS ===");
        
        org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken authToken = 
                (org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken) authentication;
        String registrationId = authToken.getAuthorizedClientRegistrationId();
        
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        
        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");
        String picture = oAuth2User.getAttribute("picture");
        String providerId = oAuth2User.getName(); // Usually the sub or id

        logger.info("OAuth2 provider: {}, email: {}, name: {}", registrationId, email, name);

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
            logger.error("Email not found from OAuth2 provider: {}", registrationId);
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Email not found from " + registrationId);
            return;
        }

        com.foodcommand.model.AuthProvider provider = com.foodcommand.model.AuthProvider.valueOf(registrationId.toUpperCase());

        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            logger.info("Creating new user from OAuth2: {}", email);
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
        
        // Always redirect to the backend-served frontend (same origin as OAuth callback)
        String targetUrlStr = frontendUrl.endsWith("/")
                ? frontendUrl + "index.html"
                : frontendUrl + "/index.html";
        
        // Check if frontend set a redirect cookie
        if (request.getCookies() != null) {
            for (jakarta.servlet.http.Cookie cookie : request.getCookies()) {
                if ("frontend_url".equals(cookie.getName())) {
                    String cookieVal = cookie.getValue();
                    if (cookieVal != null && !cookieVal.isEmpty()) {
                        targetUrlStr = cookieVal;
                    }
                    // Clear the cookie after use
                    jakarta.servlet.http.Cookie clearCookie = new jakarta.servlet.http.Cookie("frontend_url", "");
                    clearCookie.setPath("/");
                    clearCookie.setMaxAge(0);
                    response.addCookie(clearCookie);
                    break;
                }
            }
        }

        String targetUrl = UriComponentsBuilder.fromUriString(targetUrlStr)
                .queryParam("token", token)
                .queryParam("oauth_role", user.getRole().name())
                .queryParam("oauth_email", user.getEmail())
                .queryParam("oauth_name", user.getFullName() != null ? user.getFullName() : "")
                .queryParam("oauth_id", user.getId())
                .build().toUriString();

        logger.info("OAuth2 redirecting to: {}", targetUrl);
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
