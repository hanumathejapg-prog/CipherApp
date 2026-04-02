import React, { useState, useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import GifPicker from './GifPicker';
import '../reply-styles.css';

const ChatRoom = ({ messages, onSend, currentId, onMessageVisible, totalUsers }) => {
  const [text, setText] = useState('');
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView();
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getDateSeparator = (date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const messageDate = new Date(date);
    const isToday = messageDate.toDateString() === today.toDateString();
    const isYesterday = messageDate.toDateString() === yesterday.toDateString();

    if (isToday) return 'Today';
    if (isYesterday) return 'Yesterday';
    return messageDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: messageDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined });
  };

  const shouldShowDateSeparator = (currentMsg, previousMsg) => {
    if (!previousMsg) return true;
    const currentDate = new Date(currentMsg.timestamp).toDateString();
    const previousDate = new Date(previousMsg.timestamp).toDateString();
    return currentDate !== previousDate;
  };

  const submit = (e) => {
    e.preventDefault();
    if (!text.trim()) {
      return;
    }
    onSend(text.trim(), replyTo?.id);
    setText('');
    setReplyTo(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit(e);
    }
  };

  const handleSelectGif = (gifUrl) => {
    onSend(gifUrl, replyTo?.id);
    setReplyTo(null);
  };

  return (
    <div className="chat-panel">
      <h3>Public Chat</h3>
      <div className="messages">
        {messages.map((m, idx) => (
          <React.Fragment key={`${m.id || 'p'}-${idx}`}>
            {shouldShowDateSeparator(m, messages[idx - 1]) && (
              <div className="date-separator">
                <span>{getDateSeparator(m.timestamp)}</span>
              </div>
            )}
            <MessageBubble 
              message={m} 
              own={m.senderId === currentId}
              onVisible={onMessageVisible}
              onReply={setReplyTo}
              totalUsers={totalUsers}
            />
          </React.Fragment>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <GifPicker isOpen={showGifPicker} onClose={() => setShowGifPicker(false)} onSelectGif={handleSelectGif} />
      <form onSubmit={submit} className="composer">
        {replyTo && (
          <div className="reply-preview">
            <div className="reply-preview-inner">
              <div>
                <span className="reply-preview-label">Replying to {replyTo.senderName}</span>
                <div className="reply-preview-text">{replyTo.content}</div>
              </div>
              <button type="button" className="reply-preview-close" onClick={() => setReplyTo(null)}>✕</button>
            </div>
          </div>
        )}
        <textarea 
          value={text} 
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a public message (Shift+Enter for new line)" 
          rows="3"
        />
        <div className="composer-buttons">
          <button type="button" className="gif-btn" onClick={() => setShowGifPicker(true)} title="Send GIF">
            GIF
          </button>
          <button type="submit">Send</button>
        </div>
      </form>
    </div>
  );
};

export default ChatRoom;
