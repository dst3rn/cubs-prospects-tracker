import { Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import ProspectDetail from './pages/ProspectDetail'

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-cubs-blue text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <a href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cubs-red rounded-full flex items-center justify-center font-bold text-xl">
              C
            </div>
            <div>
              <h1 className="text-xl font-bold">Cubs Prospects Tracker</h1>
              <p className="text-xs text-blue-200">Top 30 Pipeline Rankings</p>
            </div>
          </a>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/prospect/:id" element={<ProspectDetail />} />
        </Routes>
      </main>

      <footer className="bg-cubs-blue text-white py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-blue-200">
          Data from MLB Stats API. Updated daily at 4am CT.
        </div>
      </footer>
    </div>
  )
}

export default App
