import React from 'react';
import './PlaylistHeader.css';

interface PlaylistHeaderProps {
    playlistName: string;
    trackCount: number;
    onDeletePlaylist: () => void;
}

const PlaylistHeader: React.FC<PlaylistHeaderProps> = ({ playlistName, trackCount, onDeletePlaylist }) => {
    
    const handleDeleteClick = () => {
        // Confirm before deleting
        if (window.confirm(`Are you sure you want to delete the playlist "${playlistName}"? This cannot be undone.`)) {
            onDeletePlaylist();
        }
    };

    return (
        <div className="playlist-header-container">
            {/* You could add a placeholder for a playlist image here */}
            <div className="playlist-header-details">
                <span className="playlist-header-type">PLAYLIST</span>
                <h1 className="playlist-header-title">{playlistName}</h1>
                <p className="playlist-header-meta">{trackCount} songs</p>
            </div>
            <div className="playlist-header-actions">
                <button 
                    onClick={handleDeleteClick} 
                    className="delete-playlist-button"
                    title="Delete this playlist"
                >
                    Delete Playlist
                </button>
                {/* A rename button could go here later */}
            </div>
        </div>
    );
};

export default PlaylistHeader;