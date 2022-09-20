import { useEffect } from "react";

type Option = {
  /**
   * Enterキーが押されたときのショートカット
   */
  enter?: () => void;
  /**
   * 右矢印が押されたときのショートカット
   */
  arrowRight?: () => void;
}

export const useShortcut = ({ enter, arrowRight }: Option) => {
  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Enter": {
          enter?.();
          break;
        }
        case "ArrowRight": {
          arrowRight?.();
          break;
        }
        default:
          break;
      }
    }
    document.addEventListener("keydown", listener);
    return () => {
      document.removeEventListener("keydown", listener);
    }
  }, [enter, arrowRight])
}