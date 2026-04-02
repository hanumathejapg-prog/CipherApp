package com.cipher.dto;

import com.cipher.model.UserStatus;

public record UserDto(Long id, String name, String picture, UserStatus status) {
}
