package com.cipher.security;

import com.cipher.service.UserService;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.HashSet;

@Service
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserService userService;

    public CustomOAuth2UserService(UserService userService) {
        this.userService = userService;
    }

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oauth2User = super.loadUser(userRequest);
        String providerId = oauth2User.getAttribute("sub");  // Google's unique user ID
        String name = oauth2User.getAttribute("name");
        String picture = oauth2User.getAttribute("picture");

        // Get the database user entity with generated ID
        com.cipher.model.User user = userService.upsertOAuthUser(providerId, name, picture);

        // Create a new attributes map and add the database user ID
        java.util.Map<String, Object> attributes = new java.util.HashMap<>(oauth2User.getAttributes());
        attributes.put("database_user_id", user.getId());

        return new DefaultOAuth2User(
                new HashSet<>(oauth2User.getAuthorities()),
                attributes,
                "sub"  // Use sub as the nameAttributeKey
        );
    }
}
