import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Send, MessageSquare, AlertCircle } from 'lucide-react';
import api from '../../api/client.js';
import UserAvatar from '../../components/UserAvatar.jsx';
import SkeletonLoader from '../../components/SkeletonLoader.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSocket } from '../../context/SocketContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';

export default function WorkspaceDiscussions() {
  const { project } = useOutletContext();
  const { user } = useAuth();
  const { socket, connected } = useSocket();
  const toast = useToast();

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/projects/${project.id}/messages?limit=60`);
      setMessages(res.data || []);
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      toast.error('Could not load discussion messages');
    } finally {
      setLoading(false);
    }
  }, [project.id, toast]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Socket.IO event listeners
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMsg) => {
      if (newMsg.projectId === project.id) {
        setMessages((prev) => {
          // Avoid duplicate
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        setTimeout(scrollToBottom, 50);
      }
    };

    const handleTypingStart = ({ projectId, username, userId }) => {
      if (projectId === project.id && userId !== user?.id) {
        setTypingUsers((prev) => new Set([...prev, username]));
      }
    };

    const handleTypingStop = ({ projectId, userId }) => {
      if (projectId === project.id) {
        setTypingUsers((prev) => {
          const next = new Set(prev);
          next.delete(userId);
          return next;
        });
      }
    };

    socket.on('message:new', handleNewMessage);
    socket.on('typing:start', handleTypingStart);
    socket.on('typing:stop', handleTypingStop);

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('typing:start', handleTypingStart);
      socket.off('typing:stop', handleTypingStop);
    };
  }, [socket, project.id, user?.id]);

  const handleInputChange = (e) => {
    setInputText(e.target.value);

    if (socket) {
      socket.emit('typing:start', { projectId: project.id });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing:stop', { projectId: project.id });
      }, 2000);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const message = inputText.trim();
    setInputText('');

    if (socket) {
      socket.emit('typing:stop', { projectId: project.id });
    }

    try {
      const res = await api.post(`/projects/${project.id}/messages`, { message });
      // Optimistically or by socket
      setMessages((prev) => {
        if (prev.some((m) => m.id === res.data.id)) return prev;
        return [...prev, res.data];
      });
      setTimeout(scrollToBottom, 50);
    } catch (err) {
      toast.error('Failed to send message');
    }
  };

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '620px', overflow: 'hidden' }}>
      {/* Discussion Header */}
      <div style={{
        padding: '1rem 1.5rem',
        borderBottom: '1px solid var(--border-light)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'var(--bg-card)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <MessageSquare size={18} color="var(--primary)" />
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)' }}>
            Team Discussion Channel
          </h3>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem' }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: connected ? 'var(--success)' : 'var(--warning)'
          }} />
          <span style={{ color: 'var(--text-muted)' }}>{connected ? 'Live Connected' : 'Connecting...'}</span>
        </div>
      </div>

      {/* Messages Feed */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '1.25rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        backgroundColor: 'var(--bg-main)'
      }}>
        {loading ? (
          <SkeletonLoader count={4} height="60px" />
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', margin: 'auto' }}>
            <MessageSquare size={36} color="var(--border-light)" style={{ margin: '0 auto 0.5rem' }} />
            <p>No messages yet. Say hello to your teammates!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === user?.id;

            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  gap: '0.75rem',
                  alignItems: 'flex-start',
                  flexDirection: isMe ? 'row-reverse' : 'row'
                }}
              >
                <UserAvatar user={msg.sender} size="sm" />
                <div style={{
                  maxWidth: '70%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isMe ? 'flex-end' : 'flex-start'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.2rem',
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)'
                  }}>
                    <strong style={{ color: 'var(--text-main)' }}>{msg.sender?.profile?.displayName || msg.sender?.username}</strong>
                    <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  <div style={{
                    padding: '0.65rem 0.95rem',
                    borderRadius: '10px',
                    fontSize: '0.875rem',
                    lineHeight: 1.4,
                    backgroundColor: isMe ? 'var(--primary)' : 'var(--bg-card)',
                    color: isMe ? '#ffffff' : 'var(--text-main)',
                    border: isMe ? 'none' : '1px solid var(--border-light)',
                    boxShadow: 'var(--shadow-sm)',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}>
                    {msg.message}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing indicator */}
      {typingUsers.size > 0 && (
        <div style={{ padding: '0.25rem 1.5rem', fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', backgroundColor: 'var(--bg-subtle)' }}>
          {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
        </div>
      )}

      {/* Message Input Bar */}
      <form onSubmit={handleSendMessage} style={{
        padding: '0.85rem 1.25rem',
        borderTop: '1px solid var(--border-light)',
        backgroundColor: 'var(--bg-card)',
        display: 'flex',
        gap: '0.75rem'
      }}>
        <input
          type="text"
          value={inputText}
          onChange={handleInputChange}
          placeholder="Type a message to your team (Press Enter to send)..."
          className="form-input"
          style={{ flex: 1 }}
        />

        <button type="submit" className="btn btn-primary" disabled={!inputText.trim()}>
          <Send size={15} /> Send
        </button>
      </form>
    </div>
  );
}
