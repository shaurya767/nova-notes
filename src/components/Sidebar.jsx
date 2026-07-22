import React from 'react';
import { 
  Inbox, 
  Star, 
  Archive, 
  Trash2, 
  Hash, 
  ChevronDown, 
  Keyboard,
  Plus
} from 'lucide-react';

export default function Sidebar({
  notes,
  activeNoteId,
  setActiveNoteId,
  onCreateNote,
  searchQuery,
  setSearchQuery,
  selectedTag,
  setSelectedTag,
  allTags,
  activeCollection,
  setActiveCollection,
  sortOption,
  setSortOption,
  onMoveNoteToCollection,
  theme,
  setTheme
}) {
  // Count helpers for collections
  const counts = {
    all: notes.filter(n => !n.archived && !n.trashed).length,
    favorites: notes.filter(n => n.pinned && !n.archived && !n.trashed).length,
    archive: notes.filter(n => n.archived && !n.trashed).length,
    trash: notes.filter(n => n.trashed).length
  };

  // Filter notes based on search query, selected tag, and active collection
  const filteredNotes = notes.filter(note => {
    // 1. Search filter
    const matchesSearch = 
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.body.toLowerCase().includes(searchQuery.toLowerCase());
    
    // 2. Tag filter
    const matchesTag = selectedTag === null || note.tags.includes(selectedTag);
    
    // 3. Collection filter
    let matchesCollection = false;
    if (activeCollection === 'all') {
      matchesCollection = !note.archived && !note.trashed;
    } else if (activeCollection === 'favorites') {
      matchesCollection = note.pinned && !note.archived && !note.trashed;
    } else if (activeCollection === 'archive') {
      matchesCollection = note.archived && !note.trashed;
    } else if (activeCollection === 'trash') {
      matchesCollection = note.trashed;
    }

    return matchesSearch && matchesTag && matchesCollection;
  });

  // Sort notes based on selected sort option
  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (sortOption === 'updated') {
      return b.updatedAt - a.updatedAt;
    } else if (sortOption === 'created') {
      return b.createdAt - a.createdAt;
    } else if (sortOption === 'title') {
      return a.title.localeCompare(b.title);
    }
    return 0;
  });

  // Drag over handler to allow dropping
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // Drop handler for collections
  const handleDrop = (e, targetCollection) => {
    e.preventDefault();
    const noteId = e.dataTransfer.getData('text/plain');
    if (noteId) {
      onMoveNoteToCollection(noteId, targetCollection);
    }
  };

  // Helper to format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <aside className="app-sidebar">
      {/* Sidebar Header */}
      <div className="sidebar-header">
        <div className="app-logo">
          <div className="logo-icon">▲</div>
          <h2>NovaNotes</h2>
        </div>
      </div>

      {/* New Note Button */}
      <button className="new-note-btn" onClick={onCreateNote}>
        <Plus size={16} />
        <span>New Note</span>
        <kbd className="shortcut-hint">⌘N</kbd>
      </button>

      {/* Search Input */}
      <div className="search-container">
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
        {searchQuery && (
          <button className="clear-search" onClick={() => setSearchQuery('')}>×</button>
        )}
      </div>

      {/* Collections Section */}
      <div className="sidebar-section">
        <h3 className="section-title">Library</h3>
        <div className="sidebar-links">
          <button 
            className={`sidebar-link ${activeCollection === 'all' ? 'active' : ''}`}
            onClick={() => { setActiveCollection('all'); setSelectedTag(null); }}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'all')}
          >
            <Inbox size={15} />
            <span>Notes</span>
            <span className="count-badge">{counts.all}</span>
          </button>
          
          <button 
            className={`sidebar-link ${activeCollection === 'favorites' ? 'active' : ''}`}
            onClick={() => { setActiveCollection('favorites'); setSelectedTag(null); }}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'favorite')}
          >
            <Star size={15} />
            <span>Favorites</span>
            <span className="count-badge">{counts.favorites}</span>
          </button>

          <button 
            className={`sidebar-link ${activeCollection === 'archive' ? 'active' : ''}`}
            onClick={() => { setActiveCollection('archive'); setSelectedTag(null); }}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'archive')}
          >
            <Archive size={15} />
            <span>Archive</span>
            <span className="count-badge">{counts.archive}</span>
          </button>

          <button 
            className={`sidebar-link ${activeCollection === 'trash' ? 'active' : ''}`}
            onClick={() => { setActiveCollection('trash'); setSelectedTag(null); }}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'trash')}
          >
            <Trash2 size={15} />
            <span>Trash</span>
            <span className="count-badge">{counts.trash}</span>
          </button>
        </div>
      </div>

      {/* Tags Section */}
      {allTags.length > 0 && (
        <div className="sidebar-section">
          <h3 className="section-title">Tags</h3>
          <div className="tags-list-container">
            {allTags.map(tag => {
              const count = notes.filter(n => n.tags.includes(tag) && !n.trashed).length;
              if (count === 0) return null;
              return (
                <button
                  key={tag}
                  className={`tag-filter-btn ${selectedTag === tag ? 'active' : ''}`}
                  onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                >
                  <Hash size={12} />
                  <span className="tag-name">{tag}</span>
                  <span className="count-badge">{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Notes List Section */}
      <div className="notes-list-section">
        <div className="notes-list-header">
          <h3 className="section-title">Notes ({sortedNotes.length})</h3>
          
          {/* Sorting Dropdown */}
          <div className="sort-wrapper">
            <select 
              value={sortOption} 
              onChange={(e) => setSortOption(e.target.value)}
              className="sort-select"
              title="Sort Notes"
            >
              <option value="updated">Date Updated</option>
              <option value="created">Date Created</option>
              <option value="title">Title (A-Z)</option>
            </select>
            <ChevronDown size={10} className="sort-chevron" />
          </div>
        </div>

        <div className="notes-list">
          {sortedNotes.length === 0 ? (
            <div className="empty-state">
              <p>No notes here</p>
            </div>
          ) : (
            sortedNotes.map(note => {
              const isActive = note.id === activeNoteId;
              const snippet = note.body.replace(/[#*`>_\-]/g, '').slice(0, 50) || 'Empty note';
              
              return (
                <div
                  key={note.id}
                  className={`note-item ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveNoteId(note.id)}
                  draggable="true"
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', note.id);
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                >
                  <div className="note-item-header">
                    <h4 className="note-item-title">
                      {note.title.trim() || 'Untitled Note'}
                    </h4>
                    <div className="note-item-indicators">
                      {note.pinned && <Star size={11} className="fav-star-icon" fill="currentColor" />}
                      {note.archived && <Archive size={11} className="archive-badge-icon" />}
                    </div>
                  </div>
                  
                  <p className="note-item-snippet">{snippet}</p>
                  
                  <div className="note-item-footer">
                    <span className="note-item-time">{formatTime(note.updatedAt)}</span>
                    <div className="note-item-tags">
                      {note.tags.slice(0, 2).map(tag => (
                        <span key={tag} className="note-item-tag">#{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Theme Picker & Shortcuts hint */}
      <div className="sidebar-footer">
        <div className="theme-selector-grid">
          <button 
            className={`theme-pill slate ${theme === 'slate' ? 'active' : ''}`} 
            onClick={() => setTheme('slate')}
            title="Slate Theme"
          />
          <button 
            className={`theme-pill charcoal ${theme === 'charcoal' ? 'active' : ''}`} 
            onClick={() => setTheme('charcoal')}
            title="Charcoal Theme"
          />
          <button 
            className={`theme-pill forest ${theme === 'forest' ? 'active' : ''}`} 
            onClick={() => setTheme('forest')}
            title="Forest Theme"
          />
          <button 
            className={`theme-pill cream ${theme === 'cream' ? 'active' : ''}`} 
            onClick={() => setTheme('cream')}
            title="Cream Theme"
          />
        </div>
        
        <div className="shortcuts-info-bar">
          <Keyboard size={12} />
          <span>⌘K Commands • ⌘P Switcher</span>
        </div>
      </div>
    </aside>
  );
}
