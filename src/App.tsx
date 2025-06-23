import { useState, useRef, useEffect, useCallback } from 'react';
import TrackList from './components/TrackList';
import { JamendoTrack, fetchPopularTracks, searchTracks } from './services/JamendoService';
import './App.css';

import { useAuth } from './contexts/AuthContext';
import LoginForm from './components/Auth/LoginForm';
import SignupForm from './components/Auth/SignupForm';

import Sidebar from './components/Layout/SideBar';
import PlayerBar from './components/Layout/PlayerBar';
import SearchInput from './components/Search/SearchInput';

type ActiveView = 'home' | 'search' | 'library';

function App() {
    const { currentUser, loading: authLoading } = useAuth();
    const audioRef = useRef<HTMLAudioElement>(null);

    // --- Player and Queue State ---
    const [currentTrack, setCurrentTrack] = useState<JamendoTrack | null>(null); // The track object currently in the player
    const [queue, setQueue] = useState<JamendoTrack[]>([]);
    const [currentQueueIndex, setCurrentQueueIndex] = useState<number>(-1); // Index in the queue, -1 if not playing from queue

    // --- UI and View State ---
    const [showLoginFormsView, setShowLoginFormsView] = useState(true);
    const [activeView, setActiveView] = useState<ActiveView>('home');
    const [viewTitle, setViewTitle] = useState('Popular Tracks');

    // --- Data Fetching State ---
    const [popularTracks, setPopularTracks] = useState<JamendoTrack[]>([]);
    const [popularLoading, setPopularLoading] = useState<boolean>(true);
    const [popularError, setPopularError] = useState<string | null>(null);

    const [searchQuery, setSearchQuery] = useState<string>('');
    const [submittedQuery, setSubmittedQuery] = useState<string>('');
    const [searchResults, setSearchResults] = useState<JamendoTrack[]>([]);
    const [searchLoading, setSearchLoading] = useState<boolean>(false);
    const [searchError, setSearchError] = useState<string | null>(null);

    // --- Queue Management ---
    const addToQueue = (track: JamendoTrack) => {
        if (!currentUser) return;
        setQueue(prevQueue => {
            // Avoid adding duplicates back-to-back if desired, or allow it
            if (prevQueue.find(t => t.id === track.id)) {
                 // Simple: just add it again. Or you could move existing to end.
                console.log(`${track.name} is already in queue, adding again.`);
            }
            const newQueue = [...prevQueue, track];
            console.log("Track added to queue:", track.name, "New queue:", newQueue.map(t=>t.name));
            // If nothing is playing and player is empty, start playing the new queue
            if (!currentTrack && audioRef.current && newQueue.length === 1) {
                playTrackFromQueue(0, newQueue); // Play the first track if queue was empty
            }
            return newQueue;
        });
        // Optionally show a toast notification "Track added to queue"
    };

    const playTrackFromQueue = useCallback(
        (index: number, q: JamendoTrack[] = queue) => {
            if (!currentUser) return;
            if (index >= 0 && index < q.length) {
                setCurrentQueueIndex(index);
                setCurrentTrack(q[index]); // This will trigger the audio playback useEffect
                console.log("Playing from queue:", q[index].name, "at index:", index);
            } else {
                console.log("Invalid queue index or empty queue for playTrackFromQueue");
                setCurrentTrack(null); // Stop playing if index is out of bounds
                setCurrentQueueIndex(-1);
            }
        },
        [currentUser, queue]
    );

    const playNextInQueue = useCallback(() => {
        if (!currentUser) return;
        console.log("Attempting to play next. Current Index:", currentQueueIndex, "Queue Length:", queue.length);
        if (queue.length > 0) {
            const nextIndex = (currentQueueIndex + 1) % queue.length; // Loop back to start
            playTrackFromQueue(nextIndex);
        } else {
            setCurrentTrack(null); // No more tracks in queue
            setCurrentQueueIndex(-1);
        }
    }, [currentUser, queue, currentQueueIndex, playTrackFromQueue]); // Added playTrackFromQueue to dependencies

    const playPreviousInQueue = useCallback(() => {
        if (!currentUser) return;
        if (queue.length > 0) {
            let prevIndex = currentQueueIndex - 1;
            if (prevIndex < 0) {
                prevIndex = queue.length - 1; // Loop to end
            }
            playTrackFromQueue(prevIndex);
        }
    }, [currentUser, queue, currentQueueIndex, playTrackFromQueue]);


    // --- Track Selection (Play Now) ---
    const handlePlayTrackNow = (track: JamendoTrack) => {
        if (!currentUser) {
            console.log("User not logged in. Cannot select track.");
            return;
        }
        // When playing a track directly, we can choose to:
        // 1. Clear current queue and start a new one with this track
        // 2. Add this track to the beginning of the queue and play it
        // For simplicity, let's go with option 1 (like Spotify often does when you click play on a song in a list)
        const newQueue = [track];
        setQueue(newQueue);
        playTrackFromQueue(0, newQueue);
    };


    const handleTrackEnd = useCallback(() => {
        console.log("Track ended. Playing next in queue.");
        playNextInQueue();
    }, [playNextInQueue]); // Dependency on memoized playNextInQueue

    // --- View Management ---
    const handleChangeView = (view: ActiveView) => {
        setActiveView(view);
        if (view !== 'search') {
            setSubmittedQuery('');
        }
    };

    // --- Data Fetching Effects ---
    useEffect(() => {
        if (activeView === 'home' && currentUser) {
            setViewTitle('Popular Tracks');
            const loadPopular = async () => {
                setPopularLoading(true); setPopularError(null); setPopularTracks([]);
                try {
                    const fetched = await fetchPopularTracks(20);
                    setPopularTracks(fetched);
                } catch (err) { setPopularError(err instanceof Error ? err.message : 'Failed to load.'); }
                finally { setPopularLoading(false); }
            };
            loadPopular();
        } else if (activeView === 'home' && !currentUser) {
            setPopularTracks([]); setPopularLoading(false); setPopularError(null);
        }
    }, [activeView, currentUser]);

    const performSearch = useCallback(async (query: string) => {
        if (!query.trim()) {
            setSearchResults([]); setSearchLoading(false); setSearchError(null); return;
        }
        setSearchLoading(true); setSearchError(null); setSearchResults([]);
        try {
            const results = await searchTracks(query, 20);
            setSearchResults(results);
        } catch (err) { setSearchError(err instanceof Error ? err.message : 'Failed to search.'); }
        finally { setSearchLoading(false); }
    }, []);

    const handleSearchSubmit = (query: string) => {
        setSubmittedQuery(query);
        setSearchQuery(query); // For SearchInput's initialQuery if needed
        if (activeView !== 'search') setActiveView('search');
        performSearch(query);
    };

    useEffect(() => {
        if (activeView === 'search') setViewTitle('Search');
    }, [activeView]);

    // --- Audio Playback Effect ---
    useEffect(() => {
        if (currentUser && currentTrack && audioRef.current) {
            console.log("Audio useEffect: Playing", currentTrack.name);
            audioRef.current.src = currentTrack.audio;
            audioRef.current.load(); // Ensure new src is loaded
            audioRef.current.play().catch(error => console.error("Error playing audio:", error));
        } else if ((!currentTrack || !currentUser) && audioRef.current) {
            console.log("Audio useEffect: Pausing");
            audioRef.current.pause();
            if(!currentUser) setCurrentTrack(null);
        }
    }, [currentTrack, currentUser]); // currentTrack is the key dependency here


    if (authLoading) {
        return <div className="App-loading-container"><h2>Loading Application...</h2></div>;
    }

    const renderMainContent = () => {
        // This function is only called if currentUser exists
        switch (activeView) {
            case 'home':
                return (
                    <TrackList
                        tracks={popularTracks}
                        isLoading={popularLoading}
                        error={popularError}
                        onTrackSelect={handlePlayTrackNow} // Play now clears queue
                        onAddToQueue={addToQueue}
                        currentPlayingTrackId={currentTrack?.id || null}
                        title={viewTitle}
                    />
                );
            case 'search': {
                let searchDisplayTitle = "Search for music";
                if(searchLoading) searchDisplayTitle = `Searching for "${submittedQuery}"...`;
                else if (submittedQuery) {
                    searchDisplayTitle = searchResults.length > 0 ? `Results for "${submittedQuery}"` : `No results for "${submittedQuery}"`;
                }
                return (
                    <>
                        <SearchInput onSearch={handleSearchSubmit} initialQuery={searchQuery} />
                        <TrackList
                            tracks={searchResults}
                            isLoading={searchLoading}
                            error={searchError}
                            onTrackSelect={handlePlayTrackNow} // Play now clears queue
                            onAddToQueue={addToQueue}
                            currentPlayingTrackId={currentTrack?.id || null}
                            title={searchDisplayTitle}
                            isSearch
                        />
                    </>
                );
            }
            case 'library':
                return <div className="view-placeholder"><h2>Your Library (Coming Soon)</h2></div>;
            default:
                return <div className="view-placeholder"><h2>Page Not Found</h2></div>;
        }
    };

    return (
        <div className="App">
            <div className="App-main-content-wrapper">
                <Sidebar activeView={activeView} onSetView={handleChangeView} isLoggedIn={!!currentUser} />
                <main className="App-content-area">
                    {!currentUser ? (
                        <div className="auth-page-container">
                            {showLoginFormsView ? (
                                <>
                                    <LoginForm />
                                    <p className="auth-toggle-text">
                                        Don't have an account?{' '}
                                        <button onClick={() => setShowLoginFormsView(false)} className="toggle-auth-link">
                                            Sign Up
                                        </button>
                                    </p>
                                </>
                            ) : (
                                <>
                                    <SignupForm />
                                    <p className="auth-toggle-text">
                                        Already have an account?{' '}
                                        <button onClick={() => setShowLoginFormsView(true)} className="toggle-auth-link">
                                            Login
                                        </button>
                                    </p>
                                </>
                            )}
                        </div>
                    ) : (
                        renderMainContent()
                    )}
                </main>
            </div>
            <PlayerBar
                currentTrack={currentUser ? currentTrack : null}
                audioRef={audioRef}
                onTrackEnd={handleTrackEnd}
                onPlayNext={playNextInQueue} // Pass new handlers
                onPlayPrevious={playPreviousInQueue} // Pass new handlers
                canPlayNext={queue.length > 0 && currentQueueIndex < queue.length -1} // Basic logic
                canPlayPrevious={queue.length > 0 && currentQueueIndex > 0} // Basic logic
            />
        </div>
    );
}

export default App;