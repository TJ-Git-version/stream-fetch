import React from 'react'

function App(): JSX.Element {
  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Stream Fetch</h1>
      <p>视频下载工具</p>
      <div id="app-info">
        <p>Platform: {window.electronAPI?.platform || 'Web'}</p>
        <p>Electron: {window.electronAPI?.versions?.electron || 'N/A'}</p>
        <p>Node: {window.electronAPI?.versions?.node || 'N/A'}</p>
      </div>
    </div>
  )
}

export default App