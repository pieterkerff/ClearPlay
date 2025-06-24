import React from 'react';
import './PlaylistHeader.css';

interface PlaylistHeaderProps {
    playlistName: string;
    trackCount: number;
    onDeletePlaylist: () => void; // This prop's function is now different (it shows the toast)
    onRenamePlaylist: (newName: string) => void;
}

const PlaylistHeader: React.FC<PlaylistHeaderProps> = ({ playlistName, trackCount, onDeletePlaylist, onRenamePlaylist }) => {
    
    // The handleRenameClick logic remains the same
    const handleRenameClick = () => {
        const newName = prompt("Enter the new name for your playlist:", playlistName);
        if (newName && newName.trim() && newName.trim() !== playlistName) {
            onRenamePlaylist(newName.trim());
        }
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
                    onClick={handleRenameClick} 
                    className="playlist-action-button rename-playlist-button"
                    title="Rename this playlist"
                >
                    Rename
                </button>
                <button 
                    // This now just calls the prop directly without a confirm dialog here.
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