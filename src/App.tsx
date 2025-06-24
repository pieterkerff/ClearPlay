import { useState, useRef, useEffect, useCallback } from 'react';
import TrackList from '../src/components/TrackList';
import { JamendoTrack, fetchPopularTracks, searchTracks } from '../src/services/JamendoService';
import { getLikedTracks } from '../src/services/FirestoreService';
import './App.css';

import { useAuth } from '../src/contexts/AuthContext';
import LoginForm from '../src/components/Auth/LoginForm';
import SignupForm from '../src/components/Auth/SignupForm';

import SideBar from '../src/components/Layout/SideBar';
import PlayerBar from '../src/components/Layout/PlayerBar';
import SearchInput from '../src/components/Search/SearchInput';

type ActiveView = 'home' | 'search' | 'library';

function App() {
    const { currentUser, loading: authLoading } = useAuth();
    const audioRef = useRef<HTMLAudioElement>(null);

    // --- Player and Queue State ---
    const [currentTrack, setCurrentTrack] = useState<JamendoTrack | null>(null);
    const [queue, setQueue] = useState<JamendoTrack[]>([]);
    const [currentQueueIndex, setCurrentQueueIndex] = useState<number>(-1);

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

    const [libraryTracks, setLibraryTracks] = useState<JamendoTrack[]>([]);
    const [libraryLoading, setLibraryLoading] = useState<boolean>(true);
    const [libraryError, setLibraryError] = useState<string | null>(null);

    // --- Queue Management Functions ---
    const addToQueue = (track: JamendoTrack) => {
        if (!currentUser) return;
        setQueue(prevQueue => {
            const newQueue = [...prevQueue, track];
            if (!currentTrack && audioRef.current && newQueue.length === 1) {
                playTrackFromQueue(0, newQueue);
            }
            return newQueue;
        });
    };

    const playTrackFromQueue = useCallback(
        (index: number, q: JamendoTrack[] = queue) => {
            if (!currentUser || index < 0 || index >= q.length) {
                setCurrentTrack(null);
                setCurrentQueueIndex(-1);
                return;
            }
            setCurrentQueueIndex(index);
            setCurrentTrack(q[index]);
        },
        [currentUser, queue]
    );

    const playNextInQueue = useCallback(() => {
        if (queue.length > 0) {
            const nextIndex = (currentQueueIndex + 1) % queue.length;
            playTrackFromQueue(nextIndex);
        } else {
            setCurrentTrack(null);
            setCurrentQueueIndex(-1);
        }
    }, [queue, currentQueueIndex, playTrackFromQueue]);

    const playPreviousInQueue = useCallback(() => {
        if (queue.length > 0) {
            let prevIndex = currentQueueIndex - 1;
            if (prevIndex < 0) prevIndex = queue.length - 1;
            playTrackFromQueue(prevIndex);
        }
    }, [queue, currentQueueIndex, playTrackFromQueue]);

    const handlePlayTrackNow = (track: JamendoTrack) => {
        if (!currentUser) return;
        const newQueue = [track];
        setQueue(newQueue);
        playTrackFromQueue(0, newQueue);
    };

    const handleTrackEnd = useCallback(() => {
        playNextInQueue();
    }, [playNextInQueue]);

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
            setPopularLoading(true); setPopularError(null);
            fetchPopularTracks(20)
                .then(setPopularTracks)
                .catch(err => setPopularError(err instanceof Error ? err.message : 'Failed to load.'))
                .finally(() => setPopularLoading(false));
        }
    }, [activeView, currentUser]);

    useEffect(() => {
        if (activeView === 'library' && currentUser) {
            setViewTitle('Liked Songs');
            setLibraryLoading(true); setLibraryError(null);
            getLikedTracks(currentUser.uid)
                .then(setLibraryTracks)
                .catch(err => setLibraryError(err instanceof Error ? err.message : 'Failed to load liked songs.'))
                .finally(() => setLibraryLoading(false));
        }
    }, [activeView, currentUser]);

    const performSearch = useCallback(async (query: string) => {
        if (!query.trim()) {
            setSearchResults([]); return;
        }
        setSearchLoading(true); setSearchError(null);
        try {
            const results = await searchTracks(query, 20);
            setSearchResults(results);
        } catch (err) { setSearchError(err instanceof Error ? err.message : 'Failed to search.'); }
        finally { setSearchLoading(false); }
    }, []);

    const handleSearchSubmit = (query: string) => {
        setSubmittedQuery(query);
        setSearchQuery(query);
        if (activeView !== 'search') setActiveView('search');
        performSearch(query);
    };

    // --- Audio Playback Effect ---
    useEffect(() => {
        if (currentUser && currentTrack && audioRef.current) {
            audioRef.current.src = currentTrack.audio;
            audioRef.current.load();
            audioRef.current.play().catch(error => console.error("Error playing audio:", error));
        } else if ((!currentTrack || !currentUser) && audioRef.current) {
            audioRef.current.pause();
            if (!currentUser) setCurrentTrack(null);
        }
    }, [currentTrack, currentUser]);

    // --- Main Render Logic ---
    if (authLoading) {
        return <div className="App-loading-container"><h2>Loading Application...</h2></div>;
    }

    const renderMainContent = () => {
        switch (activeView) {
            case 'home':
                return (
                    <TrackList
                        tracks={popularTracks}
                        isLoading={popularLoading}
                        error={popularError}
                        onTrackSelect={handlePlayTrackNow}
                        onAddToQueue={addToQueue}
                        currentPlayingTrackId={currentTrack?.id || null}
                        title={viewTitle}
                    />
                );
            case 'search': {
                let searchDisplayTitle = "Search for music";
                if (searchLoading) searchDisplayTitle = `Searching for "${submittedQuery}"...`;
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
                            onTrackSelect={handlePlayTrackNow}
                            onAddToQueue={addToQueue}
                            currentPlayingTrackId={currentTrack?.id || null}
                            title={searchDisplayTitle}
                            isSearch
                        />
                    </>
                );
            }
            case 'library':
                return (
                    <TrackList
                        tracks={libraryTracks}
                        isLoading={libraryLoading}
                        error={libraryError}
                        onTrackSelect={handlePlayTrackNow}
                        onAddToQueue={addToQueue}
                        currentPlayingTrackId={currentTrack?.id || null}
                        title={viewTitle}
                    />
                );
            default:
                return <div className="view-placeholder"><h2>Page Not Found</h2></div>;
        }
    };

    return (
        <div className="App">
            <div className="App-main-content-wrapper">
                <SideBar activeView={activeView} onSetView={handleChangeView} />
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
                onPlayNext={playNextInQueue}
                onPlayPrevious={playPreviousInQueue}
                canPlayNext={queue.length > 0} // Simplified logic: can always try to play next/prev in a queue
                canPlayPrevious={queue.length > 0}
            />
        </div>
    );
}

export default App;