// src/services/JamendoService.ts
const JAMENDO_CLIENT_ID = import.meta.env.VITE_JAMENDO_CLIENT_ID;
const API_BASE_URL = 'https://api.jamendo.com/v3.0';

// --- INTERFACES ---
export interface JamendoTrack {
    id: string;
    name: string;
    artist_name: string;
    album_name: string;
    image: string;
    audio: string;
    duration: number;
    // Add any other track properties you might need
}

export interface JamendoArtist {
    id: string;
    name: string;
    website: string; // Example property
    image: string;
    joindate: string; // Example property
    // Add any other artist properties you might need
}

export interface JamendoAlbum {
    id: string;
    name: string;
    artist_id: string;
    artist_name: string;
    image: string;
    releasedate: string; // Example property
    zip: string; // Link to download album
    // Add any other album properties you might need
}

// For the combined search function
export interface AllSearchResults {
    tracks: JamendoTrack[];
    artists: JamendoArtist[];
    albums: JamendoAlbum[];
}

interface JamendoApiResponseHeader {
    status: string;
    code: number;
    error_message?: string;
    warnings?: string;
    results_count?: number; // Might be present
}

// Generic API Response structure
interface JamendoApiResponse<T> {
    headers: JamendoApiResponseHeader;
    results: T[];
}

// --- HELPER FUNCTIONS ---
const checkClientId = () => {
    if (!JAMENDO_CLIENT_ID) {
        const errorMessage = "Jamendo Client ID is not configured. Please set VITE_JAMENDO_CLIENT_ID in your .env file.";
        console.error(errorMessage);
        throw new Error(errorMessage);
    }
};

const handleApiResponse = async <T>(response: Response): Promise<JamendoApiResponse<T>> => {
    if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
            const errorData = await response.json(); // Try to parse error response
            if (errorData && errorData.headers && errorData.headers.error_message) {
                errorMessage = `Jamendo API Error: ${errorData.headers.error_message} (Code: ${errorData.headers.code})`;
            }
        } catch { /* Ignore if error response is not JSON or parsing fails */ }
        throw new Error(errorMessage);
    }

    const data: JamendoApiResponse<T> = await response.json();
    if (data.headers.status !== 'success') {
        throw new Error(`Jamendo API Error: ${data.headers.error_message || 'Unknown API error'} (Code: ${data.headers.code})`);
    }
    return data;
};


// --- SEARCH FUNCTIONS ---
export const searchTracks = async (query: string, limit: number = 10): Promise<JamendoTrack[]> => {
    checkClientId();
    if (!query.trim()) return [];
    try {
        const params = new URLSearchParams({
            client_id: JAMENDO_CLIENT_ID!,
            format: 'json',
            limit: limit.toString(),
            namesearch: query.trim(),
            include: 'musicinfo', // For tracks, musicinfo is useful
            image_size: '200',
            order: 'popularity_total', // Or 'popularity_week'
        });
        const response = await fetch(`${API_BASE_URL}/tracks/?${params.toString()}`);
        const data = await handleApiResponse<JamendoTrack>(response);
        return data.results;
    } catch (error) {
        console.error(`Failed to search tracks for query "${query}":`, error);
        throw error;
    }
};

export const searchArtists = async (query: string, limit: number = 5): Promise<JamendoArtist[]> => {
    checkClientId();
    if (!query.trim()) return [];
    try {
        const params = new URLSearchParams({
            client_id: JAMENDO_CLIENT_ID!,
            format: 'json',
            limit: limit.toString(),
            namesearch: query.trim(),
            image_size: '200',
            order: 'popularity_total', // NEW - Choose a valid option, e.g., 'popularity_total', 'name', 'popularity_week'
        });
        const url = `${API_BASE_URL}/artists/?${params.toString()}`;
        console.log("[JamendoService/searchArtists] Fetching URL:", url);
        const response = await fetch(url);
        const data = await handleApiResponse<JamendoArtist>(response);
        return data.results;
    } catch (error) {
        console.error(`Failed to search artists for query "${query}":`, error);
        throw error; // Re-throw so Promise.allSettled in searchAllTypes sees it as rejected
    }
};

export const searchAlbums = async (query: string, limit: number = 5): Promise<JamendoAlbum[]> => {
    checkClientId();
    if (!query.trim()) return [];
    try {
        const params = new URLSearchParams({
            client_id: JAMENDO_CLIENT_ID!,
            format: 'json',
            limit: limit.toString(),
            namesearch: query.trim(),
            image_size: '200', // Adjust as needed for album art
            order: 'popularity_total', // Or 'releasedate_desc'
        });
        const response = await fetch(`${API_BASE_URL}/albums/?${params.toString()}`);
        const data = await handleApiResponse<JamendoAlbum>(response);
        return data.results;
    } catch (error) {
        console.error(`Failed to search albums for query "${query}":`, error);
        throw error;
    }
};

