import { Route, Routes } from 'react-router-dom';
import { AuthProvider } from './lib/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Shell } from './components/Shell';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { ContentEditor } from './pages/ContentEditor';
import { PressReleasesAdmin } from './pages/PressReleasesAdmin';
import { PublicationsAdmin } from './pages/PublicationsAdmin';
import { NavigationAdmin } from './pages/NavigationAdmin';
import { HeroSlidesAdmin } from './pages/HeroSlidesAdmin';
import { ExchangeRates } from './pages/ExchangeRates';
import { InstitutionsAdmin } from './pages/InstitutionsAdmin';
import { Users } from './pages/Users';
import { AuditLog } from './pages/AuditLog';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          element={
            <ProtectedRoute>
              <Shell />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route
            path="/content"
            element={
              <ProtectedRoute roles={['super_admin', 'content_editor']}>
                <ContentEditor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/press-releases"
            element={
              <ProtectedRoute roles={['super_admin', 'content_editor']}>
                <PressReleasesAdmin />
              </ProtectedRoute>
            }
          />
          <Route
            path="/publications"
            element={
              <ProtectedRoute roles={['super_admin', 'content_editor']}>
                <PublicationsAdmin />
              </ProtectedRoute>
            }
          />
          <Route
            path="/navigation"
            element={
              <ProtectedRoute roles={['super_admin', 'content_editor']}>
                <NavigationAdmin />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hero-slides"
            element={
              <ProtectedRoute roles={['super_admin', 'content_editor']}>
                <HeroSlidesAdmin />
              </ProtectedRoute>
            }
          />
          <Route
            path="/exchange-rates"
            element={
              <ProtectedRoute roles={['super_admin', 'exchange_rate_officer']}>
                <ExchangeRates />
              </ProtectedRoute>
            }
          />
          <Route
            path="/institutions"
            element={
              <ProtectedRoute roles={['super_admin', 'supervision_data_officer']}>
                <InstitutionsAdmin />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute roles={['super_admin']}>
                <Users />
              </ProtectedRoute>
            }
          />
          <Route
            path="/audit-log"
            element={
              <ProtectedRoute roles={['super_admin']}>
                <AuditLog />
              </ProtectedRoute>
            }
          />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
