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
  /**
   * dが押されたときのショートカット
   */
  d?: () => void;
}

export const useShortcut = ({ enter, arrowRight, d }: Option) => {
  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Enter": {
          enter?.();
          break;
        }
        case "d": {
          d?.();
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