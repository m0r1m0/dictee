import { Reducer } from "react";
import { subTitleType } from "subtitle";
import { convertTextToQuestionArray } from "../utils/convertTextToQuestionArray";
import { getSubtitlesText } from "../utils/getCurrentSubtitlesText";
import { removeNSI } from "../utils/nonSpeechInformation";
import { isSymbol } from "../utils/symbol";

type State = {
  isVideoLoaded: boolean;
  subtitleUrls: Record<number, Record<string, string>>;
  subtitles: subTitleType[];
  question: Question | undefined;
  currentSubtitles: subTitleType[];
  answer: string[][];
};
type Question = {
  start: number;
  end: number;
  text: string;
  originalSubtitles: subTitleType[];
};

interface DownloadUrlReceived {
  type: "downloadUrlReceived";
  movieId: number;
  urls: {
    [language: string]: string;
  };
}

interface VideoLoaded {
  type: "videoLoaded";
  subtitles: subTitleType[];
}

interface VideoUnloaded {
  type: "videoUnloaded";
}

interface VideoTimeUpdated {
  type: "videoTimeUpdated";
  time: number;
  initializeRefCallback: (question: Question) => void;
}

interface VideoPaused {
  type: "videoPaused";
  time: number;
}

interface AnswerChanged {
  type: "answerChanged";
  wordIndex: number;
  characterIndex: number;
  value: string;
}

type Action =
  | DownloadUrlReceived
  | VideoLoaded
  | VideoUnloaded
  | VideoTimeUpdated
  | VideoPaused
  | AnswerChanged;

export const initialState: State = {
  isVideoLoaded: false,
  subtitleUrls: {},
  /**
   * 現在視聴中の動画の字幕
   */
  subtitles: [],
  question: undefined,
  currentSubtitles: [],
  answer: [],
};

export const reducer: Reducer<State, Action> = (state, action) => {
  switch (action.type) {
    case "downloadUrlReceived": {
      return {
        ...state,
        subtitleUrls: {
          ...state.subtitleUrls,
          [action.movieId]: {
            ...state.subtitleUrls[action.movieId],
            ...action.urls,
          },
        },
      };
    }
    case "videoLoaded": {
      return {
        ...state,
        isVideoLoaded: true,
        subtitles: action.subtitles,
      };
    }
    case "videoUnloaded": {
      return {
        ...state,
        isVideoLoaded: false,
        subtitles: [],
      };
    }
    case "videoTimeUpdated": {
      const newCurrentSubtitle = state.subtitles.filter(
        (s) => s.start <= action.time && s.end >= action.time
      );
      if (
        state.currentSubtitles.length > 0 &&
        newCurrentSubtitle.length > 0 &&
        state.currentSubtitles[0].start === newCurrentSubtitle[0].start
      ) {
        return state;
      }

      if (newCurrentSubtitle.length === 0) {
        return {
          ...state,
          currentSubtitles: newCurrentSubtitle,
        };
      }

      const newQuestion = convertSubtitlesToQuestion(newCurrentSubtitle);
      // 質問が空(=全体がNSI)の場合は問題にしない
      if (newQuestion == null) {
        if (state.question != null) {
          return {
            ...state,
            currentSubtitles: [],
            question: undefined,
            answer: [],
          };
        }
        return state;
      }

      action.initializeRefCallback(newQuestion);
      const hasQuestionDifference = state.question?.text !== newQuestion.text;
      if (hasQuestionDifference) {
        console.log("[ANSWER]: ", getSubtitlesText(newCurrentSubtitle));
      }
      return {
        ...state,
        currentSubtitles: newCurrentSubtitle,
        question: hasQuestionDifference ? newQuestion : state.question,
        answer: hasQuestionDifference ? createEmptyAnswer(newQuestion) : state.answer,
      };
    }
    case "videoPaused": {
      // 動画が自動停止
      return {
        ...state,
        currentSubtitles: state.subtitles.filter(
          (s) => s.start <= action.time && s.end >= action.time
        ),
      };
    }
    case "answerChanged": {
      return {
        ...state,
        answer: state.answer.map((word, wordIndex) => {
          if (wordIndex !== action.wordIndex) {
            return word;
          }
          return word.map((character, characterIndex) => {
            if (characterIndex !== action.characterIndex) {
              return character;
            }
            return action.value;
          });
        })
      }
    }
    default: {
      const _check: never = action;
    }
  }
  return state;
};

const createEmptyAnswer = (question: Question) => {
  return convertTextToQuestionArray(question.text, (t) => {
    if (isSymbol(t)) {
      return t;
    }
    return "";
  });
};

/**
 * subTitleTypeの字幕情報を問題情報に変換する
 * @returns 問題がない場合はundefined
 */
const convertSubtitlesToQuestion = (subtitles: subTitleType[]): Question | undefined => {
  if (subtitles.length === 0) {
    return undefined;
  }

  const questionText = removeNSI(getSubtitlesText(subtitles))
    .replace(/ {2,}/g, " "); // 2つ以上続く空白を1つにまとめる
  if (questionText.length === 0) {
    return undefined;
  }

  return {
    start: Number(subtitles[0].start),
    end: Number(subtitles[0].end),
    text: questionText,
    originalSubtitles: subtitles,
  };
}