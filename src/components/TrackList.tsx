import React from 'react';
import { JamendoTrack } from '../services/JamendoService';
import TrackItem from './TrackItem';
import './TrackList.css'; // Ensure this CSS file exists and is correctly linked

interface TrackListProps {
    tracks: JamendoTrack[];
    isLoading: boolean;
    error: string | null;
    onTrackSelect: (track: JamendoTrack) => void;
    onAddToQueue: (track: JamendoTrack) => void;
    currentPlayingTrackId: string | null;
    title: string;
    isSearch?: boolean;
}

const TrackList: React.FC<TrackListProps> = ({
    tracks,
    isLoading,
    error,
    onTrackSelect,
    onAddToQueue,
    currentPlayingTrackId,
    title,
    isSearch
}) => {
    if (isLoading) {
        return <div className="tracklist-status">Loading {title ? title.toLowerCase() : 'tracks'}...</div>;
    }

    if (error) {
        return <div className="tracklist-status error">Error: {error}</div>;
    }

    // Improved message for no tracks found, especially for search
    if (!tracks || tracks.length === 0) {
        let message = "No tracks available at the moment.";
        if (isSearch) {
            if (title && title.toLowerCase().startsWith("results for") && title.length > "results for \"\"".length) {
                // If title indicates a search was performed (e.g., "Results for 'rock'")
                message = `No tracks found for your search.`;
            } else if (title && title.toLowerCase() === "search for music") {
                // If it's the initial search page before any search
                message = "Use the search bar above to find music.";
            } else {
                // Generic search empty state if title isn't specific
                message = "No tracks found.";
            }
        }
        return <div className="tracklist-status">{message}</div>;
    }

    return (
        <div className="tracklist-container">
            <h2 className="tracklist-title">{title}</h2>
            <ul className="tracklist-ul">
                {tracks.map((track) => (
                    <TrackItem
                        key={track.id}
                        track={track}
                        onPlay={onTrackSelect}
                        onAddToQueue={onAddToQueue}
                        isPlayingCurrent={track.id === currentPlayingTrackId}
                    />
                ))}
            </ul>
        </div>
    );
};

export default TrackList;