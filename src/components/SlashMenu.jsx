import React, { useState, useEffect, useRef } from 'react';
import { Heading1, Heading2, Heading3, List, CheckSquare, Quote, FileCode, Minus } from 'lucide-react';

const ITEMS = [
  { label: 'Large Heading', prefix: '# ', icon: Heading1, desc: 'Large section heading' },
  { label: 'Medium Heading', prefix: '## ', icon: Heading2, desc: 'Medium section heading' },
  { label: 'Small Heading', prefix: '### ', icon: Heading3, desc: 'Small sub-heading' },
  { label: 'Bullet List', prefix: '- ', icon: List, desc: 'Simple bulleted list' },
  { label: 'Task List', prefix: '- [ ] ', icon: CheckSquare, desc: 'Interactive task checklist' },
  { label: 'Quote Block', prefix: '> ', icon: Quote, desc: 'Stylized blockquote quote' },
  { label: 'Code Block', prefix: '```javascript\n\n```', icon: FileCode, desc: 'Monospace code block' },
  { label: 'Divider Line', prefix: '\n---\n', icon: Minus, desc: 'Horizontal line divider' }
];

export default function SlashMenu({
  isOpen,
  onClose,
  onSelect,
  position
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Click outside listener
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen, onClose]);

  // Keyboard navigation inside textarea
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % ITEMS.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + ITEMS.length) % ITEMS.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        onSelect(ITEMS[selectedIndex].prefix);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, selectedIndex, onSelect, onClose]);

  if (!isOpen) return null;

  const style = position 
    ? { top: `${position.top}px`, left: `${position.left}px` } 
    : { bottom: '48px', right: '24px' }; // Fallback floating placement

  return (
    <div 
      className="slash-menu" 
      style={style} 
      ref={menuRef}
    >
      <div className="slash-menu-header">
        <span>Insert Block</span>
      </div>
      <div className="slash-menu-items">
        {ITEMS.map((item, index) => {
          const isSelected = index === selectedIndex;
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              className={`slash-menu-item ${isSelected ? 'selected' : ''}`}
              onClick={() => onSelect(item.prefix)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className="item-icon-wrapper">
                <Icon size={14} />
              </div>
              <div className="item-details">
                <span className="item-label">{item.label}</span>
                <span className="item-desc">{item.desc}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
