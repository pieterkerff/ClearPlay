// src/components/Search/SearchInput.tsx
import React, { FormEvent } from "react"; // Removed useState if fully controlled
import "./SearchInput.css";

interface SearchInputProps {
  currentQuery: string; // Changed from initialQuery
  onQueryChange: (query: string) => void; // To update query in App.tsx
  // onSearchSubmit?: () => void; // Optional: if you want an explicit submit button in SearchInput
  // that might bypass debounce.
}

const SearchInput: React.FC<SearchInputProps> = ({
  currentQuery,
  onQueryChange,
  // onSearchSubmit
}) => {
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // If there's an onSearchSubmit prop, call it.
    // Otherwise, the debounced effect in App.tsx will handle the search.
    // if (onSearchSubmit) {
    //     onSearchSubmit();
    // }
    // For simplicity with debounce, often the form submit itself doesn't need to do much
    // if the search triggers on text change (debounced).
    // If you want Enter key to trigger immediate search (bypass debounce):
    // onSearchSubmit?.(); // Call the optional prop if provided.
  };

  return (
    <form onSubmit={handleSubmit} className="search-form-container">
      <input
        type="text"
        value={currentQuery} // Controlled component: value comes from App.tsx
        onChange={(e) => onQueryChange(e.target.value)} // Call prop to update App.tsx state
        placeholder="Search for tracks, artists, albums..."
        className="search-input-field"
        aria-label="Search music"
      />
      {/* 
            You could have a search button here. If so, its onClick would call onSearchSubmit 
            or the form's onSubmit would handle it.
            <button type="submit" className="search-submit-button">
                Search
            </button> 
            */}
    </form>
  );
};

export default SearchInput;