export const searchAllTypes = async (
    query: string,
    limits = { tracks: 10, artists: 5, albums: 5 }
): Promise<AllSearchResults> => {
    if (!query.trim()) return { tracks: [], artists: [], albums: [] };

    checkClientId();
    // Use Promise.allSettled to ensure all requests complete, even if some fail
    const results = await Promise.allSettled([
        searchTracks(query, limits.tracks),
        searchArtists(query, limits.artists),
        searchAlbums(query, limits.albums)
    ]);

    const tracks = results[0].status === 'fulfilled' ? results[0].value : [];
    const artists = results[1].status === 'fulfilled' ? results[1].value : [];
    const albums = results[2].status === 'fulfilled' ? results[2].value : [];

    // Log errors for failed promises
    results.forEach((result, index) => {
        if (result.status === 'rejected') {
            const type = ['tracks', 'artists', 'albums'][index];
            console.error(`Failed to fetch ${type} for query "${query}":`, result.reason);
        }
    });

    // If all promises rejected, you might want to throw an error or handle it specifically
    if (tracks.length === 0 && artists.length === 0 && albums.length === 0 && results.every(r => r.status === 'rejected')) {
        throw new Error(`All search requests failed for query "${query}"`);
    }

    return { tracks, artists, albums };
};


// --- OTHER FUNCTIONS (like fetchPopularTracks) ---
export const fetchPopularTracks = async (limit: number = 20): Promise<JamendoTrack[]> => {
    checkClientId();
    try {
        const params = new URLSearchParams({
            client_id: JAMENDO_CLIENT_ID!,
            format: 'json',
            limit: limit.toString(),
            order: 'popularity_total',
            include: 'musicinfo',
            image_size: '200',
        });
        const response = await fetch(`${API_BASE_URL}/tracks/?${params.toString()}`);
        const data = await handleApiResponse<JamendoTrack>(response);
        return data.results;
    } catch (error) {
        console.error("Failed to fetch popular tracks from Jamendo:", error);
        throw error;
    }
};

export const getTracksByArtistId = async (artistId: string, limit: number = 20): Promise<JamendoTrack[]> => {
    checkClientId();
    if (!artistId) return []; // Or throw an error

    try {
        const params = new URLSearchParams({
            client_id: JAMENDO_CLIENT_ID!,
            format: 'json',
            limit: limit.toString(),
            artist_id: artistId, // Key parameter for filtering by artist
            include: 'musicinfo',
            image_size: '200',
            order: 'popularity_week', // Or 'releasedate_desc', 'name', etc.
        });
        const url = `${API_BASE_URL}/tracks/?${params.toString()}`;
        console.log("[JamendoService/getTracksByArtistId] Fetching URL:", url);
        const response = await fetch(url);
        const data = await handleApiResponse<JamendoTrack>(response);
        console.log(`[JamendoService/getTracksByArtistId] Raw data for artist ${artistId}:`, JSON.stringify(data, null, 2));
        return data.results;
    } catch (error) {
        console.error(`Failed to fetch tracks for artist ID "${artistId}":`, error);
        throw error;
    }
};

export const getTracksByAlbumId = async (albumId: string, limit: number = 20): Promise<JamendoTrack[]> => {
    checkClientId();
    if (!albumId) return []; // Or throw an error

    try {
        const params = new URLSearchParams({
            client_id: JAMENDO_CLIENT_ID!,
            format: 'json',
            limit: limit.toString(),
            album_id: albumId, // Key parameter for filtering by album
            include: 'musicinfo',
            image_size: '200',
            order: 'track_position', // Or 'name', 'releasedate', etc. 'track_position' is good for albums.
        });
        const url = `${API_BASE_URL}/tracks/?${params.toString()}`;
        console.log("[JamendoService/getTracksByAlbumId] Fetching URL:", url);
        const response = await fetch(url);
        const data = await handleApiResponse<JamendoTrack>(response);
        console.log(`[JamendoService/getTracksByAlbumId] Raw data for album ${albumId}:`, JSON.stringify(data, null, 2));
        return data.results;
    } catch (error) {
        console.error(`Failed to fetch tracks for album ID "${albumId}":`, error);
        throw error;
    }
};