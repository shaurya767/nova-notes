import React from 'react';

/**
 * A lightweight, custom React Markdown Renderer.
 * Converts markdown text into stylized HTML React elements safely.
 */
export default function MarkdownRenderer({ content }) {
  if (!content) return <p className="markdown-placeholder">No content to preview</p>;

  const lines = content.split('\n');
  const renderedElements = [];
  
  let inCodeBlock = false;
  let codeBlockLanguage = '';
  let codeBlockLines = [];

  const parseInlineMarkdown = (text) => {
    // Escape HTML tags to prevent XSS while we render inline elements via React
    let safeText = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Images: ![alt](url)
    safeText = safeText.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="markdown-image" />');

    // Code blocks/inline code: `code`
    safeText = safeText.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

    // Bold: **text**
    safeText = safeText.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // Italic: *text* or _text_
    safeText = safeText.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    safeText = safeText.replace(/_([^_]+)_/g, '<em>$1</em>');

    // Links: [text](url)
    safeText = safeText.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    return <span dangerouslySetInnerHTML={{ __html: safeText }} />;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Handle Code Blocks
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        // End of code block
        renderedElements.push(
          <pre key={`code-${i}`} className="markdown-code-block">
            {codeBlockLanguage && <div className="code-lang-tag">{codeBlockLanguage}</div>}
            <code>{codeBlockLines.join('\n')}</code>
          </pre>
        );
        inCodeBlock = false;
        codeBlockLines = [];
        codeBlockLanguage = '';
      } else {
        // Start of code block
        inCodeBlock = true;
        codeBlockLanguage = line.trim().slice(3).trim() || 'javascript';
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      continue;
    }

    // Horizontal Rule
    if (line.trim() === '---') {
      renderedElements.push(<hr key={`hr-${i}`} className="markdown-hr" />);
      continue;
    }

    // Tables parsing support
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      const nextLine = lines[i + 1];
      if (nextLine && nextLine.trim().startsWith('|') && nextLine.trim().match(/^[|:\-\s]+$/)) {
        const headerRow = line;
        const separatorRow = nextLine;
        
        const headers = headerRow.split('|').map(s => s.trim()).filter((s, idx, arr) => idx > 0 && idx < arr.length - 1);
        const alignments = separatorRow.split('|').map(s => s.trim()).filter((s, idx, arr) => idx > 0 && idx < arr.length - 1).map(sep => {
          if (sep.startsWith(':') && sep.endsWith(':')) return 'center';
          if (sep.endsWith(':')) return 'right';
          return 'left';
        });
        
        const tableRows = [];
        i += 2; // skip header and separator
        
        while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
          const cells = lines[i].split('|').map(s => s.trim()).filter((s, idx, arr) => idx > 0 && idx < arr.length - 1);
          tableRows.push(cells);
          i++;
        }
        i--; // back one step for loop increment
        
        renderedElements.push(
          <div key={`table-${i}`} className="markdown-table-wrapper">
            <table className="markdown-table">
              <thead>
                <tr>
                  {headers.map((h, hIdx) => (
                    <th key={hIdx} style={{ textAlign: alignments[hIdx] || 'left' }}>
                      {parseInlineMarkdown(h)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row, rIdx) => (
                  <tr key={rIdx}>
                    {headers.map((_, cIdx) => (
                      <td key={cIdx} style={{ textAlign: alignments[cIdx] || 'left' }}>
                        {parseInlineMarkdown(row[cIdx] || '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        continue;
      }
    }

    // Headings
    if (line.startsWith('# ')) {
      renderedElements.push(<h1 key={`h1-${i}`} className="markdown-h1">{parseInlineMarkdown(line.slice(2))}</h1>);
      continue;
    }
    if (line.startsWith('## ')) {
      renderedElements.push(<h2 key={`h2-${i}`} className="markdown-h2">{parseInlineMarkdown(line.slice(3))}</h2>);
      continue;
    }
    if (line.startsWith('### ')) {
      renderedElements.push(<h3 key={`h3-${i}`} className="markdown-h3">{parseInlineMarkdown(line.slice(4))}</h3>);
      continue;
    }

    // Blockquotes
    if (line.startsWith('> ')) {
      renderedElements.push(<blockquote key={`quote-${i}`} className="markdown-blockquote">{parseInlineMarkdown(line.slice(2))}</blockquote>);
      continue;
    }

    // Task list: - [ ] or - [x]
    if (line.trim().startsWith('- [ ] ') || line.trim().startsWith('- [x] ') || line.trim().startsWith('* [ ] ') || line.trim().startsWith('* [x] ')) {
      const isChecked = line.includes('[x]');
      const contentText = line.split(/\[[ x]\]/)[1] || '';
      renderedElements.push(
        <div key={`task-${i}`} className="markdown-task-item">
          <input type="checkbox" checked={isChecked} readOnly className="markdown-task-checkbox" />
          <span className={isChecked ? 'task-checked' : ''}>{parseInlineMarkdown(contentText.trim())}</span>
        </div>
      );
      continue;
    }

    // Unordered lists: - item or * item
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      const contentText = line.trim().startsWith('- ') ? line.trim().slice(2) : line.trim().slice(2);
      renderedElements.push(
        <ul key={`ul-${i}`} className="markdown-ul">
          <li>{parseInlineMarkdown(contentText)}</li>
        </ul>
      );
      continue;
    }

    // Ordered lists: 1. item
    const matchOrdered = line.trim().match(/^(\d+)\.\s+(.*)$/);
    if (matchOrdered) {
      renderedElements.push(
        <ol key={`ol-${i}`} className="markdown-ol" start={matchOrdered[1]}>
          <li>{parseInlineMarkdown(matchOrdered[2])}</li>
        </ol>
      );
      continue;
    }

    // Default paragraph
    if (line.trim() === '') {
      // Empty line renders small spacer
      renderedElements.push(<div key={`spacer-${i}`} className="markdown-spacer" />);
    } else {
      renderedElements.push(<p key={`p-${i}`} className="markdown-p">{parseInlineMarkdown(line)}</p>);
    }
  }

  // Handle unclosed code block at end of document
  if (inCodeBlock) {
    renderedElements.push(
      <pre key="code-unclosed" className="markdown-code-block">
        {codeBlockLanguage && <div className="code-lang-tag">{codeBlockLanguage}</div>}
        <code>{codeBlockLines.join('\n')}</code>
      </pre>
    );
  }

  return <div className="markdown-preview-container">{renderedElements}</div>;
}
