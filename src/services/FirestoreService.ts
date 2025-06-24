import {
    doc,
    setDoc,
    getDoc,
    deleteDoc,
    collection,
    getDocs,
    Timestamp,
    query,
    orderBy,
    limit,
} from 'firebase/firestore';
import { db } from '../firebase'; // Your initialized firestore instance
import { JamendoTrack } from './JamendoService';

// Path constants for our collections to avoid typos
const USERS_COLLECTION = 'users';
const LIKED_TRACKS_SUBCOLLECTION = 'likedTracks';

/**
 * Likes a track for a given user.
 * Stores the track ID and a timestamp in a subcollection under the user's document.
 */
export const likeTrack = async (userId: string, track: JamendoTrack): Promise<void> => {
    try {
        // Create a reference to the specific document for this track in the user's 'likedTracks' subcollection
        const trackRef = doc(db, USERS_COLLECTION, userId, LIKED_TRACKS_SUBCOLLECTION, track.id);
        
        // Use setDoc to create the document. We store a subset of data.
        // Storing the full track object is okay for small scale, but for larger scale,
        // you might only store the ID and fetch details from Jamendo when needed.
        // For simplicity and better UX, we'll store the necessary display data here.
        await setDoc(trackRef, {
            id: track.id,
            name: track.name,
            artist_name: track.artist_name,
            image: track.image,
            audio: track.audio,
            duration: track.duration,
            album_name: track.album_name,
            likedAt: Timestamp.now() // Store when the track was liked
        });
        console.log(`Track ${track.id} liked for user ${userId}`);
    } catch (error) {
        console.error("Error liking track:", error);
        throw new Error("Could not like the track.");
    }
};

/**
 * Unlikes a track for a given user by deleting its document.
 */
export const unlikeTrack = async (userId: string, trackId: string): Promise<void> => {
    try {
        const trackRef = doc(db, USERS_COLLECTION, userId, LIKED_TRACKS_SUBCOLLECTION, trackId);
        await deleteDoc(trackRef);
        console.log(`Track ${trackId} unliked for user ${userId}`);
    } catch (error) {
        console.error("Error unliking track:", error);
        throw new Error("Could not unlike the track.");
    }
};

/**
 * Checks if a specific track is liked by the user.
 * Returns true if the document exists, false otherwise.
 */
export const isTrackLiked = async (userId: string, trackId: string): Promise<boolean> => {
    try {
        const trackRef = doc(db, USERS_COLLECTION, userId, LIKED_TRACKS_SUBCOLLECTION, trackId);
        const docSnap = await getDoc(trackRef);
        return docSnap.exists();
    } catch (error) {
        console.error("Error checking if track is liked:", error);
        // In case of error, assume not liked to prevent UI confusion
        return false; 
    }
};

/**
 * Fetches all liked tracks for a given user.
 * Returns an array of JamendoTrack objects.
 */
export const getLikedTracks = async (userId: string): Promise<JamendoTrack[]> => {
    try {
        // Create a reference to the user's 'likedTracks' subcollection
        const likedTracksCollectionRef = collection(db, USERS_COLLECTION, userId, LIKED_TRACKS_SUBCOLLECTION);

        // Create a query to order tracks by when they were liked, most recent first
        const q = query(likedTracksCollectionRef, orderBy("likedAt", "desc"), limit(100)); // Add a limit for safety

        const querySnapshot = await getDocs(q);
        
        const likedTracks: JamendoTrack[] = [];
        querySnapshot.forEach((doc) => {
            // doc.data() is never undefined for query doc snapshots
            const data = doc.data();
            // We can cast here because we know the structure we saved
            likedTracks.push(data as JamendoTrack);
        });

        console.log(`Fetched ${likedTracks.length} liked tracks for user ${userId}`);
        return likedTracks;

    } catch (error) {
        console.error("Error fetching liked tracks:", error);
        throw new Error("Could not fetch liked tracks.");
    }
};