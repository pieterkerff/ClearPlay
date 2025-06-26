import React, { useState, FormEvent } from 'react';
import './RenamePlaylistToastForm.css';
// You might want a generic CSS for toast forms or reuse parts of App.css
// For now, let's assume some styles will be in App.css or a new ToastForms.css

interface RenamePlaylistToastFormProps {
    currentName: string;
    onConfirm: (newName: string) => void;
    onCancel: () => void;
}

const RenamePlaylistToastForm: React.FC<RenamePlaylistToastFormProps> = ({
    currentName,
    onConfirm,
    onCancel,
}) => {
    const [newName, setNewName] = useState(currentName);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (newName.trim() && newName.trim() !== currentName) {
            onConfirm(newName.trim());
        } else if (newName.trim() === currentName) {
            onCancel(); // Or show a small message "Name is the same"
        } else {
            // Optionally, handle empty name case with an alert or inline message
            // For now, it will just not submit if empty.
        }
    };

    return (
        <form onSubmit={handleSubmit} className="rename-toast-form"> {/* Add CSS class */}
            <p>Rename playlist <strong>"{currentName}"</strong></p>
            <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Enter new playlist name"
                className="rename-input" // Add CSS class
                autoFocus
            />
            <div className="confirmation-buttons"> {/* Reuse existing CSS class */}
                <button type="submit" className="confirm-btn"> {/* Add CSS class */}
                    Save
                </button>
                <button type="button" onClick={onCancel} className="cancel-btn"> {/* Add CSS class */}
                    Cancel
                </button>
            </div>
        </form>
    );
};

export default RenamePlaylistToastForm;