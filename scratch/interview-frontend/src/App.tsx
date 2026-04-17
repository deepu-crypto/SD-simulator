import { useState, useRef, useEffect } from 'react';
import './index.css';

const API_BASE = 'http://localhost:3002/interview';

interface Evaluation {
  score: number;
  feedback: string;
  strengths: string[];
  weaknesses: string[];
  next_stage: string;
}

interface Message {
  id: string;
  role: 'ai' | 'user' | 'system';
  content: string;
  evaluation?: Evaluation;
}

function App() {
  const [inInterview, setInInterview] = useState(false);
  const [problem, setProblem] = useState('');
  const [difficulty, setDifficulty] = useState('Senior');
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  // Final summary
  const [finalReport, setFinalReport] = useState<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, finalReport]);

  const startInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!problem.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problem, difficulty })
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to connect to backend.');
      }

      setSessionId(data.sessionId);
      setMessages([
        { id: '1', role: 'system', content: `Interview Started: ${problem} (${difficulty})` },
        { id: '2', role: 'ai', content: data.firstQuestion }
      ]);
      setInInterview(true);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to connect to backend.');
    } finally {
      setIsLoading(false);
    }
  };

  const submitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !sessionId || isLoading) return;

    const answer = inputText;
    setInputText('');
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: answer }]);
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/next`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, userAnswer: answer })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Network Error computing answer.');
      }
      
      const aiMsg: Message = { 
        id: (Date.now() + 1).toString(), 
        role: 'ai', 
        content: data.nextQuestion,
        evaluation: data.evaluation
      };
      
      setMessages(prev => [...prev, aiMsg]);
      
      if (data.isComplete || data.currentStage === 'final') {
         setIsFinished(true);
      }
      
    } catch (err: any) {
      console.error(err);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'system', content: err.message || 'Network Error computing answer.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const terminateInterview = async () => {
    if (!sessionId || isLoading) return;
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/final`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error finalizing.');
      }

      setFinalReport(data.finalFeedback);
      setIsFinished(true);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error finalizing.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!inInterview) {
    return (
      <div className="app-container">
        <div className="header">
          <h1>System Design Simulator</h1>
          <p>Level up your architecture intuition with FAANG-grade AI feedback.</p>
        </div>
        
        <div className="setup-panel">
          <form onSubmit={startInterview}>
            <div className="form-group">
              <label>System Design Problem</label>
              <input 
                type="text" 
                placeholder="e.g. Design Twitter, Design Uber, Design a Rate Limiter" 
                value={problem}
                onChange={e => setProblem(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Target Level</label>
              <select value={difficulty} onChange={e => setDifficulty(e.target.value)}>
                <option value="Junior">L3 - Junior</option>
                <option value="Mid">L4 - Mid</option>
                <option value="Senior">L5 - Senior</option>
                <option value="Staff">L6 - Staff</option>
              </select>
            </div>
            
            <button type="submit" className="btn" disabled={isLoading || !problem.trim()}>
              {isLoading ? 'Booting Simulator...' : 'Start Interview'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container" style={{ maxWidth: '1200px' }}>
      <div className="header" style={{ marginBottom: '1rem' }}>
        <h1 style={{ fontSize: '1.8rem' }}>Simulator: {problem}</h1>
      </div>

      <div className="chat-container">
        {messages.map(msg => (
          <div key={msg.id} className={`message ${msg.role}`}>
            {msg.role === 'ai' && msg.evaluation && (
              <div className="evaluation-box" style={{ marginBottom: '1rem' }}>
                <h4>Score: {msg.evaluation.score}/10</h4>
                <p><strong>Feedback:</strong> {msg.evaluation.feedback}</p>
                {msg.evaluation.strengths?.length > 0 && <p><strong>Strengths:</strong> {msg.evaluation.strengths.join(', ')}</p>}
                {msg.evaluation.weaknesses?.length > 0 && <p><strong>Missed:</strong> {msg.evaluation.weaknesses.join(', ')}</p>}
              </div>
            )}
            <div>{msg.content}</div>
          </div>
        ))}

        {isLoading && (
          <div className="message ai">
            <div className="loading-dots">
              <div className="dot"></div>
              <div className="dot"></div>
              <div className="dot"></div>
            </div>
          </div>
        )}
        
        {finalReport && (
          <div className="message ai final-report">
            <div className="score-display">
              <div>
                <h2>Conclusion</h2>
                <h3 style={{color: 'var(--success)'}}>Signal: {finalReport.hiring_signal?.replace('_', ' ').toUpperCase()}</h3>
              </div>
              <div className="score-circle" style={{ '--score-pct': `${(finalReport.overall_score / 10) * 100}%` } as React.CSSProperties}>
                {finalReport.overall_score}/10
              </div>
            </div>
            <p><strong>Summary:</strong> {finalReport.short_final_summary}</p>
            <br />
            <p><strong>Strengths:</strong> {finalReport.strengths?.join(', ')}</p>
            <p><strong>Weaknesses:</strong> {finalReport.weaknesses?.join(', ')}</p>
            <br />
            <p style={{ color: 'var(--accent-primary)'}}><strong>Study Plan:</strong> {finalReport.recommended_topics_to_improve?.join(', ')}</p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {!isFinished ? (
        <form className="input-area" onSubmit={submitAnswer}>
          <textarea 
            placeholder="Type your architectural thoughts here..."
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submitAnswer(e);
              }
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button type="submit" className="btn" disabled={isLoading || !inputText.trim()}>Send</button>
            <button type="button" className="btn" style={{backgroundColor: 'var(--bg-tertiary)'}} onClick={terminateInterview} disabled={isLoading}>End</button>
          </div>
        </form>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <button className="btn" style={{ width: 'auto' }} onClick={() => window.location.reload()}>Start New Iteration</button>
        </div>
      )}
    </div>
  );
}

export default App;
