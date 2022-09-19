import { subTitleType } from "subtitle";

export function findPrevSubtitles(time: number, allSubtitles: subTitleType[]): subTitleType[] {
  return allSubtitles.filter(subtitle => subtitle.end <= time)
}