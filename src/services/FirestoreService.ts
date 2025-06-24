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
    addDoc,
    where,
    updateDoc,
    arrayUnion,
    arrayRemove,
} from 'firebase/firestore';
import { db } from '../firebase'; // Your initialized firestore instance
import { JamendoTrack } from './JamendoService';

// --- INTERFACES ---
export interface Playlist {
    id: string; // Document ID
    name: string;
    userId: string;
    createdAt: Timestamp;
    trackIds: string[]; // Store only the IDs of the tracks
}

// --- PATH CONSTANTS ---
const USERS_COLLECTION = 'users';
const LIKED_TRACKS_SUBCOLLECTION = 'likedTracks';
const PLAYLISTS_COLLECTION = 'playlists';


/**
 * Renames a specific playlist.
 */
export const renamePlaylist = async (
  playlistId: string,
  newName: string
): Promise<void> => {
  try {
    const playlistRef = doc(db, PLAYLISTS_COLLECTION, playlistId);
    await updateDoc(playlistRef, {
      name: newName,
    });
    console.log(`Playlist ${playlistId} renamed to "${newName}"`);
  } catch (error) {
    console.error("Error renaming playlist:", error);
    throw new Error("Could not rename the playlist.");
  }
};

// --- LIKED SONGS FUNCTIONS (EXISTING) ---
export const likeTrack = async (userId: string, track: JamendoTrack): Promise<void> => {
    try {
        const trackRef = doc(db, USERS_COLLECTION, userId, LIKED_TRACKS_SUBCOLLECTION, track.id);
        await setDoc(trackRef, { ...track, likedAt: Timestamp.now() });
    } catch (error) {
        console.error("Error liking track:", error);
        throw new Error("Could not like the track.");
    }
};

export const unlikeTrack = async (userId: string, trackId: string): Promise<void> => {
    try {
        const trackRef = doc(db, USERS_COLLECTION, userId, LIKED_TRACKS_SUBCOLLECTION, trackId);
        await deleteDoc(trackRef);
    } catch (error) {
        console.error("Error unliking track:", error);
        throw new Error("Could not unlike the track.");
    }
};

export const isTrackLiked = async (userId: string, trackId: string): Promise<boolean> => {
    try {
        const trackRef = doc(db, USERS_COLLECTION, userId, LIKED_TRACKS_SUBCOLLECTION, trackId);
        const docSnap = await getDoc(trackRef);
        return docSnap.exists();
    } catch (error) {
        console.error("Error checking if track is liked:", error);
        return false;
    }
};

export const getLikedTracks = async (userId: string): Promise<JamendoTrack[]> => {
    try {
        const likedTracksCollectionRef = collection(db, USERS_COLLECTION, userId, LIKED_TRACKS_SUBCOLLECTION);
        const q = query(likedTracksCollectionRef, orderBy("likedAt", "desc"), limit(100));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => doc.data() as JamendoTrack);
    } catch (error) {
        console.error("Error fetching liked tracks:", error);
        throw new Error("Could not fetch liked tracks.");
    }
};


// --- NEW PLAYLIST FUNCTIONS ---

/**
 * Creates a new playlist for a given user.
 */
export const createPlaylist = async (userId: string, name: string): Promise<string> => {
    try {
        const playlistsCollectionRef = collection(db, PLAYLISTS_COLLECTION);
        const newPlaylistDoc = await addDoc(playlistsCollectionRef, {
            name,
            userId,
            createdAt: Timestamp.now(),
            trackIds: [] // Start with an empty array of track IDs
        });
        console.log(`Playlist created with ID: ${newPlaylistDoc.id}`);
        return newPlaylistDoc.id; // Return the ID of the new playlist
    } catch (error) {
        console.error("Error creating playlist:", error);
        throw new Error("Could not create the playlist.");
    }
};

/**
 * Fetches all playlists created by a specific user.
 */
export const getUserPlaylists = async (userId: string): Promise<Playlist[]> => {
    try {
        const playlistsCollectionRef = collection(db, PLAYLISTS_COLLECTION);
        const q = query(
            playlistsCollectionRef,
            where("userId", "==", userId),
            orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Playlist));
    } catch (error) {
        console.error("Error fetching user playlists:", error);
        throw new Error("Could not fetch user playlists.");
    }
};

/**
 * Adds a track to a specific playlist.
 * It's crucial to also store the full track data for later retrieval without calling Jamendo.
 * We'll store it in a subcollection of the playlist.
 */
export const addTrackToPlaylist = async (playlistId: string, track: JamendoTrack): Promise<void> => {
    try {
        // Step 1: Add the track's ID to the trackIds array in the main playlist document
        const playlistRef = doc(db, PLAYLISTS_COLLECTION, playlistId);
        await updateDoc(playlistRef, {
            trackIds: arrayUnion(track.id)
        });

        // Step 2: Store the full track details in a subcollection for easy retrieval
        // This avoids having to call the Jamendo API every time we view a playlist.
        const trackInPlaylistRef = doc(db, PLAYLISTS_COLLECTION, playlistId, 'tracks', track.id);
        await setDoc(trackInPlaylistRef, {
            ...track,
            addedAt: Timestamp.now()
        });
        console.log(`Track ${track.id} added to playlist ${playlistId}`);
    } catch (error) {
        console.error("Error adding track to playlist:", error);
        throw new Error("Could not add track to playlist.");
    }
};


/**
 * Fetches the full track objects for a given playlist.
 */
export const getTracksForPlaylist = async (playlistId: string): Promise<JamendoTrack[]> => {
    try {
        // Fetch tracks from the subcollection
        const tracksCollectionRef = collection(db, PLAYLISTS_COLLECTION, playlistId, 'tracks');
        const q = query(tracksCollectionRef, orderBy("addedAt", "asc")); // Oldest added first
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => doc.data() as JamendoTrack);
    } catch (error) {
        console.error(`Error fetching tracks for playlist ${playlistId}:`, error);
        throw new Error("Could not fetch tracks for this playlist.");
    }
};


/**
 * Deletes a playlist document.
 * Note: This does NOT delete the subcollection of tracks within it.
 */
export const deletePlaylist = async (playlistId: string): Promise<void> => {
    try {
        const playlistRef = doc(db, PLAYLISTS_COLLECTION, playlistId);
        await deleteDoc(playlistRef);
        console.log(`Playlist ${playlistId} deleted successfully.`);
    } catch (error) {
        console.error("Error deleting playlist:", error);
        throw new Error("Could not delete the playlist.");
    }
};

/**
 * Removes a track from a specific playlist.
 */
export const removeTrackFromPlaylist = async (playlistId: string, trackId: string): Promise<void> => {
    try {
        // Step 1: Remove the track ID from the trackIds array in the main playlist document
        const playlistRef = doc(db, PLAYLISTS_COLLECTION, playlistId);
        await updateDoc(playlistRef, {
            trackIds: arrayRemove(trackId)
        });

        // Step 2: Delete the track's data from the subcollection
        const trackInPlaylistRef = doc(db, PLAYLISTS_COLLECTION, playlistId, 'tracks', trackId);
        await deleteDoc(trackInPlaylistRef);
        console.log(`Track ${trackId} removed from playlist ${playlistId}`);
    } catch (error) {
        console.error("Error removing track from playlist:", error);
        throw new Error("Could not remove track from playlist.");
    }
};