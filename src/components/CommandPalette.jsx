import React, { useState, useEffect, useRef } from 'react';
import { Search, Terminal, CornerDownLeft } from 'lucide-react';

export default function CommandPalette({
  isOpen,
  onClose,
  actions
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

  // Filter actions based on search
  const filteredActions = actions.filter(action =>
    action.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % filteredActions.length);
      scrollSelectedIntoView();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredActions.length) % filteredActions.length);
      scrollSelectedIntoView();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredActions[selectedIndex]) {
        filteredActions[selectedIndex].perform();
        onClose();
      }
    }
  };

  const scrollSelectedIntoView = () => {
    setTimeout(() => {
      const selectedElement = resultsRef.current?.querySelector('.command-item.selected');
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }, 10);
  };

  return (
    <div className="command-palette-overlay" onClick={onClose}>
      <div 
        className="command-palette" 
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="command-search-wrapper">
          <Search size={18} className="command-search-icon" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            className="command-input"
          />
          <kbd className="command-esc-hint">ESC</kbd>
        </div>

        <div className="command-results" ref={resultsRef}>
          {filteredActions.length === 0 ? (
            <div className="command-no-results">No commands found</div>
          ) : (
            filteredActions.map((action, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={action.name}
                  className={`command-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    action.perform();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <Terminal size={14} className="command-item-icon" />
                  <span className="command-item-name">{action.name}</span>
                  
                  {action.shortcut && (
                    <span className="command-item-shortcut">{action.shortcut}</span>
                  )}
                  {isSelected && (
                    <span className="command-item-enter">
                      <CornerDownLeft size={10} />
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
        
        <div className="command-palette-footer">
          <span>Use ↑↓ to navigate</span>
          <span>↵ to select</span>
        </div>
      </div>
    </div>
  );
}
