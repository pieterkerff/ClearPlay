import React, { useState, useRef, useEffect, useCallback } from 'react';
import TrackList from './components/TrackList';
import { JamendoTrack, fetchPopularTracks, searchTracks } from './services/JamendoService';
import { 
    addTrackToPlaylist, 
    getLikedTracks, 
    getTracksForPlaylist, 
    Playlist,
    removeTrackFromPlaylist,
    deletePlaylist
} from './services/FirestoreService';
import './App.css';

import { useAuth } from './contexts/AuthContext';
import LoginForm from './components/Auth/LoginForm';
import SignupForm from './components/Auth/SignupForm';

import Sidebar from './components/Layout/SideBar';
import PlayerBar from './components/Layout/PlayerBar';
import SearchInput from './components/Search/SearchInput';
import PlaylistHeader from './components/PlaylistHeader';

type ActiveView = 'home' | 'search' | 'library' | 'playlist';
type ViewIdentifier = ActiveView | `playlist-${string}`;

function App() {
    const { currentUser, loading: authLoading } = useAuth();
    const audioRef = useRef<HTMLAudioElement>(null);

    // --- State Definitions ---
    const [currentTrack, setCurrentTrack] = useState<JamendoTrack | null>(null);
    const [queue, setQueue] = useState<JamendoTrack[]>([]);
    const [currentQueueIndex, setCurrentQueueIndex] = useState<number>(-1);
    const [showLoginFormsView, setShowLoginFormsView] = useState(true);
    const [activeView, setActiveView] = useState<ActiveView>('home');
    const [activePlaylistId, setActivePlaylistId] = useState<string | null>(null);
    const [viewTitle, setViewTitle] = useState('Popular Tracks');
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [popularTracks, setPopularTracks] = useState<JamendoTrack[]>([]);
    const [popularLoading, setPopularLoading] = useState<boolean>(true);
    const [popularError, setPopularError] = useState<string | null>(null);
    const [searchResults, setSearchResults] = useState<JamendoTrack[]>([]);
    const [searchLoading, setSearchLoading] = useState<boolean>(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [submittedQuery, setSubmittedQuery] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [libraryTracks, setLibraryTracks] = useState<JamendoTrack[]>([]);
    const [libraryLoading, setLibraryLoading] = useState<boolean>(true);
    const [libraryError, setLibraryError] = useState<string | null>(null);
    const [playlistTracks, setPlaylistTracks] = useState<JamendoTrack[]>([]);
    const [playlistLoading, setPlaylistLoading] = useState<boolean>(true);
    const [playlistError, setPlaylistError] = useState<string | null>(null);

    // --- Handlers & Functions ---
    const playTrackFromQueue = useCallback((index: number, q: JamendoTrack[]) => {
        if (!currentUser || index < 0 || index >= q.length) {
            setCurrentTrack(null); setCurrentQueueIndex(-1); return;
        }
        setCurrentQueueIndex(index); setCurrentTrack(q[index]);
    }, [currentUser]);

    const playNextInQueue = useCallback(() => {
        const nextIndex = (currentQueueIndex + 1) % queue.length;
        playTrackFromQueue(nextIndex, queue);
    }, [queue, currentQueueIndex, playTrackFromQueue]);

    const playPreviousInQueue = useCallback(() => {
        let prevIndex = currentQueueIndex - 1;
        if (prevIndex < 0) prevIndex = queue.length - 1;
        playTrackFromQueue(prevIndex, queue);
    }, [queue, currentQueueIndex, playTrackFromQueue]);

    const handlePlayList = (tracks: JamendoTrack[], startIndex: number = 0) => {
        if (!currentUser || !tracks || tracks.length === 0) return;
        setQueue(tracks);
        playTrackFromQueue(startIndex, tracks);
    };
    
    const addToQueue = (track: JamendoTrack) => {
        if (!currentUser) return;
        setQueue(prevQueue => [...prevQueue, track]);
    };

    const handleTrackEnd = useCallback(() => { playNextInQueue(); }, [playNextInQueue]);

    const handleAddToPlaylist = async (playlistId: string, track: JamendoTrack) => {
        if (!currentUser) return;
        try {
            await addTrackToPlaylist(playlistId, track);
            alert(`Added "${track.name}" to playlist!`);
            if (activeView === 'playlist' && activePlaylistId === playlistId) {
                setPlaylistTracks(prev => [...prev, track]);
            }
        } catch { alert("Error: Could not add track."); }
    };

    const handleRemoveFromPlaylist = async (playlistId: string, trackId: string) => {
        if (!currentUser) return;
        try {
            await removeTrackFromPlaylist(playlistId, trackId);
            setPlaylistTracks(prev => prev.filter(t => t.id !== trackId));
            alert("Track removed from playlist.");
        } catch { alert("Error: Could not remove track."); }
    };

    const handleDeletePlaylist = async (playlistId: string) => {
        if (!currentUser) return;
        try {
            await deletePlaylist(playlistId);
            alert("Playlist deleted.");
            setPlaylists(prev => prev.filter(p => p.id !== playlistId));
            handleChangeView('library');
        } catch { alert("Error: Could not delete playlist."); }
    };

    const handleChangeView = (viewIdentifier: ViewIdentifier) => {
        if (viewIdentifier.startsWith('playlist-')) {
            const id = viewIdentifier.replace('playlist-', '');
            setActivePlaylistId(id);
            setActiveView('playlist');
        } else {
            setActivePlaylistId(null);
            setActiveView(viewIdentifier as ActiveView);
        }
    };

    // --- Data Fetching Effects ---
    useEffect(() => {
        if (!currentUser) {
            setPopularTracks([]); setSearchResults([]); setLibraryTracks([]);
            setPlaylistTracks([]); setPlaylists([]); return;
        }
        switch (activeView) {
            case 'home':
                setViewTitle('Popular Tracks'); setPopularLoading(true); setPopularError(null);
                fetchPopularTracks(20).then(setPopularTracks).catch(err => setPopularError(err.message)).finally(() => setPopularLoading(false));
                break;
            case 'library':
                setViewTitle('Liked Songs'); setLibraryLoading(true); setLibraryError(null);
                getLikedTracks(currentUser.uid).then(setLibraryTracks).catch(err => setLibraryError(err.message)).finally(() => setLibraryLoading(false));
                break;
            case 'playlist':
                if (activePlaylistId) {
                    const currentPlaylist = playlists.find(p => p.id === activePlaylistId);
                    setViewTitle(currentPlaylist ? currentPlaylist.name : 'Playlist');
                    setPlaylistLoading(true); setPlaylistError(null);
                    getTracksForPlaylist(activePlaylistId).then(setPlaylistTracks).catch(err => setPlaylistError(err.message)).finally(() => setPlaylistLoading(false));
                }
                break;
        }
    }, [activeView, currentUser, activePlaylistId, playlists]);

    const performSearch = useCallback(async (query: string) => {
        if (!query.trim()) { setSearchResults([]); return; }
        setSearchLoading(true); setSearchError(null);
        try {
            const results = await searchTracks(query, 20);
            setSearchResults(results);
        } catch (err) { setSearchError(err instanceof Error ? err.message : 'Failed to search.'); }
        finally { setSearchLoading(false); }
    }, []);

    const handleSearchSubmit = (query: string) => {
        setSubmittedQuery(query); setSearchQuery(query);
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
    if (authLoading) return <div className="App-loading-container"><h2>Loading Application...</h2></div>;

    const renderMainContent = () => {
        switch (activeView) {
            case 'home':
                return <TrackList tracks={popularTracks} isLoading={popularLoading} error={popularError} onPlayList={handlePlayList} onAddToQueue={addToQueue} onAddToPlaylist={handleAddToPlaylist} currentPlayingTrackId={currentTrack?.id || null} title={viewTitle} />;
            case 'search': {
                let searchDisplayTitle = "Search for music";
                if (searchLoading) searchDisplayTitle = `Searching for "${submittedQuery}"...`;
                else if (submittedQuery) searchDisplayTitle = searchResults.length > 0 ? `Results for "${submittedQuery}"` : `No results for "${submittedQuery}"`;
                return <><SearchInput onSearch={handleSearchSubmit} initialQuery={searchQuery} /><TrackList tracks={searchResults} isLoading={searchLoading} error={searchError} onPlayList={handlePlayList} onAddToQueue={addToQueue} onAddToPlaylist={handleAddToPlaylist} currentPlayingTrackId={currentTrack?.id || null} title={searchDisplayTitle} isSearch /></>;
            }
            case 'library':
                return <TrackList tracks={libraryTracks} isLoading={libraryLoading} error={libraryError} onPlayList={handlePlayList} onAddToQueue={addToQueue} onAddToPlaylist={handleAddToPlaylist} currentPlayingTrackId={currentTrack?.id || null} title={viewTitle} />;
            case 'playlist': {
                if (!activePlaylistId) return <div className="view-placeholder"><h2>Loading Playlist...</h2></div>;
                const currentPlaylist = playlists.find(p => p.id === activePlaylistId);
                return <><PlaylistHeader playlistName={currentPlaylist?.name || 'Playlist'} trackCount={playlistTracks.length} onDeletePlaylist={() => handleDeletePlaylist(activePlaylistId)} /><TrackList tracks={playlistTracks} isLoading={playlistLoading} error={playlistError} onPlayList={handlePlayList} onAddToQueue={addToQueue} onAddToPlaylist={handleAddToPlaylist} onRemoveFromPlaylist={handleRemoveFromPlaylist} currentPlaylistId={activePlaylistId} currentPlayingTrackId={currentTrack?.id || null} title="" /></>;
            }
            default:
                return <div className="view-placeholder"><h2>Page Not Found</h2></div>;
        }
    };

    return (
        <div className="App">
            <div className="App-main-content-wrapper">
                <Sidebar activeView={activeView} activePlaylistId={activePlaylistId} onSetView={handleChangeView} playlists={playlists} setPlaylists={setPlaylists} />
                <main className="App-content-area">{!currentUser ? <div className="auth-page-container">{showLoginFormsView ? <><LoginForm /><p className="auth-toggle-text">Don't have an account?{' '}<button onClick={() => setShowLoginFormsView(false)} className="toggle-auth-link">Sign Up</button></p></> : <><SignupForm /><p className="auth-toggle-text">Already have an account?{' '}<button onClick={() => setShowLoginFormsView(true)} className="toggle-auth-link">Login</button></p></>}</div> : renderMainContent()}</main>
            </div>
            <PlayerBar currentTrack={currentUser ? currentTrack : null} audioRef={audioRef} onTrackEnd={handleTrackEnd} onPlayNext={playNextInQueue} onPlayPrevious={playPreviousInQueue} canPlayNext={queue.length > 1} canPlayPrevious={queue.length > 1} />
        </div>
    );
}

export default App;