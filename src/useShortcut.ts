type Option = {
  /**
   * Enterキーが押されたときのショートカット
   */
  enter?: () => void;
}

export const useShortcut = ({ enter }: Option) => {
  document.addEventListener("keydown", (e) => {
    switch (e.key) {
      case "Enter": {
        enter?.();
        break;
      }
      default:
        break;
    }
  })
}