import { subTitleType } from "subtitle";

/**
 * 指定した時間の次の字幕を取得する
 * @param targetTime 対象時間
 * @param allSubtitles 全字幕
 * @returns 次の字幕
 */
export function getNextSubtitles(targetTime: number, allSubtitles: subTitleType[]): subTitleType[] {
  if (allSubtitles.length === 0) {
    return [];
  }

  // 字幕は同時間に複数設定されることがある。まずは最初の1つを見つけて、表示開始時間が同じものを集める
  const firstNextSubtitle = allSubtitles.find(sub => sub.start > targetTime);
  if (firstNextSubtitle === undefined) {
    return [];
  }
  const nextSubtitles = allSubtitles.filter(sub => sub.start === firstNextSubtitle.start);
  return nextSubtitles;
}