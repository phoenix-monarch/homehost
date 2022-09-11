import React, { useContext, useState, useRef, useEffect } from "react";
import { useSharedState } from "../hooks/useSharedState"
const AppContext = React.createContext();


const AppProvider = ({ children }) => {

  const REPEAT_STATES = Object.freeze({
    REPEAT_OFF: 0,
    REPEAT_ALL: 1,
    REPEAT_ONE: 2
  });

  // references
  const audioPlayer = useRef();   // reference our audio component
  const progressBar = useRef();   // reference our progress bar
  const animationRef = useRef();  // reference the animation
  const volumeBar = useRef();  // reference our volume bar


  const [playerState, setPlayerState] = useState(
    {
      currentIndex: null,
      playlist: [],
      currentSong: null,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      isMuted: false,
      currentVolume: 0.7,
      repeat: REPEAT_STATES.REPEAT_OFF,
      shuffle: false
    }
  );

  useEffect(() => {
    if (!audioPlayer.current) return;
    const seconds = Math.floor(audioPlayer.current.duration);

    setPlayerState(playerState => ({
      ...playerState, duration: seconds
    }));
    progressBar.current.max = seconds;
    //console.log("use effect A " + JSON.stringify(playerState))

  }, [playerState?.currentSong, audioPlayer?.current?.loadedmetadata, audioPlayer?.current?.readyState])


  useEffect(() => {
    if (playerState.isPlaying) {
      audioPlayer.current.pause();
      audioPlayer.current.play();
      animationRef.current = requestAnimationFrame(whilePlaying)
    }
    //console.log("use effect B " + JSON.stringify(playerState))

  }, [playerState?.currentIndex, audioPlayer?.current?.loadedmetadata, audioPlayer?.current?.readyState])

  useEffect(() => {
    if (playerState.currentTime >= playerState.duration) {
      nextSong()
    }
    //console.log("use effect C")
  }, [playerState?.currentTime])

  const calculateTime = (secs) => {
    const minutes = Math.floor(secs / 60);
    const returnedMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;
    const seconds = Math.floor(secs % 60);
    const returnedSeconds = seconds < 10 ? `0${seconds}` : `${seconds}`;
    return `${returnedMinutes}:${returnedSeconds}`;
  }

  const togglePlayPause = () => {
    const prevValue = playerState.isPlaying;
    setPlayerState(playerState => ({
      ...playerState, isPlaying: !prevValue
    }));

    if (!prevValue) {
      audioPlayer.current.play();
      animationRef.current = requestAnimationFrame(whilePlaying)
    } else {
      audioPlayer.current.pause();
      cancelAnimationFrame(animationRef.current);
    }
  }

  const whilePlaying = () => {
    progressBar.current.value = audioPlayer.current.currentTime;
    changeCurrentTime();
    animationRef.current = requestAnimationFrame(whilePlaying);
  }

  const changeProgress = () => {
    audioPlayer.current.currentTime = progressBar.current.value;
    changeCurrentTime();
  }

  const changeCurrentTime = () => {
    //console.log(`progressBar.current.value / playerState.duration: ${progressBar.current.value} / ${playerState.duration}`)
    progressBar.current.style.setProperty('--seek-before-width', `${progressBar.current.value / playerState.duration * 100}%`)
    setPlayerState(playerState => ({
      ...playerState, currentTime: progressBar.current.value
    }));
  }

  const changeVolume = () => {
    audioPlayer.current.volume = playerState.isMuted ? 0 : volumeBar.current.value / 100;
    volumeBar.current.style.setProperty('--seek-before-width', `${volumeBar.current.value}%`)
    setPlayerState(playerState => ({
      ...playerState, currentVolume: volumeBar.current.value
    }));
    //console.log(`volumeBar.current.value is ${volumeBar.current.value}, currentVolume is ${playerState.currentVolume}`)
  }

  const toggleMute = () => {
    const prevValue = playerState.isMuted;
    setPlayerState(playerState => ({
      ...playerState, isMuted: !prevValue
    }));

    if (!prevValue) {
      audioPlayer.current.volume = 0
    } else {
      audioPlayer.current.volume = playerState.currentVolume / 100
    }
  }

  const changeSong = (songId, playlist) => {
    let index = playlist.findIndex(item => item.id === songId)

    setPlayerState(playerState => ({
      ...playerState, currentSong: playlist[index], playlist: playlist, currentIndex: index
    }));

    //console.log("changeSong " + JSON.stringify(playerState))
  };

  const nextSong = () => {
    //console.log(`nextSong` + `${playerState.repeat == REPEAT_STATES.REPEAT_ONE}`)
    if (audioPlayer.current && playerState.repeat == REPEAT_STATES.REPEAT_ONE) {
      audioPlayer.current.currentTime = 0;
      return;
    }
      setPlayerState(playerState => {
         if (playerState.currentIndex >= playerState.playlist.length - 1) {
            return {...playerState, currentIndex: 0}
          } else {
            return {...playerState, currentIndex: playerState.currentIndex + 1}
          }
      });

      //console.log(`NEXT SONG: currentIndex: ${playerState.currentIndex} and playerState.playlist.length: ${playerState.playlist.length}`)

      if (playerState.currentIndex !== playerState.playlist.length) {
        setPlayerState(playerState => ({
          ...playerState, currentSong: playerState.playlist[playerState.currentIndex]
        }));
      }
  }

  const previousSong = () => {
      setPlayerState(playerState => {
        if (playerState.currentIndex <= 0) {
          return {...playerState, currentIndex: playerState.playlist.length - 1}
        } else {
          return {...playerState, currentIndex: playerState.currentIndex - 1}
        }
      });

      setPlayerState(playerState => ({
        ...playerState, currentSong: playerState.playlist[playerState.currentIndex]
      }));
  }

  const toggleRepeat = () => {
    if (playerState.repeat == REPEAT_STATES.REPEAT_OFF) {
      setPlayerState(playerState => ({
        ...playerState, repeat: REPEAT_STATES.REPEAT_ALL
      }));
    } else if (playerState.repeat == REPEAT_STATES.REPEAT_ALL) {
      setPlayerState(playerState => ({
        ...playerState, repeat: REPEAT_STATES.REPEAT_ONE
      }));
    } else if (playerState.repeat == REPEAT_STATES.REPEAT_ONE) {
      setPlayerState(playerState => ({
        ...playerState, repeat: REPEAT_STATES.REPEAT_OFF
      }));
  }
  //console.log(`toggleRepeat state ${playerState.repeat}`)
}

  const toggleShuffle = () => {
    const prevValue = playerState.shuffle;
    setPlayerState(playerState => ({
      ...playerState, shuffle: !prevValue
    }));
    //console.log(`toggleShuffle state ${playerState.shuffle}`)
  }

  return <AppContext.Provider value={{
    audioPlayer,
    progressBar,
    animationRef,
    volumeBar,
    playerState,
    togglePlayPause,
    toggleMute,
    toggleShuffle,
    toggleRepeat,
    REPEAT_STATES,
    changeProgress,
    changeVolume,
    calculateTime,
    changeSong,
    nextSong,
    previousSong
  }}>
    {children}
  </AppContext.Provider>
}

//global hook
const useGlobalContext = () => {
  return useContext(AppContext)
}

export { AppProvider, useGlobalContext }