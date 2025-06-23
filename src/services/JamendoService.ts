const JAMENDO_CLIENT_ID = import.meta.env.VITE_JAMENDO_CLIENT_ID;
const API_BASE_URL = 'https://api.jamendo.com/v3.0';

export interface JamendoTrack {
    id: string;
    name: string;
    artist_name: string;
    album_name: string;
    image: string;
    audio: string;
    duration: number;
}

interface JamendoApiResponse {
    headers: {
        status: string;
        code: number;
        error_message?: string;
        warnings?: string;
    };
    results: JamendoTrack[];
}

const checkClientId = () => {
    if (!JAMENDO_CLIENT_ID) {
        const errorMessage = "Jamendo Client ID is not configured. Please set VITE_JAMENDO_CLIENT_ID in your .env file.";
        console.error(errorMessage);
        throw new Error(errorMessage);
    }
};

const handleApiResponse = async (response: Response): Promise<JamendoApiResponse> => {
    if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
            const errorData = await response.json();
            if (errorData && errorData.headers && errorData.headers.error_message) {
                errorMessage = `Jamendo API Error: ${errorData.headers.error_message} (Code: ${errorData.headers.code})`;
            }
        } catch { /* Ignore if error response is not JSON */ }
        throw new Error(errorMessage);
    }

    const data: JamendoApiResponse = await response.json();
    if (data.headers.status !== 'success') {
        throw new Error(`Jamendo API Error: ${data.headers.error_message || 'Unknown API error'} (Code: ${data.headers.code})`);
    }
    return data;
};


export const fetchPopularTracks = async (limit: number = 15): Promise<JamendoTrack[]> => {
    checkClientId();
    try {
        const params = new URLSearchParams({
            client_id: JAMENDO_CLIENT_ID!,
            format: 'json',
            limit: limit.toString(),
            order: 'popularity_week',
            include: 'musicinfo',
            image_size: '200', // Request a decent image size
        });
        const response = await fetch(`${API_BASE_URL}/tracks/?${params.toString()}`);
        const data = await handleApiResponse(response);
        return data.results;
    } catch (error) {
        console.error("Failed to fetch popular tracks from Jamendo:", error);
        throw error;
    }
};

// --- NEW FUNCTION ---
export const searchTracks = async (query: string, limit: number = 15): Promise<JamendoTrack[]> => {
    checkClientId();
    if (!query.trim()) {
        return []; // Return empty if query is empty or just whitespace
    }
    try {
        const params = new URLSearchParams({
            client_id: JAMENDO_CLIENT_ID!,
            format: 'json',
            limit: limit.toString(),
            namesearch: query.trim(), // Use namesearch for general track/artist/album search
            include: 'musicinfo',
            image_size: '200',
        });
        const response = await fetch(`${API_BASE_URL}/tracks/?${params.toString()}`);
        const data = await handleApiResponse(response);
        return data.results;
    } catch (error) {
        console.error(`Failed to search tracks for query "${query}":`, error);
        throw error;
    }
};