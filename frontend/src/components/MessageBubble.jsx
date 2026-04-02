import React, { useEffect, useRef } from 'react';

const MessageBubble = ({ message, own, onVisible, onReply, totalUsers }) => {
  const messageRef = useRef(null);

  useEffect(() => {
    // Check if message is already read based on type (public vs private)
    const isPrivate = message.receiverId !== null && message.receiverId !== undefined;
    const isRead = isPrivate ? message.readAt : (message.readByUserIds?.length > 0);
    
    if (own || isRead || !onVisible) {
      return; // Only for received unread messages
    }

    console.log('🔍 Setting up IntersectionObserver for message:', message.id, message.content);

    const observer = new IntersectionObserver(([entry]) => {
      console.log('👁️ IntersectionObserver fired:', {
        messageId: message.id,
        isIntersecting: entry.isIntersecting,
        intersectionRatio: entry.intersectionRatio
      });

      if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
        console.log('✅ Message IS VISIBLE on screen:', message.id);
        onVisible(message);
        observer.unobserve(messageRef.current);
      }
    }, { threshold: [0, 0.25, 0.5, 0.75, 1.0] });

    if (messageRef.current) {
      observer.observe(messageRef.current);
    }

    return () => observer.disconnect();
  }, [message, own, onVisible]);

  const getTick = () => {
    // Determine if message is private or public
    const isPrivate = message.receiverId !== null && message.receiverId !== undefined;
    
    if (isPrivate) {
      // Private message: use readAt field for double ticks
      if (message.readAt) {
        return '✓✓'; // Read (double tick)
      }
      return '✓'; // Sent (single tick)
    } else {
      // Public message: use readByUserIds array
      const readCount = message.readByUserIds?.length || 0;
      
      if (readCount === 0) {
        return '✓'; // Sent (single tick)
      }
      
      // Check if all users have read it
      if (totalUsers && readCount === totalUsers) {
        return '✓✓'; // All read (double tick)
      }
      
      // Someone read it but not everyone
      return '✓'; // Sent (single tick)
    }
  };

  const isGifUrl = (text) => {
    if (!text) return false;
    // Match any URL containing 'giphy' or ending with .gif
    return /giphy|\.gif/i.test(text);
  };

  const renderContent = (text) => {
    if (!text) return '';
    if (isGifUrl(text)) {
      return <img src={text} alt="GIF" className="gif-image" />;
    }
    return text;
  };

  return (
    <div ref={messageRef} className={`message ${own ? 'own' : ''}`}>
      {!own && <img src={message.senderPicture || 'https://placehold.co/36'} alt={message.senderName} />}
      <div className="message-content-wrapper">
        <div>
          <div className="meta">
            <span>{new Date(message.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
          </div>
          {message.replyToId && (
            <div className="reply-quote">
              <div className="quote-sender">{message.replyToSenderName}</div>
              <div className="quote-content">
                {isGifUrl(message.replyToContent) ? (
                  <img src={message.replyToContent} alt="GIF" className="reply-gif-image" />
                ) : (
                  message.replyToContent
                )}
              </div>
            </div>
          )}
          {isGifUrl(message.content) ? (
            <div className="content gif-content">
              <img src={message.content} alt="GIF" className="gif-image" />
            </div>
          ) : (
            <div className="content">{message.content}</div>
          )}
        </div>
        {onReply && (
          <button className="reply-btn" onClick={() => onReply(message)} title="Reply">
            ↩️
          </button>
        )}
      </div>
      {own && (
        <div className="profile-with-ticks">
          <img src={message.senderPicture || 'https://placehold.co/36'} alt={message.senderName} />
          <span className="tick">{getTick()}</span>
        </div>
      )}
    </div>
  );
};

export default MessageBubble;
