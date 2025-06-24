import React from 'react';
import { JamendoTrack } from '../services/JamendoService';
import { useLikedTracks } from '../hooks/useLikedTracks';
import './TrackItem.css';

interface TrackItemProps {
    track: JamendoTrack;
    onPlay: () => void; // A simple function to call when the item is clicked to be played
    isPlayingCurrent: boolean;
}

const TrackItem: React.FC<TrackItemProps> = ({ track, onPlay, isPlayingCurrent }) => {
    // This hook manages the like state for this specific track
    const { isLiked, toggleLike } = useLikedTracks(track.id);

    const handleLikeClick = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent the main onPlay from firing
        toggleLike(track);
    };

    // A small helper to format time from seconds to MM:SS
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
                    <strong className="track-item-name">{track.name || "Unknown Track"}</strong>
                    <p className="track-item-artist">{track.artist_name || "Unknown Artist"}</p>
                </div>
            </div>
            <div className="track-item-meta">
                {/* Like Button */}
                <button
                    onClick={handleLikeClick}
                    className={`track-item-action-button like-button ${isLiked ? 'liked' : ''}`}
                    title={isLiked ? "Unlike" : "Like"}
                    aria-label={isLiked ? `Unlike ${track.name}` : `Like ${track.name}`}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                </button>

                {/* Duration */}
                <span className="track-item-duration">{formatDuration(track.duration)}</span>
                
                {/* 
                  The "Add to Queue" or "Add to Playlist" button was removed for this step
                  to simplify the logic. We will add a "..." context menu here later.
                */}
            </div>
        </li>
    );
};

export default TrackItem;