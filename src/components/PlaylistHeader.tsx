// src/components/PlaylistHeader.tsx
import React from 'react';
import './PlaylistHeader.css';

interface PlaylistHeaderProps {
    playlistName: string;
    trackCount: number;
    onDeletePlaylist: () => void;
    // MODIFIED: This prop now directly triggers the toast UI in App.tsx
    // The responsibility of getting the new name is moved to App.tsx via the toast form.
    onRenamePlaylist: () => void;
}

const PlaylistHeader: React.FC<PlaylistHeaderProps> = ({
    playlistName,
    trackCount,
    onDeletePlaylist,
    onRenamePlaylist // This is the prop passed from App.tsx (e.g., promptRenamePlaylist)
}) => {

    // The handleRenameClick simply calls the onRenamePlaylist prop.
    // The prompt() logic is removed from here.
    const handleRenameClick = () => {
        onRenamePlaylist(); // This will now trigger the toast form configured in App.tsx
    };

    return (
        <div className="playlist-header-container">
            <div className="playlist-header-details">
                <span className="playlist-header-type">PLAYLIST</span>
                <h1 className="playlist-header-title">{playlistName}</h1>
                <p className="playlist-header-meta">{trackCount} {trackCount === 1 ? 'song' : 'songs'}</p>
            </div>
            <div className="playlist-header-actions">
                <button
                    onClick={handleRenameClick} // This now calls the App.tsx function to show the toast
                    className="playlist-action-button rename-playlist-button"
                    title="Rename this playlist"
                >
                    Rename
                </button>
                <button
                    onClick={onDeletePlaylist}
                    className="playlist-action-button delete-playlist-button"
                    title="Delete this playlist"
                >
                    Delete
                </button>
            </div>
        </div>
    );
};

export default PlaylistHeader;