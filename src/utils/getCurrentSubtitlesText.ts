import { subTitleType } from "subtitle"

export function getCurrentSubtitlesText(subs: subTitleType[]) {
  const text = subs.map(v => v.text).join("\n")
  const matchResult = text.match(/(?<=<[a-zA-Z._]+>)[^<]+/sg)
  if (matchResult == null) {
    return text;
  }
  return matchResult.join("\n")
}  