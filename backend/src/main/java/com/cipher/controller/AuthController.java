package com.cipher.controller;

import com.cipher.dto.UserDto;
import com.cipher.model.User;
import com.cipher.service.UserService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;

    public AuthController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public UserDto me(Authentication authentication) {
        String userIdStr = authentication.getName();
        try {
            // JWT now contains database user ID (Long value as string)
            Long userId = Long.parseLong(userIdStr);
            User user = userService.getById(userId);
            return new UserDto(user.getId(), user.getName(), user.getPicture(), user.getStatus());
        } catch (NumberFormatException e) {
            // Fallback: try to lookup by provider ID (for backward compatibility)
            User user = userService.getByProviderId(userIdStr);
            return new UserDto(user.getId(), user.getName(), user.getPicture(), user.getStatus());
        }
    }
}
