import { Textarea } from "@chakra-ui/react";
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
      <Textarea fontSize="24" variant="filled" height="100%" placeholder="答えを入力してね！" resize={"none"} isRequired />
    </div>
  );
}

export default App;
