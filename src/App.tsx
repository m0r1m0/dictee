import {
  Textarea,
  Text,
  Box,
  Button,
  useToast,
  Input,
  FormControl,
  FormLabel,
  Switch,
  IconButton,
} from "@chakra-ui/react";
import React, {
  createRef,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import "./App.css";
import { useInterval } from "./useInterval";
import { parse, subTitleType } from "subtitle";
import { getSubtitlesText } from "./utils/getCurrentSubtitlesText";
import { RepeatIcon } from "@chakra-ui/icons";
import { findPrevSubtitles } from "./utils/findPrevSubtitles";

type MovieInfo = {
  movieId: string;
  timedtexttracks: Array<{
    language: string | null;
    ttDownloadables: {
      "webvtt-lssdh-ios8": {
        downloadUrls: Record<string, string>;
      };
    };
  }>;
};

type URL = string;
type SubsDownloadUrlsCache = {
  [movieId: string]: {
    [language: string]: URL;
  };
};

const randomProperty = (obj: Record<string, string>): string => {
  const keys = Object.keys(obj);
  return obj[keys[(keys.length * Math.random()) << 0]];
};

const getMovieId = (path: string) => {
  const segments = path.split("/");
  return segments[segments.length - 1];
};

function App() {
  const [showElement, setShowElement] = useState(false);
  const [answer, setAnswer] = useState("");
  const [urlsCache, setUrlsCache] = useState<SubsDownloadUrlsCache>({});
  const [currentSubtitles, setCurrentSubtitles] = useState<subTitleType[]>([]);
  const [currentSubtitle, setCurrentSubtitle] = useState<subTitleType[]>([]);
  const [prevSubtitle, setPrevSubtitle] = useState<subTitleType[]>([]);
  const correctToast = useToast({
    title: "正解",
    status: "success",
  });
  const incorrectToast = useToast({
    title: "不正解",
    status: "error",
  });
  const [easyModeAnswer, setEasyModeAnswer] = useState<string[][]>([]);
  const [isEasyMode, setIsEasyMode] = useState(false);
  const [prevAutoPausedTime, setPrevAutoPausedTime] = useState<
    number | undefined
  >(undefined);
  const [question, setQuestion] = useState<
    | {
        start: number;
        end: number;
        text: string;
        subtitles: subTitleType[];
      }
    | undefined
  >();

  // 問題字幕の更新
  useEffect(() => {
    const videoElement = document.querySelector("video");
    if (videoElement == null) {
      return;
    }
    const currentTime = Math.round(videoElement.currentTime * 1000);
    // 一度も自動停止したことがない
    if (prevAutoPausedTime == null) {
      const searchKeyTime =
        currentSubtitle[0] != null ? currentSubtitle[0].start : currentTime;
      const prevSubtitles = findPrevSubtitles(
        Number(searchKeyTime),
        currentSubtitles
      );
      if (prevSubtitles.length > 0) {
        setQuestion({
          start: Number(prevSubtitles[0].start),
          end: Number(prevSubtitles[0].end),
          text: getSubtitlesText(prevSubtitles),
          subtitles: prevSubtitles
        });
        return;
      }
      if (currentSubtitle.length === 0) {
        setQuestion(undefined);
        return;
      }
      setQuestion({
        start: Number(currentSubtitle[0].start),
        end: Number(currentSubtitle[0].end),
        text: getSubtitlesText(currentSubtitle),
        subtitles: currentSubtitle,
      })
      return;
    }

    // 前回の自動停止は今の字幕のstart, end内か
    if (
      currentSubtitle[0] != null &&
      prevAutoPausedTime >= currentSubtitle[0].start &&
      prevAutoPausedTime <= currentSubtitle[0].end
    ) {
      setQuestion({
        start: Number(currentSubtitle[0].start),
        end: Number(currentSubtitle[0].end),
        text: getSubtitlesText(currentSubtitle),
        subtitles: currentSubtitle,
      })
      return;
    }
    if (prevSubtitle.length === 0) {
      setQuestion(undefined);
      return
    }
    setQuestion({
      start: Number(prevSubtitle[0].start),
      end: Number(prevSubtitle[0].end),
      text: getSubtitlesText(prevSubtitle),
      subtitles: prevSubtitle
    });
    return;
  }, [currentSubtitle, prevSubtitle, prevAutoPausedTime])

  // 字幕をダウンロードするためのURLを保存
  useEffect(() => {
    const listener = (e: CustomEvent<MovieInfo>) => {
      console.log("DICTEE_DOWNLOADURL_RECEIVED", {
        movieId: e.detail.movieId,
        timedtexttracks: e.detail.timedtexttracks,
      });

      const tracks = e.detail.timedtexttracks.filter(
        (track) => track.language != null
      );
      const newCache = tracks.reduce((cache, track) => {
        const urls = track.ttDownloadables["webvtt-lssdh-ios8"]?.downloadUrls;
        if (urls == null) {
          return cache;
        }
        return {
          ...cache,
          // languageのnullチェックは👆でやってる
          [track.language!]: randomProperty(urls),
        };
      }, {});

      setUrlsCache((c) => {
        return {
          ...c,
          [e.detail.movieId]: {
            ...c[e.detail.movieId],
            ...newCache,
          },
        };
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

  // 回答入力欄を表示するか判定
  useInterval(() => {
    const hasElm =
      document.getElementsByClassName("watch-video").length > 0 &&
      document.querySelector("video") != null;
    if (hasElm != showElement) {
      setShowElement(hasElm);
    }
  }, 500);

  // 現在再生中の動画の字幕を取得
  useEffect(() => {
    if (showElement) {
      const cache = urlsCache[getMovieId(location.pathname)];
      if (cache == null) {
        return;
      }
      fetch(cache["en"]).then((t) =>
        t.text().then((d) => {
          const parsed = parse(d);
          setCurrentSubtitles(parsed);
        })
      );
    }
  }, [showElement, urlsCache]);

  // 今表示する字幕を抽出
  useEffect(() => {
    if (!showElement) {
      return;
    }

    const videoElement = document.querySelector("video");
    if (videoElement == null) {
      return;
    }

    const handleTimeUpdate = () => {
      const currentTime = Math.round(videoElement.currentTime * 1000);
      if (currentSubtitle.length === 0) {
        setCurrentSubtitle(
          currentSubtitles.filter(
            (s) => s.start <= currentTime && s.end >= currentTime
          )
        );
        return;
      }

      // 今表示している字幕のendを超えたらpause & 次の字幕を検索
      const { end } = currentSubtitle[0];
      if (currentTime > end) {
        if (!videoElement.paused) {
          window.dispatchEvent(
            new CustomEvent("DICTEE_PLAYER_SEEK", { detail: end })
          );
          window.dispatchEvent(new CustomEvent("DICTEE_PLAYER_PAUSE"));
          setPrevAutoPausedTime(end as number);
        }
        setCurrentSubtitle(
          currentSubtitles.filter(
            (s) => s.start <= currentTime && s.end >= currentTime
          )
        );
        setPrevSubtitle(currentSubtitle);
      }
    };

    videoElement.addEventListener("timeupdate", handleTimeUpdate);
    return () => {
      videoElement.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, [currentSubtitles, showElement, currentSubtitle]);

  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setAnswer(e.target.value);
    },
    []
  );

  // 答え合わせ
  const handleJudgeClick = useCallback(() => {
    const videoElement = document.querySelector("video");
    if (videoElement == null) {
      return;
    }

    // 答えを取得
    const correctAnswer = question?.text;

    if (answer === correctAnswer) {
      correctToast();
    } else {
      incorrectToast();
    }
  }, [correctToast, incorrectToast, answer, question?.text]);

  const easyModeInputRefs = useRef(
    easyModeAnswer.map((word) => {
      return word.map((_character) => createRef<HTMLInputElement>());
    })
  );
  // 簡単モードの入力stateの初期化
  useEffect(() => {
    const newEasyModeAnswer = (question?.text ?? "")
      .split(" ")
      .map((word) => {
        return word.split("").map((character) => "");
      });
    setEasyModeAnswer(newEasyModeAnswer);
    easyModeInputRefs.current = newEasyModeAnswer.map((word) => {
      return word.map((_character) => createRef<HTMLInputElement>());
    });
  }, [question?.text]);

  const handleChangeInput =
    (wordIndex: number, characterIndex: number) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      // state更新
      const value = e.target.value.charAt(e.target.value.length - 1);
      setEasyModeAnswer((s) =>
        s.map((w, wi) => {
          if (wi === wordIndex) {
            return w.map((c, ci) => {
              if (ci === characterIndex) {
                return value;
              }
              return c;
            });
          }
          return w;
        })
      );

      const correctAnswer = (question?.text ?? "")
        .split(" ")
        .map((w) => w.split(""));
      // 不正解のときは次の入力欄にフォーカスしない
      if (value !== correctAnswer[wordIndex][characterIndex]) {
        return;
      }

      // 正解してたら次の入力欄にフォーカス
      // 最後の1文字の場合は次の単語の最初の入力欄にフォーカス
      if (characterIndex === easyModeAnswer[wordIndex].length - 1) {
        // 最後の単語の時はなにもしない
        if (wordIndex === easyModeAnswer.length - 1) {
          return;
        }
        const nextInputRef =
          easyModeInputRefs.current[wordIndex + 1][0].current;
        nextInputRef?.focus();
      } else {
        const nextInputRef =
          easyModeInputRefs.current[wordIndex][characterIndex + 1].current;
        nextInputRef?.focus();
      }
    };

  const handleRepeatClick = () => {
    // 問題になってる字幕の開始時間を取得
    const start = question?.start
    // startの時間までseekする
    window.dispatchEvent(
      new CustomEvent("DICTEE_PLAYER_SEEK", { detail: start })
    );
    window.dispatchEvent(
      new CustomEvent("DICTEE_PLAYER_PLAY")
    );
  };

  if (!showElement) {
    return null;
  }

  return (
    <Box className="AppContainer" p={6}>
      <Box display="flex">
        <IconButton
          colorScheme="teal"
          aria-label="もう一回聞く"
          size="lg"
          icon={<RepeatIcon />}
          onClick={handleRepeatClick}
        />
        <FormControl display="flex" alignItems="center">
          <FormLabel htmlFor="easy-mode" mb={0} ml="auto" fontSize={12}>
            簡単モードに切り替える
          </FormLabel>
          <Switch
            id="easy-mode"
            size={"lg"}
            colorScheme="teal"
            isChecked={isEasyMode}
            onChange={() => {
              setIsEasyMode((m) => !m);
            }}
          />
        </FormControl>
      </Box>
      {isEasyMode && (
        <Box height={"40%"} mt={4} display="flex" width="100%" flexWrap="wrap">
          {easyModeAnswer.map((word, wordIndex) => {
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
                      key={`${wordIndex}-${characterIndex}`}
                      size="lg"
                      w={16}
                      h={16}
                      mr={2}
                      fontSize={16}
                      textAlign="center"
                      onChange={handleChangeInput(wordIndex, characterIndex)}
                      value={character}
                      ref={easyModeInputRefs.current[wordIndex][characterIndex]}
                    />
                  );
                })}
              </Box>
            );
          })}
        </Box>
      )}
      {!isEasyMode && (
        <>
          <Box height={"40%"} mt={4}>
            <Textarea
              value={answer}
              onChange={handleTextChange}
              fontSize="24"
              variant="filled"
              height="100%"
              placeholder="答えを入力してね！"
              resize={"none"}
              isRequired
            />
          </Box>
          <Box display={"flex"}>
            <Button
              colorScheme="teal"
              ml="auto"
              mt={4}
              size="lg"
              onClick={handleJudgeClick}
            >
              答え合わせ
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
}

export default App;
