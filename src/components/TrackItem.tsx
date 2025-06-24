import React, { useState } from 'react';
import { JamendoTrack } from '../services/JamendoService';
import { useLikedTracks } from '../hooks/useLikedTracks';
import TrackActionsMenu from './TrackActionsMenu'; // Import the new menu
import './TrackItem.css';

interface TrackItemProps {
    track: JamendoTrack;
    onPlay: () => void;
    onAddToQueue: (track: JamendoTrack) => void; // Add prop back
    onAddToPlaylist: (playlistId: string, track: JamendoTrack) => void; // Add prop
    isPlayingCurrent: boolean;
}

const TrackItem: React.FC<TrackItemProps> = ({ track, onPlay, onAddToQueue, onAddToPlaylist, isPlayingCurrent }) => {
    const { isLiked, toggleLike } = useLikedTracks(track.id);
    const [menuOpen, setMenuOpen] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

    const handleLikeClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        toggleLike(track);
    };

    const handleMoreOptionsClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        setMenuPosition({
            top: rect.bottom + window.scrollY,
            left: rect.left + window.scrollX - 160, // Position menu to the left of button
        });
        setMenuOpen(true);
    };

    const formatDuration = (seconds: number): string => {
        if (isNaN(seconds) || seconds < 0) return "0:00";
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    };

    const listItemClass = `track-item-li ${isPlayingCurrent ? 'currently-playing-item' : ''}`;

    return (
        <li className={listItemClass} onClick={onPlay} title={`Play ${track.name}`}>
            <div className="track-item-main-content">
                <div className="track-item-image-container">
                    <img src={track.image} alt={track.album_name || 'Album art'} className="track-item-image" />
                    <div className="play-icon-overlay">▶</div>
                </div>
                <div className="track-item-details">
                    <strong className="track-item-name">{track.name}</strong>
                    <p className="track-item-artist">{track.artist_name}</p>
                </div>
            </div>
            <div className="track-item-meta">
                <button
                    onClick={handleLikeClick}
                    className={`track-item-action-button like-button ${isLiked ? 'liked' : ''}`}
                    title={isLiked ? "Unlike" : "Like"}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                </button>

                <span className="track-item-duration">{formatDuration(track.duration)}</span>
                
                <button
                    onClick={handleMoreOptionsClick}
                    className="track-item-action-button more-options-button"
                    title="More options"
                >
                    {/* "..." icon */}
                    •••
                </button>

                {menuOpen && (
                    <div style={{ position: 'fixed', top: menuPosition.top, left: menuPosition.left }}>
                        <TrackActionsMenu 
                            track={track} 
                            onClose={() => setMenuOpen(false)} 
                            onAddToQueue={onAddToQueue}
                            onAddToPlaylist={onAddToPlaylist}
                        />
                    </div>
                )}
            </div>
        </li>
    );
};

export default TrackItem;