import React from 'react';
import { JamendoTrack } from '../services/JamendoService';
import TrackItem from './TrackItem';
import './TrackList.css';

export interface TrackListProps {
    tracks: JamendoTrack[];
    isLoading?: boolean;
    error?: string | null;
    onPlayList: (tracks: JamendoTrack[], startIndex?: number) => void;
    onAddToQueue: (track: JamendoTrack) => void;
    onAddToPlaylist: (playlistId: string, track: JamendoTrack) => Promise<void>;
    currentPlayingTrackId: string | null;
    title: string;
    isSearch?: boolean;
}

const TrackList: React.FC<TrackListProps> = ({
    tracks, error, onPlayList, onAddToQueue, onAddToPlaylist, currentPlayingTrackId, title
}) => {
    // ... loading/error/empty logic ...

    const handleTrackPlay = (index: number) => {
        onPlayList(tracks, index);
    };

    return (
        <div className="tracklist-container">
            <h2 className="tracklist-title">{title}</h2>
            {error && <div className="tracklist-error">{error}</div>}
            <ul className="tracklist-ul">
                {tracks.map((track, index) => (
                    <TrackItem
                        key={`${track.id}-${index}`}
                        track={track}
                        onPlay={() => handleTrackPlay(index)}
                        onAddToQueue={onAddToQueue} // Pass it down
                        onAddToPlaylist={onAddToPlaylist} // Pass it down
                        isPlayingCurrent={track.id === currentPlayingTrackId}
                    />
                ))}
            </ul>
        </div>
    );
};

export default TrackList;