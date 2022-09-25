import { RepeatIcon } from "@chakra-ui/icons";
import { Box, Button, Input } from "@chakra-ui/react";
import React, {
  createRef,
  RefObject,
  useCallback,
  useEffect,
  useReducer,
  useRef,
} from "react";
import { parse } from "subtitle";
import "../App.css";
import { useInterval } from "../useInterval";
import { useShortcut } from "../useShortcut";
import { convertTextToQuestionArray } from "../utils/convertTextToQuestionArray";
import { getSubtitlesText } from "../utils/getCurrentSubtitlesText";
import { getCurrentTime } from "../utils/getCurrentTime";
import { getNextSubtitles } from "../utils/getNextSubtitles";
import { initialState, reducer } from "./reducer";

type MovieInfo = {
  movieId: number;
  timedtexttracks: Array<{
    language: string | null;
    ttDownloadables: {
      "webvtt-lssdh-ios8": {
        downloadUrls: Record<string, string>;
      };
    };
  }>;
};
const randomProperty = (obj: Record<string, string>): string => {
  const keys = Object.keys(obj);
  return obj[keys[(keys.length * Math.random()) << 0]];
};

const getMovieId = (path: string) => {
  const segments = path.split("/");
  return segments[segments.length - 1];
};

const SymbolRegex = /[,\.\?]/;

