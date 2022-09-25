/**
 * videoのcurrentTimeを字幕のtimeにあわせる
 * @param videoElement video要素
 */
export function getCurrentTime(videoElement: HTMLVideoElement): number {
  return videoElement.currentTime * 1000
}