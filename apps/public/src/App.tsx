import { Route, Routes } from 'react-router-dom';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ContentPage } from './components/ContentPage';
import { Home } from './pages/Home';
import { Institutions } from './pages/Institutions';
import { Publications } from './pages/Publications';
import { Laws } from './pages/Laws';
import { Press } from './pages/Press';
import { Careers } from './pages/Careers';
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
          <Route path="/laws" element={<Laws />} />
          <Route path="/press" element={<Press />} />
          <Route path="/careers" element={<Careers />} />
          <Route path="/about" element={<ContentPage slug="about-the-bank" />} />
          <Route path="/governance" element={<ContentPage slug="governance" />} />
          <Route path="/core-functions" element={<ContentPage slug="core-functions" />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}

export default App;
