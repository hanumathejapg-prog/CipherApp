package com.cipher.service;

import com.cipher.dto.UserDto;
import com.cipher.model.AuthProvider;
import com.cipher.model.User;
import com.cipher.model.UserStatus;
import com.cipher.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional
    public User upsertOAuthUser(String providerUserId, String name, String picture) {
        User user = userRepository.findByProviderUserId(providerUserId).orElseGet(User::new);
        user.setProviderUserId(providerUserId);
        user.setName(name);
        user.setPicture(picture);
        user.setProvider(AuthProvider.GOOGLE);
        if (user.getStatus() == null) {
            user.setStatus(UserStatus.OFFLINE);
        }
        return userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public User getById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + id));
    }

    @Transactional(readOnly = true)
    public User getByProviderId(String providerUserId) {
        return userRepository.findByProviderUserId(providerUserId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + providerUserId));
    }

    @Transactional
    public void setStatus(Long userId, UserStatus status) {
        userRepository.findById(userId).ifPresent(u -> {
            u.setStatus(status);
            userRepository.save(u);
        });
    }

    @Transactional(readOnly = true)
    public List<UserDto> getAll() {
        return userRepository.findAll().stream()
                .map(u -> new UserDto(u.getId(), u.getName(), u.getPicture(), u.getStatus()))
                .toList();
    }
}
