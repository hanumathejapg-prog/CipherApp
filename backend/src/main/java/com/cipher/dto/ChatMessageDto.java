package com.cipher.dto;

import com.cipher.model.MessageType;

import java.time.Instant;
import java.util.List;

public class ChatMessageDto {
    private Long id;
    private Long senderId;
    private String senderName;
    private String senderPicture;
    private Long receiverId;
    private String content;
    private MessageType type;
    private Instant timestamp;
    private Instant readAt;
    private List<Long> readByUserIds;
    private Long replyToId;
    private String replyToContent;
    private String replyToSenderName;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getSenderId() { return senderId; }
    public void setSenderId(Long senderId) { this.senderId = senderId; }
    public String getSenderName() { return senderName; }
    public void setSenderName(String senderName) { this.senderName = senderName; }
    public String getSenderPicture() { return senderPicture; }
    public void setSenderPicture(String senderPicture) { this.senderPicture = senderPicture; }
    public Long getReceiverId() { return receiverId; }
    public void setReceiverId(Long receiverId) { this.receiverId = receiverId; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public MessageType getType() { return type; }
    public void setType(MessageType type) { this.type = type; }
    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }
    public Instant getReadAt() { return readAt; }
    public void setReadAt(Instant readAt) { this.readAt = readAt; }
    public List<Long> getReadByUserIds() { return readByUserIds; }
    public void setReadByUserIds(List<Long> readByUserIds) { this.readByUserIds = readByUserIds; }
    public Long getReplyToId() { return replyToId; }
    public void setReplyToId(Long replyToId) { this.replyToId = replyToId; }
    public String getReplyToContent() { return replyToContent; }
    public void setReplyToContent(String replyToContent) { this.replyToContent = replyToContent; }
    public String getReplyToSenderName() { return replyToSenderName; }
    public void setReplyToSenderName(String replyToSenderName) { this.replyToSenderName = replyToSenderName; }
}
