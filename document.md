# Read Receipts Implementation for Public Chat

## Overview
Implemented a per-user read receipt system for public chat messages showing:
- **✓** (single tick): At least 1 user has read the message
- **✓✓** (double tick): ALL users have read the message

## Backend Changes

### 1. Message Entity (`model/Message.java`)
- Added `readByUserIds` field (JSON column) to track which users have read each message
- Stores as JSON array: `[userId1, userId2, userId3]`

```java
@Column(name = "read_by_user_ids", columnDefinition = "JSON")
private String readByUserIds = "[]";
```

### 2. ChatMessageDto (`dto/ChatMessageDto.java`)
- Added `readByUserIds` as List<Long> for JSON serialization
- Getter/setter methods included

```java
private List<Long> readByUserIds;
```

### 3. ChatService (`service/ChatService.java`)
- **markMessageAsRead()** - Now accepts userId parameter and adds to readByUserIds list
  - Parses JSON array
  - Adds current userId if not already present
  - Serializes back to JSON
  - Returns DTO with updated readByUserIds

- **toDto()** - Updated to parse readByUserIds JSON into List<Long>

- Helper methods:
  - `parseReadByUserIds()` - Converts JSON string to List<Long>
  - `toJson()` - Converts List<Long> to JSON string

### 4. ChatController (`controller/ChatController.java`)
- **sendReadReceipt()** - Updated to:
  - Extract userId from WebSocket session
  - Pass userId to `markMessageAsRead(messageId, userId)`
  - Broadcast updated message with full readByUserIds to all clients

### 5. MessageController (`controller/MessageController.java`)
- **markAsRead()** - Updated to extract userId from Authentication and pass to service

## Frontend Changes

### 1. MessageBubble Component (`components/MessageBubble.jsx`)
- New prop: `totalUsers` (total number of active users)
- Updated check condition: Uses `readByUserIds` array instead of `readAt` timestamp
- Updated `getTick()` logic:
  ```
  If readByUserIds.length == 0: show ✓ (sent, not read)
  If readByUserIds.length > 0 && readByUserIds.length < totalUsers: show ✓ (someone read)
  If readByUserIds.length === totalUsers: show ✓✓ (all read)
  ```
- IntersectionObserver: Checks `readByUserIds.length > 0` instead of `readAt`

### 2. ChatRoom Component (`components/ChatRoom.jsx`)
- New prop: `totalUsers` (passed from parent Home component)
- Passes `totalUsers` to each MessageBubble instance

### 3. Home Component (`pages/Home.jsx`)
- Passes `totalUsers={users.length}` to ChatRoom component
- Updated all unread message checks:
  - Changed from `!message.readAt` to `!message.readByUserIds || message.readByUserIds.length === 0`
  - Updated in: `publicUnreadCount`, `sortedUsers`, `handleMessageVisible()`
- Updated optimistic update in `handleMessageVisible()`:
  - Adds current user to `readByUserIds` array immediately (optimistic UI update)
  - Deduplicates user IDs in the array

## Data Flow

### Reading a Message (Public Chat):
1. **User Scrolls to Message** → Message becomes visible on screen
2. **IntersectionObserver Triggers** → Detects message with ratio > 0.5
3. **onVisible() Called** → Frontend calls `handleMessageVisible(message)`
4. **Optimistic Update** → Immediately add current userId to readByUserIds, update UI
5. **Send Read Receipt** → WebSocket message to `/app/chat.read-receipt` with messageId
6. **Backend Receives** → Extracts userId from session, adds to readByUserIds in DB
7. **Broadcast Message** → Server sends updated message to `/topic/public`
8. **All Clients Update** → Receive message update with full readByUserIds array
9. **UI Updates** → MessageBubble recalculates ticks based on readByUserIds length vs totalUsers

### Checkmark Display Logic:
```
readByUserIds = [userId1, userId2, userId3]
totalUsers = 5
readCount = 3

If readCount === 0: ✓ (sent)
If readCount > 0 && readCount < 5: ✓ (someone read)
If readCount === 5: ✓✓ (all read)
```

## Database Schema Change

### Migration:
```sql
ALTER TABLE messages ADD COLUMN read_by_user_ids JSON DEFAULT '[]';
```

Hibernate will auto-apply this change if `ddl-auto=update` is set.

## Benefits

1. **Per-User Tracking** - Know exactly who has read your message
2. **Global Awareness** - See if all recipients have read (✓✓)
3. **Optimistic UI** - Instant visual feedback when you read a message
4. **Real-time Sync** - All connected clients see read receipts update in real-time
5. **Backward Compatible** - New messages default to empty readByUserIds array

## Testing Checklist

- [ ] Deploy backend, database migrates schema automatically (if ddl-auto=update)
- [ ] Login with 2+ users
- [ ] Send public message
- [ ] Verify sender sees ✓
- [ ] Have first user scroll to message → See optimistic ✓ locally, then ✓ from broadcast
- [ ] Verify sender still sees ✓ (only 1 of 2 read)
- [ ] Have second user scroll to message
- [ ] Verify sender now sees ✓✓ (all 2 users have read)
- [ ] Test with 5+ users to verify the full user count matching logic
