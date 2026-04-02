package com.cipher.security;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

@Component
public class OAuth2SuccessHandler implements AuthenticationSuccessHandler {

    private final JwtUtil jwtUtil;
    private final String frontendRedirectUri;

    public OAuth2SuccessHandler(JwtUtil jwtUtil,
                                @Value("${app.oauth2.redirect-uri}") String frontendRedirectUri) {
        this.jwtUtil = jwtUtil;
        this.frontendRedirectUri = frontendRedirectUri;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        
        // Get database user ID - should be set by CustomOAuth2UserService
        Object dbIdObj = oAuth2User.getAttribute("database_user_id");
        if (dbIdObj == null) {
            throw new IllegalStateException("database_user_id not found in OAuth2 attributes");
        }
        
        Long databaseUserId = ((Number) dbIdObj).longValue();
        String token = jwtUtil.generateToken(String.valueOf(databaseUserId));
        
        String redirectUrl = UriComponentsBuilder
                .fromUriString(frontendRedirectUri)
                .queryParam("token", token)
                .build()
                .toUriString();
        response.sendRedirect(redirectUrl);
    }
}
