import React from 'react';
import { JamendoTrack } from '../services/JamendoService';
import './TrackItem.css'; // Make sure this CSS file is linked and correct

interface TrackItemProps {
    track: JamendoTrack;
    onPlay: (track: JamendoTrack) => void;
    onAddToQueue: (track: JamendoTrack) => void;
    isPlayingCurrent: boolean;
}

const TrackItem: React.FC<TrackItemProps> = ({ track, onPlay, onAddToQueue, isPlayingCurrent }) => {
    const handlePlayClick = () => {
        onPlay(track);
    };

    const handleAddToQueueClick = (e: React.MouseEvent) => {
        // Stop the click from bubbling up to the parent li's onClick handler
        e.stopPropagation(); 
        onAddToQueue(track);
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
            {/* Main clickable area for playing the track */}
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

            {/* Separate section for metadata and the action button */}
            <div className="track-item-meta">
                <span className="track-item-duration">{formatDuration(track.duration)}</span>
                
                {/* The "Add to Queue" button with its own isolated onClick handler */}
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