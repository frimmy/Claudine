import React, { useState } from 'react';

function App() {
  const [count, setCount] = useState(0);

  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
    },
    header: {
      fontSize: '3rem',
      marginBottom: '2rem',
      textAlign: 'center',
    },
    card: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      padding: '2rem',
      borderRadius: '1rem',
      backdropFilter: 'blur(10px)',
      boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
      border: '1px solid rgba(255, 255, 255, 0.18)',
    },
    button: {
      padding: '1rem 2rem',
      fontSize: '1.2rem',
      backgroundColor: '#4CAF50',
      color: 'white',
      border: 'none',
      borderRadius: '0.5rem',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      marginTop: '1rem',
    },
    count: {
      fontSize: '2rem',
      fontWeight: 'bold',
      marginTop: '1rem',
    },
    emoji: {
      fontSize: '4rem',
      marginBottom: '1rem',
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>🚀 Welcome to React!</h1>
      <div style={styles.card}>
        <div style={styles.emoji}>⚛️</div>
        <p style={{ textAlign: 'center', fontSize: '1.2rem' }}>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <div style={{ textAlign: 'center' }}>
          <button 
            style={styles.button}
            onClick={() => setCount(count + 1)}
            onMouseOver={(e) => e.target.style.backgroundColor = '#45a049'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#4CAF50'}
          >
            Click me!
          </button>
          <div style={styles.count}>
            Count: {count}
          </div>
        </div>
      </div>
      <p style={{ marginTop: '2rem', fontSize: '1rem', opacity: 0.8 }}>
        Running on port 8080 🎉
      </p>
    </div>
  );
}

export default App;
