import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import AuthDetails from "../Auth/AuthDetails";
import {
  Playlist,
  getUserPlaylists,
  createPlaylist,
} from "../../services/FirestoreService";
import "./SideBar.css";
import { toast } from "react-hot-toast";

type ViewIdentifier = "home" | "search" | "library" | `playlist-${string}`;

interface SideBarProps {
  activeView: "home" | "search" | "library" | "playlist" | "artistPage";
  activePlaylistId: string | null;
  onSetView: (view: ViewIdentifier) => void;
  playlists: Playlist[];
  setPlaylists: React.Dispatch<React.SetStateAction<Playlist[]>>;
}

const SideBar: React.FC<SideBarProps> = ({
  activeView,
  activePlaylistId,
  onSetView,
  playlists,
  setPlaylists,
}) => {
  const { currentUser } = useAuth();
  const [loadingPlaylists, setLoadingPlaylists] = useState(true);

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

  const handleCreatePlaylist = async () => {
    if (!currentUser) return;
    const newPlaylistName = prompt("Enter playlist name:", "My Playlist");
    if (newPlaylistName && newPlaylistName.trim()) {
      try {
        const newPlaylistId = await createPlaylist(
          currentUser.uid,
          newPlaylistName.trim()
        );
        const updatedPlaylists = await getUserPlaylists(currentUser.uid);
        setPlaylists(updatedPlaylists);
        onSetView(`playlist-${newPlaylistId}`);
        toast.success("Playlist created!");
      } catch {
        alert("Could not create playlist.");
      }
      toast.error("Could not create playlist.");
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
            onClick={handleCreatePlaylist}
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
