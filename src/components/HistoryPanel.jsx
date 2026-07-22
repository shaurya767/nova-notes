import React from 'react';
import { Clock, RotateCcw, X, FileText } from 'lucide-react';

export default function HistoryPanel({
  isOpen,
  onClose,
  history,
  onRestoreVersion
}) {
  if (!isOpen) return null;

  // Format timestamp helper
  const formatTimeAgo = (timestamp) => {
    const diffMs = Date.now() - timestamp;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return new Date(timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="history-panel">
      <div className="history-panel-header">
        <div className="header-title-wrapper">
          <Clock size={16} className="history-icon" />
          <h3>Version History</h3>
        </div>
        <button className="close-history-btn" onClick={onClose} title="Close Panel">
          <X size={16} />
        </button>
      </div>

      <div className="history-list">
        {(!history || history.length === 0) ? (
          <div className="history-empty-state">
            <p>No previous versions logged yet.</p>
            <span className="history-sub-tip">Start typing in the editor and pause to auto-save history snapshots.</span>
          </div>
        ) : (
          [...history].reverse().map((version, idx) => {
            // Calculate index in original array (since we reversed it for rendering newest first)
            const originalIndex = history.length - 1 - idx;
            const wordCount = version.body.trim() === '' ? 0 : version.body.trim().split(/\s+/).length;
            const charCount = version.body.length;

            return (
              <div key={version.timestamp} className="history-card">
                <div className="history-card-header">
                  <span className="history-card-time">{formatTimeAgo(version.timestamp)}</span>
                  <button 
                    className="restore-version-btn"
                    onClick={() => {
                      if (confirm('Restore this note to this version? Current changes will be logged in history.')) {
                        onRestoreVersion(originalIndex);
                      }
                    }}
                    title="Restore this version"
                  >
                    <RotateCcw size={12} />
                    <span>Restore</span>
                  </button>
                </div>
                <h4 className="history-card-title">{version.title || 'Untitled Note'}</h4>
                <div className="history-card-stats">
                  <FileText size={10} />
                  <span>{wordCount} words / {charCount} chars</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
