import { useState, useRef, useEffect, useCallback } from "react";
import { Toaster, toast } from "react-hot-toast";
import TrackList from "./components/TrackList";
import {
  JamendoTrack,
  JamendoArtist,
  JamendoAlbum,
  getTracksByAlbumId,
  fetchPopularTracks,
  searchAllTypes,
  AllSearchResults,
  getTracksByArtistId,
} from "./services/JamendoService";
import {
  addTrackToPlaylist,
  getLikedTracks,
  getTracksForPlaylist,
  Playlist,
  removeTrackFromPlaylist,
  deletePlaylist,
  renamePlaylist as firestoreRenamePlaylist,
  createPlaylist,
} from "./services/FirestoreService";
import "./App.css";

import { useDebounce } from "./hooks/useDebounce";

import { useAuth } from "./contexts/AuthContext";
import LoginForm from "./components/Auth/LoginForm";
import SignupForm from "./components/Auth/SignupForm";

import Sidebar from "./components/Layout/SideBar";
import PlayerBar from "./components/Layout/PlayerBar";
import SearchInput from "./components/Search/SearchInput";
import PlaylistHeader from "./components/PlaylistHeader";
import RenamePlaylistToastForm from "./components/ToastForms/RenamePlaylistToastForm";
import CreatePlaylistToastForm from "./components/ToastForms/CreatePlaylistToastForm";
import { Timestamp } from "firebase/firestore";

type ActiveView =
  | "home"
  | "search"
  | "library"
  | "playlist"
  | "artistPage"
  | "albumPage";
type ViewIdentifier =
  | ActiveView
  | `playlist-${string}`
  | `artist-${string}`
  | `album-${string}`;

