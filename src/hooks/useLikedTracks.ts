import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { isTrackLiked, likeTrack, unlikeTrack } from '../services/FirestoreService';
import { JamendoTrack } from '../services/JamendoService';

export const useLikedTracks = (trackId: string | null) => {
    const { currentUser } = useAuth();
    const [isLiked, setIsLiked] = useState(false);
    const [loading, setLoading] = useState(true);

    // Check the initial liked status of the track
    useEffect(() => {
        // Don't do anything if there's no user or no track ID provided
        if (!currentUser || !trackId) {
            setIsLiked(false);
            setLoading(false);
            return;
        }

        let isMounted = true; // Avoid state updates on unmounted component
        setLoading(true);

        const checkStatus = async () => {
            const status = await isTrackLiked(currentUser.uid, trackId);
            if (isMounted) {
                setIsLiked(status);
                setLoading(false);
            }
        };

        checkStatus();

        return () => {
            isMounted = false;
        };
    }, [currentUser, trackId]); // Rerun when user or track changes

    // Memoized toggle function to prevent re-creation on every render
    const toggleLike = useCallback(async (track: JamendoTrack) => {
        if (!currentUser || !track) return;
        
        // Immediately update the UI for a responsive feel (optimistic update)
        const previousState = isLiked;
        setIsLiked(!previousState);

        try {
            if (previousState) {
                // If it was liked, unlike it
                await unlikeTrack(currentUser.uid, track.id);
            } else {
                // If it was not liked, like it
                await likeTrack(currentUser.uid, track);
            }
        } catch (error) {
            console.error("Failed to toggle like status:", error);
            // If the database action fails, revert the UI to the previous state
            setIsLiked(previousState);
            // Optionally show an error toast to the user
        }

    }, [currentUser, isLiked]); // Depends on the current user and liked state

    return { isLiked, toggleLike, loading };
};