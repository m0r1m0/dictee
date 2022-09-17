import { useState } from "react";
import "./App.css";
import { useInterval } from "./useInterval";

function App() {
  const [showElement, setShowElement] = useState(false);

  useInterval(() => {
    setShowElement(document.getElementsByClassName("watch-video").length > 0);
  }, 500);

  if (!showElement) {
    return null;
  }

  return (
    <div className="AppContainer">
      <input
        type="text"
        placeholder="答えを入力してね！"
        style={{
          height: 100,
          width: 600,
        }}
      />
    </div>
  );
}

export default App;
