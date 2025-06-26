import { useState, useRef, useEffect, useCallback } from "react";
import { Toaster, toast } from "react-hot-toast"; // Ensure toast is imported
import TrackList from "./components/TrackList";
import {
  JamendoTrack,
  JamendoArtist,
  fetchPopularTracks,
  searchAllTypes,
  AllSearchResults,
  getTracksByArtistId, // <-- Add this import
} from "./services/JamendoService";
import {
  addTrackToPlaylist,
  getLikedTracks,
  getTracksForPlaylist,
  Playlist,
  removeTrackFromPlaylist,
  deletePlaylist,
  renamePlaylist as firestoreRenamePlaylist, // Aliased to avoid conflict if needed, or rename original
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
import RenamePlaylistToastForm from "./components/ToastForms/RenamePlaylistToastForm"; // IMPORT THE NEW COMPONENT

type ActiveView = "home" | "search" | "library" | "playlist" | "artistPage";
type ViewIdentifier = ActiveView | `playlist-${string}` | `artist-${string}`;

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
    // NEW
    tracks: [],
    artists: [],
    albums: [],
  });
  const [searchLoading, setSearchLoading] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500); // 500ms delay
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
    useState<JamendoArtist | null>(null); // Optional: if you want to display artist info
  const [artistPageLoading, setArtistPageLoading] = useState<boolean>(false);
  const [artistPageError, setArtistPageError] = useState<string | null>(null);

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
      toast.success(`Added "${track.name}" to playlist!`); // Use toast for success
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
      toast.success("Track removed from playlist."); // Use toast for success
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
      await firestoreRenamePlaylist(playlistId, newName); // Using aliased import or original name
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
            handleRenamePlaylist(playlistId, newNameFromToast); // Call original handler
            toast.dismiss(t.id);
          }}
          onCancel={() => {
            toast.dismiss(t.id);
          }}
        />
      ),
      {
        duration: Infinity, // Keep toast open until action or manual dismiss
        // You can add id here if you need to programmatically dismiss this specific toast later
        // id: `rename-playlist-toast-${playlistId}`
      }
    );
  };

  const handleChangeView = (viewIdentifier: ViewIdentifier) => {
    // Reset artist page specific states when navigating generally
    setViewingArtistId(null);
    setArtistPageTracks([]);
    setArtistPageArtistDetails(null);

    if (viewIdentifier.startsWith("playlist-")) {
      const id = viewIdentifier.replace("playlist-", "");
      setActivePlaylistId(id);
      setActiveView("playlist");
    } else if (viewIdentifier.startsWith("artist-")) {
      // NEW
      const id = viewIdentifier.replace("artist-", "");
      setViewingArtistId(id);
      setActiveView("artistPage");
    } else {
      setActivePlaylistId(null);
      setActiveView(viewIdentifier as ActiveView);
    }
  };

  const handleArtistClick = (artistId: string) => {
    // This function can be passed down to where artist items are rendered
    // It directly sets the necessary states and changes the view
    setViewingArtistId(artistId);
    setActiveView("artistPage");
    // Clear previous artist page data immediately for better UX
    setArtistPageTracks([]);
    setArtistPageArtistDetails(null); // If you fetch artist details
    setArtistPageLoading(true);
    setArtistPageError(null);
  };

  const performSearch = useCallback(async (queryToSearch: string) => {
    if (!queryToSearch.trim()) {
      setAllSearchResults({ tracks: [], artists: [], albums: [] });
      setSubmittedQuery(""); // Clear submitted query display
      setSearchLoading(false); // Ensure loading is off
      return;
    }
    setSearchLoading(true);
    setSearchError(null);
    setSubmittedQuery(queryToSearch); // Update what was searched for display

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
    setSearchQuery(newQuery); // Update the live input query
    if (newQuery.trim()) {
      // If there's a query, ensure we are in search view
      if (activeView !== "search") {
        setActiveView("search");
      }
    } else {
      // If query is cleared, clear submitted query and results
      setSubmittedQuery("");
      setAllSearchResults({ tracks: [], artists: [], albums: [] });
    }
  };

  useEffect(() => {
    // Only proceed if debouncedSearchQuery has a non-empty, trimmed value
    if (debouncedSearchQuery.trim()) {
      // Only perform the search if the active view is 'search'
      // This prevents searching if the user types something, then navigates away
      // before the debounce delay elapses.
      if (activeView === "search") {
        performSearch(debouncedSearchQuery);
      }
    } else if (activeView === "search") {
      // If the debounced query becomes empty (e.g., user clears the input)
      // while still in the search view, clear out previous results and submitted query.
      setAllSearchResults({ tracks: [], artists: [], albums: [] });
      setSubmittedQuery("");
      setSearchLoading(false); // Ensure loading is off
    }
  }, [debouncedSearchQuery, performSearch, activeView]);

  // --- Data Fetching Effects ---
  useEffect(() => {
    // 1. Handle currentUser changes (global reset if user logs out or changes)
    if (!currentUser) {
      // Clear all view-specific data
      setPopularTracks([]);
      setLibraryTracks([]);
      setPlaylistTracks([]);
      setPlaylists([]);

      // Clear player state
      setCurrentTrack(null);
      setQueue([]);
      setCurrentQueueIndex(-1);

      // Clear search state
      setSearchQuery("");
      setSubmittedQuery("");
      setAllSearchResults({ tracks: [], artists: [], albums: [] });

      // Reset view to home or a logged-out state if you have one
      setActiveView("home"); // Or a specific 'loggedOutHome'
      setViewTitle("Popular Tracks"); // Default title
      return; // Exit early if no user
    }

    // 2. Handle view switching for non-search views
    // The debounced search useEffect handles data for 'search' view.
    // This effect handles data fetching when activeView changes to something *else*,
    // or when dependencies for those views change (e.g., activePlaylistId).

    if (activeView === "home") {
      setViewTitle("Popular Tracks");
      // Optional: Only fetch if data isn't already there or to refresh
      // if (popularTracks.length === 0 || someConditionToRefresh) {
      setPopularLoading(true);
      setPopularError(null);
      fetchPopularTracks(20)
        .then(setPopularTracks)
        .catch((err) => setPopularError(err.message))
        .finally(() => setPopularLoading(false));
      // }
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
      setViewTitle("Artist Page"); // Will be updated with artist name
      setArtistPageLoading(true);
      setArtistPageError(null);

      getTracksByArtistId(viewingArtistId, 30)
        .then((tracks) => {
          setArtistPageTracks(tracks);
          if (tracks.length > 0) {
            setViewTitle(tracks[0].artist_name); // Use artist_name from the first track
            // For more robust artist details, you'd fetch the artist object separately
            // and store it in artistPageArtistDetails state
          } else {
            setViewTitle("Artist Page"); // Or "Artist Not Found" if you have separate artist details
          }
        })
        .catch((err) => {
          setArtistPageError(err.message);
          setViewTitle("Error Loading Artist");
        })
        .finally(() => {
          setArtistPageLoading(false);
        });
    } else if (activeView === "search") {
      // For 'search' view, this useEffect only sets the title.
      // Data fetching is handled by the debouncedSearch useEffect.
      if (submittedQuery) {
        // Title will be more dynamic in renderMainContent ("Results for...", "No results...")
        // This can be a fallback or general title.
        setViewTitle(`Search: ${submittedQuery}`);
      } else {
        setViewTitle("Search");
      }
    }

    // 3. Clear search results if navigating AWAY from the search view
    //    and a search had been previously submitted.
    if (activeView !== "search" && submittedQuery) {
      setAllSearchResults({ tracks: [], artists: [], albums: [] });
      setSubmittedQuery("");
      // Optionally reset searchQuery (the visual input) as well:
      // setSearchQuery('');
    }
  }, [
    activeView,
    currentUser,
    activePlaylistId,
    playlists, // For playlist view title and data
    submittedQuery,
    viewingArtistId,
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
            // onRemoveFromPlaylist={undefined} // Keep as is
            currentPlaylistId={null}
            currentPlayingTrackId={currentTrack?.id || null}
            title={viewTitle}
          />
        );

      case "search": {
        // Determine the main display title for the search area
        let overallSearchAreaTitle = "Search for music"; // Default when no query submitted
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

        // Condition to show the "No results found for..." message specifically
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

            {/* Display overall status/title for the search area */}
            {/* Show loading message centrally */}
            {searchLoading && (
              <div className="search-status-message">
                Searching for "{submittedQuery}"...
              </div>
            )}

            {/* Show error message centrally */}
            {searchError && (
              <div className="search-status-message error">
                Error: {searchError}
              </div>
            )}

            {/* Container for actual results, shown only if not loading and no error */}
            {!searchLoading && !searchError && submittedQuery && (
              <div className="search-results-page-container">
                <h2 className="search-results-area-title">
                  {overallSearchAreaTitle}
                </h2>

                {/* Tracks Section */}
                {allSearchResults.tracks.length > 0 && (
                  <section className="search-results-section tracks-section">
                    <h3>Tracks</h3>
                    <TrackList
                      tracks={allSearchResults.tracks}
                      isLoading={false} // Loading handled globally for search page
                      error={null} // Error handled globally for search page
                      onPlayList={handlePlayList}
                      onAddToQueue={addToQueue}
                      onAddToPlaylist={handleAddToPlaylist}
                      currentPlaylistId={null}
                      currentPlayingTrackId={currentTrack?.id || null}
                      title="" // Section has its own <h3>
                      isSearch
                    />
                  </section>
                )}

                {/* Artists Section - Basic List */}
                {allSearchResults.artists.length > 0 && (
                  <section className="search-results-section artists-section">
                    <h3>Artists</h3>
                    <ul className="basic-list artist-list">
                      {" "}
                      {/* Add your CSS classes */}
                      {allSearchResults.artists.map((artist) => (
                        <li
                          key={artist.id}
                          className="artist-search-item"
                          onClick={() => handleArtistClick(artist.id)} // <--- ADD THIS
                          style={{ cursor: "pointer" }} // Indicate it's clickable
                        >
                          <img
                            src={artist.image}
                            alt={artist.name}
                            className="item-image"
                          />
                          <div className="item-details">
                            <span className="item-name">{artist.name}</span>
                            {/* You might add an explicit "Artist" tag here */}
                          </div>
                          {/* Example: <button onClick={() => handleArtistClick(artist.id)}>View Artist</button> */}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {/* Albums Section - Basic List */}
                {allSearchResults.albums.length > 0 && (
                  <section className="search-results-section albums-section">
                    <h3>Albums</h3>
                    <ul className="basic-list album-list">
                      {" "}
                      {/* Add your CSS classes */}
                      {allSearchResults.albums.map((album) => (
                        <li key={album.id} className="album-search-item">
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
                          {/* Example: <button onClick={() => handleAlbumClick(album.id)}>View Album</button> */}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {/* Specific "No results found for your query" message */}
                {showNoResultsFoundMessage && (
                  <div className="search-status-message">
                    No tracks, artists, or albums found for "{submittedQuery}".
                    Try a different search term.
                  </div>
                )}
              </div>
            )}

            {/* Initial search prompt if no query has been submitted yet and not loading/error */}
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
            // onRemoveFromPlaylist={undefined} // Keep as is
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
          // Added !currentPlaylist check
          return (
            <div className="view-placeholder">
              <h2>Loading Playlist...</h2>
            </div>
          );
        }

        return (
          <>
            {!playlistLoading && ( // Ensure currentPlaylist exists before rendering header
              <PlaylistHeader
                playlistName={currentPlaylist.name}
                trackCount={playlistTracks.length}
                onDeletePlaylist={() =>
                  confirmDeletePlaylist(activePlaylistId, currentPlaylist.name)
                }
                // MODIFIED PROP TO CALL THE NEW TOAST FUNCTION
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
        // NEW CASE
        // You might want a dedicated ArtistHeader component here too
        // similar to PlaylistHeader, to show artist image, name, etc.
        // For now, viewTitle will show the artist's name (from useEffect).
        return (
          <div className="artist-page-container">
            {/* Optional: Display artist details if you fetched them */}
            {/* {artistPageArtistDetails && (
                    <div className="artist-page-header">
                        <img src={artistPageArtistDetails.image} alt={artistPageArtistDetails.name} />
                        <h1>{artistPageArtistDetails.name}</h1>
                    </div>
                )} */}
            <TrackList
              tracks={artistPageTracks}
              isLoading={artistPageLoading}
              error={artistPageError}
              onPlayList={handlePlayList}
              onAddToQueue={addToQueue}
              onAddToPlaylist={handleAddToPlaylist}
              currentPlaylistId={null} // Not a playlist view
              currentPlayingTrackId={currentTrack?.id || null}
              title={
                artistPageArtistDetails
                  ? artistPageArtistDetails.name
                  : viewTitle
              } // Use specific artist name if available
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
