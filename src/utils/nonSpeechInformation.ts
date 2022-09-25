const musicRegex = /^[(\[♪].+[)\]♪]$/;
const isMusicRegex = (text: string) => {
  return musicRegex.test(text);
};

const speakerIdentifiersRegex = /((^[\[(].+[\])] )|^.+: )/;

const paralanguageRegex = /[\[(].+[\])]/;

/**
 * 非音声情報(NSI)かどうかを判定する
 */
export const isNSI = (text: string): boolean => {
  return isMusicRegex(text);
};

/**
 * 文字列からNSIを取り除く
 */
export const removeNSI = (text: string): string => {
  return text
    .replace(musicRegex, "")
    .replace(speakerIdentifiersRegex, "")
    .replace(paralanguageRegex, "")
    .trim();
};
