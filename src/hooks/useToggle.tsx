import { ChakraProvider } from "@chakra-ui/react";
import { createRoot } from "react-dom/client";
import { Toggle } from "../Toggle";
import { useInterval } from "../useInterval";

/**
 * ディクテーションモードをオン・オフするためのトグルを表示する
 */
export const useToggle = () => {
  useInterval(() => {
    const controlElements = document.getElementsByClassName(
      "watch-video--bottom-controls-container"
    );
    if (
      controlElements.length > 0 &&
      document.getElementsByClassName("dictee-settings").length === 0
    ) {
      const referenceNode =
        document.querySelector('[data-uia="control-fullscreen-enter"]')
          ?.parentElement ?? null;
      const parentNode = referenceNode?.parentNode;
      const settingNode = document.createElement("div");
      settingNode.className = "dictee-settings";
      parentNode?.insertBefore(settingNode, referenceNode);
      const root = createRoot(document.querySelector(".dictee-settings")!);
      const appContainer = document.querySelector(".AppContainer");
      root.render(
        <ChakraProvider>
          <Toggle
            initialValue={appContainer != null}
            onChange={(value: boolean) => {
              dispatchEvent(
                new CustomEvent("DICTEE_TOGGLE", {
                  detail: value,
                })
              );
            }}
          />
        </ChakraProvider>
      );
    }
  }, 100);
};
