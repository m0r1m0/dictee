import { subTitleType } from "subtitle";

export function findPrevSubtitles(time: number, allSubtitles: subTitleType[]): subTitleType[] {
  // 字幕は同時間に複数設定されることがある。そのため、まずははじめの1つを見つけて、その開始時間をもとにすべての字幕を取得する
  const firstPrevSubtitle = allSubtitles.slice().reverse().find(subtitle => subtitle.end <= time);
  if (firstPrevSubtitle == null) {
    return [];
  }
  const prevSubtitles = allSubtitles.filter(subtitle => subtitle.end === firstPrevSubtitle.end);
  return prevSubtitles;
}