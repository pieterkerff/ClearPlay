import React from 'react';
import { JamendoTrack } from '../../services/JamendoService';
import './PlayerBar.css';

interface PlayerBarProps {
    currentTrack: JamendoTrack | null;
    audioRef: React.RefObject<HTMLAudioElement | null>
    onTrackEnd: () => void;
    onPlayNext: () => void; // New prop
    onPlayPrevious: () => void; // New prop
    canPlayNext: boolean; // New prop
    canPlayPrevious: boolean; // New prop
}

const PlayerBar: React.FC<PlayerBarProps> = ({
    currentTrack,
    audioRef,
    onTrackEnd,
    onPlayNext,
    onPlayPrevious,
    canPlayNext,
    canPlayPrevious
}) => {
    if (!currentTrack) {
        return (
            <footer className="App-player-bar empty-player">
                <div className="player-placeholder-text">No track selected</div>
            </footer>
        );
    }

    return (
        <footer className="App-player-bar">
            <div className="player-track-info">
                {currentTrack.image && (
                    <img
                        src={currentTrack.image}
                        alt={currentTrack.album_name || currentTrack.name}
                        className="player-album-art"
                    />
                )}
                <div className="player-text-details">
                    <strong className="player-track-name">{currentTrack.name}</strong>
                    <span className="player-artist-name">{currentTrack.artist_name}</span>
                </div>
            </div>

            <div className="player-controls-wrapper">
                 {/* Previous Button - very basic */}
                <button
                    onClick={onPlayPrevious}
                    disabled={!canPlayPrevious}
                    className="player-nav-button"
                    title="Previous Track"
                >
                    {'<'}
                </button>

                <audio ref={audioRef} controls onEnded={onTrackEnd} className="custom-audio-controls">
                    Your browser does not support the audio element.
                </audio>

                {/* Next Button - very basic */}
                <button
                    onClick={onPlayNext}
                    disabled={!canPlayNext}
                    className="player-nav-button"
                    title="Next Track"
                >
                    {'>'}
                </button>
            </div>

            <div className="player-options">
                {/* Placeholder for volume, etc. */}
            </div>
        </footer>
    );
};

export default PlayerBar;