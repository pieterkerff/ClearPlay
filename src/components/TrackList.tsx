import React from 'react';
import { JamendoTrack } from '../services/JamendoService';
import TrackItem from './TrackItem';
import './TrackList.css';

interface TrackListProps {
    tracks: JamendoTrack[];
    isLoading: boolean;
    error: string | null;
    onPlayList: (tracks: JamendoTrack[], startIndex: number) => void;
    currentPlayingTrackId: string | null;
    title: string;
    isSearch?: boolean;
}

const TrackList: React.FC<TrackListProps> = ({
    tracks,
    isLoading,
    error,
    onPlayList,
    currentPlayingTrackId,
    title,
    isSearch
}) => {
    // --- Render Loading State ---
    if (isLoading) {
        return (
            <div className="tracklist-container">
                <h2 className="tracklist-title">{title}</h2>
                <div className="tracklist-status">Loading...</div>
            </div>
        );
    }

    // --- Render Error State ---
    if (error) {
        return (
            <div className="tracklist-container">
                <h2 className="tracklist-title">{title}</h2>
                <div className="tracklist-status error">Error: {error}</div>
            </div>
        );
    }

    // --- Render Empty State ---
    if (!tracks || tracks.length === 0) {
        let message = "This list is currently empty.";
        if (isSearch) {
             if (title.toLowerCase().startsWith("results for")) {
                message = "No tracks found for your search.";
            } else {
                message = "Use the search bar above to find music.";
            }
        } else if (title === "Liked Songs") {
            message = "You haven't liked any songs yet. Click the heart on a track to save it here.";
        }

        return (
            <div className="tracklist-container">
                <h2 className="tracklist-title">{title}</h2>
                <div className="tracklist-status">{message}</div>
            </div>
        );
    }

    // --- Render Track List ---
    const handleTrackPlay = (index: number) => {
        // This tells App.tsx to set the *entire current list* as the queue
        // and start playing from the selected track's index.
        onPlayList(tracks, index);
    };

    return (
        <div className="tracklist-container">
            <h2 className="tracklist-title">{title}</h2>
            <ul className="tracklist-ul">
                {tracks.map((track, index) => (
                    <TrackItem
                        key={`${track.id}-${index}`} // A more robust key for lists that might contain duplicates
                        track={track}
                        onPlay={() => handleTrackPlay(index)} // Pass a function that knows the index
                        isPlayingCurrent={track.id === currentPlayingTrackId}
                    />
                ))}
            </ul>
        </div>
    );
};

export default TrackList;