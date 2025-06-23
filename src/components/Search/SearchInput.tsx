import React, { useState, FormEvent } from 'react';
import './SearchInput.css';

interface SearchInputProps {
    onSearch: (query: string) => void;
    initialQuery?: string;
}

const SearchInput: React.FC<SearchInputProps> = ({ onSearch, initialQuery = '' }) => {
    const [query, setQuery] = useState(initialQuery);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        onSearch(query);
    };

    return (
        <form onSubmit={handleSubmit} className="search-form-container">
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for artists, songs, or albums..."
                className="search-input-field"
                aria-label="Search music"
            />
            <button type="submit" className="search-submit-button">
                Search
            </button>
        </form>
    );
};

export default SearchInput;