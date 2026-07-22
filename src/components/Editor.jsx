import React, { useState, useEffect, useRef } from 'react';
import { 
  Star, 
  Archive, 
  Trash2, 
  RotateCcw,
  Eye, 
  Edit3, 
  Columns, 
  Copy, 
  Download,
  Plus,
  X,
  FileText,
  Clock,
  Sparkles,
  Command,
  CheckCircle2,
  RefreshCw,
  Calendar,
  BookOpen,
  Map
} from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';
import SlashMenu from './SlashMenu';
import HistoryPanel from './HistoryPanel';

export default function Editor({
  note,
  onUpdateNote,
  onDeleteNote,
  onRestoreNote,
  onPermanentlyDeleteNote,
  saveStatus,
  onOpenCommandPalette,
  noteHistory,
  onRestoreVersion,
  onCreateNoteFromTemplate
}) {
  const [splitView, setSplitView] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashMenuPos, setSlashMenuPos] = useState(null);
  
  // Slide-out panel for version history
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  
  const textareaRef = useRef(null);

  // Close slash menu & history panel when switching notes
  useEffect(() => {
    setTagInput('');
    setShowSlashMenu(false);
    setIsHistoryOpen(false);
  }, [note?.id]);

  if (!note) {
    return (
      <div className="editor-empty-state">
        <div className="empty-content">
          <div className="empty-logo">▲</div>
          <h2>Create, organize, refine</h2>
          <p>Choose an existing note from the sidebar, or start fresh with a clean note or template.</p>
          
          {/* Rich Templates Picker in Empty State */}
          <div className="empty-templates-section">
            <h4>Start with a Template</h4>
            <div className="template-cards-grid">
              <div className="template-card" onClick={() => onCreateNoteFromTemplate('meeting')}>
                <Calendar size={18} className="template-icon" />
                <h5>Meeting Notes</h5>
                <span>Agenda, sync, action items</span>
              </div>
              <div className="template-card" onClick={() => onCreateNoteFromTemplate('journal')}>
                <BookOpen size={18} className="template-icon" />
                <h5>Daily Journal</h5>
                <span>Reflection, gratitude, logs</span>
              </div>
              <div className="template-card" onClick={() => onCreateNoteFromTemplate('roadmap')}>
                <Map size={18} className="template-icon" />
                <h5>Project Roadmap</h5>
                <span>Milestones, backlog, tasks</span>
              </div>
            </div>
          </div>

          <div className="shortcut-guide">
            <div className="shortcut-row">
              <span className="shortcut-label">New Blank Note</span>
              <kbd>⌘N</kbd>
            </div>
            <div className="shortcut-row">
              <span className="shortcut-label">Quick Switcher</span>
              <kbd>⌘P</kbd>
            </div>
            <div className="shortcut-row">
              <span className="shortcut-label">Command Palette</span>
              <kbd>⌘K</kbd>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleTitleChange = (e) => {
    onUpdateNote({ ...note, title: e.target.value });
  };

  const handleBodyChange = (e) => {
    onUpdateNote({ ...note, body: e.target.value });
  };

  // Listen for the slash command character "/"
  const handleKeyDown = (e) => {
    if (e.key === '/') {
      const textarea = textareaRef.current;
      if (textarea) {
        const start = textarea.selectionStart;
        const text = textarea.value;
        const lineStartIdx = text.lastIndexOf('\n', start - 1) + 1;
        const lineText = text.substring(lineStartIdx, start);
        
        // Show slash menu if line is empty or only has spaces before "/"
        if (lineText.trim() === '') {
          setShowSlashMenu(true);
          setSlashMenuPos({ top: 120, left: 30 });
        }
      }
    }
  };

  // Action to insert prefix from SlashMenu
  const handleSelectBlock = (prefix) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;

    const before = text.substring(0, start - 1);
    const after = text.substring(end);

    const newContent = before + prefix + after;
    onUpdateNote({ ...note, body: newContent });
    setShowSlashMenu(false);

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start - 1 + prefix.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 50);
  };

  const handleTogglePin = () => {
    onUpdateNote({ ...note, pinned: !note.pinned });
  };

  const handleToggleArchive = () => {
    onUpdateNote({ ...note, archived: !note.archived });
  };

  // Add Tag
  const handleAddTag = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const cleanedTag = tagInput.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
      if (cleanedTag && !note.tags.includes(cleanedTag)) {
        onUpdateNote({
          ...note,
          tags: [...note.tags, cleanedTag]
        });
      }
      setTagInput('');
    }
  };

  // Remove Tag
  const handleRemoveTag = (tagToRemove) => {
    onUpdateNote({
      ...note,
      tags: note.tags.filter(t => t !== tagToRemove)
    });
  };

  // Copy note content
  const handleCopyText = () => {
    const noteContent = `${note.title}\n\n${note.body}`;
    navigator.clipboard.writeText(noteContent)
      .then(() => alert('Note content copied to clipboard!'))
      .catch(err => console.error('Failed to copy text: ', err));
  };

  // Download note as text file
  const handleDownloadNote = () => {
    const noteContent = `${note.title}\n\n${note.body}`;
    const blob = new Blob([noteContent], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${note.title.trim() || 'untitled-note'}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculate statistics
  const charCount = note.body.length;
  const wordCount = note.body.trim() === '' ? 0 : note.body.trim().split(/\s+/).length;
  const readingTime = Math.ceil(wordCount / 200);

  return (
    <div className="app-editor">
      {/* Editor Header Toolbar */}
      <header className="editor-header">
        <div className="editor-header-left">
          {note.trashed ? (
            <span className="trashed-badge">
              <Trash2 size={14} /> Trashed Note
            </span>
          ) : (
            <>
              <button 
                className={`toolbar-btn pin-btn ${note.pinned ? 'pinned-active' : ''}`}
                onClick={handleTogglePin}
                title={note.pinned ? 'Remove from Favorites' : 'Add to Favorites'}
              >
                <Star size={16} fill={note.pinned ? 'currentColor' : 'none'} />
              </button>
              
              <button 
                className={`toolbar-btn archive-btn ${note.archived ? 'archived-active' : ''}`}
                onClick={handleToggleArchive}
                title={note.archived ? 'Send to Notes' : 'Archive Note'}
              >
                <Archive size={16} />
              </button>
            </>
          )}
        </div>

        <div className="editor-header-right">
          {!note.trashed && (
            <>
              {/* View Toggles */}
              <div className="view-mode-group">
                <button 
                  className={`toolbar-btn ${!previewMode && !splitView ? 'active' : ''}`}
                  onClick={() => { setPreviewMode(false); setSplitView(false); }}
                  title="Edit Mode"
                >
                  <Edit3 size={16} />
                </button>
                <button 
                  className={`toolbar-btn ${previewMode && !splitView ? 'active' : ''}`}
                  onClick={() => { setPreviewMode(true); setSplitView(false); }}
                  title="Preview Mode"
                >
                  <Eye size={16} />
                </button>
                <button 
                  className={`toolbar-btn ${splitView ? 'active' : ''}`}
                  onClick={() => { setSplitView(true); setPreviewMode(false); }}
                  title="Split View"
                >
                  <Columns size={16} />
                </button>
              </div>

              <div className="toolbar-separator"></div>

              {/* Actions */}
              <button className="toolbar-btn" onClick={handleCopyText} title="Copy Note to Clipboard">
                <Copy size={16} />
              </button>
              <button className="toolbar-btn" onClick={handleDownloadNote} title="Download Note (.txt)">
                <Download size={16} />
              </button>

              <button 
                className={`toolbar-btn ${isHistoryOpen ? 'active' : ''}`}
                onClick={() => setIsHistoryOpen(!isHistoryOpen)} 
                title="Version History"
              >
                <Clock size={16} />
              </button>
              
              <button 
                className="toolbar-btn"
                onClick={onOpenCommandPalette}
                title="Command Palette (⌘K)"
              >
                <Command size={16} />
              </button>
            </>
          )}

          <div className="toolbar-separator"></div>

          {note.trashed ? (
            <div className="trash-actions">
              <button 
                className="restore-restore-btn"
                onClick={() => onRestoreNote(note.id)}
              >
                <RotateCcw size={14} />
                <span>Restore Note</span>
              </button>
              <button 
                className="restore-delete-btn"
                onClick={() => {
                  if (confirm('Permanently delete this note? This cannot be undone.')) {
                    onPermanentlyDeleteNote(note.id);
                  }
                }}
              >
                <Trash2 size={14} />
                <span>Delete Permanently</span>
              </button>
            </div>
          ) : (
            <button 
              className="toolbar-btn delete-btn" 
              onClick={() => onDeleteNote(note.id)} 
              title="Move to Trash"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </header>

      {/* Trashed Note Banner Alert */}
      {note.trashed && (
        <div className="trashed-note-banner">
          <p>This note is in the Trash. Restore it to continue editing.</p>
        </div>
      )}

      {/* Editor Metadata (Title & Tags) */}
      <div className="editor-meta">
        <input
          type="text"
          value={note.title}
          onChange={handleTitleChange}
          placeholder="Untitled Note"
          className="note-title-input"
          disabled={note.trashed}
        />
        
        {/* Tag Input & Chips */}
        <div className="tags-management">
          <div className="tags-container">
            {note.tags.map(tag => (
              <span key={tag} className="tag-chip">
                #{tag}
                {!note.trashed && (
                  <button className="remove-tag-btn" onClick={() => handleRemoveTag(tag)}>
                    <X size={10} />
                  </button>
                )}
              </span>
            ))}
          </div>
          {!note.trashed && (
            <div className="tag-input-wrapper">
              <Plus size={12} className="tag-plus-icon" />
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder="Add tag..."
                className="tag-input-field"
              />
            </div>
          )}
        </div>
      </div>

      {/* Workspace Area (Editor, Preview, or Split) */}
      <div className="editor-workspace-wrapper">
        <div className="editor-workspace">
          {/* Edit Panel */}
          {(!previewMode || splitView) && (
            <div className={`workspace-pane edit-pane ${splitView ? 'split' : ''}`}>
              <textarea
                ref={textareaRef}
                value={note.body}
                onChange={handleBodyChange}
                onKeyDown={handleKeyDown}
                placeholder="Start typing your note here... Type '/' to insert lists, headers, or formatting blocks."
                className="editor-textarea"
                disabled={note.trashed}
              />
            </div>
          )}

          {/* Preview Panel */}
          {(previewMode || splitView || note.trashed) && (
            <div className={`workspace-pane preview-pane ${splitView ? 'split' : ''}`}>
              <MarkdownRenderer content={note.body} />
            </div>
          )}

          {/* Slash contextual menu */}
          <SlashMenu 
            isOpen={showSlashMenu && !note.trashed}
            onClose={() => setShowSlashMenu(false)}
            onSelect={handleSelectBlock}
            position={slashMenuPos}
          />
        </div>

        {/* Slide-out Version History Panel */}
        <HistoryPanel 
          isOpen={isHistoryOpen && !note.trashed}
          onClose={() => setIsHistoryOpen(false)}
          history={noteHistory}
          onRestoreVersion={onRestoreVersion}
        />
      </div>

      {/* Editor Footer / Stats Bar */}
      <footer className="editor-footer">
        <div className="footer-stat">
          <FileText size={12} />
          <span>{wordCount} words</span>
        </div>
        <div className="footer-stat">
          <span>{charCount} characters</span>
        </div>
        <div className="footer-stat">
          <Clock size={12} />
          <span>{readingTime} min read</span>
        </div>
        
        {/* Autosave feedback indicator */}
        <div className="footer-stat autosave-indicator">
          {saveStatus === 'saving' ? (
            <>
              <RefreshCw size={12} className="saving-spinner" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <CheckCircle2 size={12} className="saved-icon" />
              <span>Saved locally</span>
            </>
          )}
        </div>
      </footer>
    </div>
  );
}
