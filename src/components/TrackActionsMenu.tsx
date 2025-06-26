import React, { useState, useEffect, useRef, MouseEvent } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Playlist, getUserPlaylists } from "../services/FirestoreService";
import { JamendoTrack } from "../services/JamendoService";
import "./TrackActionsMenu.css";

interface TrackActionsMenuProps {
  track: JamendoTrack;
  onClose: () => void;
  onAddToQueue: (track: JamendoTrack) => void;
  onAddToPlaylist: (playlistId: string, track: JamendoTrack) => void;
  onRemoveFromPlaylist?: (playlistId: string, trackId: string) => void;
  currentPlaylistId?: string | null;
}

const TrackActionsMenu: React.FC<TrackActionsMenuProps> = ({
  track,
  onClose,
  onAddToQueue,
  onAddToPlaylist,
  currentPlaylistId,
  onRemoveFromPlaylist,
}) => {
  const { currentUser } = useAuth();
  const [showPlaylists, setShowPlaylists] = useState(false);
  const [userPlaylists, setUserPlaylists] = useState<Playlist[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showPlaylists && currentUser) {
      getUserPlaylists(currentUser.uid).then(setUserPlaylists);
    }
  }, [showPlaylists, currentUser]);

  useEffect(() => {
    const handleClickOutside = (event: globalThis.MouseEvent) => {
      // Use globalThis.MouseEvent for document listener
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  const handleAddToPlaylistClick = (playlistId: string, e: MouseEvent) => {
    e.stopPropagation();
    onAddToPlaylist(playlistId, track);
    onClose();
  };

  const handleAddToQueueClick = (e: MouseEvent) => {
    e.stopPropagation();
    onAddToQueue(track);
    onClose();
  };

  const handleRemoveFromPlaylistClick = (e: MouseEvent) => {
    if (onRemoveFromPlaylist && currentPlaylistId) {
      e.stopPropagation();
      onRemoveFromPlaylist(currentPlaylistId, track.id);
      onClose();
    }
  };

  return (
    <div className="track-actions-menu" ref={menuRef}>
      {!showPlaylists ? (
        <ul>
          <li onClick={(e) => handleAddToQueueClick(e)}>Add to Queue</li>
          <li onClick={() => setShowPlaylists(true)}>Add to Playlist</li>
          {currentPlaylistId && onRemoveFromPlaylist && (
            <li
              onClick={(e) => handleRemoveFromPlaylistClick(e)}
              className="remove-option"
            >
              Remove from this Playlist
            </li>
          )}
        </ul>
      ) : (
        <div>
          <div className="menu-header">
            <button onClick={() => setShowPlaylists(false)}>←</button>
            <span>Add to Playlist</span>
          </div>
          <ul>
            {userPlaylists.length > 0 ? (
              userPlaylists.map((playlist) => (
                <li
                  key={playlist.id}
                  onClick={(e) => handleAddToPlaylistClick(playlist.id, e)}
                >
                  {playlist.name}
                </li>
              ))
            ) : (
              <li className="no-playlists-text">No playlists found.</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default TrackActionsMenu;
