"use client"

import { Play, Pause, SkipBack, SkipForward, Heart, X, Minus, Square } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useMusicStore } from "@/store/useMusic"
import { next, previus } from "@/lib/howler/hwoler"
import { ProgressBar } from "../components/player-controls/progress-bar"
import { useState } from "react"


const NoDrag = {
  WebkitAppRegion: 'no-drag',
}
export default function MiniMusicPlayer() {
  const [currentTime, setCurrentTime] = useState(0)
  const { currentSong, toggleLike, setIsPlaying, isPlaying } = useMusicStore()
  const handleMinimize = () => {
    window.electronAPI.minimizeApp()
  }

  const handleMaximize = () => {
    window.electronAPI.maximizeApp()
  }



  const handleClose = async () => {
    window.electronAPI.closeApp()
  }

  const handleProgressChange = (value: number[]) => {
    setCurrentTime(value[0])
  }


  return (
    <div className="w-full max-w-[340px] h-[180px] mx-auto bg-linear-to-br from-slate-800 via-slate-900 to-slate-800  shadow-2xl border border-slate-700 flex flex-col overflow-hidden">
      
      {/* Barra superior estilo Windows */}
      <div className="h-6 bg-slate-900/90 flex items-center justify-end border-b border-slate-700" style={{
        WebkitAppRegion: 'drag',
      }}>
        <button className="w-8 h-full flex items-center justify-center hover:bg-slate-700/70" title="Minimizar" onClick={handleMinimize} style={NoDrag}>
          <Minus className="h-3 w-3 text-slate-300" />
        </button>
        <button className="w-8 h-full flex items-center justify-center hover:bg-slate-700/70" title="Maximizar" onClick={handleMaximize} style={NoDrag}>
          <Square className="h-3 w-3 text-slate-300" />
        </button>
        <button className="w-8 h-full flex items-center justify-center hover:bg-red-600/80" title="Cerrar" onClick={handleClose} style={NoDrag}>
          <X className="h-3 w-3 text-slate-300" />
        </button>
      </div>

      {/* Contenido */}
      <div className="flex flex-1 p-3 gap-3 overflow-hidden">
        {/* Album Art */}
        <div className="w-[100px] h-[100px] relative shrink-0 rounded-xl overflow-hidden shadow-xl">
          <img src={currentSong?.coverUrl} alt="Album cover" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent" />
        </div>

        {/* Info + Controles + Barra */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Título y Artista */}
          <div className="mb-2">
            <h3 className="text-white font-semibold text-[14px] leading-tight truncate">{currentSong?.title}</h3>
            <p className="text-slate-400 text-[12px] truncate">{currentSong?.artist}</p>
          </div>

          {/* Controles */}
          <div className="flex items-center justify-between mt-5 mb-2">
            <div className="flex items-center gap-2">
              <Button onClick={previus} variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-700/50">
                <SkipBack className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 bg-accent hover:bg-accent-20 text-white rounded-full shadow-lg"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
              </Button>
              <Button onClick={next} variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-700/50">
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>

            {/* Like y tiempo */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className={`h-8 w-8 p-0 ${currentSong && currentSong.isLiked ? "text-accent" : "text-slate-400"} hover:text-accent hover:bg-slate-700/50`}
                onClick={() => currentSong && toggleLike(currentSong.id)}

              >
                <Heart className={`h-4 w-4 ${currentSong && currentSong.isLiked ? "fill-current" : ""}`} />
              </Button>

            </div>
          </div>

          {/* Barra de progreso */}
          <div>
           <ProgressBar
                  currentTime={currentTime}
                  duration={currentSong?.durationRaw || 0}
                  onProgressChange={handleProgressChange}
           />
        </div>
      </div>
    </div>
    </div>
  )
}
