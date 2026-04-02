package com.cipher.service;

import com.cipher.dto.ChatMessageDto;
import com.cipher.model.Message;
import com.cipher.model.MessageType;
import com.cipher.model.User;
import com.cipher.repository.MessageRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Service
public class ChatService {

    private final MessageRepository messageRepository;
    private final UserService userService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public ChatService(MessageRepository messageRepository, UserService userService) {
        this.messageRepository = messageRepository;
        this.userService = userService;
    }

    @Transactional
    public ChatMessageDto savePublicMessage(ChatMessageDto dto) {
        User sender = userService.getById(dto.getSenderId());
        Message message = new Message();
        message.setSender(sender);
        message.setReceiver(null);
        message.setContent(dto.getContent());
        message.setType(MessageType.PUBLIC);
        message.setReadByUserIds("[]");
        
        // Handle reply
        if (dto.getReplyToId() != null) {
            Message replyTo = messageRepository.findById(dto.getReplyToId())
                    .orElseThrow(() -> new IllegalArgumentException("Reply-to message not found: " + dto.getReplyToId()));
            message.setReplyTo(replyTo);
        }
        
        return toDto(messageRepository.save(message));
    }

    @Transactional
    public ChatMessageDto savePrivateMessage(ChatMessageDto dto) {
        User sender = userService.getById(dto.getSenderId());
        User receiver = userService.getById(dto.getReceiverId());
        Message message = new Message();
        message.setSender(sender);
        message.setReceiver(receiver);
        message.setContent(dto.getContent());
        message.setType(MessageType.PRIVATE);
        message.setReadByUserIds("[]");
        
        // Handle reply
        if (dto.getReplyToId() != null) {
            Message replyTo = messageRepository.findById(dto.getReplyToId())
                    .orElseThrow(() -> new IllegalArgumentException("Reply-to message not found: " + dto.getReplyToId()));
            message.setReplyTo(replyTo);
        }
        
        return toDto(messageRepository.save(message));
    }

    @Transactional(readOnly = true)
    public List<ChatMessageDto> publicHistory() {
        return messageRepository.findByTypeOrderByTimestampAsc(MessageType.PUBLIC)
                .stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public List<ChatMessageDto> privateHistory(Long authUserId, Long otherUserId) {
        return messageRepository.findByTypeAndSenderIdAndReceiverIdOrTypeAndSenderIdAndReceiverIdOrderByTimestampAsc(
                        MessageType.PRIVATE, authUserId, otherUserId,
                        MessageType.PRIVATE, otherUserId, authUserId
                )
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public ChatMessageDto markMessageAsRead(Long messageId, Long userId) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new IllegalArgumentException("Message not found: " + messageId));
        
        System.out.println("MARK_AS_READ - Message found: id=" + message.getId() + 
            ", sender_id=" + message.getSender().getId() + 
            ", receiver_id=" + (message.getReceiver() != null ? message.getReceiver().getId() : "null") + 
            ", userId_marking=" + userId);
        
        // Parse existing readByUserIds
        List<Long> readByUserIds = parseReadByUserIds(message.getReadByUserIds());
        
        // Add current user if not already in the list
        if (!readByUserIds.contains(userId)) {
            readByUserIds.add(userId);
            message.setReadByUserIds(toJson(readByUserIds));
        }
        
        if (message.getReadAt() == null) {
            message.setReadAt(Instant.now());
        }
        
        messageRepository.save(message);
        ChatMessageDto dto = toDto(message);
        System.out.println("MARK_AS_READ - DTO created: id=" + dto.getId() + 
            ", senderId=" + dto.getSenderId() + 
            ", readByUserIds=" + dto.getReadByUserIds());
        return dto;
    }

    private List<Long> parseReadByUserIds(String json) {
        try {
            if (json == null || json.isEmpty() || "[]".equals(json)) {
                return new ArrayList<>();
            }
            Long[] ids = objectMapper.readValue(json, Long[].class);
            return new ArrayList<>(Arrays.asList(ids));
        } catch (Exception e) {
            System.err.println("Error parsing readByUserIds JSON: " + e.getMessage());
            return new ArrayList<>();
        }
    }

    private String toJson(List<Long> ids) {
        try {
            return objectMapper.writeValueAsString(ids);
        } catch (Exception e) {
            System.err.println("Error serializing readByUserIds: " + e.getMessage());
            return "[]";
        }
    }

    private ChatMessageDto toDto(Message message) {
        ChatMessageDto dto = new ChatMessageDto();
        dto.setId(message.getId());
        dto.setSenderId(message.getSender().getId());
        dto.setSenderName(message.getSender().getName());
        dto.setSenderPicture(message.getSender().getPicture());
        if (message.getReceiver() != null) {
            dto.setReceiverId(message.getReceiver().getId());
        }
        dto.setContent(message.getContent());
        dto.setType(message.getType());
        dto.setTimestamp(message.getTimestamp());
        dto.setReadAt(message.getReadAt());
        
        // Always set readByUserIds as a list, never null
        List<Long> readByUserIds = parseReadByUserIds(message.getReadByUserIds());
        dto.setReadByUserIds(readByUserIds != null ? readByUserIds : new ArrayList<>());
        
        // Include reply information if this message is a reply
        if (message.getReplyTo() != null) {
            dto.setReplyToId(message.getReplyTo().getId());
            dto.setReplyToContent(message.getReplyTo().getContent());
            dto.setReplyToSenderName(message.getReplyTo().getSender().getName());
        }
        
        return dto;
    }
}
