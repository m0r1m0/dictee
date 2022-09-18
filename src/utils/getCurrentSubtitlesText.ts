import { subTitleType } from "subtitle"

export function getCurrentSubtitlesText(currentTime: number, subs: subTitleType[]) {
  const text = subs.filter(s => s.start <= currentTime && s.end >= currentTime).map(v => v.text).join("\n")
  const matchResult = text.match(/(?<=<[a-zA-Z._]+>)[^<]+/sg)
  return matchResult?.join("\n") ?? ""
}