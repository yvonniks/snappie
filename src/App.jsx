import React, { createContext, useContext, useState } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import Home       from './pages/Home'
import Dare       from './pages/Dare'
import Booth      from './pages/Booth'
import Result     from './pages/Result'
import Gallery    from './pages/Gallery'
import PartySetup from './pages/PartySetup'
import PartyLive  from './pages/PartyLive'

// ─── Global app context ─────────────────────────────────
const AppContext = createContext({})
export const useApp = () => useContext(AppContext)

export default function App() {
  // Shared state passed between pages via context
  const [capturedFrames,  setCapturedFrames]  = useState([])   // raw canvas frames
  const [capturedBlob,    setCapturedBlob]    = useState(null)  // final jpg/gif blob
  const [capturedDataUrl, setCapturedDataUrl] = useState(null)  // preview data URL
  const [shootMode,       setShootMode]       = useState('photo') // photo | gif | stopmotion
  const [activeDare,      setActiveDare]      = useState(null)
  const [partySession,    setPartySession]    = useState(null)
  const [albumMode,       setAlbumMode]       = useState('family') // family | event

  const ctx = {
    capturedFrames,  setCapturedFrames,
    capturedBlob,    setCapturedBlob,
    capturedDataUrl, setCapturedDataUrl,
    shootMode,       setShootMode,
    activeDare,      setActiveDare,
    partySession,    setPartySession,
    albumMode,       setAlbumMode,
  }

  return (
    <AppContext.Provider value={ctx}>
      <Routes>
        <Route path="/"              element={<Home />} />
        <Route path="/dare"          element={<Dare />} />
        <Route path="/booth"         element={<Booth />} />
        <Route path="/result"        element={<Result />} />
        <Route path="/gallery"       element={<Gallery />} />
        <Route path="/party/setup"   element={<PartySetup />} />
        <Route path="/party/live"    element={<PartyLive />} />
        <Route path="/event/:id"     element={<Gallery eventMode />} />
      </Routes>
    </AppContext.Provider>
  )
}
