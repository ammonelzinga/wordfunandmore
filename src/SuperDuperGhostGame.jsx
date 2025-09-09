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

const defaultPlayers = ["You", "Friend 1"];

export default function SuperDuperGhostGame() {
  const [fragment, setFragment] = useState("");
  const [players, setPlayers] = useState(defaultPlayers);
  const [turn, setTurn] = useState(0);
  const [history, setHistory] = useState([]);
  const [message, setMessage] = useState("");
  const [mode, setMode] = useState("passnplay");

  async function addLetter(letter, position, reverse) {
    let newFragment = fragment;
    if (reverse) newFragment = newFragment.split("").reverse().join("");
    if (position === "start") newFragment = letter + newFragment;
    else newFragment = newFragment + letter;
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
    if (await isValidFragment(fragment)) {
      setMessage(`${players[(turn + players.length - 1) % players.length]} must name a word starting with '${fragment}'.`);
    } else {
      setMessage(`${players[(turn + players.length - 1) % players.length]} cannot name a word. ${players[turn]} wins!`);
    }
    setHistory([...history, { fragment, player: players[turn], result: "challenge" }]);
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
    for (const pos of ["start", "end"]) {
      for (const rev of [false, true]) {
        for (const l of alphabet) {
          let frag = fragment;
          if (rev) frag = frag.split("").reverse().join("");
          let newFrag = pos === "start" ? l + frag : frag + l;
          if (await isValidFragment(newFrag) && !(await isCompleteWord(newFrag))) {
            options.push({ l, pos, rev });
          }
        }
      }
    }
    if (options.length === 0) {
      setMessage("Bot cannot move. You win!");
      return;
    }
    const { l, pos, rev } = options[Math.floor(Math.random() * options.length)];
    addLetter(l, pos, rev);
  }

  return (
    <div style={{ padding: 24 }}>
      <h2>Superduperghost</h2>
      <div>
        <label>
          <input type="radio" checked={mode === "passnplay"} onChange={() => setMode("passnplay")} /> Pass-n-Play
        </label>
        <label style={{ marginLeft: 16 }}>
          <input type="radio" checked={mode === "bot"} onChange={() => setMode("bot")} /> Play vs Bot
        </label>
      </div>
      <div style={{ marginTop: 16 }}>
        <strong>Current fragment:</strong> {fragment || <em>(empty)</em>}
      </div>
      <div style={{ marginTop: 8 }}>
        <strong>Turn:</strong> {mode === "bot" ? (turn % 2 === 0 ? "You" : "Bot") : players[turn]}
      </div>
      <div style={{ marginTop: 16 }}>
        <input
          type="text"
          maxLength={1}
          style={{ width: 40, fontSize: 24 }}
          disabled={message || (mode === "bot" && turn % 2 === 1)}
          onKeyDown={e => {
            if (/^[a-zA-Z]$/.test(e.key)) {
              addLetter(e.key.toLowerCase(), "end", false);
            }
          }}
          placeholder="Letter (end)"
        />
        <input
          type="text"
          maxLength={1}
          style={{ width: 40, fontSize: 24, marginLeft: 8 }}
          disabled={message || (mode === "bot" && turn % 2 === 1)}
          onKeyDown={e => {
            if (/^[a-zA-Z]$/.test(e.key)) {
              addLetter(e.key.toLowerCase(), "start", false);
            }
          }}
          placeholder="Letter (start)"
        />
        <input
          type="text"
          maxLength={1}
          style={{ width: 40, fontSize: 24, marginLeft: 8 }}
          disabled={message || (mode === "bot" && turn % 2 === 1)}
          onKeyDown={e => {
            if (/^[a-zA-Z]$/.test(e.key)) {
              addLetter(e.key.toLowerCase(), "end", true);
            }
          }}
          placeholder="Letter (end, reverse)"
        />
        <input
          type="text"
          maxLength={1}
          style={{ width: 40, fontSize: 24, marginLeft: 8 }}
          disabled={message || (mode === "bot" && turn % 2 === 1)}
          onKeyDown={e => {
            if (/^[a-zA-Z]$/.test(e.key)) {
              addLetter(e.key.toLowerCase(), "start", true);
            }
          }}
          placeholder="Letter (start, reverse)"
        />
        <button onClick={challenge} disabled={message}>Challenge</button>
        <button onClick={resetGame}>Reset</button>
      </div>
      {mode === "bot" && turn % 2 === 1 && !message && (
        <button onClick={botMove} style={{ marginTop: 8 }}>Bot Move</button>
      )}
      <div style={{ marginTop: 16, color: "red" }}>{message}</div>
      <div style={{ marginTop: 24 }}>
        <h4>History</h4>
        <ul>
          {history.map((h, i) => (
            <li key={i}>{h.player}: {h.fragment} {h.result}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
