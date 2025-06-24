import React from 'react';
import { JamendoTrack } from '../services/JamendoService';
import { useLikedTracks } from '../hooks/useLikedTracks'; // Import the new hook
import './TrackItem.css';

interface TrackItemProps {
    track: JamendoTrack;
    onPlay: (track: JamendoTrack) => void;
    onAddToQueue: (track: JamendoTrack) => void;
    isPlayingCurrent: boolean;
}

const TrackItem: React.FC<TrackItemProps> = ({ track, onPlay, onAddToQueue, isPlayingCurrent }) => {
    const { isLiked, toggleLike } = useLikedTracks(track.id); // Use the hook for this specific track

    const handlePlayClick = () => {
        onPlay(track);
    };

    const handleAddToQueueClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onAddToQueue(track);
    };

    const handleLikeClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        toggleLike(track); // Call the toggle function from our hook
    };

    const formatDuration = (seconds: number): string => {
        if (isNaN(seconds) || seconds < 0) return "0:00";
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    };

    const listItemClass = `track-item-li ${isPlayingCurrent ? 'currently-playing-item' : ''}`;

    return (
        <li className={listItemClass}>
            <div className="track-item-main-content" onClick={handlePlayClick} title={`Play ${track.name}`}>
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
                    {/* Heart SVG */}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                </button>

                <span className="track-item-duration">{formatDuration(track.duration)}</span>
                
                {/* Add to Queue Button */}
                <button
                    onClick={handleAddToQueueClick}
                    className="track-item-action-button add-to-queue-button"
                    title="Add to Queue"
                    aria-label={`Add ${track.name || 'track'} to queue`}
                >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <path d="M14 7H9V2C9 1.44772 8.55228 1 8 1C7.44772 1 7 1.44772 7 2V7H2C1.44772 7 1 7.44772 1 8C1 8.55228 1.44772 9 2 9H7V14C7 14.5523 7.44772 15 8 15C8.55228 15 9 14.5523 9 14V9H14C14.5523 9 15 8.55228 15 8C15 7.44772 14.5523 7 14 7Z"/>
                    </svg>
                </button>
            </div>
        </li>
    );
};

export default TrackItem;