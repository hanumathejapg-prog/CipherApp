import React from 'react';

const UserList = ({ users, currentId, selectedId, onSelect }) => {
  return (
    <div className="user-list">
      <h4 style={{ textTransform: 'uppercase', margin: '0 0 10px 0', padding: '15px 0' }}>Users</h4>
      {users
        .map((u) => (
          <div
            key={u.id}
            className={`user-item ${selectedId === u.id ? 'active' : ''} ${u.id === currentId ? 'current-user' : ''} ${u.unreadCount > 0 ? 'unread' : ''}`}
            onClick={() => onSelect(u)}
            style={{ cursor: 'pointer' }}
            title={u.id === currentId ? '(You)' : ''}
          >
            <img src={u.picture || 'https://placehold.co/40'} alt={u.name} />
            <div>
              <strong>{u.name} {u.id === currentId ? '(You)' : ''}</strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {u.unreadCount > 0 && (
                <span className="unread-badge">{u.unreadCount}</span>
              )}
              <span className={`status ${u.status === 'ONLINE' ? 'on' : 'off'}`}>{u.status}</span>
            </div>
          </div>
        ))}
    </div>
  );
};

export default UserList;
