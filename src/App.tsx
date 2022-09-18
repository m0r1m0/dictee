import { Textarea, Text, Box, Button } from "@chakra-ui/react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import "./App.css";
import { useInterval } from "./useInterval";
import { parse, subTitleType } from "subtitle"
import { getCurrentSubtitlesText } from "./utils/getCurrentSubtitlesText";

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
  const [currentSubtitle, setCurrentSubtitle] = useState("");

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

  useInterval(() => {
    const hasElm = document.getElementsByClassName("watch-video").length > 0 && document.querySelector('video') != null
    if (hasElm != showElement) {
      setShowElement(hasElm);
    }
  }, 500);

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

  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setAnswer(e.target.value);
    },
    []
  );


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
      const currentSubs = getCurrentSubtitlesText(currentTime, currentSubtitles);
      setCurrentSubtitle(currentSubs);
    }

    videoElement.addEventListener("timeupdate", handleTimeUpdate);
    return () => {
      videoElement.removeEventListener('timeupdate', handleTimeUpdate)
    }
  }, [currentSubtitles, showElement])

  if (!showElement) {
    return null;
  }

  return (
    <Box className="AppContainer" p={6}>
      <Text fontSize='2xl'>{currentSubtitle}</Text>
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
    </Box>
  );
}

export default App;
