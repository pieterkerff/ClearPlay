import React, { useState, FormEvent } from 'react';
// We can reuse the same CSS file and classes from the rename form
import './RenamePlaylistToastForm.css'; 

interface CreatePlaylistToastFormProps {
    // This function will be called with the new name when the user confirms.
    onConfirm: (playlistName: string) => void;
    // This function is called when the user clicks cancel or submits an empty form.
    onCancel: () => void;
}

const CreatePlaylistToastForm: React.FC<CreatePlaylistToastFormProps> = ({
    onConfirm,
    onCancel,
}) => {
    // State to hold the value of the input field
    const [playlistName, setPlaylistName] = useState('');

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        const trimmedName = playlistName.trim();

        // Only confirm if the user has entered a non-empty name
        if (trimmedName) {
            onConfirm(trimmedName);
        } else {
            // If the name is empty, we can just cancel the operation.
            // Optionally, you could show a validation message here.
            onCancel();
        }
    };

    return (
        // Use the same class as the rename form to reuse styles
        <form onSubmit={handleSubmit} className="rename-toast-form"> 
            <p><strong>Create a new playlist</strong></p>
            <input
                type="text"
                value={playlistName}
                onChange={(e) => setPlaylistName(e.target.value)}
                placeholder="Enter playlist name"
                className="rename-input" // Reuse the input style class
                autoFocus // Automatically focus the input when the toast appears
            />
            <div className="confirmation-buttons"> {/* Reuse the button container class */}
                <button type="submit" className="confirm-btn">
                    Create
                </button>
                <button type="button" onClick={onCancel} className="cancel-btn">
                    Cancel
                </button>
            </div>
        </form>
    );
};

export default CreatePlaylistToastForm;