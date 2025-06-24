import React from 'react';
import './PlaylistHeader.css'; // This CSS file will now be correct

interface PlaylistHeaderProps {
    playlistName: string;
    trackCount: number;
    onDeletePlaylist: () => void;
    onRenamePlaylist: (newName: string) => void;
}

const PlaylistHeader: React.FC<PlaylistHeaderProps> = ({ 
    playlistName, 
    trackCount, 
    onDeletePlaylist, 
    onRenamePlaylist 
}) => {
    
    const handleDeleteClick = () => {
        if (window.confirm(`Are you sure you want to delete the playlist "${playlistName}"? This cannot be undone.`)) {
            onDeletePlaylist();
        }
    };

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
                    onClick={handleDeleteClick} 
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