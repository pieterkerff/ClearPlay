import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { isTrackLiked, likeTrack, unlikeTrack } from '../services/FirestoreService';
import { JamendoTrack } from '../services/JamendoService';

export const useLikedTracks = (trackId: string | null) => {
    const { currentUser } = useAuth();
    const [isLiked, setIsLiked] = useState(false);
    const [loading, setLoading] = useState(true);

    // useEffect for initial check remains the same - it's perfect.
    useEffect(() => {
        if (!currentUser || !trackId) {
            setIsLiked(false);
            setLoading(false);
            return;
        }

        let isMounted = true;
        setLoading(true);

        const checkStatus = async () => {
            try {
                const status = await isTrackLiked(currentUser.uid, trackId);
                if (isMounted) setIsLiked(status);
            } catch (error) {
                console.error("Error checking like status:", error);
                if (isMounted) setIsLiked(false);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        checkStatus();

        return () => { isMounted = false; };
    }, [currentUser, trackId]);

    // Revised toggleLike function
    const toggleLike = useCallback(async (track: JamendoTrack) => {
        if (!currentUser || !track) return;
        
        // This is the main change. We use the functional update form.
        // It guarantees we get the most recent 'prevState'.
        setIsLiked(prevState => {
            const newState = !prevState;
            
            // Perform the async operation based on the new state
            (async () => {
                try {
                    if (newState) {
                        // The new state is 'liked', so call likeTrack
                        await likeTrack(currentUser.uid, track);
                    } else {
                        // The new state is 'unliked', so call unlikeTrack
                        await unlikeTrack(currentUser.uid, track.id);
                    }
                } catch (error) {
                    console.error("Failed to toggle like status:", error);
                    // On error, revert to the original state
                    setIsLiked(prevState);
                }
            })();

            // Return the new state for the optimistic update
            return newState;
        });

    }, [currentUser]); // Now, the only dependency is currentUser.

    return { isLiked, toggleLike, loading };
};