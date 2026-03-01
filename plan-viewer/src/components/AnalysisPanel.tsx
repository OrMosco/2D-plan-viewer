interface AnalysisPanelProps {
  text: string;
  onClose: () => void;
}

function AnalysisPanel({ text, onClose }: AnalysisPanelProps) {
  // Simple markdown-like rendering: bold, headers, bullets
  const renderMarkdown = (md: string) => {
    const lines = md.split('\n');
    const elements: JSX.Element[] = [];

    lines.forEach((line, i) => {
      const trimmed = line.trim();

      if (trimmed.startsWith('### ')) {
        elements.push(<h4 key={i} className="analysis-h3">{trimmed.slice(4)}</h4>);
      } else if (trimmed.startsWith('## ')) {
        elements.push(<h3 key={i} className="analysis-h2">{trimmed.slice(3)}</h3>);
      } else if (trimmed.startsWith('# ')) {
        elements.push(<h2 key={i} className="analysis-h1">{trimmed.slice(2)}</h2>);
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        elements.push(
          <div key={i} className="analysis-bullet">
            <span className="bullet-dot">•</span>
            <span dangerouslySetInnerHTML={{ __html: inlineBold(trimmed.slice(2)) }} />
          </div>
        );
      } else if (/^\d+\.\s/.test(trimmed)) {
        const match = trimmed.match(/^(\d+\.)\s(.*)$/);
        if (match) {
          elements.push(
            <div key={i} className="analysis-numbered">
              <span className="numbered-num">{match[1]}</span>
              <span dangerouslySetInnerHTML={{ __html: inlineBold(match[2]) }} />
            </div>
          );
        }
      } else if (trimmed === '') {
        elements.push(<div key={i} className="analysis-spacer" />);
      } else {
        elements.push(<p key={i} className="analysis-paragraph" dangerouslySetInnerHTML={{ __html: inlineBold(trimmed) }} />);
      }
    });

    return elements;
  };

  const inlineBold = (text: string): string => {
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  };

  return (
    <div className="analysis-panel">
      <div className="analysis-panel-header">
        <div className="analysis-panel-title">
          🧠 AI Structural Analysis
        </div>
        <button className="analysis-panel-close" onClick={onClose} title="Close panel">
          ✕
        </button>
      </div>
      <div className="analysis-panel-content">
        {renderMarkdown(text)}
      </div>
    </div>
  );
}

export default AnalysisPanel;
