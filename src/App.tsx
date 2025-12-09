import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AspirePlayground from './components/playground/AspirePlayground'
import SvgRenderer from './components/playground/SvgRenderer'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AspirePlayground />} />
        <Route path="/svg" element={<SvgRenderer />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
