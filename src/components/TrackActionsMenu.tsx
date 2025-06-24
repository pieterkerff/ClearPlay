import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Playlist, getUserPlaylists } from '../services/FirestoreService';
import { JamendoTrack } from '../services/JamendoService';
import './TrackActionsMenu.css';

interface TrackActionsMenuProps {
    track: JamendoTrack;
    onClose: () => void;
    onAddToQueue: (track: JamendoTrack) => void;
    onAddToPlaylist: (playlistId: string, track: JamendoTrack) => void;
}

const TrackActionsMenu: React.FC<TrackActionsMenuProps> = ({ track, onClose, onAddToQueue, onAddToPlaylist }) => {
    const { currentUser } = useAuth();
    const [showPlaylists, setShowPlaylists] = useState(false);
    const [userPlaylists, setUserPlaylists] = useState<Playlist[]>([]);
    const menuRef = useRef<HTMLDivElement>(null);

    // Fetch user's playlists when they open the "Add to Playlist" submenu
    useEffect(() => {
        if (showPlaylists && currentUser) {
            getUserPlaylists(currentUser.uid).then(setUserPlaylists);
        }
    }, [showPlaylists, currentUser]);

    // Close menu if clicking outside of it
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);

    const handleAddToPlaylistClick = (playlistId: string) => {
        onAddToPlaylist(playlistId, track);
        onClose(); // Close menu after action
    };

    const handleAddToQueueClick = () => {
        onAddToQueue(track);
        onClose();
    };

    return (
        <div className="track-actions-menu" ref={menuRef}>
            {!showPlaylists ? (
                // Main Menu
                <ul>
                    <li onClick={handleAddToQueueClick}>Add to Queue</li>
                    <li onClick={() => setShowPlaylists(true)}>Add to Playlist</li>
                </ul>
            ) : (
                // "Add to Playlist" Submenu
                <div>
                    <div className="menu-header">
                        <button onClick={() => setShowPlaylists(false)}>←</button>
                        <span>Add to Playlist</span>
                    </div>
                    <ul>
                        {userPlaylists.length > 0 ? (
                            userPlaylists.map(playlist => (
                                <li key={playlist.id} onClick={() => handleAddToPlaylistClick(playlist.id)}>
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