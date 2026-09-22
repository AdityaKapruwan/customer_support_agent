import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  LayoutDashboard,
  Send,
  PlusCircle,
  ChevronDown,
  ChevronUp,
  ThumbsUp,
  ThumbsDown,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  User,
  Bot,
  ShieldAlert,
  BarChart3,
  Ticket as TicketIcon
} from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'admin'

  // --- CHAT STATE ---
  const [conversationId, setConversationId] = useState('');
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [expandedDetails, setExpandedDetails] = useState({}); // messageId -> boolean
  const [submittedFeedback, setSubmittedFeedback] = useState({}); // messageId -> 'helpful' | 'not_helpful'
  const messagesEndRef = useRef(null);

  // --- ADMIN DASHBOARD STATE ---
  const [adminStats, setAdminStats] = useState(null);
  const [recentTickets, setRecentTickets] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState(null);

  // Initialize or generate Conversation ID
  useEffect(() => {
    const storedId = localStorage.getItem('support_conv_id');
    if (storedId) {
      setConversationId(storedId);
      fetchConversationHistory(storedId);
    } else {
      startNewConversation();
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const startNewConversation = () => {
    const newId = `conv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    setConversationId(newId);
    localStorage.setItem('support_conv_id', newId);
    setMessages([
      {
        messageId: `msg_${Date.now()}_welcome`,
        sender: 'bot',
        text: 'Hello! Welcome to AI Customer Support. How can I assist you today?',
        timestamp: new Date().toISOString()
      }
    ]);
    setErrorMsg(null);
    setExpandedDetails({});
    setSubmittedFeedback({});
  };

  const fetchConversationHistory = async (convId) => {
    try {
      const res = await fetch(`${API_BASE}/conversations/${convId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.messages && data.messages.length > 0) {
          setMessages(data.messages);
          return;
        }
      }
      startNewConversation();
    } catch (err) {
      console.warn('Could not fetch history, starting new chat context.');
      startNewConversation();
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || loading) return;

    const queryText = inputText.trim();
    setInputText('');
    setErrorMsg(null);

    // Append optimistic user message
    const userMsg = {
      messageId: `msg_${Date.now()}_user`,
      sender: 'user',
      text: queryText,
      timestamp: new Date().toISOString()
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: conversationId,
          message: queryText
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to send message.');
      }

      const data = await response.json();

      // Bot message object returned from Express backend
      const botMsg = {
        messageId: data.botMessage.messageId || `msg_${Date.now()}_bot`,
        sender: 'bot',
        text: data.botMessage.text,
        timestamp: data.botMessage.timestamp || new Date().toISOString(),
        prediction: data.prediction,
        routing: data.routing,
        requiresClarification: data.requiresClarification,
        isEscalated: data.isEscalated
      };

      setMessages((prev) => [...prev, botMsg]);

      // Automatically expand routing details for visibility
      setExpandedDetails((prev) => ({
        ...prev,
        [botMsg.messageId]: true
      }));

    } catch (err) {
      setErrorMsg(err.message || 'Unable to connect to AI Support Backend.');
    } finally {
      setLoading(false);
    }
  };

  const toggleDetails = (messageId) => {
    setExpandedDetails((prev) => ({
      ...prev,
      [messageId]: !prev[messageId]
    }));
  };

  const handleFeedback = async (messageId, ratingValue, type) => {
    try {
      setSubmittedFeedback((prev) => ({
        ...prev,
        [messageId]: type
      }));

      await fetch(`${API_BASE}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: conversationId,
          messageId: messageId,
          rating: ratingValue,
          comment: type === 'helpful' ? 'Helpful bot response' : 'Unhelpful response'
        })
      });
    } catch (err) {
      console.error('Feedback submission failed:', err);
    }
  };

  // --- ADMIN FETCHING ---
  const fetchAdminData = async () => {
    setAdminLoading(true);
    setAdminError(null);
    try {
      const [statsRes, ticketsRes] = await Promise.all([
        fetch(`${API_BASE}/admin/stats`),
        fetch(`${API_BASE}/admin/tickets?limit=50`)
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setAdminStats(statsData.stats);
      }
      if (ticketsRes.ok) {
        const ticketsData = await ticketsRes.json();
        setRecentTickets(ticketsData.tickets);
      }
    } catch (err) {
      setAdminError('Failed to load Admin Dashboard statistics.');
    } finally {
      setAdminLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'admin') {
      fetchAdminData();
    }
  }, [activeTab]);

  const handleResolveTicket = async (ticketId) => {
    try {
      const res = await fetch(`${API_BASE}/admin/tickets/${ticketId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'resolved' })
      });
      if (res.ok) {
        fetchAdminData();
      }
    } catch (err) {
      console.error('Failed to resolve ticket:', err);
    }
  };

  return (
    <div className="app-root">
      {/* Header Bar */}
      <header className="app-header">
        <div className="brand-logo">
          <Bot className="w-6 h-6" />
          AI Customer Support Router
        </div>
        <nav className="nav-tabs">
          <button
            className={`nav-tab ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            <MessageSquare size={16} />
            Customer Chat
          </button>
          <button
            className={`nav-tab ${activeTab === 'admin' ? 'active' : ''}`}
            onClick={() => setActiveTab('admin')}
          >
            <LayoutDashboard size={16} />
            Admin Dashboard
          </button>
        </nav>
      </header>

      {/* Main Tab Content */}
      {activeTab === 'chat' ? (
        <div className="chat-layout">
          {/* Sidebar */}
          <aside className="chat-sidebar">
            <button className="btn-new-chat" onClick={startNewConversation}>
              <PlusCircle size={18} />
              Start New Conversation
            </button>
            <div style={{ marginTop: '1.5rem', fontSize: '0.8rem', color: '#64748b' }}>
              <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Active Session:</p>
              <code style={{ wordBreak: 'break-all', backgroundColor: '#e2e8f0', padding: '0.3rem 0.5rem', borderRadius: '4px' }}>
                {conversationId}
              </code>
            </div>
          </aside>

          {/* Chat Panel */}
          <main className="chat-main">
            {errorMsg && (
              <div style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '0.75rem 1.25rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={18} />
                {errorMsg}
              </div>
            )}

            <div className="messages-feed">
              {messages.map((msg, index) => {
                const isBot = msg.sender === 'bot';
                const hasPrediction = isBot && msg.prediction;
                const intentLabel = msg.prediction?.intent || 'N/A';
                const confPercent = msg.prediction?.confidence ? `${Math.round(msg.prediction.confidence * 100)}%` : 'N/A';
                const agentName = msg.routing?.assignedAgent || 'Unassigned';
                const isExpanded = expandedDetails[msg.messageId];
                const userRating = submittedFeedback[msg.messageId];

                return (
                  <div key={msg.messageId || index} className={`message-row ${isBot ? 'bot' : 'user'}`}>
                    <div className={`avatar ${isBot ? 'bot' : 'user'}`}>
                      {isBot ? <Bot size={20} /> : <User size={20} />}
                    </div>

                    <div>
                      <div className="bubble">
                        {msg.text}

                        {/* Expandable AI Routing Details Section */}
                        {hasPrediction && (
                          <div style={{ marginTop: '0.5rem' }}>
                            <button className="ai-details-toggle" onClick={() => toggleDetails(msg.messageId)}>
                              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              AI Routing Details
                            </button>

                            {isExpanded && (
                              <div className="ai-details-box">
                                <div className="ai-detail-item">
                                  <span className="ai-detail-label">Intent:</span>
                                  <span className="ai-detail-val">{intentLabel}</span>
                                </div>
                                <div className="ai-detail-item">
                                  <span className="ai-detail-label">Confidence:</span>
                                  <span className="ai-detail-val">{confPercent}</span>
                                </div>
                                <div className="ai-detail-item">
                                  <span className="ai-detail-label">Assigned Agent:</span>
                                  <span className="ai-detail-val" style={{ color: agentName === 'Human Support' ? '#dc2626' : '#2563eb' }}>
                                    {agentName}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* User Feedback Buttons */}
                        {isBot && index > 0 && (
                          <div className="feedback-actions">
                            <button
                              className={`btn-feedback ${userRating === 'helpful' ? 'active-like' : ''}`}
                              onClick={() => handleFeedback(msg.messageId, 5, 'helpful')}
                            >
                              <ThumbsUp size={14} /> Helpful
                            </button>
                            <button
                              className={`btn-feedback ${userRating === 'not_helpful' ? 'active-dislike' : ''}`}
                              onClick={() => handleFeedback(msg.messageId, 1, 'not_helpful')}
                            >
                              <ThumbsDown size={14} /> Not Helpful
                            </button>
                            {userRating && (
                              <span style={{ fontSize: '0.7rem', color: '#10b981', marginLeft: '0.25rem' }}>
                                ✓ Feedback recorded
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="timestamp">
                        {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Loading Indicator */}
              {loading && (
                <div className="message-row bot">
                  <div className="avatar bot"><Bot size={20} /></div>
                  <div className="bubble" style={{ color: '#64748b', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <RefreshCw className="animate-spin" size={16} />
                    AI Routing Engine is analyzing your query...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <form className="chat-input-area" onSubmit={handleSendMessage}>
              <input
                type="text"
                placeholder="Type your question here (e.g. 'Where is my order?' or 'I want a refund')..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={loading}
              />
              <button type="submit" className="btn-send" disabled={loading || !inputText.trim()}>
                <Send size={18} />
              </button>
            </form>
          </main>
        </div>
      ) : (
        /* ADMIN DASHBOARD VIEW */
        <div className="admin-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Admin Operations Dashboard</h2>
            <button className="nav-tab" style={{ border: '1px solid #cbd5e1' }} onClick={fetchAdminData}>
              <RefreshCw size={14} /> Refresh Stats
            </button>
          </div>

          {adminError && (
            <div style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
              {adminError}
            </div>
          )}

          {adminLoading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
              Loading dashboard metrics...
            </div>
          ) : (
            <>
              {/* Stat Overview Cards */}
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-label">Total Conversations</div>
                  <div className="stat-val">{adminStats?.totalConversations || 0}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Total Tickets</div>
                  <div className="stat-val">{adminStats?.totalTickets || 0}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Resolved Tickets</div>
                  <div className="stat-val" style={{ color: '#10b981' }}>{adminStats?.resolvedTickets || 0}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Escalated Tickets</div>
                  <div className="stat-val" style={{ color: '#ef4444' }}>{adminStats?.escalatedTickets || 0}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Average Confidence</div>
                  <div className="stat-val" style={{ color: '#2563eb' }}>
                    {adminStats?.averageConfidence ? `${Math.round(adminStats.averageConfidence * 100)}%` : '0%'}
                  </div>
                </div>
              </div>

              {/* Analytics Sections */}
              <div className="dashboard-sections">
                {/* Intent Distribution */}
                <div className="card-box">
                  <div className="card-title"><BarChart3 size={18} /> Intent Distribution</div>
                  <ul style={{ listStyle: 'none' }}>
                    {Object.entries(adminStats?.intentDistribution || {}).map(([intent, count]) => (
                      <li key={intent} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #f1f5f9' }}>
                        <span style={{ fontWeight: 600 }}>{intent}</span>
                        <span style={{ fontWeight: 700, color: '#2563eb' }}>{count}</span>
                      </li>
                    ))}
                    {Object.keys(adminStats?.intentDistribution || {}).length === 0 && (
                      <li style={{ color: '#94a3b8', fontStyle: 'italic' }}>No intent data recorded yet.</li>
                    )}
                  </ul>
                </div>

                {/* Agent Distribution */}
                <div className="card-box">
                  <div className="card-title"><TicketIcon size={18} /> Agent Distribution</div>
                  <ul style={{ listStyle: 'none' }}>
                    {Object.entries(adminStats?.agentDistribution || {}).map(([agent, count]) => (
                      <li key={agent} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #f1f5f9' }}>
                        <span style={{ fontWeight: 600 }}>{agent}</span>
                        <span style={{ fontWeight: 700, color: '#10b981' }}>{count}</span>
                      </li>
                    ))}
                    {Object.keys(adminStats?.agentDistribution || {}).length === 0 && (
                      <li style={{ color: '#94a3b8', fontStyle: 'italic' }}>No agent distribution data yet.</li>
                    )}
                  </ul>
                </div>
              </div>

              {/* Recent Tickets Table */}
              <div className="card-box">
                <div className="card-title"><ShieldAlert size={18} /> Recent Customer Tickets</div>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Query</th>
                      <th>Intent</th>
                      <th>Confidence</th>
                      <th>Assigned Agent</th>
                      <th>Status</th>
                      <th>Timestamp</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTickets.map((t) => (
                      <tr key={t.ticketId}>
                        <td style={{ maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.query}</td>
                        <td><span style={{ fontWeight: 600 }}>{t.predictedIntent}</span></td>
                        <td>{Math.round(t.confidence * 100)}%</td>
                        <td>{t.assignedAgent}</td>
                        <td>
                          <span className={`badge ${t.status}`}>{t.status}</span>
                        </td>
                        <td>{new Date(t.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                        <td>
                          {t.status !== 'resolved' ? (
                            <button
                              style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                              onClick={() => handleResolveTicket(t.ticketId)}
                            >
                              Resolve
                            </button>
                          ) : (
                            <span style={{ color: '#10b981', fontSize: '0.75rem', fontWeight: 600 }}>Done</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {recentTickets.length === 0 && (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', padding: '2rem' }}>
                          No tickets created yet. Submit a message in the Customer Chat to create tickets!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
