import { Route, Routes } from 'react-router-dom';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
import { Institutions } from './pages/Institutions';
import { Publications } from './pages/Publications';
import { Press } from './pages/Press';
import { About } from './pages/About';
import { Contact } from './pages/Contact';

function App() {
  return (
    <>
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/institutions" element={<Institutions />} />
          <Route path="/publications" element={<Publications />} />
          <Route path="/press" element={<Press />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}

export default App;
