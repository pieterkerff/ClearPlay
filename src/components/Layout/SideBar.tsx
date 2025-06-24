import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import AuthDetails from '../Auth/AuthDetails';
import { Playlist, getUserPlaylists, createPlaylist } from '../../services/FirestoreService';
import './SideBar.css';

type ViewIdentifier = 'home' | 'search' | 'library' | `playlist-${string}`;

interface SideBarProps {
    activeView: 'home' | 'search' | 'library' | 'playlist';
    activePlaylistId: string | null;
    onSetView: (view: ViewIdentifier) => void;
    playlists: Playlist[]; // Receive playlists as a prop
    setPlaylists: React.Dispatch<React.SetStateAction<Playlist[]>>; // Receive setter function
}

const SideBar: React.FC<SideBarProps> = ({ activeView, activePlaylistId, onSetView, playlists, setPlaylists }) => {
    const { currentUser } = useAuth();
    const [loadingPlaylists, setLoadingPlaylists] = useState(false);

    // Fetch user's playlists when they log in
    useEffect(() => {
        if (!currentUser) {
            setPlaylists([]); // Clear playlists on logout (handled by parent App)
            return;
        }

        setLoadingPlaylists(true);
        getUserPlaylists(currentUser.uid)
            .then(fetchedPlaylists => {
                setPlaylists(fetchedPlaylists); // Update the state in the parent App component
            })
            .catch(err => console.error("Failed to fetch playlists for sidebar:", err))
            .finally(() => setLoadingPlaylists(false));

    }, [currentUser, setPlaylists]); // Dependency is on setPlaylists to ensure stability

    const handleCreatePlaylist = async () => {
        if (!currentUser) return;
        const newPlaylistName = prompt("Enter a name for your new playlist:", "My Awesome Playlist");
        if (newPlaylistName && newPlaylistName.trim()) {
            try {
                const newPlaylistId = await createPlaylist(currentUser.uid, newPlaylistName.trim());
                // Refetch playlists to update the list
                const updatedPlaylists = await getUserPlaylists(currentUser.uid);
                setPlaylists(updatedPlaylists); // Update state in App.tsx
                // Switch view to the new playlist
                onSetView(`playlist-${newPlaylistId}`);
            } catch {
                alert("Could not create playlist. Please try again.");
            }
        }
    };


    return (
        <aside className="App-sidebar">
            <div className="sidebar-header">
                <h1>MusicHub</h1>
            </div>
            <nav className="sidebar-nav">
                <ul>
                    <li>
                        <button
                            onClick={() => onSetView('home')}
                            className={`nav-link ${activeView === 'home' ? 'active' : ''}`}
                        >
                            Home
                        </button>
                    </li>
                    <li>
                        <button
                            onClick={() => onSetView('search')}
                            className={`nav-link ${activeView === 'search' ? 'active' : ''}`}
                        >
                            Search
                        </button>
                    </li>
                    {currentUser && (
                        <li>
                            <button
                                onClick={() => onSetView('library')}
                                className={`nav-link ${activeView === 'library' ? 'active' : ''}`}
                            >
                                Your Library
                            </button>
                        </li>
                    )}
                </ul>
            </nav>

            <div className="sidebar-divider"></div>

            {currentUser && (
                <div className="sidebar-playlists">
                    <button className="create-playlist-btn" onClick={handleCreatePlaylist}>
                        + Create Playlist
                    </button>
                    {loadingPlaylists && <p className="playlist-loading-text">Loading...</p>}
                    <ul className="playlist-list">
                        {playlists.map(playlist => (
                            <li key={playlist.id}>
                                <button
                                    className={`nav-link playlist-link ${activePlaylistId === playlist.id ? 'active' : ''}`}
                                    onClick={() => onSetView(`playlist-${playlist.id}`)}
                                >
                                    {playlist.name}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}


            {currentUser && (
                <div className="sidebar-user-section">
                    <AuthDetails />
                </div>
            )}
        </aside>
    );
};

export default SideBar;