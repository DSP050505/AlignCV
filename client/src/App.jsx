// ─────────────────────────────────────────────────────────────────
// AlignCV — App Root
// React Router setup with auth guard and lazy-loaded pages.
// ─────────────────────────────────────────────────────────────────

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Suspense, lazy } from 'react';
import { useAuthStore } from './store/authStore';
import { FullPageSpinner } from './components/ui/Spinner';

// ── Lazy-loaded Pages ────────────────────────────────────────────
const AuthPage = lazy(() => import('./pages/AuthPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ProfileWizardPage = lazy(() => import('./pages/ProfileWizardPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const PreviewProfilePage = lazy(() => import('./pages/PreviewProfilePage'));
const NewResumePage = lazy(() => import('./pages/NewResumePage'));
const EditorPage = lazy(() => import('./pages/EditorPage'));
const HistoryPage = lazy(() => import('./pages/HistoryPage'));
const ReferralRadarPage = lazy(() => import('./pages/ReferralRadarPage'));
const ReferralLogPage = lazy(() => import('./pages/ReferralLogPage'));
const OmniSearchPage = lazy(() => import('./pages/OmniSearchPage'));

// ── Auth Guard ───────────────────────────────────────────────────
function ProtectedRoute({ children }) {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Navigate to="/auth" replace />;
  return children;
}

function PublicRoute({ children }) {
  const token = useAuthStore((s) => s.token);
  if (token) return <Navigate to="/dashboard" replace />;
  return children;
}

// ── App ──────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: 'rgba(15, 20, 35, 0.95)',
            color: '#fff',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            borderRadius: '12px',
            fontSize: '13px',
            backdropFilter: 'blur(12px)',
          },
          success: {
            iconTheme: { primary: '#22C55E', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#EF4444', secondary: '#fff' },
          },
        }}
      />

      <Suspense fallback={<FullPageSpinner />}>
        <Routes>
          {/* Public Routes */}
          <Route
            path="/auth"
            element={
              <PublicRoute>
                <AuthPage />
              </PublicRoute>
            }
          />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Sprint 2 Routes */}
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/profile/preview" element={<ProtectedRoute><PreviewProfilePage /></ProtectedRoute>} />
          <Route path="/profile/wizard" element={<ProtectedRoute><ProfileWizardPage /></ProtectedRoute>} />

          {/* Future routes (Sprint 3+) */}
          <Route path="/new-resume" element={<ProtectedRoute><NewResumePage /></ProtectedRoute>} />
          <Route path="/editor/:id" element={<ProtectedRoute><EditorPage /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
          <Route path="/referral" element={<ProtectedRoute><ReferralRadarPage /></ProtectedRoute>} />
          <Route path="/referral/log" element={<ProtectedRoute><ReferralLogPage /></ProtectedRoute>} />
          <Route path="/omnisearch" element={<ProtectedRoute><OmniSearchPage /></ProtectedRoute>} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/auth" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
