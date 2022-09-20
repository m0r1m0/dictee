/**
 * videoのcurrentTimeを丸めた値を取得する
 * @param videoElement video要素
 */
export function getCurrentTime(videoElement: HTMLVideoElement): number {
  return Math.round(videoElement.currentTime * 1000);
}