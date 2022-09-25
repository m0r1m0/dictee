/**
 * 問題文を1文字ずつ回答するための配列形式に変換する
 * [["T", "h", "i", "s"], ["i", "s"]] のような形式
 * @param questionText 問題テキスト
 * @returns 配列形式の問題
 */
export function convertTextToQuestionArray(
  questionText: string,
  characterCallback: (v: string) => string = (v) => v
) {
  return questionText.split(" ").map((word) => {
    return word.split("").map(characterCallback);
  });
}
