import React, { useState } from "react";
async function isValidFragment(fragment) {
  if (!fragment) return false;
  const res = await fetch(`https://api.datamuse.com/words?sp=${fragment}*`);
  const words = await res.json();
  return words.length > 0;
}

async function isCompleteWord(fragment) {
  if (!fragment || fragment.length < 4) return false;
  const res = await fetch(`https://api.datamuse.com/words?sp=${fragment}`);
  const words = await res.json();
  return words.some(w => w.word === fragment);
}

async function findValidWord(fragment) {
  if (!fragment) return null;
  const res = await fetch(`https://api.datamuse.com/words?sp=${fragment}*&max=1`);
  const words = await res.json();
  return words.length > 0 ? words[0].word : null;
}

const defaultPlayers = [
  { name: "Player 1", lives: 0, isOut: false },
  { name: "Player 2", lives: 0, isOut: false }
];

export default function SuperGhostGame() {
  const [fragment, setFragment] = useState("");
  const [players, setPlayers] = useState(defaultPlayers);
  const [turn, setTurn] = useState(0);
  const [history, setHistory] = useState([]);
  const [message, setMessage] = useState("");
  const [mode, setMode] = useState("passnplay");
  const [gameSetup, setGameSetup] = useState(true);
  const [playerCount, setPlayerCount] = useState(2);
  const [playerNames, setPlayerNames] = useState(["Player 1", "Player 2", "Player 3", "Player 4"]);
  const [gameWinner, setGameWinner] = useState(null);
  const [challengeMode, setChallengeMode] = useState(false);
  const [challengeWord, setChallengeWord] = useState("");
  const [challengeTarget, setChallengeTarget] = useState(null);

  const getGhostLetters = (lives) => {
    const letters = "GHOST";
    return letters.substring(0, lives);
  };

  const getActivePlayers = () => {
    return players.filter(p => !p.isOut);
  };

  const addPlayerLife = (playerIndex) => {
    const newPlayers = [...players];
    newPlayers[playerIndex].lives++;
    if (newPlayers[playerIndex].lives >= 5) {
      newPlayers[playerIndex].isOut = true;
    }
    setPlayers(newPlayers);
    
    // Check for winner
    const activePlayers = newPlayers.filter(p => !p.isOut);
    if (activePlayers.length === 1) {
      setGameWinner(activePlayers[0].name);
    }
  };

  const setupGame = () => {
    const newPlayers = [];
    for (let i = 0; i < playerCount; i++) {
      newPlayers.push({
        name: playerNames[i] || `Player ${i + 1}`,
        lives: 0,
        isOut: false
      });
    }
    setPlayers(newPlayers);
    setGameSetup(false);
    setTurn(0);
    setFragment("");
    setHistory([]);
    setMessage("");
    setGameWinner(null);
  };

  const nextTurn = () => {
    const activePlayers = getActivePlayers();
    if (activePlayers.length <= 1) return;
    
    let nextTurnIndex = (turn + 1) % players.length;
    while (players[nextTurnIndex].isOut) {
      nextTurnIndex = (nextTurnIndex + 1) % players.length;
    }
    setTurn(nextTurnIndex);
  };

  const nextRound = () => {
    setFragment("");
    setChallengeMode(false);
    setChallengeWord("");
    setChallengeTarget(null);
    if (mode === "bot") {
      setTurn(0);
    } else {
      nextTurn();
    }
    setMessage("");
  };

  async function addLetter(letter, position) {
    let newFragment = fragment;
    if (position === "start") newFragment = letter + fragment;
    else newFragment = fragment + letter;
    if (!(await isValidFragment(newFragment))) {
      setMessage(`No word starts with '${newFragment}'. ${players[turn]} loses!`);
      setHistory([...history, { fragment: newFragment, player: players[turn], result: "lose" }]);
      return;
    }
    if (await isCompleteWord(newFragment)) {
      setMessage(`'${newFragment}' is a complete word. ${players[turn]} loses!`);
      setHistory([...history, { fragment: newFragment, player: players[turn], result: "lose" }]);
      return;
    }
    setFragment(newFragment);
    setTurn((turn + 1) % players.length);
    setMessage("");
  }

  async function challenge() {
    if (mode === "bot" && turn % 2 === 1) {
      // Player is challenging the bot
      const validWord = await findValidWord(fragment);
      if (validWord) {
        setMessage(`Bot wins! Valid word: "${validWord}". You lose the challenge!`);
        setHistory([...history, { fragment, player: "You", result: "lost challenge", botWord: validWord }]);
      } else {
        setMessage(`You win! Bot cannot name a valid word starting with "${fragment}".`);
        setHistory([...history, { fragment, player: "Bot", result: "lost challenge" }]);
      }
    } else {
      // Traditional challenge logic for pass-n-play
      if (await isValidFragment(fragment)) {
        setMessage(`${players[(turn + players.length - 1) % players.length]} must name a word starting with '${fragment}'.`);
      } else {
        setMessage(`${players[(turn + players.length - 1) % players.length]} cannot name a word. ${players[turn]} wins!`);
      }
      setHistory([...history, { fragment, player: players[turn], result: "challenge" }]);
    }
  }

  function resetGame() {
    setFragment("");
    setTurn(0);
    setHistory([]);
    setMessage("");
  }

  async function botMove() {
    const alphabet = "abcdefghijklmnopqrstuvwxyz";
    const options = [];
    for (const l of alphabet) {
      if (await isValidFragment(l + fragment) && !(await isCompleteWord(l + fragment))) {
        options.push({ l, pos: "start" });
      }
      if (await isValidFragment(fragment + l) && !(await isCompleteWord(fragment + l))) {
        options.push({ l, pos: "end" });
      }
    }
    if (options.length === 0) {
      setMessage("Bot cannot move. You win!");
      return;
    }
    const { l, pos } = options[Math.floor(Math.random() * options.length)];
    addLetter(l, pos);
  }

  return (
    <div style={{ 
      minHeight: "100vh",
      background: "linear-gradient(135deg, #fc466b 0%, #3f5efb 100%)",
      padding: "20px",
      fontFamily: "system-ui, -apple-system, sans-serif"
    }}>
      <div style={{
        maxWidth: "800px",
        margin: "0 auto",
        background: "white",
        borderRadius: "20px",
        padding: "40px",
        boxShadow: "0 20px 40px rgba(0,0,0,0.1)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
          <button 
            onClick={() => window.location.hash = ''}
            style={{
              padding: "12px 24px",
              background: "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "10px",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: "600"
            }}
          >
            ← Back to Home
          </button>
          <h2 style={{ margin: 0, color: "#2c3e50", fontSize: "2.5em" }}>Superghost</h2>
          <div></div>
        </div>

        <div style={{ 
          background: "#f8f9fa", 
          padding: "20px", 
          borderRadius: "15px", 
          marginBottom: "30px",
          border: "2px solid #e9ecef"
        }}>
          <div style={{ marginBottom: "20px" }}>
            <label style={{ marginRight: "20px", fontSize: "18px" }}>
              <input 
                type="radio" 
                checked={mode === "passnplay"} 
                onChange={() => setMode("passnplay")}
                style={{ marginRight: "8px", transform: "scale(1.2)" }}
              /> 
              Pass-n-Play
            </label>
            <label style={{ fontSize: "18px" }}>
              <input 
                type="radio" 
                checked={mode === "bot"} 
                onChange={() => setMode("bot")}
                style={{ marginRight: "8px", transform: "scale(1.2)" }}
              /> 
              Play vs Bot
            </label>
          </div>
        </div>

        <div style={{ 
          background: "#e8f5e8", 
          padding: "25px", 
          borderRadius: "15px", 
          marginBottom: "25px",
          textAlign: "center"
        }}>
          <div style={{ fontSize: "18px", marginBottom: "15px", color: "#2e7d32" }}>
            <strong>Current Fragment:</strong>
          </div>
          <div style={{ 
            fontSize: "3em", 
            fontWeight: "bold", 
            color: "#1b5e20",
            fontFamily: "monospace",
            minHeight: "1.2em",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            {fragment || <em style={{ fontSize: "0.6em", color: "#666" }}>(empty)</em>}
          </div>
        </div>

        <div style={{ 
          background: "#fff3e0", 
          padding: "20px", 
          borderRadius: "15px", 
          marginBottom: "25px",
          textAlign: "center"
        }}>
          <div style={{ fontSize: "18px", color: "#e65100" }}>
            <strong>Current Turn:</strong> {mode === "bot" ? (turn % 2 === 0 ? "You" : "Bot") : players[turn]}
          </div>
        </div>

        <div style={{ 
          display: "flex", 
          gap: "15px", 
          justifyContent: "center", 
          alignItems: "center",
          marginBottom: "25px",
          flexWrap: "wrap"
        }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
            <label style={{ fontSize: "14px", fontWeight: "600", color: "#666" }}>Add to End</label>
            <input
              type="text"
              maxLength={1}
              style={{
                width: "60px",
                height: "60px",
                fontSize: "2em",
                textAlign: "center",
                border: "3px solid #ddd",
                borderRadius: "15px",
                fontWeight: "bold"
              }}
              disabled={message || (mode === "bot" && turn % 2 === 1)}
              onKeyDown={e => {
                if (/^[a-zA-Z]$/.test(e.key)) {
                  addLetter(e.key.toLowerCase(), "end");
                  e.target.value = "";
                }
              }}
              placeholder="?"
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
            <label style={{ fontSize: "14px", fontWeight: "600", color: "#666" }}>Add to Start</label>
            <input
              type="text"
              maxLength={1}
              style={{
                width: "60px",
                height: "60px",
                fontSize: "2em",
                textAlign: "center",
                border: "3px solid #ddd",
                borderRadius: "15px",
                fontWeight: "bold"
              }}
              disabled={message || (mode === "bot" && turn % 2 === 1)}
              onKeyDown={e => {
                if (/^[a-zA-Z]$/.test(e.key)) {
                  addLetter(e.key.toLowerCase(), "start");
                  e.target.value = "";
                }
              }}
              placeholder="?"
            />
          </div>
          <button 
            onClick={challenge} 
            disabled={message}
            style={{
              padding: "15px 25px",
              background: "#dc3545",
              color: "white",
              border: "none",
              borderRadius: "10px",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: "600"
            }}
          >
            Challenge
          </button>
          <button 
            onClick={resetGame}
            style={{
              padding: "15px 25px",
              background: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "10px",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: "600"
            }}
          >
            Reset
          </button>
        </div>

        {mode === "bot" && turn % 2 === 1 && !message && (
          <div style={{ textAlign: "center", marginBottom: "25px" }}>
            <button 
              onClick={botMove}
              style={{
                padding: "15px 30px",
                background: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "10px",
                cursor: "pointer",
                fontSize: "18px",
                fontWeight: "600"
              }}
            >
              🤖 Bot Move
            </button>
          </div>
        )}

        {message && (
          <div style={{ 
            background: "#f8d7da", 
            color: "#721c24", 
            padding: "20px", 
            borderRadius: "15px", 
            marginBottom: "25px",
            textAlign: "center",
            fontSize: "18px",
            fontWeight: "600"
          }}>
            {message}
          </div>
        )}

        <div style={{ 
          background: "#f8f9fa", 
          padding: "20px", 
          borderRadius: "15px"
        }}>
          <h4 style={{ margin: "0 0 15px 0", color: "#495057" }}>Game History</h4>
          <div style={{ maxHeight: "200px", overflowY: "auto" }}>
            {history.length === 0 ? (
              <p style={{ color: "#6c757d", fontStyle: "italic" }}>No moves yet...</p>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {history.map((h, i) => (
                  <li key={i} style={{ 
                    padding: "8px 0", 
                    borderBottom: "1px solid #dee2e6",
                    fontSize: "16px"
                  }}>
                    <strong>{h.player}:</strong> "{h.fragment}" - {h.result}
                    {h.botWord && <span style={{ color: "#007bff" }}> (Bot's word: "{h.botWord}")</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
