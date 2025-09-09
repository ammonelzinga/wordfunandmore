import React, { useState, useEffect } from "react";
import HomePage from "./HomePage.jsx";
import GhostGame from "./GhostGame.jsx";
import SuperGhostGame from "./SuperGhostGame.jsx";
import SuperDuperGhostGame from "./SuperDuperGhostGame.jsx";
import XGhostGame from "./XGhostGame.jsx";
import AnaGhostGame from "./AnaGhostGame.jsx";

function App() {
  const [hash, setHash] = useState(window.location.hash.replace('#', ''));

  useEffect(() => {
    const handleHashChange = () => {
      setHash(window.location.hash.replace('#', ''));
    };
    
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  let page;
  switch (hash) {
    case "GhostGame": page = <GhostGame />; break;
    case "SuperGhostGame": page = <SuperGhostGame />; break;
    case "SuperDuperGhostGame": page = <SuperDuperGhostGame />; break;
    case "XGhostGame": page = <XGhostGame />; break;
    case "AnaGhostGame": page = <AnaGhostGame />; break;
    default: page = <HomePage />;
  }
  return page;
}

export default App;
