import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Editor from './components/Editor';
import CommandPalette from './components/CommandPalette';
import NoteSwitcher from './components/NoteSwitcher';
import './App.css';

// Initial mock notes for a great first-launch experience
const INITIAL_NOTES = [
  {
    id: 'welcome',
    title: 'Welcome to NovaNotes 🚀',
    body: `Welcome to your premium, distraction-free note-taking workspace!

Here are some neat features you can explore right now:
* **Command Palette**: Press ⌘K (or Ctrl+K) anywhere to trigger actions instantly.
* **Quick Switcher**: Press ⌘P (or Ctrl+P) to search note titles and jump between notes instantly.
* **Slash Commands**: Start typing on a new line and press "/" to format text quickly.
* **Favorites**: Click the Star icon in the toolbar or drag a note into Favorites.
* **Version History**: Make some changes, wait 2 seconds, and click the Clock icon to see past versions.

Get started by editing this note or creating a new one from the templates below!`,
    pinned: true,
    archived: false,
    trashed: false,
    tags: ['guide', 'welcome'],
    createdAt: Date.now() - 3600000 * 2, // 2 hours ago
    updatedAt: Date.now() - 3600000 * 2
  },
  {
    id: 'formatting-guide',
    title: 'Writing Guide 📝',
    body: `# Formatting Quick Reference

You can format your notes using simple typing helpers.

## Headings
Use hashes at the start of a line to create headers:
# Large Heading
## Medium Heading
### Small Heading

## Tables & Images
Markdown tables and images render inline in the preview:

| Feature | Support | Shortcut |
|:---|:---:|---:|
| Checkboxes | Yes | \`- [ ]\` |
| Table grid | Yes | \`| cell |\` |
| Image files | Yes | \`![alt](url)\` |

![Vite Logo](https://vite.dev/logo-with-shadow.png)

## Lists & Tasks
- [x] Create a sleek note-taking app
- [ ] Add cloud database support (Phase 2)
- [ ] Deploy multi-user sync (Phase 3)

Enjoy writing in your clean editor!`,
    pinned: false,
    archived: false,
    trashed: false,
    tags: ['writing', 'guide'],
    createdAt: Date.now() - 3600000 * 24, // 1 day ago
    updatedAt: Date.now() - 3600000 * 24
  }
];