function App() {
  const [
    {
      subtitleUrls,
      question,
      isVideoLoaded,
      currentSubtitles,
      subtitles,
      answer,
    },
    dispatch,
  ] = useReducer(reducer, initialState);
  const answerInputRefs = useRef<RefObject<HTMLInputElement>[][]>([]);

  useInterval(() => {
    const hasElement =
      document.getElementsByClassName("watch-video").length > 0 &&
      document.querySelector("video") != null;
    if (hasElement != isVideoLoaded) {
      // 動画を開いたら字幕をダウンロードする
      if (hasElement) {
        const movieId = getMovieId(location.pathname);
        const url = subtitleUrls[Number(movieId)]?.["en"];
        if (url == null) {
          dispatch({
            type: "videoLoaded",
            subtitles: [],
          });
          return;
        }
        fetch(url).then((d) => {
          d.text().then((t) => {
            dispatch({
              type: "videoLoaded",
              subtitles: parse(t),
            });
          });
        });
      } else {
        dispatch({
          type: "videoUnloaded",
        });
      }
    }
  }, 500);

  // 字幕をダウンロードするためのURLを取得
  useEffect(() => {
    const listener = (e: CustomEvent<MovieInfo>) => {
      const tracks = e.detail.timedtexttracks.filter(
        (track) => track.language != null
      );
      const downloadUrls = tracks.reduce((cache, track) => {
        const urls = track.ttDownloadables["webvtt-lssdh-ios8"]?.downloadUrls;
        if (urls == null) {
          return cache;
        }
        return {
          ...cache,
          [track.language!]: randomProperty(urls),
        };
      }, {});

      dispatch({
        type: "downloadUrlReceived",
        movieId: e.detail.movieId,
        urls: downloadUrls,
      });
    };
    window.addEventListener(
      "DICTEE_DOWNLOADURL_RECEIVED",
      listener as EventListener
    );

    return () =>
      window.removeEventListener(
        "DICTEE_DOWNLOADURL_RECEIVED",
        listener as EventListener
      );
  }, []);

  // 表示する字幕を取得する
  useEffect(() => {
    if (!isVideoLoaded) {
      return;
    }

    const videoElement = document.querySelector("video");
    if (videoElement == null) {
      return;
    }

    const handleTimeUpdate = () => {
      const currentTime = getCurrentTime(videoElement);
      if (
        currentSubtitles.length > 0 &&
        currentSubtitles[0].end <= currentTime
      ) {
        if (!videoElement.paused) {
          dispatchEvent(new CustomEvent("DICTEE_PLAYER_PAUSE"));
          dispatchEvent(
            new CustomEvent("DICTEE_PLAYER_SEEK", {
              detail: currentSubtitles[0].end,
            })
          );
        }
        dispatch({
          type: "videoPaused",
          time: currentTime,
        });
        return;
      }
      dispatch({
        type: "videoTimeUpdated",
        time: currentTime,
        initializeRefCallback: (newQuestion) => {
          console.log("[CALLBACK] ref initialized", newQuestion);
          answerInputRefs.current = convertTextToQuestionArray(
            getSubtitlesText(newQuestion)
          ).map((word) => {
            return word.map((_character) => {
              return createRef<HTMLInputElement>();
            });
          });
        },
      });
    };

    videoElement.addEventListener("timeupdate", handleTimeUpdate);
    return () => {
      videoElement.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, [isVideoLoaded, subtitles, currentSubtitles]);

  const handleChangeInput =
    (wordIndex: number, characterIndex: number) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value.charAt(e.target.value.length - 1);
      dispatch({
        type: "answerChanged",
        wordIndex,
        characterIndex,
        value,
      });
      const correctAnswer = convertTextToQuestionArray(
        getSubtitlesText(question),
        (v) => v.toLowerCase()
      );
      if (value.toLowerCase() !== correctAnswer[wordIndex][characterIndex]) {
        console.log("不正解！");
        return;
      }
      focusNext(wordIndex, characterIndex, correctAnswer);
    };

  const focusNext = (
    wordIndex: number,
    characterIndex: number,
    correctAnswer: string[][]
  ) => {
    // 最後の1文字の場合は次の単語の最初の入力欄にフォーカス
    if (characterIndex === answer[wordIndex].length - 1) {
      // 次の単語がない = 最後のときは何もしない
      if (wordIndex === answer.length - 1) {
        return;
      }

      // フォーカス対象が記号だった場合さらに次の入力欄にフォーカスする
      const focusTargetCharacter = correctAnswer[wordIndex + 1][0];
      if (SymbolRegex.test(focusTargetCharacter)) {
        focusNext(wordIndex + 1, 0, correctAnswer);
        return;
      }
      const nextInputRef = answerInputRefs.current[wordIndex + 1][0].current;
      nextInputRef?.focus();
      return;
    }

    const focusTargetCharacter = correctAnswer[wordIndex][characterIndex + 1];
    if (SymbolRegex.test(focusTargetCharacter)) {
      focusNext(wordIndex, characterIndex + 1, correctAnswer);
      return;
    }
    const nextInputRef =
      answerInputRefs.current[wordIndex][characterIndex + 1].current;
    nextInputRef?.focus();
  };

  const handleRepeatClick = () => {
    if (question.length === 0) {
      return;
    }
    // 問題になってる字幕の開始時間を取得
    const start = question[0].start;
    // startの時間までseekする
    window.dispatchEvent(
      new CustomEvent("DICTEE_PLAYER_SEEK", { detail: start })
    );
    window.dispatchEvent(new CustomEvent("DICTEE_PLAYER_PLAY"));
  };

  const playNextSubtitle = useCallback(() => {
    if (!isVideoLoaded) {
      return;
    }

    const videoElement = document.querySelector("video");
    if (videoElement == null) {
      return;
    }
    const currentTime = getCurrentTime(videoElement);
    const nextSubtitles = getNextSubtitles(currentTime, subtitles);
    if (nextSubtitles.length === 0) {
      return;
    }

    const { start } = nextSubtitles[0]
    window.dispatchEvent(new CustomEvent("DICTEE_PLAYER_SEEK", { detail: start }));
    window.dispatchEvent(new CustomEvent("DICTEE_PLAYER_PLAY"));
  }, [subtitles, isVideoLoaded])

  useShortcut({
    enter: handleRepeatClick,
    d: playNextSubtitle,
  })

  useEffect(() => {
    console.warn("[RENDERD]", answer, question);
  });

  if (!isVideoLoaded) {
    return null;
  }
  return (
    <Box className="AppContainer" p={6} bg="white">
      <Box display="flex" width="100%" flexDirection="row">
        <Box display="flex" flexWrap="wrap" width="90%" alignItems="flex-start">
          {convertTextToQuestionArray(getSubtitlesText(question)).map(
            (word, wordIndex) => {
              return (
                <Box
                  className="word"
                  mr={8}
                  key={wordIndex}
                  display="flex"
                  mb={4}
                >
                  {word.map((character, characterIndex) => {
                    return (
                      <Input
                        ref={answerInputRefs.current[wordIndex][characterIndex]}
                        key={`${wordIndex}-${characterIndex}`}
                        size="lg"
                        w={16}
                        h={16}
                        mr={2}
                        fontSize="2xl"
                        textAlign="center"
                        placeholder={character}
                        value={answer[wordIndex][characterIndex]}
                        onChange={handleChangeInput(wordIndex, characterIndex)}
                        readOnly={SymbolRegex.test(character)}
                        variant="filled"
                      />
                    );
                  })}
                </Box>
              );
            }
          )}
        </Box>
        <Box width="10%">
          <Button
            leftIcon={<RepeatIcon />}
            colorScheme="teal"
            size={"lg"}
            onClick={handleRepeatClick}
          >
            もう一回聞く
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

export default App;