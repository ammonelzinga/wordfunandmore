import React from "react";

const games = [
  { name: "Classic Ghost", component: "GhostGame", description: "Build a word fragment, don't finish a word!" },
  { name: "Superghost", component: "SuperGhostGame", description: "Add letters to either end of the fragment." },
  { name: "Superduperghost", component: "SuperDuperGhostGame", description: "Add letters to either end, or reverse before adding." },
  { name: "Xghost", component: "XGhostGame", description: "Add a letter anywhere in the fragment." },
  { name: "Anaghost", component: "AnaGhostGame", description: "Add a letter or rearrange (anagram) the fragment." }
];

export default function HomePage() {
  return (
    <div style={{ padding: 32, fontFamily: "sans-serif" }}>
      <div style={{ marginBottom: "20px" }}>
        <button 
          onClick={() => window.location.href = 'https://ammonelzinga.github.io/'}
          style={{
            padding: "12px 24px",
            background: "#6c757d",
            color: "white",
            border: "none",
            borderRadius: "10px",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          ← Back to Main Site
        </button>
      </div>
      <h1 style={{ textAlign: "center" }}>Word Fun & More</h1>
      <h2 style={{ textAlign: "center" }}>Choose a Game:</h2>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "24px",
        marginTop: "32px"
      }}>
        {games.map((game) => {
          const navigateToGame = () => {
            window.location.hash = game.component;
            window.location.reload(); // Force reload to trigger App component re-render
          };
          
          return (
            <div
              key={game.name}
              onClick={navigateToGame}
              style={{
                cursor: "pointer",
                background: "#f8f8ff",
                border: "2px solid #ddd",
                borderRadius: "16px",
                boxShadow: "0 2px 8px #0001",
                padding: "32px 16px",
                textAlign: "center",
                transition: "box-shadow 0.2s, border-color 0.2s",
                fontSize: "1.1em"
              }}
              onMouseOver={e => e.currentTarget.style.borderColor = "#888"}
              onMouseOut={e => e.currentTarget.style.borderColor = "#ddd"}
            >
              <div style={{ fontWeight: "bold", fontSize: "1.3em", marginBottom: "12px" }}>{game.name}</div>
              <div style={{ color: "#555", marginBottom: "16px" }}>{game.description}</div>
              <button 
                onClick={(e) => {
                  e.stopPropagation(); // Prevent event bubbling
                  navigateToGame();
                }}
                style={{
                  padding: "8px 20px",
                  borderRadius: "8px",
                  border: "none",
                  background: "#4f8cff",
                  color: "white",
                  fontWeight: "bold",
                  fontSize: "1em",
                  cursor: "pointer"
                }}
              >
                Play
              </button>
            </div>
          );
        })}
      </div>
      <p style={{ textAlign: "center", marginTop: "40px" }}>
        Enjoy a variety of word games and puzzles!<br />
        Each game has options for bot or pass-n-play with friends.
      </p>
    </div>
  );
}
