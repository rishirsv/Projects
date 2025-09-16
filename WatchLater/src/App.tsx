import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Download, Copy, RefreshCw, ChevronRight, Circle, CheckCircle, ChevronLeft, History } from 'lucide-react';
import { fetchTranscript, saveTranscript, generateSummaryFromFile, getSavedSummaries, readSavedSummary, fetchVideoMetadata } from './api';
import { extractVideoId } from './utils';
import './App.css';

function extractKeyTakeaways(summaryText: string) {
  const lines = summaryText.split('\n');
  const takeaways: string[] = [];
  let inTakeawaysSection = false;

  for (const line of lines) {
    if (line.toLowerCase().includes('key') || line.toLowerCase().includes('takeaway') || line.toLowerCase().includes('important')) {
      inTakeawaysSection = true;
      continue;
    }
    if (inTakeawaysSection && (line.trim().startsWith('-') || line.trim().startsWith('•') || line.trim().match(/^\d+[.]/))) {
      takeaways.push(line.trim().replace(/^[-•\d.]\s*/, ''));
    }
    if (inTakeawaysSection && line.trim() === '') {
      if (takeaways.length > 0) break;
    }
  }

  return takeaways.slice(0, 4);
}

function extractHashtags(summaryText: string) {
  const hashtagMatches = summaryText.match(/#[\w-]+/g);
  return hashtagMatches ? hashtagMatches.slice(0, 3) : [];
}

const WatchLater = () => {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState('idle'); // idle, processing, complete, error
  const [summary, setSummary] = useState(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const [summaryCount, setSummaryCount] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [currentStage, setCurrentStage] = useState(0); // 0: idle, 1: metadata, 2: transcript, 3: ai-processing, 4: file-saving
  const [showPulse, setShowPulse] = useState(false);
  const [error, setError] = useState('');
  const [savedSummaries, setSavedSummaries] = useState([]);
  const [loadingSummaries, setLoadingSummaries] = useState(false);
  const inputRef = useRef(null);

  const loadSavedSummaries = useCallback(async () => {
    setLoadingSummaries(true);
    try {
      const summaries = await getSavedSummaries();
      setSavedSummaries(summaries);
      setSummaryCount(summaries.length);
    } catch (err) {
      console.error('Error loading saved summaries:', err);
    } finally {
      setLoadingSummaries(false);
    }
  }, []);

  useEffect(() => {
    loadSavedSummaries();
    inputRef.current?.focus();
  }, [loadSavedSummaries]);

  const isYouTubeUrl = useCallback((text: string) => {
    return /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?]+)/.test(text);
  }, []);

  const handleSummarize = useCallback(async (urlToProcess = url) => {
    if (!isYouTubeUrl(urlToProcess) || status === 'processing') return;
    
    setStatus('processing');
    setCurrentStage(1);
    setError('');
    setSummary(null);
    
    try {
      // Stage 1: Extract video ID and fetch metadata
      const extractedVideoId = extractVideoId(urlToProcess);
      if (!extractedVideoId) {
        throw new Error('Invalid YouTube URL');
      }
      
      // Try to get metadata (non-blocking)
      let metadata = null;
      try {
        metadata = await fetchVideoMetadata(extractedVideoId);
        console.log('Video metadata fetched:', metadata.title);
      } catch (metadataError) {
        console.warn('Failed to fetch video metadata, continuing without title:', metadataError);
      }
      
      setCurrentStage(2);
      
      // Stage 2: Fetch transcript
      const transcriptText = await fetchTranscript(extractedVideoId);
      
      // Save transcript with title if available
      await saveTranscript(extractedVideoId, transcriptText, false, metadata?.title);
      
      setCurrentStage(3);
      
      // Stage 3: AI Processing - Generate summary from file
      const result = await generateSummaryFromFile(extractedVideoId);
      
      setCurrentStage(4);
      
      // Stage 4: File saving is already done in generateSummaryFromFile
      // Parse the summary for display
      const summaryData = {
        videoId: extractedVideoId,
        title: metadata?.title || `Video ${extractedVideoId}`,
        author: metadata?.author || 'Unknown',
        content: result.summary,
        transcript: transcriptText,
        savedFile: result.savedFile.filename,
        // Extract key takeaways from summary (simple parsing)
        keyTakeaways: extractKeyTakeaways(result.summary),
        tags: extractHashtags(result.summary)
      };
      
      setSummary(summaryData);
      setStatus('complete');
      setShowPulse(true);
      setTimeout(() => setShowPulse(false), 500);
      
      // Refresh summaries list
      await loadSavedSummaries();
    
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setStatus('error');
      console.error('Summarization error:', err);
    }
  }, [isYouTubeUrl, loadSavedSummaries, status, url]);

  useEffect(() => {
    const handlePaste = (e: Event) => {
      const target = e.target as HTMLInputElement | null;
      if (!target) return;

      setTimeout(() => {
        const pastedText = target.value;
        if (isYouTubeUrl(pastedText) && status === 'idle') {
          setTimeout(() => handleSummarize(pastedText), 50);
        }
      }, 10);
    };

    const input = inputRef.current;
    input?.addEventListener('paste', handlePaste);
    return () => input?.removeEventListener('paste', handlePaste);
  }, [handleSummarize, isYouTubeUrl, status]);

  const handleCancel = () => {
    setStatus('idle');
    setCurrentStage(0);
    setError('');
  };

  const handleDownload = () => {
    if (!summary) return;
    
    const blob = new Blob([summary.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${summary.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    if (!summary) return;
    navigator.clipboard.writeText(summary.content);
  };

  const handleOpenFolder = () => {
    // Show user where files are saved
    alert(`Files are saved in: exports/summaries/\n\nLatest file: ${summary?.savedFile || 'No file saved yet'}`);
  };

  const handleHistoryItemClick = async (savedSummary) => {
    try {
      const summaryData = await readSavedSummary(savedSummary.videoId);
      const baseName = summaryData.filename.replace(/-summary-.*\.md$/, '');
      const [, titlePart] = baseName.split('__');
      const derivedTitle = (savedSummary.title ?? titlePart ?? savedSummary.videoId).trim();
      const displayData = {
        videoId: savedSummary.videoId,
        title: derivedTitle,
        content: summaryData.summary,
        savedFile: summaryData.filename,
        keyTakeaways: extractKeyTakeaways(summaryData.summary),
        tags: extractHashtags(summaryData.summary)
      };
      setSummary(displayData);
      setStatus('complete');
      setShowHistory(false);
    } catch (err) {
      setError(`Failed to load summary: ${err.message}`);
    }
  };

  const SignalGlyph = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className={showPulse ? 'animate-pulse-custom' : ''}>
      <rect x="4" y="8" width="3" height="8" rx="1.5" fill="currentColor" opacity="0.4"/>
      <rect x="10.5" y="6" width="3" height="12" rx="1.5" fill="currentColor" opacity="0.6"/>
      <rect x="17" y="4" width="3" height="16" rx="1.5" fill="currentColor" opacity="0.8"/>
      <circle cx="12" cy="20" r="2" fill="#03D5A3" className={showPulse ? 'animate-pulse-dot' : ''}/>
    </svg>
  );

  const ProgressIndicator = ({ stage }) => (
    <div className="flex items-center gap-2 text-sm">
      <div className="flex items-center gap-1">
        {stage >= 1 ? <CheckCircle className="w-4 h-4 text-[#03D5A3]" /> : <Circle className="w-4 h-4 text-[#666]" />}
        <span className={stage >= 1 ? "text-[#03D5A3]" : "text-[#666]"}>Metadata</span>
      </div>
      <span className="text-[#666]">•</span>
      <div className="flex items-center gap-1">
        {stage >= 2 ? <CheckCircle className="w-4 h-4 text-[#03D5A3]" /> : <Circle className="w-4 h-4 text-[#666]" />}
        <span className={stage >= 2 ? "text-[#03D5A3]" : "text-[#666]"}>Transcript</span>
      </div>
      <span className="text-[#666]">•</span>
      <div className="flex items-center gap-1">
        {stage >= 3 ? <CheckCircle className="w-4 h-4 text-[#03D5A3]" /> : <Circle className="w-4 h-4 text-[#666]" />}
        <span className={stage >= 3 ? "text-[#03D5A3]" : "text-[#666]"}>AI Processing</span>
      </div>
      <span className="text-[#666]">•</span>
      <div className="flex items-center gap-1">
        {stage >= 4 ? <CheckCircle className="w-4 h-4 text-[#03D5A3]" /> : <Circle className="w-4 h-4 text-[#666]" />}
        <span className={stage >= 4 ? "text-[#03D5A3]" : "text-[#666]"}>Save</span>
      </div>
    </div>
  );

  const isReturningUser = summaryCount > 0;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#EDEDED] flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#0A0A0A]/90 backdrop-blur-md border-b border-[#1a1a1a]">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isReturningUser && (
              <button 
                onClick={() => setShowHistory(!showHistory)}
                className="p-1 hover:bg-[#1a1a1a] rounded transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <div className="flex items-center gap-2">
              <SignalGlyph />
              <span className="font-medium text-lg">Watch Later</span>
              <span className="text-xs text-[#666] bg-[#1a1a1a] px-1.5 py-0.5 rounded">β</span>
            </div>
          </div>
          {isReturningUser && (
            <div className="flex items-center gap-4">
              <div className="flex gap-1">
                {[...Array(Math.min(summaryCount, 5))].map((_, i) => (
                  <div key={i} className={`w-2 h-2 rounded-full bg-[#03D5A3] ${i === summaryCount - 1 && showPulse ? 'animate-pulse-dot' : ''}`} />
                ))}
              </div>
              <button 
                onClick={loadSavedSummaries}
                className="p-2 hover:bg-[#1a1a1a] rounded transition-colors"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="flex flex-1">
        {/* History Drawer */}
        {isReturningUser && showHistory && (
          <aside className="w-64 bg-[#0A0A0A] border-r border-[#1a1a1a] p-4">
            <div className="flex items-center gap-2 mb-4">
              <History className="w-4 h-4" />
              <h2 className="font-medium">History</h2>
              {loadingSummaries && <RefreshCw className="w-3 h-3 animate-spin" />}
            </div>
            <div className="space-y-2">
              {savedSummaries.slice(0, 10).map((saved, index) => {
                const baseName = saved.filename.replace(/-summary-.*\.md$/, '');
                const [, titlePart] = baseName.split('__');
                const displayTitle = (saved.title ?? titlePart ?? saved.videoId).trim();
                const timeAgo = new Date(saved.modified).toLocaleDateString();
                
                return (
                  <div 
                    key={index} 
                    className="p-3 bg-[#1a1a1a] rounded-lg cursor-pointer hover:bg-[#252525] transition-colors"
                    onClick={() => handleHistoryItemClick(saved)}
                  >
                    <div className="text-sm font-medium truncate">{displayTitle}</div>
                    <div className="text-xs text-[#666]">{timeAgo} • {Math.round(saved.size / 1024)}KB</div>
                  </div>
                );
              })}
            </div>
            {savedSummaries.length > 10 && (
              <button className="mt-4 text-sm text-[#03D5A3] hover:underline">
                View all {summaryCount} summaries →
              </button>
            )}
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 max-w-3xl mx-auto w-full p-6">
          <div className="space-y-4">
            {/* Input Section */}
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste YouTube link here"
                disabled={status === 'processing'}
                className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#333] rounded-lg text-base placeholder-[#666] focus:outline-none focus:border-[#03D5A3] transition-colors font-mono"
              />
              {status === 'processing' && (
                <button
                  onClick={handleCancel}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 text-sm bg-[#333] hover:bg-[#444] rounded transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>

            {/* Progress Indicator */}
            {status === 'processing' && (
              <div className="flex justify-center py-2">
                <ProgressIndicator stage={currentStage} />
              </div>
            )}

            {/* Error State */}
            {status === 'error' && (
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 text-red-300">
                <div className="font-medium">Error</div>
                <div className="text-sm mt-1">{error}</div>
                <button 
                  onClick={() => setStatus('idle')}
                  className="text-sm text-red-400 hover:underline mt-2"
                >
                  Try again
                </button>
              </div>
            )}

            {/* Success State */}
            {status === 'complete' && summary && (
              <>
                <div className="flex items-center justify-center gap-3 text-sm animate-fadeIn">
                  <span className="text-[#03D5A3]">✓</span>
                  <span>Saved to: {summary.savedFile}</span>
                  <button
                    onClick={handleOpenFolder}
                    className="flex items-center gap-1 text-[#03D5A3] hover:underline"
                  >
                    Open folder
                    <ChevronRight className="w-3 h-3" />
                  </button>
                  <div className="flex items-center gap-2 ml-auto">
                    <button
                      onClick={handleDownload}
                      className="p-2 hover:bg-[#1a1a1a] rounded transition-colors"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleCopy}
                      className="p-2 hover:bg-[#1a1a1a] rounded transition-colors"
                      title="Copy"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleSummarize(url)}
                      className="p-2 hover:bg-[#1a1a1a] rounded transition-colors"
                      title="Regenerate"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Key Takeaways Card */}
                {summary.keyTakeaways && summary.keyTakeaways.length > 0 && (
                  <div className="border-l-4 border-[#03D5A3] bg-[#1a1a1a] rounded-r-lg p-4 animate-fadeIn">
                    <h3 className="font-medium mb-2 text-[#03D5A3]">Key Takeaways</h3>
                    <ul className="space-y-1 text-sm">
                      {summary.keyTakeaways.map((takeaway, idx) => (
                        <li key={idx}>• {takeaway}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Summary Content */}
                <div className="prose prose-invert max-w-none animate-fadeIn">
                  <h1 className="text-2xl font-bold mb-4">{summary.title}</h1>
                  {summary.author && (
                    <p className="text-[#666] text-sm mb-4">by {summary.author}</p>
                  )}
                  
                  <div className="text-[#CCCCCC] leading-relaxed whitespace-pre-wrap">
                    {summary.content}
                  </div>
                </div>

                {/* Tags */}
                {isReturningUser && summary.tags && summary.tags.length > 0 && (
                  <div className="flex gap-2 mt-6">
                    {summary.tags.map((tag, idx) => (
                      <span key={idx} className="px-3 py-1 bg-[#1a1a1a] text-[#03D5A3] text-sm rounded-full cursor-pointer hover:bg-[#252525] transition-colors">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Transcript Accordion */}
                {summary.transcript && (
                  <details className="mt-6 border border-[#333] rounded-lg">
                    <summary 
                      className="px-4 py-3 cursor-pointer hover:bg-[#1a1a1a] transition-colors flex items-center justify-between"
                      onClick={(e) => {
                        e.preventDefault();
                        setShowTranscript(!showTranscript);
                      }}
                    >
                      <span className="text-sm">Show transcript</span>
                      <ChevronRight className={`w-4 h-4 transition-transform ${showTranscript ? 'rotate-90' : ''}`} />
                    </summary>
                    {showTranscript && (
                      <div className="px-4 py-3 border-t border-[#333] text-sm text-[#999] font-mono whitespace-pre-wrap max-h-96 overflow-y-auto">
                        {summary.transcript}
                      </div>
                    )}
                  </details>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        
        @keyframes pulse-custom {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        .animate-pulse-custom {
          animation: pulse-custom 0.5s ease-out;
        }
        
        @keyframes pulse-dot {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.8; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-pulse-dot {
          animation: pulse-dot 0.5s ease-out;
        }
      `}</style>
    </div>
  );
};

export default WatchLater;