function App() {
  const { currentUser, loading: authLoading } = useAuth();
  const audioRef = useRef<HTMLAudioElement>(null);

  // --- State Definitions ---
  const [currentTrack, setCurrentTrack] = useState<JamendoTrack | null>(null);
  const [queue, setQueue] = useState<JamendoTrack[]>([]);
  const [currentQueueIndex, setCurrentQueueIndex] = useState<number>(-1);
  const [showLoginFormsView, setShowLoginFormsView] = useState(true);
  const [activeView, setActiveView] = useState<ActiveView>("home");
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(null);
  const [viewTitle, setViewTitle] = useState("Popular Tracks");
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [popularTracks, setPopularTracks] = useState<JamendoTrack[]>([]);
  const [popularLoading, setPopularLoading] = useState<boolean>(true);
  const [popularError, setPopularError] = useState<string | null>(null);
  const [allSearchResults, setAllSearchResults] = useState<AllSearchResults>({
    tracks: [],
    artists: [],
    albums: [],
  });
  const [searchLoading, setSearchLoading] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [submittedQuery, setSubmittedQuery] = useState<string>("");
  const [libraryTracks, setLibraryTracks] = useState<JamendoTrack[]>([]);
  const [libraryLoading, setLibraryLoading] = useState<boolean>(true);
  const [libraryError, setLibraryError] = useState<string | null>(null);
  const [playlistTracks, setPlaylistTracks] = useState<JamendoTrack[]>([]);
  const [playlistLoading, setPlaylistLoading] = useState<boolean>(true);
  const [playlistError, setPlaylistError] = useState<string | null>(null);

  const [viewingArtistId, setViewingArtistId] = useState<string | null>(null);
  const [artistPageTracks, setArtistPageTracks] = useState<JamendoTrack[]>([]);
  const [artistPageArtistDetails, setArtistPageArtistDetails] =
    useState<JamendoArtist | null>(null);
  const [artistPageLoading, setArtistPageLoading] = useState<boolean>(false);
  const [artistPageError, setArtistPageError] = useState<string | null>(null);

  const [viewingAlbumId, setViewingAlbumId] = useState<string | null>(null);
  const [albumPageTracks, setAlbumPageTracks] = useState<JamendoTrack[]>([]);
  const [albumPageAlbumDetails, setAlbumPageAlbumDetails] =
    useState<JamendoAlbum | null>(null);
  const [albumPageLoading, setAlbumPageLoading] = useState<boolean>(false);
  const [albumPageError, setAlbumPageError] = useState<string | null>(null);

  // --- Handlers & Functions ---
  const playTrackFromQueue = useCallback(
    (index: number, q: JamendoTrack[]) => {
      if (!currentUser || index < 0 || index >= q.length) {
        setCurrentTrack(null);
        setCurrentQueueIndex(-1);
        return;
      }
      setCurrentQueueIndex(index);
      setCurrentTrack(q[index]);
    },
    [currentUser]
  );

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
    setQueue((prevQueue) => [...prevQueue, track]);
  };

  const handleTrackEnd = useCallback(() => {
    playNextInQueue();
  }, [playNextInQueue]);

  const handleAddToPlaylist = async (
    playlistId: string,
    track: JamendoTrack
  ) => {
    if (!currentUser) return;
    try {
      await addTrackToPlaylist(playlistId, track);
      toast.success(`Added "${track.name}" to playlist!`);
      if (activeView === "playlist" && activePlaylistId === playlistId) {
        setPlaylistTracks((prev) => [...prev, track]);
      }
    } catch (error) {
      toast.error("Could not add track to playlist.");
      console.error("Failed to add track to playlist:", error);
    }
  };

  const handleRemoveFromPlaylist = async (
    playlistId: string,
    trackId: string
  ) => {
    if (!currentUser) return;
    try {
      await removeTrackFromPlaylist(playlistId, trackId);
      setPlaylistTracks((prev) => prev.filter((t) => t.id !== trackId));
      toast.success("Track removed from playlist.");
    } catch (error) {
      toast.error("Could not remove track.");
      console.error("Failed to remove track from playlist:", error);
    }
  };

  const performDeletePlaylist = async (playlistId: string) => {
    if (!currentUser) return;
    try {
      await deletePlaylist(playlistId);
      setPlaylists((prev) => prev.filter((p) => p.id !== playlistId));
      handleChangeView("library");
      toast.success("Playlist deleted successfully.");
    } catch (error) {
      console.error("Failed to delete playlist:", error);
      toast.error("Could not delete playlist.");
    }
  };

  const confirmDeletePlaylist = (playlistId: string, playlistName: string) => {
    toast(
      (t) => (
        <div className="confirmation-toast">
          <p>
            Delete playlist <strong>"{playlistName}"</strong>? This cannot be
            undone.
          </p>
          <div className="confirmation-buttons">
            <button
              className="confirm-btn"
              onClick={() => {
                performDeletePlaylist(playlistId);
                toast.dismiss(t.id);
              }}
            >
              Confirm
            </button>
            <button className="cancel-btn" onClick={() => toast.dismiss(t.id)}>
              Cancel
            </button>
          </div>
        </div>
      ),
      {
        duration: 6000,
      }
    );
  };

  const handleRenamePlaylist = async (playlistId: string, newName: string) => {
    if (!currentUser) return;
    try {
      await firestoreRenamePlaylist(playlistId, newName);
      setPlaylists((prevPlaylists) =>
        prevPlaylists.map((p) =>
          p.id === playlistId ? { ...p, name: newName } : p
        )
      );
      if (activePlaylistId === playlistId) {
        setViewTitle(newName);
      }
      toast.success("Playlist renamed successfully.");
    } catch (error) {
      toast.error("Could not rename playlist.");
      console.error("Failed to rename playlist:", error);
    }
  };

  const promptRenamePlaylist = (playlistId: string, currentName: string) => {
    if (!currentUser) return;

    toast(
      (t) => (
        <RenamePlaylistToastForm
          currentName={currentName}
          onConfirm={(newNameFromToast) => {
            handleRenamePlaylist(playlistId, newNameFromToast);
            toast.dismiss(t.id);
          }}
          onCancel={() => {
            toast.dismiss(t.id);
          }}
        />
      ),
      {
        duration: Infinity,
      }
    );
  };

  const promptCreatePlaylist = () => {
    if (!currentUser) return;

    toast(
      (t) => (
        <CreatePlaylistToastForm
          onConfirm={async (newPlaylistName) => {
            toast.dismiss(t.id);
            try {
              const newPlaylistId = await createPlaylist(
                currentUser.uid,
                newPlaylistName
              );

              const newPlaylist: Playlist = {
                id: newPlaylistId,
                name: newPlaylistName,
                userId: currentUser.uid,
                createdAt: Timestamp.now(),
                trackIds: [],
              };

              setPlaylists((prevPlaylists) => [newPlaylist, ...prevPlaylists]);
              handleChangeView(`playlist-${newPlaylistId}`);
              toast.success(`Playlist "${newPlaylistName}" created!`);
            } catch (error) {
              console.error("Failed to create playlist:", error);
              toast.error("Could not create the playlist.");
            }
          }}
          onCancel={() => {
            toast.dismiss(t.id);
          }}
        />
      ),
      {
        duration: Infinity,
      }
    );
  };

  const handleChangeView = (viewIdentifier: ViewIdentifier) => {
    setViewingArtistId(null);
    setArtistPageTracks([]);
    setArtistPageArtistDetails(null);
    setViewingAlbumId(null);
    setAlbumPageTracks([]);
    setAlbumPageAlbumDetails(null);

    if (viewIdentifier.startsWith("playlist-")) {
      const id = viewIdentifier.replace("playlist-", "");
      setActivePlaylistId(id);
      setActiveView("playlist");
    } else if (viewIdentifier.startsWith("artist-")) {
      const id = viewIdentifier.replace("artist-", "");
      setViewingArtistId(id);
      setActiveView("artistPage");
    } else if (viewIdentifier.startsWith("album-")) {
      const id = viewIdentifier.replace("album-", "");
      setViewingAlbumId(id);
      setActiveView("albumPage");
    } else {
      setActivePlaylistId(null);
      setActiveView(viewIdentifier as ActiveView);
    }
  };

  const handleAlbumClick = (albumId: string) => {
    setViewingAlbumId(albumId);
    setActiveView("albumPage");
    setAlbumPageTracks([]);
    setAlbumPageAlbumDetails(null);
    setAlbumPageLoading(true);
    setAlbumPageError(null);
  };

  const handleArtistClick = (artistId: string) => {
    setViewingArtistId(artistId);
    setActiveView("artistPage");
    setArtistPageTracks([]);
    setArtistPageArtistDetails(null);
    setArtistPageLoading(true);
    setArtistPageError(null);
  };

  const performSearch = useCallback(async (queryToSearch: string) => {
    if (!queryToSearch.trim()) {
      setAllSearchResults({ tracks: [], artists: [], albums: [] });
      setSubmittedQuery("");
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    setSearchError(null);
    setSubmittedQuery(queryToSearch);

    try {
      const results = await searchAllTypes(queryToSearch);
      setAllSearchResults(results);
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : "Failed to search.");
      setAllSearchResults({ tracks: [], artists: [], albums: [] });
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const handleSearchInputChange = (newQuery: string) => {
    setSearchQuery(newQuery);
    if (newQuery.trim()) {
      if (activeView !== "search") {
        setActiveView("search");
      }
    } else {
      setSubmittedQuery("");
      setAllSearchResults({ tracks: [], artists: [], albums: [] });
    }
  };

  // --- Data Fetching Effects ---
  useEffect(() => {
    if (debouncedSearchQuery.trim()) {
      if (activeView === "search") {
        performSearch(debouncedSearchQuery);
      }
    } else if (activeView === "search") {
      setAllSearchResults({ tracks: [], artists: [], albums: [] });
      setSubmittedQuery("");
      setSearchLoading(false);
    }
  }, [debouncedSearchQuery, performSearch, activeView]);

  useEffect(() => {
    if (!currentUser) {
      setPopularTracks([]);
      setLibraryTracks([]);
      setPlaylistTracks([]);
      setPlaylists([]);
      setViewingAlbumId(null);
      setAlbumPageTracks([]);
      setAlbumPageAlbumDetails(null);
      setCurrentTrack(null);
      setQueue([]);
      setCurrentQueueIndex(-1);
      setSearchQuery("");
      setSubmittedQuery("");
      setAllSearchResults({ tracks: [], artists: [], albums: [] });
      setActiveView("home");
      setViewTitle("Popular Tracks");
      return;
    }
    if (activeView !== "artistPage" && viewingArtistId) {
      setViewingArtistId(null);
      setArtistPageTracks([]);
      setArtistPageArtistDetails(null);
    }
    if (activeView !== "albumPage" && viewingAlbumId) {
      setViewingAlbumId(null);
      setAlbumPageTracks([]);
      setAlbumPageAlbumDetails(null);
    }

    if (activeView === "home") {
      setViewTitle("Popular Tracks");
      setPopularLoading(true);
      setPopularError(null);
      fetchPopularTracks(20)
        .then(setPopularTracks)
        .catch((err) => setPopularError(err.message))
        .finally(() => setPopularLoading(false));
    } else if (activeView === "library") {
      setViewTitle("Liked Songs");
      setLibraryLoading(true);
      setLibraryError(null);
      getLikedTracks(currentUser.uid)
        .then(setLibraryTracks)
        .catch((err) => setLibraryError(err.message))
        .finally(() => setLibraryLoading(false));
    } else if (activeView === "playlist" && activePlaylistId) {
      const currentPlaylist = playlists.find((p) => p.id === activePlaylistId);
      setViewTitle(currentPlaylist ? currentPlaylist.name : "Playlist");
      setPlaylistLoading(true);
      setPlaylistError(null);
      getTracksForPlaylist(activePlaylistId)
        .then(setPlaylistTracks)
        .catch((err) => setPlaylistError(err.message))
        .finally(() => setPlaylistLoading(false));
    } else if (activeView === "artistPage" && viewingArtistId) {
      setViewTitle("Artist Page");
      setArtistPageLoading(true);
      setArtistPageError(null);

      getTracksByArtistId(viewingArtistId, 30)
        .then((tracks) => {
          setArtistPageTracks(tracks);
          if (tracks.length > 0) {
            setViewTitle(tracks[0].artist_name);
          } else {
            setViewTitle("Artist Page");
          }
        })
        .catch((err) => {
          setArtistPageError(err.message);
          setViewTitle("Error Loading Artist");
        })
        .finally(() => {
          setArtistPageLoading(false);
        });
    } else if (activeView === "albumPage" && viewingAlbumId && currentUser) {
      setViewTitle("Album Page");
      setAlbumPageLoading(true);
      setAlbumPageError(null);
      getTracksByAlbumId(viewingAlbumId, 50)
        .then((tracks) => {
          setAlbumPageTracks(tracks);
          if (tracks.length > 0) {
            setViewTitle(tracks[0].album_name);
            const albumFromSearch = allSearchResults.albums.find(
              (a) => a.id === viewingAlbumId
            );
            if (albumFromSearch) {
              setAlbumPageAlbumDetails(albumFromSearch);
              setViewTitle(albumFromSearch.name);
            }
          } else {
            const albumFromSearch = allSearchResults.albums.find(
              (a) => a.id === viewingAlbumId
            );
            if (albumFromSearch) {
              setAlbumPageAlbumDetails(albumFromSearch);
              setViewTitle(albumFromSearch.name);
            } else {
              setViewTitle("Album Page");
            }
          }
        })
        .catch((err) => {
          setAlbumPageError(err.message);
          setViewTitle("Error Loading Album");
        })
        .finally(() => {
          setAlbumPageLoading(false);
        });
    } else if (activeView === "search") {
      if (submittedQuery) {
        setViewTitle(`Search: ${submittedQuery}`);
      } else {
        setViewTitle("Search");
      }
    }
    if (activeView !== "search" && submittedQuery) {
      setAllSearchResults({ tracks: [], artists: [], albums: [] });
      setSubmittedQuery("");
    }
  }, [
    activeView,
    currentUser,
    activePlaylistId,
    playlists,
    submittedQuery,
    viewingArtistId,
    viewingAlbumId,
    allSearchResults,
  ]);

  // --- Audio Playback Effect ---
  useEffect(() => {
    if (currentUser && currentTrack && audioRef.current) {
      audioRef.current.src = currentTrack.audio;
      audioRef.current.load();
      audioRef.current
        .play()
        .catch((error) => console.error("Error playing audio:", error));
    } else if ((!currentTrack || !currentUser) && audioRef.current) {
      audioRef.current.pause();
      if (!currentUser) setCurrentTrack(null);
    }
  }, [currentTrack, currentUser]);

  // --- Main Render Logic ---
  if (authLoading)
    return (
      <div className="App-loading-container">
        <h2>Loading Application...</h2>
      </div>
    );

  const renderMainContent = () => {
    switch (activeView) {
      case "home":
        return (
          <TrackList
            tracks={popularTracks}
            isLoading={popularLoading}
            error={popularError}
            onPlayList={handlePlayList}
            onAddToQueue={addToQueue}
            onAddToPlaylist={handleAddToPlaylist}
            currentPlaylistId={null}
            currentPlayingTrackId={currentTrack?.id || null}
            title={viewTitle}
          />
        );

      case "search": {
        let overallSearchAreaTitle = "Search for music";
        if (searchLoading) {
          overallSearchAreaTitle = `Searching for "${submittedQuery}"...`;
        } else if (submittedQuery) {
          const hasAnyResults =
            allSearchResults.tracks.length > 0 ||
            allSearchResults.artists.length > 0 ||
            allSearchResults.albums.length > 0;
          overallSearchAreaTitle = hasAnyResults
            ? `Results for "${submittedQuery}"`
            : `No results found for "${submittedQuery}"`;
        }

        const showNoResultsFoundMessage =
          !searchLoading &&
          submittedQuery &&
          allSearchResults.tracks.length === 0 &&
          allSearchResults.artists.length === 0 &&
          allSearchResults.albums.length === 0;

        return (
          <>
            <SearchInput
              currentQuery={searchQuery}
              onQueryChange={handleSearchInputChange}
            />

            {searchLoading && (
              <div className="search-status-message">
                Searching for "{submittedQuery}"...
              </div>
            )}

            {searchError && (
              <div className="search-status-message error">
                Error: {searchError}
              </div>
            )}

            {!searchLoading && !searchError && submittedQuery && (
              <div className="search-results-page-container">
                <h2 className="search-results-area-title">
                  {overallSearchAreaTitle}
                </h2>

                {allSearchResults.tracks.length > 0 && (
                  <section className="search-results-section tracks-section">
                    <h3>Tracks</h3>
                    <TrackList
                      tracks={allSearchResults.tracks}
                      isLoading={false}
                      error={null}
                      onPlayList={handlePlayList}
                      onAddToQueue={addToQueue}
                      onAddToPlaylist={handleAddToPlaylist}
                      currentPlaylistId={null}
                      currentPlayingTrackId={currentTrack?.id || null}
                      title=""
                      isSearch
                    />
                  </section>
                )}

                {allSearchResults.artists.length > 0 && (
                  <section className="search-results-section artists-section">
                    <h3>Artists</h3>
                    <ul className="basic-list artist-list">
                      {allSearchResults.artists.map((artist) => (
                        <li
                          key={artist.id}
                          className="artist-search-item"
                          onClick={() => handleArtistClick(artist.id)}
                          style={{ cursor: "pointer" }}
                        >
                          <img
                            src={artist.image}
                            alt={artist.name}
                            className="item-image"
                          />
                          <div className="item-details">
                            <span className="item-name">{artist.name}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {allSearchResults.albums.length > 0 && (
                  <section className="search-results-section albums-section">
                    <h3>Albums</h3>
                    <ul className="basic-list album-list">
                      {allSearchResults.albums.map((album) => (
                        <li
                          key={album.id}
                          className="album-search-item"
                          onClick={() => handleAlbumClick(album.id)}
                          style={{ cursor: "pointer" }}
                        >
                          <img
                            src={album.image}
                            alt={album.name}
                            className="item-image"
                          />
                          <div className="item-details">
                            <span className="item-name">{album.name}</span>
                            <span className="item-sub-detail">
                              {album.artist_name}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {showNoResultsFoundMessage && (
                  <div className="search-status-message">
                    No tracks, artists, or albums found for "{submittedQuery}".
                    Try a different search term.
                  </div>
                )}
              </div>
            )}

            {!submittedQuery && !searchLoading && !searchError && (
              <div className="search-status-message">
                {overallSearchAreaTitle}
              </div>
            )}
          </>
        );
      }
      case "library":
        return (
          <TrackList
            tracks={libraryTracks}
            isLoading={libraryLoading}
            error={libraryError}
            onPlayList={handlePlayList}
            onAddToQueue={addToQueue}
            onAddToPlaylist={handleAddToPlaylist}
            currentPlaylistId={null}
            currentPlayingTrackId={currentTrack?.id || null}
            title={viewTitle}
          />
        );

      case "playlist": {
        const currentPlaylist = playlists.find(
          (p) => p.id === activePlaylistId
        );

        if (!activePlaylistId || !currentPlaylist) {
          return (
            <div className="view-placeholder">
              <h2>Loading Playlist...</h2>
            </div>
          );
        }

        return (
          <>
            {!playlistLoading && (
              <PlaylistHeader
                playlistName={currentPlaylist.name}
                trackCount={playlistTracks.length}
                onDeletePlaylist={() =>
                  confirmDeletePlaylist(activePlaylistId, currentPlaylist.name)
                }
                onRenamePlaylist={() =>
                  promptRenamePlaylist(activePlaylistId, currentPlaylist.name)
                }
              />
            )}

            <TrackList
              tracks={playlistTracks}
              isLoading={playlistLoading}
              error={playlistError}
              onPlayList={handlePlayList}
              onAddToQueue={addToQueue}
              onAddToPlaylist={handleAddToPlaylist}
              onRemoveFromPlaylist={handleRemoveFromPlaylist}
              currentPlaylistId={activePlaylistId}
              currentPlayingTrackId={currentTrack?.id || null}
              title=""
            />
          </>
        );
      }

      case "artistPage": {
        return (
          <div className="artist-page-container">
            <TrackList
              tracks={artistPageTracks}
              isLoading={artistPageLoading}
              error={artistPageError}
              onPlayList={handlePlayList}
              onAddToQueue={addToQueue}
              onAddToPlaylist={handleAddToPlaylist}
              currentPlaylistId={null}
              currentPlayingTrackId={currentTrack?.id || null}
              title={
                artistPageArtistDetails
                  ? artistPageArtistDetails.name
                  : viewTitle
              }
            />
          </div>
        );
      }

      case "albumPage": {
        let headerTitle = viewTitle;
        if (albumPageAlbumDetails) {
          headerTitle = albumPageAlbumDetails.name;
        }

        return (
          <div className="album-page-container">
            {albumPageAlbumDetails && (
              <div className="album-page-header">
                <img
                  src={albumPageAlbumDetails.image}
                  alt={albumPageAlbumDetails.name}
                  className="album-art-large"
                />
                <div className="album-header-info">
                  <span className="album-header-type">ALBUM</span>
                  <h1>{albumPageAlbumDetails.name}</h1>
                  <p>By {albumPageAlbumDetails.artist_name}</p>
                </div>
              </div>
            )}
            <TrackList
              tracks={albumPageTracks}
              isLoading={albumPageLoading}
              error={albumPageError}
              onPlayList={handlePlayList}
              onAddToQueue={addToQueue}
              onAddToPlaylist={handleAddToPlaylist}
              currentPlaylistId={null}
              currentPlayingTrackId={currentTrack?.id || null}
              title={!albumPageAlbumDetails ? headerTitle : ""}
            />
          </div>
        );
      }

      default:
        return (
          <div className="view-placeholder">
            <h2>Page Not Found</h2>
          </div>
        );
    }
  };

  return (
    <div className="App">
      <Toaster
        position="top-center"
        reverseOrder={false}
        gutter={8}
        toastOptions={{
          className: "",
          duration: 4000,
          style: {
            background: "#363636",
            color: "#fff",
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: "green",
              secondary: "black",
            },
          },
          error: {
            duration: 5000,
          },
        }}
      />
      <div className="App-main-content-wrapper">
        <Sidebar
          activeView={activeView}
          activePlaylistId={activePlaylistId}
          onSetView={handleChangeView}
          playlists={playlists}
          setPlaylists={setPlaylists}
          onCreatePlaylist={promptCreatePlaylist}
        />
        <main className="App-content-area">
          {!currentUser ? (
            <div className="auth-page-container">
              {showLoginFormsView ? (
                <>
                  <LoginForm />
                  <p className="auth-toggle-text">
                    Don't have an account?{" "}
                    <button
                      onClick={() => setShowLoginFormsView(false)}
                      className="toggle-auth-link"
                    >
                      Sign Up
                    </button>
                  </p>
                </>
              ) : (
                <>
                  <SignupForm />
                  <p className="auth-toggle-text">
                    Already have an account?{" "}
                    <button
                      onClick={() => setShowLoginFormsView(true)}
                      className="toggle-auth-link"
                    >
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
        canPlayNext={queue.length > 1}
        canPlayPrevious={queue.length > 1}
      />
    </div>
  );
}

export default App;