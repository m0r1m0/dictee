import { Textarea } from "@chakra-ui/react";
import { useCallback, useEffect, useState } from "react";
import "./App.css";
import { useInterval } from "./useInterval";

function App() {
  const [showElement, setShowElement] = useState(false);
  const [answer, setAnswer] = useState("");

  useInterval(() => {
    setShowElement(document.getElementsByClassName("watch-video").length > 0);
  }, 500);

  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setAnswer(e.target.value);
    },
    []
  );

  if (!showElement) {
    return null;
  }

  return (
    <div className="AppContainer">
      <Textarea
        value={answer}
        onChange={handleTextChange}
        fontSize="24"
        variant="filled"
        height="100%"
        placeholder="答えを入力してね！"
        resize={"none"}
        isRequired
      />
    </div>
  );
}

export default App;
