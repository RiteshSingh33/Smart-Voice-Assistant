import React, { useState, useEffect } from 'react';
import './app.css';

const App = () => {
  const [transcription, setTranscription] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechRecognition, setSpeechRecognition] = useState(null);
  const [extractedActions, setExtractedActions] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [todoList, setTodoList] = useState([]);
  
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);

      recognition.onresult = (event) => {
        let newTranscription = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            newTranscription += ' ' + event.results[i][0].transcript;
          }
        }
        setTranscription((prev) => prev + newTranscription);
      };

      setSpeechRecognition(recognition);
    } else {
      alert('Your browser does not support Speech Recognition API');
    }
  }, []);

  const handleStart = () => {
    if (speechRecognition) {
      speechRecognition.start();
    }
  };

  const handleStop = () => {
    if (speechRecognition) {
      speechRecognition.stop();
      extractActions();
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(transcription).then(() => {
      alert('Text copied to clipboard');
    }).catch((err) => {
      console.error('Error copying text: ', err);
    });
  };

  const extractActions = () => {
    setProcessing(true);
    
    const actionPattern = /(?:create|schedule|set up|plan|remind me to)\s(.*?)\s(?:on|by|at)\s(.*?)(?:\.|$)/gi;
    const datePattern = /\b(?:today|tomorrow|next\s(?:week|month|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)|\d{1,2}(?:st|nd|rd|th)?\s(?:January|February|March|April|May|June|July|August|September|October|November|December)(?:\s\d{4})?|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{1,2}:\d{2}\s?(?:AM|PM)?)\b/gi;
    
    let actions = [];
    let match;

    while ((match = actionPattern.exec(transcription)) !== null) {
      actions.push({ task: match[1], date: match[2] });
    }

    const dates = transcription.match(datePattern);
    if (dates) {
      dates.forEach(date => {
        actions.push({ task: 'Event', date });
      });
    }
    
    setExtractedActions(actions);
    generateTodoList(actions);
    setProcessing(false);
  };

  const generateTodoList = (actions) => {
    const todos = actions.map(action => `Task: ${action.task} | Due: ${action.date}`);
    setTodoList(todos);
  };

  const sendEmail = () => {
    const emailBody = extractedActions.map(action => `Task: ${action.task}\nDate: ${action.date}`).join('\n');
    window.location.href = `mailto:?subject=Meeting Summary&body=${encodeURIComponent(emailBody)}`;
  };

  return (
    <div className="container">
      <h1>Smart Assistant</h1>
      <div className="button-container">
        <button onClick={handleStart} disabled={isListening} className="start-button">Start</button>
        <button onClick={handleStop} disabled={!isListening} className="stop-button">Stop</button>
        <button onClick={handleCopy} disabled={!transcription} className="copy-button">Copy</button>
        <button onClick={sendEmail} disabled={extractedActions.length === 0} className="email-button">Share via Email</button>
      </div>

      <div>
        <h2>Transcription:</h2>
        <textarea
          value={transcription}
          onChange={(e) => setTranscription(e.target.value)}
          rows="10"
          cols="50"
          placeholder="Your transcription will appear here..."
        />
      </div>

      {processing && <p>Processing actions...</p>}

      <div className="extracted-actions">
        <h2>Extracted Actions:</h2>
        <div className="action-list">
          {extractedActions.length > 0 ? (
            extractedActions.map((action, index) => (
              <div key={index} className="action-card">
                <p><strong>Task:</strong> {action.task}</p>
                <p><strong>Date:</strong> {action.date}</p>
              </div>
            ))
          ) : (
            <p>No actions extracted yet.</p>
          )}
        </div>
      </div>

      <div className="todo-list">
        <h2>To-Do List:</h2>
        <ul>
          {todoList.map((todo, index) => (
            <li key={index}>{todo}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default App;