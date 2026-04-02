package com.cipher.controller;

import com.cipher.dto.ChatMessageDto;
import com.cipher.model.MessageType;
import com.cipher.model.UserStatus;
import com.cipher.service.ChatService;
import com.cipher.service.UserService;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Controller;

@Controller
public class ChatController {

    private final ChatService chatService;
    private final UserService userService;
    private final SimpMessagingTemplate messagingTemplate;

    public ChatController(ChatService chatService,
                          UserService userService,
                          SimpMessagingTemplate messagingTemplate) {
        this.chatService = chatService;
        this.userService = userService;
        this.messagingTemplate = messagingTemplate;
    }

    @MessageMapping("/chat.send")
    public void sendPublic(@Payload ChatMessageDto message) {
        ChatMessageDto saved = chatService.savePublicMessage(message);
        messagingTemplate.convertAndSend("/topic/public", saved);
    }

    @MessageMapping("/chat.private")
    public void sendPrivate(@Payload ChatMessageDto message) {
        message.setType(MessageType.PRIVATE);
        ChatMessageDto saved = chatService.savePrivateMessage(message);
        messagingTemplate.convertAndSendToUser(saved.getReceiverId().toString(), "/queue/messages", saved);
        messagingTemplate.convertAndSendToUser(saved.getSenderId().toString(), "/queue/messages", saved);
    }

    @MessageMapping("/chat.addUser")
    public void addUser(@Payload ChatMessageDto message) {
        userService.setStatus(message.getSenderId(), UserStatus.ONLINE);
        messagingTemplate.convertAndSend("/topic/presence", userService.getAll());
    }

    @MessageMapping("/chat.disconnect")
    public void disconnect(@Payload ChatMessageDto message) {
        userService.setStatus(message.getSenderId(), UserStatus.OFFLINE);
        messagingTemplate.convertAndSend("/topic/presence", userService.getAll());
    }

    @MessageMapping("/chat.read-receipt")
    public void sendReadReceipt(@Payload ChatMessageDto message, StompHeaderAccessor headerAccessor) {
        // Get authenticated user ID from WebSocket session
        Object userIdObj = headerAccessor.getSessionAttributes().get("user_id");
        Long authenticatedUserId = userIdObj instanceof Long ? (Long) userIdObj : Long.parseLong(userIdObj.toString());
        
        System.out.println("READ RECEIPT RECEIVED: messageId=" + message.getId() + ", from_user_id=" + authenticatedUserId);
        
        // Mark message as read in database with the current user
        ChatMessageDto updatedMessage = chatService.markMessageAsRead(message.getId(), authenticatedUserId);
        System.out.println("MESSAGE MARKED AS READ: id=" + updatedMessage.getId() + ", readByUserIds=" + updatedMessage.getReadByUserIds());
        
        // Check if it's a public or private message
        if (updatedMessage.getReceiverId() == null) {
          // PUBLIC message - broadcast to all subscribers of /topic/public
          System.out.println("BROADCASTING TO PUBLIC: " + updatedMessage.getId());
          messagingTemplate.convertAndSend("/topic/public", updatedMessage);
        } else {
          // PRIVATE message - send to both sender and receiver
          System.out.println("SENDING TO SENDER: " + updatedMessage.getSenderId());
          messagingTemplate.convertAndSendToUser(updatedMessage.getSenderId().toString(), "/queue/messages", updatedMessage);
          
          System.out.println("SENDING TO RECEIVER: " + updatedMessage.getReceiverId());
          messagingTemplate.convertAndSendToUser(updatedMessage.getReceiverId().toString(), "/queue/messages", updatedMessage);
        }
        
        System.out.println("READ RECEIPT COMPLETE");
    }
}
