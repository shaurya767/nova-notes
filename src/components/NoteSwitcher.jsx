import React, { useState, useEffect, useRef } from 'react';
import { Search, FileText, Star, Archive, CornerDownLeft } from 'lucide-react';

export default function NoteSwitcher({
  isOpen,
  onClose,
  notes,
  onSelectNote
}) {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const resultsRef = useRef(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Handle global escape key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Filter notes based on search query (excluding trashed notes for cleaner navigation)
  const filteredNotes = notes
    .filter(note => !note.trashed)
    .filter(note =>
      note.title.toLowerCase().includes(search.toLowerCase()) ||
      note.body.toLowerCase().includes(search.toLowerCase())
    );

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % filteredNotes.length);
      scrollSelectedIntoView();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredNotes.length) % filteredNotes.length);
      scrollSelectedIntoView();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredNotes[selectedIndex]) {
        onSelectNote(filteredNotes[selectedIndex].id);
        onClose();
      }
    }
  };

  const scrollSelectedIntoView = () => {
    setTimeout(() => {
      const selectedElement = resultsRef.current?.querySelector('.switcher-item.selected');
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }, 10);
  };

  return (
    <div className="switcher-overlay" onClick={onClose}>
      <div 
        className="switcher-palette" 
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="switcher-search-wrapper">
          <Search size={18} className="switcher-search-icon" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search note titles or content..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            className="switcher-input"
          />
          <kbd className="switcher-esc-hint">ESC</kbd>
        </div>

        <div className="switcher-results" ref={resultsRef}>
          {filteredNotes.length === 0 ? (
            <div className="switcher-no-results">No matching notes found</div>
          ) : (
            filteredNotes.map((note, index) => {
              const isSelected = index === selectedIndex;
              const snippet = note.body.replace(/[#*`>_\-]/g, '').slice(0, 60) || 'Empty note';
              return (
                <div
                  key={note.id}
                  className={`switcher-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    onSelectNote(note.id);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <FileText size={14} className="switcher-item-icon" />
                  
                  <div className="switcher-item-content">
                    <div className="switcher-item-row">
                      <span className="switcher-item-title">
                        {note.title.trim() || 'Untitled Note'}
                      </span>
                      <div className="switcher-item-badges">
                        {note.pinned && <Star size={11} className="fav-star-icon" fill="currentColor" />}
                        {note.archived && <Archive size={11} className="archive-badge-icon" />}
                      </div>
                    </div>
                    <span className="switcher-item-snippet">{snippet}</span>
                  </div>

                  {isSelected && (
                    <span className="switcher-item-enter">
                      <CornerDownLeft size={10} />
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
        
        <div className="switcher-palette-footer">
          <span>{filteredNotes.length} notes found</span>
          <span>Use ↑↓ to navigate, ↵ to open</span>
        </div>
      </div>
    </div>
  );
}
