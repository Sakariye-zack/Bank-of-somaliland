import { Route, Routes } from 'react-router-dom';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { SiteWatermark } from './components/SiteWatermark';
import { ScrollToTop } from './components/ScrollToTop';
import { ContentPage } from './components/ContentPage';
import { Home } from './pages/Home';
import { Institutions } from './pages/Institutions';
import { ExchangeRates } from './pages/ExchangeRates';
import { NotFound } from './pages/NotFound';
import { Publications } from './pages/Publications';
import { Laws } from './pages/Laws';
import { Press } from './pages/Press';
import { PressDetail } from './pages/PressDetail';
import { Careers } from './pages/Careers';
import { Contact } from './pages/Contact';
import { Search } from './pages/Search';
import { FAQ } from './pages/FAQ';
import { Statistics } from './pages/Statistics';

function App() {
  return (
    <>
      <ScrollToTop />
      <SiteWatermark />
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/institutions" element={<Institutions />} />
          <Route path="/exchange-rates" element={<ExchangeRates />} />
          <Route path="/publications" element={<Publications />} />
          <Route path="/laws" element={<Laws />} />
          <Route path="/press" element={<Press />} />
          <Route path="/press/:id" element={<PressDetail />} />
          <Route path="/search" element={<Search />} />
          <Route path="/careers" element={<Careers />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/statistics" element={<Statistics />} />
          <Route path="/privacy-policy" element={<ContentPage slug="privacy-policy" />} />
          <Route path="/terms-of-use" element={<ContentPage slug="terms-of-use" />} />
          <Route path="/about" element={<ContentPage slug="about-the-bank" />} />
          <Route path="/governance" element={<ContentPage slug="governance" />} />
          <Route path="/core-functions" element={<ContentPage slug="core-functions" />} />
          <Route path="/about/governors-statement" element={<ContentPage slug="governors-statement" />} />
          <Route path="/about/overview" element={<ContentPage slug="bosl-overview" />} />
          <Route path="/about/history" element={<ContentPage slug="history" />} />
          <Route path="/about/somaliland" element={<ContentPage slug="about-somaliland" />} />
          <Route path="/about/senior-management" element={<ContentPage slug="senior-management" />} />
          <Route path="/about/office-of-the-governor" element={<ContentPage slug="office-of-the-governor" />} />
          <Route path="/about/structure" element={<ContentPage slug="bosl-structure" />} />
          <Route path="/functions/currency-banking-operations" element={<ContentPage slug="currency-banking-operations" />} />
          <Route path="/functions/monetary-financial-regulatory-policy" element={<ContentPage slug="monetary-financial-regulatory-policy" />} />
          <Route path="/functions/payment-systems-nps" element={<ContentPage slug="payment-systems-nps" />} />
          <Route path="/functions/financial-admin-support" element={<ContentPage slug="financial-admin-support" />} />
          <Route path="/opportunities/training" element={<ContentPage slug="training" />} />
          <Route path="/pages/:slug" element={<ContentPage />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}

export default App;
