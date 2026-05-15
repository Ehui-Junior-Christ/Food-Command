package com.foodcommand.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.http.HttpMethod;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.oauth2.client.web.HttpSessionOAuth2AuthorizationRequestRepository;

import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class WebSecurityConfig {
    @Autowired
    UserDetailsServiceImpl userDetailsService;

    @Autowired
    private AuthEntryPointJwt unauthorizedHandler;

    // Use Spring Security's built-in session-based OAuth2 authorization request repository
    // This is more reliable than cookie-based serialization which breaks in Spring Boot 3.x

    @Bean
    public AuthTokenFilter authenticationJwtTokenFilter() {
        return new AuthTokenFilter();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();

        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());

        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Autowired
    private OAuth2LoginSuccessHandler oauth2LoginSuccessHandler;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.cors(cors -> cors.configurationSource(request -> {
                    var corsConfiguration = new org.springframework.web.cors.CorsConfiguration();
                    corsConfiguration.setAllowedOriginPatterns(java.util.List.of("*"));
                    corsConfiguration.setAllowedMethods(java.util.List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
                    corsConfiguration.setAllowedHeaders(java.util.List.of("*"));
                    corsConfiguration.setAllowCredentials(true);
                    return corsConfiguration;
                }))
                .csrf(csrf -> csrf.disable())
                .exceptionHandling(exception -> exception.authenticationEntryPoint(unauthorizedHandler))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.ALWAYS))
                .authorizeHttpRequests(auth ->
                        auth.requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                                // OAuth2 callback paths - must be public
                                .requestMatchers("/oauth2/**", "/login/oauth2/**", "/login/**").permitAll()
                                .requestMatchers(HttpMethod.GET, "/api/auth/me").authenticated()
                                .requestMatchers(HttpMethod.PUT, "/api/auth/me").authenticated()
                                .requestMatchers("/api/auth/**").permitAll()
                                .requestMatchers("/api/test/**").permitAll()
                                .requestMatchers("/api/restaurants/**").permitAll()
                                .requestMatchers(HttpMethod.GET, "/api/menu-items/**").permitAll()
                                .requestMatchers("/api/categories/**").permitAll()
                                .requestMatchers("/", "/index.html", "/css/**", "/js/**", "/assets/**", "/pages/**").permitAll()
                                .requestMatchers("/favicon.ico").permitAll()
                                .requestMatchers("/ws-tracking/**").permitAll()
                                .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
                                .requestMatchers(HttpMethod.GET, "/api/client/search").permitAll()
                                .requestMatchers("/api/client/**").hasRole("CLIENT")
                                .requestMatchers("/api/delivery/**").hasAnyRole("DELIVERY", "COURIER")
                                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                                .anyRequest().authenticated()
                )
                .oauth2Login(oauth2 -> oauth2
                        .authorizationEndpoint(authorization -> authorization
                                .authorizationRequestRepository(new HttpSessionOAuth2AuthorizationRequestRepository())
                        )
                        .successHandler(oauth2LoginSuccessHandler)
                        .failureHandler((request, response, exception) -> {
                            System.err.println("[OAuth2 FAILURE] " + exception.getClass().getName() + ": " + exception.getMessage());
                            exception.printStackTrace();
                            String errorMsg = exception.getMessage();
                            if (errorMsg == null) errorMsg = "unknown_error";
                            response.sendRedirect("/pages/auth.html?error=" + java.net.URLEncoder.encode(errorMsg, "UTF-8"));
                        })
                );

        http.authenticationProvider(authenticationProvider());
        http.addFilterBefore(authenticationJwtTokenFilter(), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
