package com.cipher.controller;

import com.cipher.dto.ChatMessageDto;
import com.cipher.model.User;
import com.cipher.service.ChatService;
import com.cipher.service.UserService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/messages")
public class MessageController {

    private final ChatService chatService;
    private final UserService userService;

    public MessageController(ChatService chatService, UserService userService) {
        this.chatService = chatService;
        this.userService = userService;
    }

    @GetMapping("/public")
    public List<ChatMessageDto> publicMessages() {
        return chatService.publicHistory();
    }

    @GetMapping("/{userId}")
    public List<ChatMessageDto> privateMessages(Authentication authentication, @PathVariable Long userId) {
        Long currentUserId = Long.parseLong(authentication.getName());
        User current = userService.getById(currentUserId);
        return chatService.privateHistory(current.getId(), userId);
    }

    @PostMapping("/{messageId}/mark-as-read")
    public ChatMessageDto markAsRead(@PathVariable Long messageId, Authentication authentication) {
        Long currentUserId = Long.parseLong(authentication.getName());
        return chatService.markMessageAsRead(messageId, currentUserId);
    }
}
