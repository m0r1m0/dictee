import { Textarea, Text, Box, Button, useToast } from "@chakra-ui/react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import "./App.css";
import { useInterval } from "./useInterval";
import { parse, subTitleType } from "subtitle"
import { getSubtitlesText } from "./utils/getCurrentSubtitlesText";

type MovieInfo = {
  movieId: string;
  timedtexttracks: Array<{
    language: string | null;
    ttDownloadables: {
      "webvtt-lssdh-ios8": {
        downloadUrls: Record<string, string>
      }
    }
  }>
}

type URL = string;
type SubsDownloadUrlsCache = {
  [movieId: string]: {
    [language: string]: URL;
  }
}

const randomProperty = (obj: Record<string, string>): string => {
  const keys = Object.keys(obj)
  return obj[keys[(keys.length * Math.random()) << 0]]
}

const getMovieId = (path: string) => {
  const segments = path.split("/");
  return segments[segments.length - 1];
}

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
  })

  // 字幕をダウンロードするためのURLを保存
  useEffect(() => {
    const listener = (e: CustomEvent<MovieInfo>) => {
      console.log('DICTEE_DOWNLOADURL_RECEIVED', {
        movieId: e.detail.movieId,
        timedtexttracks: e.detail.timedtexttracks
      });

      const tracks = e.detail.timedtexttracks.filter(track => track.language != null);
      const newCache = tracks.reduce((cache, track) => {
        const urls = track.ttDownloadables["webvtt-lssdh-ios8"]?.downloadUrls;
        if (urls == null) {
          return cache
        }
        return {
          ...cache,
          // languageのnullチェックは👆でやってる
          [track.language!]: randomProperty(urls)
        }
      }, {})

      setUrlsCache(c => {
        return {
          ...c,
          [e.detail.movieId]: {
            ...c[e.detail.movieId], 
            ...newCache
          }
        }
      })
    }
    window.addEventListener("DICTEE_DOWNLOADURL_RECEIVED", listener as EventListener);
    
    return () => window.removeEventListener("DICTEE_DOWNLOADURL_RECEIVED", listener as EventListener);
  }, [])

  // 回答入力欄を表示するか判定
  useInterval(() => {
    const hasElm = document.getElementsByClassName("watch-video").length > 0 && document.querySelector('video') != null
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
      fetch(cache["en"]).then(t => t.text().then((d) => {
        const parsed = parse(d);
        setCurrentSubtitles(parsed)
      }))
    }
  }, [showElement, urlsCache])

  // 今表示する字幕を抽出
  useEffect(() => {
    if (!showElement) {
      return;
    }

    const videoElement = document.querySelector('video');
    if (videoElement == null) {
      return;
    }

    const handleTimeUpdate = () => {
      const currentTime = Math.round(videoElement.currentTime * 1000);
      if (currentSubtitle.length === 0) {
        setCurrentSubtitle(currentSubtitles.filter(s => s.start <= currentTime && s.end >= currentTime))
        return;
      }
      
      // 今表示している字幕のendを超えたらpause & 次の字幕を検索
      const { end } = currentSubtitle[0]
      if (currentTime >= end) {
        if (!videoElement.paused) {
          window.dispatchEvent(new CustomEvent("DICTEE_PLAYER_PAUSE"));
        }
        setCurrentSubtitle(currentSubtitles.filter(s => s.start <= currentTime && s.end >= currentTime))
        setPrevSubtitle(currentSubtitle);
      }
    }

    videoElement.addEventListener("timeupdate", handleTimeUpdate);
    return () => {
      videoElement.removeEventListener('timeupdate', handleTimeUpdate)
    }
  }, [currentSubtitles, showElement, currentSubtitle])

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
    let correctAnswer = ""
    const currentTime = Math.round(videoElement.currentTime * 1000);
    if (currentSubtitle.length === 0) {
      correctAnswer = getSubtitlesText(prevSubtitle);
    } else if (currentSubtitle[0].end > currentTime) {
      correctAnswer = getSubtitlesText(prevSubtitle);
    } else {
      correctAnswer = getSubtitlesText(currentSubtitle);
    }

    if (answer === correctAnswer) {
      correctToast();
    } else {
      incorrectToast();
    }
  }, [currentSubtitle, correctToast, incorrectToast, prevSubtitle, answer])

  useEffect(() => {
    console.log('prev', getSubtitlesText(prevSubtitle));
    console.log('current', getSubtitlesText(currentSubtitle))
  }, [currentSubtitle, prevSubtitle])

  if (!showElement) {
    return null;
  }

  return (
    <Box className="AppContainer" p={6}>
      <Text fontSize='2xl'>{getSubtitlesText(currentSubtitle)}</Text>
      <Textarea
        value={answer}
        onChange={handleTextChange}
        fontSize="24"
        variant="filled"
        height="100%"
        placeholder="答えを入力してね！"
        resize={"none"}
        isRequired
        mt={4}
      />
      <Box display={"flex"}>
        <Button colorScheme="teal" ml="auto" mt={4} size="lg" onClick={handleJudgeClick}>答え合わせ</Button>
      </Box>
    </Box>
  );
}

export default App;
