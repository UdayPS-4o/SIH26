import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useSpeech } from '../hooks/useSpeech';
import fakeResponses from '../data/fakeResponses.json';

const SAMPLE_QUESTIONS = [
  'What was the Poona Pact?',
  'Tell me about the Constitution',
  'Who was Dr. Ambedkar?',
  'Tell me about his education',
  'What is Annihilation of Caste?',
  'When did he convert to Buddhism?',
];

export default function ChatInterface() {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Namaste! I am the Samdarshi AI assistant. Ask me anything about Dr. B.R. Ambedkar — his life, works, philosophy, or contributions to India.',
      citations: [],
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [visibleCount, setVisibleCount] = useState(0);
  const messagesEndRef = useRef(null);
  const location = useLocation();
  const initialQueryHandled = useRef(false);
  const { speak, listen, isListening, isSpeaking, stopSpeaking } = useSpeech();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages, visibleCount]);

  useEffect(() => {
    const q = location.state?.query;
    if (q && !initialQueryHandled.current) {
      initialQueryHandled.current = true;
      handleSend(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  const findBestResponse = (query) => {
    const q = query.toLowerCase();
    let bestMatch = null;
    let bestScore = 0;

    for (const [key, data] of Object.entries(fakeResponses.responses)) {
      let score = 0;
      for (const keyword of data.keywords) {
        if (q.includes(keyword.toLowerCase())) score++;
      }
      if (score > bestScore) {
        bestScore = score;
        bestMatch = data;
      }
    }
    return bestMatch || fakeResponses.fallback;
  };

  const extractCitations = (text) => {
    const matches = text.match(/\[Source:[^\]]+\]/g) || [];
    return matches.map(m => m.replace(/[\[\]]/g, ''));
  };

  const simulateStream = (fullText, messageId) => {
    setStreamingText(fullText);
    setVisibleCount(0);
    setIsLoading(true);

    const words = fullText.split(' ');
    let index = 0;
    const delay = Math.max(30, Math.min(80, 600 / words.length));

    const interval = setInterval(() => {
      if (index < words.length) {
        const wordsToAdd = index === 0 ? 1 : Math.ceil(Math.random() * 2);
        index = Math.min(index + wordsToAdd, words.length);
        setVisibleCount(index);
      } else {
        clearInterval(interval);
        setIsLoading(false);
        setMessages(prev => {
          const updated = prev.map(m =>
            m.id === messageId ? { ...m, content: fullText } : m
          );
          return updated;
        });
        setStreamingText('');
        setVisibleCount(0);
      }
    }, delay);

    return () => clearInterval(interval);
  };

  const handleSend = async (text) => {
    if (!text.trim() || isLoading) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const tempId = `assistant-${Date.now()}`;
    const response = findBestResponse(text);
    const citations = extractCitations(response.answer);

    const assistantMessage = {
      id: tempId,
      role: 'assistant',
      content: '',
      citations,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, assistantMessage]);

    setTimeout(() => {
      simulateStream(response.answer, tempId);
    }, 600);
  };

  const handleListen = (text) => {
    if (isSpeaking) {
      stopSpeaking();
      return;
    }
    speak(text, 'en-IN');
  };

  return (
    <>
      <div className="page-header">
        <div className="page-eyebrow">AI Assistant</div>
        <h1 className="page-title">Chat with AI</h1>
        <p className="page-subtitle">Ask anything about Dr. B. R. Ambedkar&rsquo;s life, works and legacy &mdash; answers cite archival sources.</p>
      </div>

      <div className="chat-container">
        <div className="chat-messages">
          {messages.map((msg) => (
            <div key={msg.id} className={`message ${msg.role}`}>
              <div className="message-avatar">
                {msg.role === 'user' ? 'You' : 'AS'}
              </div>
              <div className="message-bubble">
                <div>
                  {msg.role === 'assistant' && msg.content === '' && isLoading ? (
                    <div className="typing-indicator">
                      <span></span><span></span><span></span>
                    </div>
                  ) : (
                    <>
                      <div>
                        {(msg.role === 'assistant' && msg.id === messages[messages.length - 1]?.id && visibleCount > 0) ? (
                          <span>{streamingText.split(' ').slice(0, visibleCount).join(' ')}</span>
                        ) : (
                          msg.content.split('\n').map((line, i) => {
                            if (line.startsWith('• ')) {
                              return <li key={i}>{line.slice(2)}</li>;
                            }
                            if (line.startsWith('[Source:')) {
                              return <div key={i} style={{ marginTop: '12px', fontSize: '13px', color: 'var(--color-text-dim)' }}>{line}</div>;
                            }
                            if (line.trim() === '') return <br key={i} />;
                            return <p key={i} style={{ marginBottom: '8px' }}>{line}</p>;
                          })
                        )}
                      </div>
                      {msg.role === 'assistant' && msg.citations && msg.citations.length > 0 && msg.content && visibleCount === 0 && (
                        <div className="message-meta">
                          <button
                            className={`listen-btn ${isSpeaking ? 'active' : ''}`}
                            onClick={() => handleListen(msg.content)}
                            title={isSpeaking ? 'Stop speaking' : 'Listen to response'}
                          >
                            🔊 {isSpeaking ? 'Stop' : 'Listen'}
                          </button>
                          {msg.citations.map((citation, i) => (
                            <span key={i} className="citation-chip">
                              📄 {citation}
                            </span>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input-area">
          <div className="chat-input-row">
            <button
              className={`mic-btn ${isListening ? 'listening' : ''}`}
              onClick={() => listen((text) => handleSend(text))}
              title={isListening ? 'Stop listening' : 'Voice input'}
            >
              {isListening ? '⏹' : '🎤'}
            </button>
            <input
              className="chat-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
              placeholder="Ask about Dr. Ambedkar..."
              disabled={isLoading}
            />
            <button
              className="send-btn"
              onClick={() => handleSend(input)}
              disabled={!input.trim() || isLoading}
            >
              ➤
            </button>
          </div>
          <div className="sample-chips">
            {SAMPLE_QUESTIONS.map((q, i) => (
              <button
                key={i}
                className="sample-chip"
                onClick={() => handleSend(q)}
                disabled={isLoading}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}