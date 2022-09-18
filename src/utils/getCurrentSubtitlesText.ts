import { subTitleType } from "subtitle"

export function getSubtitlesText(subs: subTitleType[]) {
  const text = subs.map(v => v.text).join(" ")
  const matchResult = text.match(/(?<=<[a-zA-Z._]+>)[^<]+/sg)
  if (matchResult == null) {
    return text.replace(/\n/g, " ");
  }
  return matchResult.join(" ").replace(/\n/g, " ");
}  