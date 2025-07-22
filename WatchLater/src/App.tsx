import { useState, useEffect } from 'react'
import { fetchTranscript, saveTranscript, generateSummaryFromFile, getSavedTranscripts, getSavedSummaries, downloadSummary, downloadSavedSummary, readSavedSummary } from './api'
import { extractVideoId } from './utils'
import './App.css'

function App() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState('')
  const [videoId, setVideoId] = useState('')
  const [summary, setSummary] = useState('')
  const [summarizing, setSummarizing] = useState(false)
  const [savedTranscripts, setSavedTranscripts] = useState<Array<{ filename: string; videoId: string; created: string; modified: string; size: number }>>([])
  const [loadingTranscripts, setLoadingTranscripts] = useState(false)
  const [savedSummaries, setSavedSummaries] = useState<Array<{ filename: string; videoId: string; created: string; modified: string; size: number }>>([])
  const [loadingSummaries, setLoadingSummaries] = useState(false)
  const [savedSummaryFile, setSavedSummaryFile] = useState('')

  const handleTest = async () => {
    if (!url) {
      setError('Please enter a YouTube URL')
      return
    }

    setLoading(true)
    setError('')
    setTranscript('')
    setVideoId('')

    try {
      // Extract video ID
      const extractedVideoId = extractVideoId(url)
      if (!extractedVideoId) {
        throw new Error('Invalid YouTube URL')
      }

      console.log('Extracted video ID:', extractedVideoId)
      setVideoId(extractedVideoId)
      
      // Fetch transcript
      const transcriptText = await fetchTranscript(extractedVideoId)
      setTranscript(transcriptText)
      
      // Save transcript (without auto-download)
      await saveTranscript(extractedVideoId, transcriptText, false)
      
      console.log('Transcript length:', transcriptText.length)
      console.log('First 500 chars:', transcriptText.substring(0, 500))

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    if (videoId && transcript) {
      await saveTranscript(videoId, transcript, true)
    }
  }

  const handleSummarize = async () => {
    if (!videoId || !transcript) {
      setError('No transcript available to summarize')
      return
    }

    setSummarizing(true)
    setError('')
    setSummary('')
    setSavedSummaryFile('')

    try {
      const result = await generateSummaryFromFile(videoId)
      setSummary(result.summary)
      setSavedSummaryFile(result.savedFile.filename)
      console.log('Summary generated and saved successfully:', result.savedFile.filename)
      
      // Refresh the saved summaries list
      await loadSavedSummaries()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate summary')
      console.error('Summary generation error:', err)
    } finally {
      setSummarizing(false)
    }
  }

  const handleDownloadSummary = async () => {
    if (videoId && summary) {
      try {
        await downloadSummary(videoId, summary)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to download summary')
      }
    }
  }

  const loadSavedTranscripts = async () => {
    setLoadingTranscripts(true)
    try {
      const transcripts = await getSavedTranscripts()
      setSavedTranscripts(transcripts)
    } catch (err) {
      console.error('Error loading saved transcripts:', err)
    } finally {
      setLoadingTranscripts(false)
    }
  }

  const loadSavedSummaries = async () => {
    setLoadingSummaries(true)
    try {
      const summaries = await getSavedSummaries()
      setSavedSummaries(summaries)
    } catch (err) {
      console.error('Error loading saved summaries:', err)
    } finally {
      setLoadingSummaries(false)
    }
  }

  const handleSummarizeFromFile = async (savedVideoId: string) => {
    setSummarizing(true)
    setError('')
    setSummary('')
    setSavedSummaryFile('')
    setVideoId(savedVideoId)

    try {
      const result = await generateSummaryFromFile(savedVideoId)
      setSummary(result.summary)
      setSavedSummaryFile(result.savedFile.filename)
      console.log('Summary generated and saved from file:', savedVideoId, '→', result.savedFile.filename)
      
      // Refresh the saved summaries list
      await loadSavedSummaries()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate summary from saved file')
      console.error('File-based summary error:', err)
    } finally {
      setSummarizing(false)
    }
  }

  const handleViewSavedSummary = async (savedVideoId: string) => {
    setError('')
    setSummary('')
    setSavedSummaryFile('')
    setVideoId(savedVideoId)

    try {
      const summaryData = await readSavedSummary(savedVideoId)
      setSummary(summaryData.summary)
      setSavedSummaryFile(summaryData.filename)
      console.log('Loaded saved summary:', summaryData.filename)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load saved summary')
      console.error('Error loading saved summary:', err)
    }
  }

  const handleDownloadSavedSummary = async (savedVideoId: string) => {
    try {
      await downloadSavedSummary(savedVideoId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download saved summary')
    }
  }

  // Load saved transcripts and summaries on component mount
  useEffect(() => {
    loadSavedTranscripts()
    loadSavedSummaries()
  }, [])

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>YouTube Transcript Tester</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter YouTube URL (e.g., https://www.youtube.com/watch?v=...)"
          style={{ 
            width: '100%', 
            padding: '10px', 
            marginBottom: '10px',
            fontSize: '16px'
          }}
        />
        <button 
          onClick={handleTest}
          disabled={loading}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: loading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginRight: '10px'
          }}
        >
          {loading ? 'Fetching...' : 'Test Transcript Fetch'}
        </button>
        
        {transcript && (
          <button 
            onClick={handleSummarize}
            disabled={summarizing}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              backgroundColor: summarizing ? '#ccc' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: summarizing ? 'not-allowed' : 'pointer'
            }}
          >
            {summarizing ? 'Summarizing...' : 'Generate Summary'}
          </button>
        )}
      </div>

      {error && (
        <div style={{ 
          backgroundColor: '#f8d7da', 
          color: '#721c24', 
          padding: '10px', 
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          Error: {error}
        </div>
      )}

      {transcript && (
        <div>
          <h3>Transcript Preview (first 1000 characters):</h3>
          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '15px',
            borderRadius: '4px',
            maxHeight: '400px',
            overflow: 'auto',
            whiteSpace: 'pre-wrap',
            fontSize: '14px',
            lineHeight: '1.4'
          }}>
            {transcript.substring(0, 1000)}
            {transcript.length > 1000 && '...'}
          </div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginTop: '10px' 
          }}>
            <p><strong>Full transcript length:</strong> {transcript.length} characters</p>
            <button 
              onClick={handleDownload}
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Download Transcript
            </button>
          </div>
          <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
            ✅ Transcript saved to file system and localStorage (key: transcript-{videoId})
          </p>
        </div>
      )}

      {summary && (
        <div>
          <h3>AI Generated Summary:</h3>
          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '15px',
            borderRadius: '4px',
            maxHeight: '600px',
            overflow: 'auto',
            whiteSpace: 'pre-wrap',
            fontSize: '14px',
            lineHeight: '1.6',
            border: '1px solid #dee2e6'
          }}>
            {summary}
          </div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginTop: '10px' 
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <p><strong>Summary length:</strong> {summary.length} characters</p>
              {savedSummaryFile && (
                <p style={{ fontSize: '12px', color: '#28a745' }}>
                  ✅ Auto-saved to server: {savedSummaryFile}
                </p>
              )}
            </div>
            <button 
              onClick={handleDownloadSummary}
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Download Summary (.md)
            </button>
          </div>
        </div>
      )}

      <div style={{ marginTop: '40px', borderTop: '2px solid #dee2e6', paddingTop: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>Saved Transcripts</h2>
          <button 
            onClick={loadSavedTranscripts}
            disabled={loadingTranscripts}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loadingTranscripts ? 'not-allowed' : 'pointer'
            }}
          >
            {loadingTranscripts ? 'Loading...' : 'Refresh List'}
          </button>
        </div>
        
        {savedTranscripts.length === 0 ? (
          <p style={{ color: '#666', fontStyle: 'italic' }}>No saved transcripts found. Fetch a transcript first!</p>
        ) : (
          <div style={{ display: 'grid', gap: '10px' }}>
            {savedTranscripts.map((saved, index) => (
              <div key={index} style={{
                border: '1px solid #dee2e6',
                borderRadius: '4px',
                padding: '15px',
                backgroundColor: '#f8f9fa'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>Video ID:</strong> {saved.videoId}<br/>
                    <small style={{ color: '#666' }}>
                      File: {saved.filename} | Size: {Math.round(saved.size / 1024)}KB | 
                      Modified: {new Date(saved.modified).toLocaleString()}
                    </small>
                  </div>
                  <button 
                    onClick={() => handleSummarizeFromFile(saved.videoId)}
                    disabled={summarizing}
                    style={{
                      padding: '8px 16px',
                      fontSize: '14px',
                      backgroundColor: summarizing ? '#ccc' : '#ffc107',
                      color: summarizing ? '#666' : '#212529',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: summarizing ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {summarizing ? 'Processing...' : 'Summarize'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginTop: '40px', borderTop: '2px solid #dee2e6', paddingTop: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>Saved Summaries</h2>
          <button 
            onClick={loadSavedSummaries}
            disabled={loadingSummaries}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loadingSummaries ? 'not-allowed' : 'pointer'
            }}
          >
            {loadingSummaries ? 'Loading...' : 'Refresh List'}
          </button>
        </div>
        
        {savedSummaries.length === 0 ? (
          <p style={{ color: '#666', fontStyle: 'italic' }}>No saved summaries found. Generate a summary first!</p>
        ) : (
          <div style={{ display: 'grid', gap: '10px' }}>
            {savedSummaries.map((saved, index) => (
              <div key={index} style={{
                border: '1px solid #dee2e6',
                borderRadius: '4px',
                padding: '15px',
                backgroundColor: '#f8f9fa'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>Video ID:</strong> {saved.videoId}<br/>
                    <small style={{ color: '#666' }}>
                      File: {saved.filename} | Size: {Math.round(saved.size / 1024)}KB | 
                      Modified: {new Date(saved.modified).toLocaleString()}
                    </small>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                      onClick={() => handleViewSavedSummary(saved.videoId)}
                      style={{
                        padding: '8px 16px',
                        fontSize: '14px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      View
                    </button>
                    <button 
                      onClick={() => handleDownloadSavedSummary(saved.videoId)}
                      style={{
                        padding: '8px 16px',
                        fontSize: '14px',
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Download
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginTop: '30px', fontSize: '14px', color: '#666' }}>
        <p><strong>🚀 Architecture:</strong> Frontend (port 5173) → Backend API (port 3001) → YouTube</p>
        
        <p><strong>Test URLs to try:</strong></p>
        <ul>
          <li>https://www.youtube.com/watch?v=dQw4w9WgXcQ (Rick Roll)</li>
          <li>https://youtu.be/dQw4w9WgXcQ (Short URL format)</li>
          <li>https://www.youtube.com/watch?v=9bZkp7q19f0 (Gangnam Style)</li>
          <li>https://www.youtube.com/watch?v=kJQP7kiw5Fk (Despacito)</li>
        </ul>
        
        <p><strong>💡 Troubleshooting:</strong></p>
        <ul style={{ fontSize: '12px' }}>
          <li>If you get "Cannot connect" error, run: <code>npm run server</code></li>
          <li>Check browser console (F12) for detailed error messages</li>
          <li>Backend health check: <a href="http://localhost:3001/health" target="_blank">http://localhost:3001/health</a></li>
        </ul>
      </div>
    </div>
  )
}

export default App
