import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import AuthDetails from "../Auth/AuthDetails";
import {
  Playlist,
  getUserPlaylists,
} from "../../services/FirestoreService";
import "./SideBar.css";

// This type definition now includes artist and album pages
type ViewIdentifier =
  | "home"
  | "search"
  | "library"
  | `playlist-${string}`
  | `artist-${string}`
  | `album-${string}`;

interface SideBarProps {
  activeView:
    | "home"
    | "search"
    | "library"
    | "playlist"
    | "artistPage"
    | "albumPage";
  activePlaylistId: string | null;
  onSetView: (view: ViewIdentifier) => void;
  playlists: Playlist[];
  setPlaylists: React.Dispatch<React.SetStateAction<Playlist[]>>;
  // Prop to trigger the creation flow in App.tsx
  onCreatePlaylist: () => void; 
}

const SideBar: React.FC<SideBarProps> = ({
  activeView,
  activePlaylistId,
  onSetView,
  playlists,
  setPlaylists,
  onCreatePlaylist, // Destructure the new prop
}) => {
  const { currentUser } = useAuth();
  const [loadingPlaylists, setLoadingPlaylists] = useState(true);

  // This useEffect correctly fetches user playlists when the user logs in
  useEffect(() => {
    if (!currentUser) {
      setPlaylists([]);
      setLoadingPlaylists(false);
      return;
    }

    setLoadingPlaylists(true);
    getUserPlaylists(currentUser.uid)
      .then((fetchedPlaylists) => {
        setPlaylists(fetchedPlaylists);
      })
      .catch((err) =>
        console.error("Failed to fetch playlists for sidebar:", err)
      )
      .finally(() => setLoadingPlaylists(false));
  }, [currentUser, setPlaylists]);

  // The handler is now very simple: it just calls the prop from App.tsx.
  const handleCreatePlaylist = () => {
    onCreatePlaylist();
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
              onClick={() => onSetView("home")}
              className={`nav-link ${activeView === "home" ? "active" : ""}`}
            >
              Home
            </button>
          </li>
          <li>
            <button
              onClick={() => onSetView("search")}
              className={`nav-link ${activeView === "search" ? "active" : ""}`}
            >
              Search
            </button>
          </li>
          {currentUser && (
            <li>
              <button
                onClick={() => onSetView("library")}
                className={`nav-link ${
                  activeView === "library" ? "active" : ""
                }`}
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
          <button
            className="create-playlist-btn"
            onClick={handleCreatePlaylist} // This now calls our simplified handler
          >
            + Create Playlist
          </button>
          {loadingPlaylists && (
            <p className="playlist-loading-text">Loading...</p>
          )}
          <ul className="playlist-list">
            {playlists.map((playlist) => (
              <li key={playlist.id}>
                <button
                  className={`nav-link playlist-link ${
                    activePlaylistId === playlist.id ? "active" : ""
                  }`}
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