export default function App() {
  // ── localStorage persistence ──────────────────────────────────────────────
  // Each piece of state uses a lazy initializer: read from localStorage once
  // on mount, falling back to sensible defaults for first-time visitors.

  const [notes, setNotes] = useState(() => {
    try {
      const saved = localStorage.getItem('nova-notes-data');
      return saved ? JSON.parse(saved) : INITIAL_NOTES;
    } catch {
      return INITIAL_NOTES;
    }
  });

  const [activeNoteId, setActiveNoteId] = useState(() => {
    return localStorage.getItem('nova-notes-activeId') || 'welcome';
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState(null);

  const [activeCollection, setActiveCollection] = useState(() => {
    return localStorage.getItem('nova-notes-collection') || 'all';
  });

  const [sortOption, setSortOption] = useState(() => {
    return localStorage.getItem('nova-notes-sort') || 'updated';
  });

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('nova-notes-theme') || 'slate';
  });

  // Modals & Save states
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isNoteSwitcherOpen, setIsNoteSwitcherOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState('saved');

  // Note version history state: { [noteId]: [{ timestamp, title, body }] }
  const [noteHistory, setNoteHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('nova-notes-history');
      return saved ? JSON.parse(saved) : {
        'welcome': [
          {
            timestamp: Date.now() - 3600000 * 3,
            title: 'Initial Note Idea 💭',
            body: 'Welcome to your premium note-taking space. Start typing!'
          },
          {
            timestamp: Date.now() - 3600000 * 2,
            title: 'Welcome to NovaNotes 🚀',
            body: 'Welcome to your premium, distraction-free note-taking workspace!'
          }
        ]
      };
    } catch {
      return {};
    }
  });

  const saveTimeoutRef = useRef(null);
  const historyTimerRef = useRef(null);

  // ── Persist to localStorage on every relevant state change ───────────────
  useEffect(() => {
    try { localStorage.setItem('nova-notes-data', JSON.stringify(notes)); } catch { /* quota exceeded */ }
  }, [notes]);

  useEffect(() => {
    try { localStorage.setItem('nova-notes-history', JSON.stringify(noteHistory)); } catch { /* quota exceeded */ }
  }, [noteHistory]);

  useEffect(() => {
    localStorage.setItem('nova-notes-activeId', activeNoteId ?? '');
  }, [activeNoteId]);

  useEffect(() => {
    localStorage.setItem('nova-notes-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('nova-notes-sort', sortOption);
  }, [sortOption]);

  useEffect(() => {
    localStorage.setItem('nova-notes-collection', activeCollection);
  }, [activeCollection]);

  // Sync theme class with body element
  useEffect(() => {
    document.body.className = `theme-${theme}`;
  }, [theme]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const isModifier = isMac ? e.metaKey : e.ctrlKey;

      // ⌘K - Command Palette
      if (isModifier && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }

      // ⌘P - Quick Switcher
      if (isModifier && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setIsNoteSwitcherOpen(prev => !prev);
      }

      // ⌘N - New Note
      if (isModifier && e.key.toLowerCase() === 'n' && !e.altKey) {
        e.preventDefault();
        handleCreateNote();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [notes, activeNoteId]);

  // Extract all unique active tags
  const allTags = Array.from(
    new Set(notes.reduce((tags, note) => {
      if (!note.trashed) {
        return [...tags, ...note.tags];
      }
      return tags;
    }, []))
  ).sort();

  // Find active note object
  const activeNote = notes.find(n => n.id === activeNoteId);

  // Create Note Action
  const handleCreateNote = () => {
    const newNote = {
      id: `note-${Date.now()}`,
      title: 'Untitled Note',
      body: '',
      pinned: false,
      archived: false,
      trashed: false,
      tags: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    setNotes(prevNotes => [newNote, ...prevNotes]);
    setActiveNoteId(newNote.id);
    setActiveCollection('all');
    setSelectedTag(null);
    setSearchQuery('');
  };

  // Create Note from Templates
  const handleCreateNoteFromTemplate = (templateType) => {
    const todayStr = new Date().toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    let title = 'Untitled Note';
    let body = '';
    let tags = [];

    if (templateType === 'meeting') {
      title = `Sync Meeting - ${todayStr} 🗓️`;
      body = `# Weekly Team Sync Agenda

Date: ${todayStr}
Participants: @You, @Team

## Discussion Topics
- [ ] Review progress targets
- [ ] Align on design updates
- [ ] Address pipeline blocks

## Decision Grid
| Discussion Point | Decision | Owner |
|---|:---:|---:|
| Landing page color | Muted Indigo | @Design |
| DB Architecture | Client local state | @Dev |

Enjoy note taking!`;
      tags = ['meeting', 'sync'];
    } else if (templateType === 'journal') {
      title = `Daily Log - ${todayStr} ☀️`;
      body = `# Daily Journal Log
Date: ${todayStr}

> "Write down the thoughts of today so you can plan the victories of tomorrow."

## Intentions for Today
1. Focus on code quality and clean refactorings.
2. Complete portfolio components.

## Checklist Grid
| Priority | Task Description | Completed |
|---|:---|:---:|
| High | Styling CSS variables | Yes |
| Medium | Tag filters validation | No |

## Reflection & Gratitude
- I am grateful for the clean coding slate.`;
      tags = ['journal', 'personal'];
    } else if (templateType === 'roadmap') {
      title = 'Project Roadmap & Backlog 🗺️';
      body = `# Project Roadmap Checklist

A roadmap checklist detailing product features and implementation milestones.

## Milestones
- [x] Phase 1: Client UI layouts
- [ ] Phase 2: Offline persistence (IndexDB)
- [ ] Phase 3: Collaborative server sync

## Backlog Priority Table
| Ticket | Feature description | Priority | Status |
|---|---|:---:|---:|
| #101 | Add vector database embedding | High | Backlog |
| #102 | Add AI review assistant | Medium | Backlog |`;
      tags = ['roadmap', 'coding'];
    }

    const newNote = {
      id: `note-${Date.now()}`,
      title,
      body,
      pinned: false,
      archived: false,
      trashed: false,
      tags,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    setNotes(prevNotes => [newNote, ...prevNotes]);
    setActiveNoteId(newNote.id);
    setActiveCollection('all');
    setSelectedTag(null);
    setSearchQuery('');
  };

  // Update Note Action with Debounced Autosave and Version history logging
  const handleUpdateNote = (updatedNote) => {
    setSaveStatus('saving');

    setNotes(prevNotes => 
      prevNotes.map(n => 
        n.id === updatedNote.id 
          ? { ...updatedNote, updatedAt: Date.now() } 
          : n
      )
    );

    // Debounce save spinner reset
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      setSaveStatus('saved');
    }, 600);

    // Debounce version history logging (2 seconds of typing pause)
    if (historyTimerRef.current) clearTimeout(historyTimerRef.current);
    historyTimerRef.current = setTimeout(() => {
      logHistorySnapshot(updatedNote);
    }, 2000);
  };

  // Log version history snapshot helper
  const logHistorySnapshot = (noteToLog) => {
    setNoteHistory(prevHistory => {
      const currentList = prevHistory[noteToLog.id] || [];
      const lastVersion = currentList[currentList.length - 1];

      // Prevent redundant snapshots if title and body are identical
      if (!lastVersion || lastVersion.body !== noteToLog.body || lastVersion.title !== noteToLog.title) {
        const newSnapshot = {
          timestamp: Date.now(),
          title: noteToLog.title,
          body: noteToLog.body
        };
        return {
          ...prevHistory,
          [noteToLog.id]: [...currentList, newSnapshot]
        };
      }
      return prevHistory;
    });
  };

  // Restore Note Version Action
  const handleRestoreVersion = (versionIndex) => {
    const activeHistory = noteHistory[activeNoteId] || [];
    const targetVersion = activeHistory[versionIndex];
    if (targetVersion && activeNote) {
      // First log current state so they don't lose work
      logHistorySnapshot(activeNote);

      const restoredNote = {
        ...activeNote,
        title: targetVersion.title,
        body: targetVersion.body
      };

      handleUpdateNote(restoredNote);
    }
  };

  // Trash Note (Soft delete)
  const handleTrashNote = (idToTrash) => {
    setNotes(prevNotes => 
      prevNotes.map(n => 
        n.id === idToTrash 
          ? { ...n, trashed: true, pinned: false, archived: false, updatedAt: Date.now() } 
          : n
      )
    );
    autoSelectAfterStatusChange(idToTrash);
  };

  // Archive Note
  const handleArchiveNote = (idToArchive) => {
    setNotes(prevNotes => 
      prevNotes.map(n => 
        n.id === idToArchive 
          ? { ...n, archived: true, pinned: false, updatedAt: Date.now() } 
          : n
      )
    );
    autoSelectAfterStatusChange(idToArchive);
  };

  // Restore Note
  const handleRestoreNote = (idToRestore) => {
    setNotes(prevNotes => 
      prevNotes.map(n => 
        n.id === idToRestore 
          ? { ...n, trashed: false, archived: false, updatedAt: Date.now() } 
          : n
      )
    );
    setActiveNoteId(idToRestore);
    setActiveCollection('all');
  };

  // Permanent Delete
  const handlePermanentlyDeleteNote = (idToDelete) => {
    setNotes(prevNotes => prevNotes.filter(n => n.id !== idToDelete));
    // Clear history
    setNoteHistory(prevHistory => {
      const copy = { ...prevHistory };
      delete copy[idToDelete];
      return copy;
    });
    autoSelectAfterStatusChange(idToDelete);
  };

  // Drag-and-Drop Action: Move Note status directly
  const handleMoveNoteToCollection = (noteId, targetCollection) => {
    setNotes(prevNotes => 
      prevNotes.map(n => {
        if (n.id !== noteId) return n;

        let updated = { ...n, updatedAt: Date.now() };
        if (targetCollection === 'all') {
          updated.archived = false;
          updated.trashed = false;
        } else if (targetCollection === 'favorite') {
          updated.pinned = true;
          updated.archived = false;
          updated.trashed = false;
        } else if (targetCollection === 'archive') {
          updated.archived = true;
          updated.pinned = false;
          updated.trashed = false;
        } else if (targetCollection === 'trash') {
          updated.trashed = true;
          updated.pinned = false;
          updated.archived = false;
        }
        return updated;
      })
    );

    if (activeNoteId === noteId) {
      setTimeout(() => autoSelectAfterStatusChange(noteId), 50);
    }
  };

  // Auto-selection helper when notes list changes visibility
  const autoSelectAfterStatusChange = (changedNoteId) => {
    setNotes(currentNotes => {
      const remainingNotes = currentNotes.filter(n => {
        if (n.id === changedNoteId) return false;
        if (activeCollection === 'all') return !n.archived && !n.trashed;
        if (activeCollection === 'favorites') return n.pinned && !n.archived && !n.trashed;
        if (activeCollection === 'archive') return n.archived && !n.trashed;
        if (activeCollection === 'trash') return n.trashed;
        return true;
      });

      if (remainingNotes.length > 0) {
        setActiveNoteId(remainingNotes[0].id);
      } else {
        setActiveNoteId(null);
      }
      return currentNotes;
    });
  };

  // Actions list for Command Palette (⌘K)
  const commandPaletteActions = [
    { name: 'Create New Blank Note', shortcut: '⌘N', perform: handleCreateNote },
    { name: 'Create Meeting Notes template', shortcut: '', perform: () => handleCreateNoteFromTemplate('meeting') },
    { name: 'Create Daily Journal template', shortcut: '', perform: () => handleCreateNoteFromTemplate('journal') },
    { name: 'Create Project Roadmap template', shortcut: '', perform: () => handleCreateNoteFromTemplate('roadmap') },
    { name: 'Open Note Quick Switcher', shortcut: '⌘P', perform: () => setIsNoteSwitcherOpen(true) },
    { 
      name: activeNote?.pinned ? 'Remove from Favorites' : 'Add to Favorites', 
      shortcut: '', 
      perform: () => activeNote && handleUpdateNote({ ...activeNote, pinned: !activeNote.pinned }) 
    },
    { 
      name: activeNote?.archived ? 'Send to Notes' : 'Archive Note', 
      shortcut: '', 
      perform: () => activeNote && handleUpdateNote({ ...activeNote, archived: !activeNote.archived }) 
    },
    { 
      name: 'Move Note to Trash', 
      shortcut: '⌘⌫', 
      perform: () => activeNote && handleTrashNote(activeNote.id) 
    },
    { 
      name: 'Copy Note Content', 
      shortcut: '', 
      perform: () => {
        if (!activeNote) return;
        const text = `${activeNote.title}\n\n${activeNote.body}`;
        navigator.clipboard.writeText(text).then(() => alert('Copied note content!'));
      }
    },
    { name: 'Switch Theme to Slate (Muted Blue)', shortcut: '', perform: () => setTheme('slate') },
    { name: 'Switch Theme to Charcoal Dark', shortcut: '', perform: () => setTheme('charcoal') },
    { name: 'Switch Theme to Forest Green', shortcut: '', perform: () => setTheme('forest') },
    { name: 'Switch Theme to Cream Light', shortcut: '', perform: () => setTheme('cream') }
  ];

  return (
    <div className={`app-container theme-${theme}`}>
      <Sidebar
        notes={notes}
        activeNoteId={activeNoteId}
        setActiveNoteId={setActiveNoteId}
        onCreateNote={handleCreateNote}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedTag={selectedTag}
        setSelectedTag={setSelectedTag}
        allTags={allTags}
        activeCollection={activeCollection}
        setActiveCollection={setActiveCollection}
        sortOption={sortOption}
        setSortOption={setSortOption}
        onMoveNoteToCollection={handleMoveNoteToCollection}
        theme={theme}
        setTheme={setTheme}
      />
      <main className="app-main">
        <Editor
          note={activeNote}
          onUpdateNote={handleUpdateNote}
          onDeleteNote={handleTrashNote}
          onRestoreNote={handleRestoreNote}
          onPermanentlyDeleteNote={handlePermanentlyDeleteNote}
          saveStatus={saveStatus}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          noteHistory={activeNote ? (noteHistory[activeNote.id] || []) : []}
          onRestoreVersion={handleRestoreVersion}
          onCreateNoteFromTemplate={handleCreateNoteFromTemplate}
        />
      </main>

      {/* Command Palette (⌘K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        actions={commandPaletteActions}
      />

      {/* Raycast Quick Switcher (⌘P) */}
      <NoteSwitcher
        isOpen={isNoteSwitcherOpen}
        onClose={() => setIsNoteSwitcherOpen(false)}
        notes={notes}
        onSelectNote={(noteId) => {
          setActiveNoteId(noteId);
          setActiveCollection('all'); // switch back to active notes if switcher selecting archived/faves
        }}
      />
    </div>
  );
}
