import React, { useState } from "react";

async function isValidFragment(fragment) {
  if (!fragment) return false;
  const res = await fetch(`https://api.datamuse.com/words?sp=*${fragment}*`);
  const words = await res.json();
  return words.length > 0;
}

async function isCompleteWord(fragment) {
  if (!fragment || fragment.length < 4) return false;
  const res = await fetch(`https://api.datamuse.com/words?sp=${fragment}`);
  const words = await res.json();
  return words.some(w => w.word === fragment);
}

async function getAnagrams(fragment) {
  if (!fragment) return [];
  const res = await fetch(`https://api.datamuse.com/words?sp=${fragment.split('').sort().join('')}*&md=p`);
  const words = await res.json();
  return words.filter(w => w.word.length === fragment.length && w.word.split('').sort().join('') === fragment.split('').sort().join(''));
}

async function findValidWord(fragment) {
  if (!fragment) return null;
  const res = await fetch(`https://api.datamuse.com/words?sp=*${fragment}*&max=1`);
  const words = await res.json();
  return words.length > 0 ? words[0].word : null;
}

const defaultPlayers = [
  { name: "Player 1", lives: 0, isOut: false },
  { name: "Player 2", lives: 0, isOut: false }
];

export default function AnaGhostGame() {
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
  const [anagramMode, setAnagramMode] = useState(false);
  const [pendingLetter, setPendingLetter] = useState("");

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

  const nextRound = (losingPlayerIndex = null) => {
    setFragment("");
    setChallengeMode(false);
    setChallengeWord("");
    setChallengeTarget(null);
    setAnagramMode(false);
    setPendingLetter("");
    
    if (mode === "bot") {
      setTurn(0);
    } else if (losingPlayerIndex !== null && !players[losingPlayerIndex].isOut) {
      setTurn(losingPlayerIndex);
    } else {
      nextTurn();
    }
    setMessage("");
  };

  async function addLetter(letter, doAnagram) {
    if (gameWinner) return;
    
    if (doAnagram && fragment) {
      setAnagramMode(true);
      setPendingLetter(letter);
      return;
    }
    
    let newFragment = fragment + letter;
    
    const currentPlayer = mode === "bot" ? (turn % 2 === 0 ? 0 : "bot") : turn;
    const playerName = mode === "bot" ? (turn % 2 === 0 ? "You" : "Bot") : players[turn].name;
    
    if (!(await isValidFragment(newFragment))) {
      setMessage(`No word contains '${newFragment}'. ${playerName} loses!`);
      setHistory([...history, { fragment: newFragment, player: playerName, result: "lose" }]);
      if (mode === "passnplay" && typeof currentPlayer === "number") {
        addPlayerLife(currentPlayer);
        setTimeout(() => nextRound(currentPlayer), 2000);
      } else {
        setTimeout(() => nextRound(), 2000);
      }
      return;
    }
    
    if (await isCompleteWord(newFragment)) {
      setMessage(`'${newFragment}' is a complete word. ${playerName} loses!`);
      setHistory([...history, { fragment: newFragment, player: playerName, result: "lose" }]);
      if (mode === "passnplay" && typeof currentPlayer === "number") {
        addPlayerLife(currentPlayer);
        setTimeout(() => nextRound(currentPlayer), 2000);
      } else {
        setTimeout(() => nextRound(), 2000);
      }
      return;
    }
    
    setFragment(newFragment);
    if (mode === "bot") {
      setTurn((turn + 1) % 2);
    } else {
      nextTurn();
    }
    setMessage("");
  }

  const submitAnagram = (anagramText) => {
    const newFragment = anagramText.toLowerCase().trim();
    const expectedLetters = (fragment + pendingLetter).split('').sort().join('');
    const anagramLetters = newFragment.split('').sort().join('');
    
    if (anagramLetters !== expectedLetters) {
      setMessage(`Invalid anagram! Must use exactly the letters: ${expectedLetters}`);
      setAnagramMode(false);
      setPendingLetter("");
      return;
    }
    
    processFragmentAfterAnagram(newFragment);
  };

  const processFragmentAfterAnagram = async (newFragment) => {
    const currentPlayer = mode === "bot" ? (turn % 2 === 0 ? 0 : "bot") : turn;
    const playerName = mode === "bot" ? (turn % 2 === 0 ? "You" : "Bot") : players[turn].name;
    
    if (!(await isValidFragment(newFragment))) {
      setMessage(`No word contains '${newFragment}'. ${playerName} loses!`);
      setHistory([...history, { fragment: newFragment, player: playerName, result: "lose", anagram: true }]);
      if (mode === "passnplay" && typeof currentPlayer === "number") {
        addPlayerLife(currentPlayer);
        setTimeout(() => nextRound(currentPlayer), 2000);
      } else {
        setTimeout(() => nextRound(), 2000);
      }
      return;
    }
    
    if (await isCompleteWord(newFragment)) {
      setMessage(`'${newFragment}' is a complete word. ${playerName} loses!`);
      setHistory([...history, { fragment: newFragment, player: playerName, result: "lose", anagram: true }]);
      if (mode === "passnplay" && typeof currentPlayer === "number") {
        addPlayerLife(currentPlayer);
        setTimeout(() => nextRound(currentPlayer), 2000);
      } else {
        setTimeout(() => nextRound(), 2000);
      }
      return;
    }
    
    setFragment(newFragment);
    setAnagramMode(false);
    setPendingLetter("");
    if (mode === "bot") {
      setTurn((turn + 1) % 2);
    } else {
      nextTurn();
    }
    setMessage("");
  };

  async function challenge() {
    if (mode === "bot" && turn % 2 === 1) {
      const validWord = await findValidWord(fragment);
      if (validWord) {
        setMessage(`Bot wins! Valid word: "${validWord}". You lose the challenge!`);
        setHistory([...history, { fragment, player: "You", result: "lost challenge", botWord: validWord }]);
        setTimeout(() => nextRound(), 2000);
      } else {
        setMessage(`You win! Bot cannot name a valid word containing "${fragment}".`);
        setHistory([...history, { fragment, player: "Bot", result: "lost challenge" }]);
        setTimeout(() => nextRound(), 2000);
      }
    } else if (mode === "passnplay") {
      let challengedPlayerIndex = (turn + players.length - 1) % players.length;
      while (players[challengedPlayerIndex].isOut) {
        challengedPlayerIndex = (challengedPlayerIndex + players.length - 1) % players.length;
      }
      setChallengeTarget(challengedPlayerIndex);
      setChallengeMode(true);
      setMessage(`${players[challengedPlayerIndex].name} must provide a valid word containing '${fragment}'.`);
    }
  }

  async function submitChallengeWord() {
    if (!challengeWord.trim() || challengeTarget === null) return;
    
    const word = challengeWord.toLowerCase().trim();
    const targetPlayer = players[challengeTarget];
    const challenger = players[turn];
    
    if (!word.includes(fragment.toLowerCase())) {
      setMessage(`"${word}" doesn't contain "${fragment}". ${targetPlayer.name} loses the challenge!`);
      addPlayerLife(challengeTarget);
      setHistory([...history, { 
        fragment, 
        player: targetPlayer.name, 
        result: "lost challenge - invalid word",
        challengeWord: word 
      }]);
      setTimeout(() => nextRound(challengeTarget), 2000);
      return;
    }
    
    const isValid = await isCompleteWord(word);
    if (isValid) {
      setMessage(`"${word}" is valid! ${challenger.name} loses the challenge!`);
      addPlayerLife(turn);
      setHistory([...history, { 
        fragment, 
        player: challenger.name, 
        result: "lost challenge - valid word provided",
        challengeWord: word 
      }]);
      setTimeout(() => nextRound(turn), 2000);
    } else {
      setMessage(`"${word}" is not a valid word! ${targetPlayer.name} loses the challenge!`);
      addPlayerLife(challengeTarget);
      setHistory([...history, { 
        fragment, 
        player: targetPlayer.name, 
        result: "lost challenge - invalid word",
        challengeWord: word 
      }]);
      setTimeout(() => nextRound(challengeTarget), 2000);
    }
  }

  const resetGame = () => {
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
    setChallengeMode(false);
    setChallengeWord("");
    setChallengeTarget(null);
    setAnagramMode(false);
    setPendingLetter("");
  };

  async function botMove() {
    const alphabet = "abcdefghijklmnopqrstuvwxyz";
    const options = [];
    for (const l of alphabet) {
      if (await isValidFragment(fragment + l) && !(await isCompleteWord(fragment + l))) {
        options.push({ l, anagram: false });
      }
      // Bot could also try anagram options, but keep it simple for now
    }
    if (options.length === 0) {
      setMessage("Bot cannot move. You win!");
      return;
    }
    const { l, anagram } = options[Math.floor(Math.random() * options.length)];
    addLetter(l, anagram);
  }

  if (gameSetup) {
    return (
      <div style={{ 
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
        padding: "20px",
        fontFamily: "system-ui, -apple-system, sans-serif"
      }}>
        <div style={{
          maxWidth: "600px",
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
            <h2 style={{ margin: 0, color: "#2c3e50", fontSize: "2.5em" }}>AnaGhost Setup</h2>
            <div></div>
          </div>

          <div style={{ marginBottom: "30px" }}>
            <h3 style={{ color: "#2c3e50", marginBottom: "20px" }}>Game Mode</h3>
            <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
              <label style={{ fontSize: "18px", display: "flex", alignItems: "center" }}>
                <input 
                  type="radio" 
                  checked={mode === "passnplay"} 
                  onChange={() => setMode("passnplay")}
                  style={{ marginRight: "8px", transform: "scale(1.2)" }}
                /> 
                Pass-n-Play
              </label>
              <label style={{ fontSize: "18px", display: "flex", alignItems: "center" }}>
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

          {mode === "passnplay" && (
            <div style={{ marginBottom: "30px" }}>
              <h3 style={{ color: "#2c3e50", marginBottom: "20px" }}>Number of Players</h3>
              <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
                {[2, 3, 4].map(num => (
                  <button 
                    key={num}
                    onClick={() => setPlayerCount(num)}
                    style={{
                      padding: "10px 20px",
                      background: playerCount === num ? "#007bff" : "#f8f9fa",
                      color: playerCount === num ? "white" : "#495057",
                      border: "2px solid #007bff",
                      borderRadius: "10px",
                      cursor: "pointer",
                      fontSize: "16px",
                      fontWeight: "600"
                    }}
                  >
                    {num} Players
                  </button>
                ))}
              </div>

              <h3 style={{ color: "#2c3e50", marginBottom: "20px" }}>Player Names</h3>
              {Array.from({ length: playerCount }, (_, i) => (
                <div key={i} style={{ marginBottom: "15px" }}>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "600" }}>
                    Player {i + 1}:
                  </label>
                  <input
                    type="text"
                    value={playerNames[i]}
                    onChange={(e) => {
                      const newNames = [...playerNames];
                      newNames[i] = e.target.value;
                      setPlayerNames(newNames);
                    }}
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "2px solid #ddd",
                      borderRadius: "8px",
                      fontSize: "16px"
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          <button 
            onClick={setupGame}
            style={{
              width: "100%",
              padding: "15px",
              background: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "10px",
              cursor: "pointer",
              fontSize: "18px",
              fontWeight: "600"
            }}
          >
            Start Game
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: "100vh",
      background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
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
          <h2 style={{ margin: 0, color: "#2c3e50", fontSize: "2.5em" }}>AnaGhost</h2>
          <div></div>
        </div>

        <div style={{ 
          background: "#f8f9fa", 
          padding: "20px", 
          borderRadius: "15px", 
          marginBottom: "30px",
          border: "2px solid #e9ecef"
        }}>
          {mode === "passnplay" && (
            <div style={{ marginBottom: "20px" }}>
              <h4 style={{ margin: "0 0 15px 0", color: "#495057" }}>Players & Lives</h4>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px" }}>
                {players.map((player, i) => (
                  <div key={i} style={{ 
                    background: player.isOut ? "#f8d7da" : (i === turn ? "#d4edda" : "white"),
                    padding: "15px", 
                    borderRadius: "10px",
                    border: "2px solid " + (player.isOut ? "#f5c6cb" : (i === turn ? "#c3e6cb" : "#dee2e6")),
                    textAlign: "center"
                  }}>
                    <div style={{ 
                      fontWeight: "bold", 
                      fontSize: "16px",
                      color: player.isOut ? "#721c24" : (i === turn ? "#155724" : "#495057"),
                      marginBottom: "8px"
                    }}>
                      {player.name}
                      {i === turn && !player.isOut && " (Current Turn)"}
                      {player.isOut && " (OUT)"}
                    </div>
                    <div style={{ 
                      fontSize: "20px",
                      fontWeight: "bold",
                      color: player.isOut ? "#721c24" : "#dc3545",
                      fontFamily: "monospace"
                    }}>
                      {getGhostLetters(player.lives) || "-"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {gameWinner && (
          <div style={{ 
            background: "#d4edda", 
            color: "#155724", 
            padding: "30px", 
            borderRadius: "15px", 
            marginBottom: "25px",
            textAlign: "center",
            fontSize: "24px",
            fontWeight: "bold",
            border: "3px solid #c3e6cb"
          }}>
            🎉 {gameWinner} Wins the Game! 🎉
          </div>
        )}

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
            <strong>Current Turn:</strong> {mode === "bot" ? (turn % 2 === 0 ? "You" : "Bot") : (players[turn] ? players[turn].name : "")}
          </div>
        </div>

        <div style={{ 
          background: "#e1f5fe", 
          padding: "20px", 
          borderRadius: "15px", 
          marginBottom: "25px",
          textAlign: "center"
        }}>
          <div style={{ fontSize: "16px", color: "#0277bd", marginBottom: "10px" }}>
            <strong>AnaGhost Rules:</strong> Add letters and optionally rearrange (anagram) the fragment
          </div>
          <div style={{ fontSize: "14px", color: "#0288d1" }}>
            Fragment must be contained within a valid word. Avoid complete words.
          </div>
        </div>

        {anagramMode && (
          <div style={{ 
            background: "#f3e5f5", 
            padding: "25px", 
            borderRadius: "15px", 
            marginBottom: "25px",
            border: "3px solid #9c27b0"
          }}>
            <h4 style={{ margin: "0 0 15px 0", color: "#7b1fa2", textAlign: "center" }}>
              Anagram Mode
            </h4>
            <p style={{ margin: "0 0 15px 0", textAlign: "center", fontSize: "16px" }}>
              Rearrange the letters "{fragment + pendingLetter}" into a new fragment:
            </p>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <input
                type="text"
                placeholder={`Anagram of "${fragment + pendingLetter}"`}
                style={{
                  flex: 1,
                  padding: "12px",
                  fontSize: "16px",
                  border: "2px solid #ddd",
                  borderRadius: "8px"
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.target.value.trim()) {
                    submitAnagram(e.target.value);
                  }
                }}
              />
              <button 
                onClick={(e) => {
                  const input = e.target.previousElementSibling;
                  if (input.value.trim()) {
                    submitAnagram(input.value);
                  }
                }}
                style={{
                  padding: "12px 20px",
                  background: "#9c27b0",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "16px",
                  fontWeight: "600"
                }}
              >
                Submit
              </button>
              <button 
                onClick={() => {
                  setAnagramMode(false);
                  setPendingLetter("");
                }}
                style={{
                  padding: "12px 20px",
                  background: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "16px",
                  fontWeight: "600"
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {challengeMode && (
          <div style={{ 
            background: "#fff3e0", 
            padding: "25px", 
            borderRadius: "15px", 
            marginBottom: "25px",
            border: "3px solid #ff9800"
          }}>
            <h4 style={{ margin: "0 0 15px 0", color: "#e65100", textAlign: "center" }}>
              Challenge Mode
            </h4>
            <p style={{ margin: "0 0 15px 0", textAlign: "center", fontSize: "16px" }}>
              {challengeTarget !== null ? players[challengeTarget].name : ""} must provide a valid word containing "{fragment}":
            </p>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <input
                type="text"
                value={challengeWord}
                onChange={(e) => setChallengeWord(e.target.value)}
                placeholder="Enter word..."
                style={{
                  flex: 1,
                  padding: "12px",
                  fontSize: "16px",
                  border: "2px solid #ddd",
                  borderRadius: "8px"
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    submitChallengeWord();
                  }
                }}
              />
              <button 
                onClick={submitChallengeWord}
                style={{
                  padding: "12px 20px",
                  background: "#28a745",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "16px",
                  fontWeight: "600"
                }}
              >
                Submit
              </button>
            </div>
          </div>
        )}

        <div style={{ 
          display: "flex", 
          gap: "15px", 
          justifyContent: "center", 
          alignItems: "center",
          marginBottom: "25px",
          flexWrap: "wrap"
        }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
            <label style={{ fontSize: "14px", fontWeight: "600", color: "#666" }}>Add Letter</label>
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
              disabled={message || challengeMode || anagramMode || gameWinner || (mode === "bot" && turn % 2 === 1)}
              onKeyDown={e => {
                if (/^[a-zA-Z]$/.test(e.key)) {
                  addLetter(e.key.toLowerCase(), false);
                  e.target.value = "";
                }
              }}
              placeholder="?"
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
            <label style={{ fontSize: "14px", fontWeight: "600", color: "#666" }}>Add + Anagram</label>
            <input
              type="text"
              maxLength={1}
              style={{
                width: "60px",
                height: "60px",
                fontSize: "2em",
                textAlign: "center",
                border: "3px solid #9c27b0",
                borderRadius: "15px",
                fontWeight: "bold",
                background: "#f3e5f5"
              }}
              disabled={message || challengeMode || anagramMode || gameWinner || !fragment || (mode === "bot" && turn % 2 === 1)}
              onKeyDown={e => {
                if (/^[a-zA-Z]$/.test(e.key)) {
                  addLetter(e.key.toLowerCase(), true);
                  e.target.value = "";
                }
              }}
              placeholder="?"
            />
          </div>
          <button 
            onClick={challenge} 
            disabled={message || challengeMode || anagramMode || gameWinner || !fragment}
            style={{
              padding: "15px 25px",
              background: "#dc3545",
              color: "white",
              border: "none",
              borderRadius: "10px",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: "600",
              opacity: (message || challengeMode || anagramMode || gameWinner || !fragment) ? 0.6 : 1
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
            New Game
          </button>
        </div>

        {mode === "bot" && turn % 2 === 1 && !message && !challengeMode && !anagramMode && !gameWinner && (
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
                    {h.anagram && <span style={{ color: "#9c27b0" }}> (anagram)</span>}
                    {h.botWord && <span style={{ color: "#007bff" }}> (Bot's word: "{h.botWord}")</span>}
                    {h.challengeWord && <span style={{ color: "#6f42c1" }}> (Word: "{h.challengeWord}")</span>}
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
