import React from 'react';
import { JamendoTrack } from '../services/JamendoService';
import TrackItem from './TrackItem';
import './TrackList.css';

interface TrackListProps {
    tracks: JamendoTrack[];
    isLoading: boolean;
    error: string | null;
    onPlayList: (tracks: JamendoTrack[], startIndex: number) => void;
    onAddToQueue: (track: JamendoTrack) => void;
    onAddToPlaylist: (playlistId: string, track: JamendoTrack) => void;
    onRemoveFromPlaylist?: (playlistId: string, trackId: string) => void;
    currentPlaylistId?: string | null;
    currentPlayingTrackId: string | null;
    title: string;
    isSearch?: boolean;
}

const TrackList: React.FC<TrackListProps> = ({
    tracks, isLoading, error, onPlayList, onAddToQueue, onAddToPlaylist, 
    onRemoveFromPlaylist,
    currentPlaylistId,
    currentPlayingTrackId, title, isSearch
}) => {
    if (isLoading) return <div className="tracklist-container"><h2 className="tracklist-title">{title}</h2><div className="tracklist-status">Loading...</div></div>;
    if (error) return <div className="tracklist-container"><h2 className="tracklist-title">{title}</h2><div className="tracklist-status error">Error: {error}</div></div>;
    
    if (!tracks || tracks.length === 0) {
        let message = "This list is currently empty.";
        if (isSearch) message = title.toLowerCase().startsWith("results for") ? "No tracks found for your search." : "Use the search bar above to find music.";
        else if (title === "Liked Songs") message = "You haven't liked any songs yet. Click the heart on a track to save it here.";
        return <div className="tracklist-container"><h2 className="tracklist-title">{title}</h2><div className="tracklist-status">{message}</div></div>;
    }

    const handleTrackPlay = (index: number) => {
        onPlayList(tracks, index);
    };

    return (
        <div className="tracklist-container">
            <h2 className="tracklist-title">{title}</h2>
            <ul className="tracklist-ul">
                {tracks.map((track, index) => (
                    <TrackItem
                        key={`${track.id}-${index}`}
                        track={track}
                        onPlay={() => handleTrackPlay(index)}
                        onAddToQueue={onAddToQueue}
                        onAddToPlaylist={onAddToPlaylist}
                        onRemoveFromPlaylist={onRemoveFromPlaylist}
                        currentPlaylistId={currentPlaylistId}
                        isPlayingCurrent={track.id === currentPlayingTrackId}
                    />
                ))}
            </ul>
        </div>
    );
};

export default TrackList;