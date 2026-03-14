import { Music, Trash2, MoreVertical, Heart } from 'lucide-react';
import { useMusicStore, type Song } from '@/store/useMusic';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { FAVORITES_PLAYLIST_ID } from '@/store/useMusic';
import { useRef, memo, useMemo, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useLoadStore } from '@/store/useLoad';
import useFile from '@/hooks/useFiles';

const SongRow = memo(({ song, isSelected, isPlaying, onSongClick, onSongDoubleClick, onToggleLike, onRemove }: {
  song: Song;
  isSelected: boolean;
  isPlaying: boolean;
  onSongClick: (id: string) => void;
  onSongDoubleClick: (id: string) => void;
  onToggleLike: (id: string) => void;
  onRemove: (id: string) => void;
}) => (
  <div
    onClick={() => onSongClick(song.id)}
    onDoubleClick={() => onSongDoubleClick(song.id)}
    className={`group flex items-center gap-3 p-2 rounded-lg hover:bg-accent-10 transition-colors cursor-pointer
    ${isPlaying || isSelected ? 'bg-accent-20 border border-accent/20' : ''}`}
  >
    <div className="shrink-0 w-12 h-12 rounded-md overflow-hidden bg-gray-800">
      {song.coverUrl ? (
        <img src={song.coverUrl} alt={`${song.title} cover`} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-800">
          <Music className="w-6 h-6 text-gray-500" />
        </div>
      )}
    </div>

    <div className="flex-1 min-w-0">
      <div className={`text-sm font-medium truncate ${isPlaying ? 'text-accent' : 'text-gray-300'}`}>
        {song.title}
      </div>
      <div className="text-sm text-gray-500 truncate">{song.artist}</div>
    </div>

    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          onToggleLike(song.id);
        }}
        className={`px-2 hover:bg-accent-10 ${song.isLiked ? 'text-accent' : 'text-gray-500 hover:text-accent'}`}
      >
        <Heart className={`h-4 w-4 ${song.isLiked ? 'fill-current' : ''}`} />
      </Button>

      <div className="text-sm text-gray-500">{song.duration}</div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 hover:bg-accent-10"
          >
            <MoreVertical className="h-4 w-4 text-accent" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40 bg-gray-900/95 " >
          <DropdownMenuItem
            onClick={() => onRemove(song.id)}
            className="gap-2 text-red-400 focus:text-red-400 focus:bg-red-500/10"
          >
            <Trash2 className="h-4 w-4" />
            <span>Eliminar</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </div>
));

SongRow.displayName = 'SongRow';

export function CurrentPlaylist() {
  const {
    currentId,
    currentPlaylist,
    selectedSong,
    toggleSongPlay,
    setSelectedSong,
    removeSongFromPlaylist,
    toggleLike,
    playlists
  } = useMusicStore();
  const { setLoad } = useLoadStore()
  const { ProcessFiles } = useFile()
  
  const currentPlaylistName = useMemo(
    () => playlists.find(p => p.songs === currentPlaylist)?.name || "Playlist",
    [currentPlaylist, playlists]
  );

  const handleOpenFile = useCallback(async () => {
    try {
      await ProcessFiles(currentId)
    } catch (error) {
      setLoad(false)
      console.error('Error al cargar archivos:', error);
    }
  }, [ProcessFiles, currentId, setLoad]);

  const handleSongClick = useCallback((songId: string) => {
    setSelectedSong(selectedSong?.id === songId ? undefined : currentPlaylist.find(s => s.id === songId));
  }, [selectedSong, setSelectedSong, currentPlaylist]);

  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: currentPlaylist.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72,
    overscan: 5,
  });
                                          
  if (currentPlaylist.length === 0) {
    return (                        
      <div className="bg-gray-900/95 backdrop-blur-md border-t border-gray-800">
        <div className="max-w-7xl mx-auto p-4">
          <div className="flex items-center justify-between mb-4">
              {currentId !== FAVORITES_PLAYLIST_ID && (
              <Button
                variant="default"
                size="sm"
                onClick={handleOpenFile}
                className="bg-accent text-white"
                style={{ backgroundColor: 'var(--color-accent)' }}
              >
                Añadir canciones
              </Button>
            )}
          </div>
          <div className="flex items-center justify-center h-[168px] text-gray-500">
            No hay canciones en la cola
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/95 backdrop-blur-md border-t border-gray-800">
      <div className="mx-auto p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-accent/80 text-sm font-medium">{currentPlaylistName}</h3>
          {currentId !== FAVORITES_PLAYLIST_ID && (
            <Button
              variant="default"
              size="sm"
              onClick={handleOpenFile}
              className="bg-accent text-white"
              style={{ backgroundColor: 'var(--color-accent)' }}
            >
              Añadir canciones
            </Button>
          )}
        </div>
        <div
          ref={parentRef}
          className="h-[168px] overflow-y-auto custom-scrollbar pr-2 relative"
        >
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map(virtualRow => {
              const song = currentPlaylist[virtualRow.index];
              const isSelected = selectedSong?.id === song.id;
              const isPlaying = song.isPlaying || isSelected;
              
              return (
                <div
                  key={song.id}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <SongRow
                    song={song}
                    isSelected={isSelected}
                    isPlaying={isPlaying}
                    onSongClick={handleSongClick}
                    onSongDoubleClick={toggleSongPlay}
                    onToggleLike={toggleLike}
                    onRemove={removeSongFromPlaylist}
                  />
                </div>
              );
            })}
          </div>
        </div>
 
      </div>
    </div>
  );
}