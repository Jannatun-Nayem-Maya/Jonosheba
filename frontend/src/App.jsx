
import {
  Routes,
  Route,
  Navigate,
  Link
} from 'react-router-dom';

// ==========================================
// MAIN COMPONENTS
// ==========================================

import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import HelpChat from './components/HelpChat.jsx';

// ==========================================
// CONTEXT
// ==========================================

import { useLang } from './context/LangContext.jsx';
import { useAuth } from './context/AuthContext.jsx';

// ==========================================
// EXISTING PAGES
// ==========================================

import Home from './pages/Home.jsx';
import Services from './pages/Services.jsx';
import Health from './pages/Health.jsx';
import BloodDonors from './pages/BloodDonors.jsx';
import Scholarship from './pages/Scholarship.jsx';
import DisasterAlerts from './pages/DisasterAlerts.jsx';
import EmergencyContacts from './pages/EmergencyContacts.jsx';
import ReliefApply from './pages/ReliefApply.jsx';
import ServiceApply from './pages/ServiceApply.jsx';
import Volunteer from './pages/Volunteer.jsx';
import WelfarePrograms from './pages/WelfarePrograms.jsx';

// ==========================================
// AUTHENTICATION
// ==========================================

import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';

// ==========================================
// DASHBOARDS
// ==========================================

import CitizenDashboard from './pages/CitizenDashboard.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';

// ==========================================
// NEARBY ESSENTIAL SERVICES
// ==========================================

import NearbyServices from './pages/NearbyServices.jsx';

// ==========================================
// CITIZEN COMPLAINT SYSTEM
// ==========================================

import Complaints from './pages/Complaints.jsx';
import AdminComplaints from './pages/AdminComplaints.jsx';

// ==========================================
// GOVERNMENT E-SERVICES
// ==========================================

import GovServices from './pages/GovServices.jsx';
import AdminGovServices from './pages/AdminGovServices.jsx';

// ==========================================
// FEEDBACK AND RATING SYSTEM
// ==========================================

import Feedback from './pages/Feedback.jsx';
import AdminFeedback from './pages/AdminFeedback.jsx';

// ==========================================
// SMART HELP CENTER
// ==========================================

// Public Help Center
import HelpCenter from './pages/HelpCenter.jsx';

// Admin Help Center Management
import AdminHelpCenter from './pages/AdminHelpCenter.jsx';

// ==========================================
// CITIZEN / VISITOR FEEDBACK ROUTE
// ==========================================

function CitizenFeedbackRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="container section">
        Loading...
      </div>
    );
  }

  if (
    String(user?.role || '').toLowerCase() ===
    'admin'
  ) {
    return (
      <Navigate
        to="/admin"
        replace
      />
    );
  }

  return <Feedback />;
}

// ==========================================
// TEMPORARY ROUTE TEST COMPONENT
// ==========================================

// This route is only for checking whether
// React Router is loading the current App.jsx.
//
// Remove it after routing is confirmed.

function HelpRouteTest() {
  return (
    <div className="container section">
      <div
        style={{
          padding: '32px',
          background: '#eef8f2',
          border: '1px solid #b7dfc7',
          borderRadius: '14px',
          color: '#145c3c'
        }}
      >
        <h2>
          Help Route Test Successful
        </h2>

        <p>
          React Router is loading the current
          App.jsx correctly.
        </p>

        <Link to="/admin/help-center">
          Open Admin Help Center
        </Link>
      </div>
    </div>
  );
}

// ==========================================
// MAIN APPLICATION
// ==========================================

export default function App() {
  const { t } = useLang();

  return (
    <div className="app">

      {/* ================================= */}
      {/* NAVBAR                            */}
      {/* ================================= */}

      <Navbar />

      {/* ================================= */}
      {/* MAIN CONTENT                      */}
      {/* ================================= */}

      <main>
        <Routes>

          {/* ============================ */}
          {/* TEMPORARY ROUTE TEST         */}
          {/* ============================ */}

          <Route
            path="/test-help-route"
            element={<HelpRouteTest />}
          />

          {/* ============================ */}
          {/* HOME                         */}
          {/* ============================ */}

          <Route
            path="/"
            element={<Home />}
          />

          {/* ============================ */}
          {/* ALL SERVICES                 */}
          {/* ============================ */}

          <Route
            path="/services"
            element={<Services />}
          />

          {/* ============================ */}
          {/* HEALTH                       */}
          {/* ============================ */}

          <Route
            path="/health"
            element={<Health />}
          />

          {/* ============================ */}
          {/* BLOOD DONATION               */}
          {/* ============================ */}

          <Route
            path="/blood-donors"
            element={<BloodDonors />}
          />

          {/* ============================ */}
          {/* SCHOLARSHIPS                 */}
          {/* ============================ */}

          <Route
            path="/scholarship"
            element={<Scholarship />}
          />

          {/* ============================ */}
          {/* DISASTER ALERTS              */}
          {/* ============================ */}

          <Route
            path="/disaster-alerts"
            element={<DisasterAlerts />}
          />

          {/* ============================ */}
          {/* EMERGENCY CONTACTS           */}
          {/* ============================ */}

          <Route
            path="/emergency-contacts"
            element={<EmergencyContacts />}
          />

          {/* ============================ */}
          {/* RELIEF APPLICATION           */}
          {/* LOGIN REQUIRED               */}
          {/* ============================ */}

          <Route
            path="/relief-apply"
            element={
              <ProtectedRoute>
                <ReliefApply />
              </ProtectedRoute>
            }
          />

          {/* ============================ */}
          {/* SERVICE APPLICATION          */}
          {/* LOGIN REQUIRED               */}
          {/* ============================ */}

          <Route
            path="/service-apply/:name"
            element={
              <ProtectedRoute>
                <ServiceApply />
              </ProtectedRoute>
            }
          />

          {/* ============================ */}
          {/* VOLUNTEER SERVICES           */}
          {/* ============================ */}

          <Route
            path="/volunteer"
            element={<Volunteer />}
          />

          {/* ============================ */}
          {/* WELFARE PROGRAMS             */}
          {/* ============================ */}

          <Route
            path="/welfare-programs"
            element={<WelfarePrograms />}
          />

          {/* ============================ */}
          {/* NEARBY ESSENTIAL SERVICES    */}
          {/* ============================ */}

          <Route
            path="/nearby-services"
            element={<NearbyServices />}
          />

          {/* ============================ */}
          {/* CITIZEN COMPLAINTS           */}
          {/* ============================ */}

          <Route
            path="/complaints"
            element={<Complaints />}
          />

          {/* ============================ */}
          {/* GOVERNMENT E-SERVICES        */}
          {/* ============================ */}

          <Route
            path="/gov-services"
            element={<GovServices />}
          />

          {/* ============================ */}
          {/* CITIZEN / VISITOR FEEDBACK   */}
          {/* ============================ */}

          <Route
            path="/feedback"
            element={<CitizenFeedbackRoute />}
          />

          {/* ============================ */}
          {/* PUBLIC HELP CENTER           */}
          {/* ============================ */}

          <Route
            path="/help-center"
            element={<HelpCenter />}
          />

          {/* ============================ */}
          {/* LOGIN                        */}
          {/* ============================ */}

          <Route
            path="/login"
            element={<Login />}
          />

          {/* ============================ */}
          {/* REGISTRATION                 */}
          {/* ============================ */}

          <Route
            path="/register"
            element={<Register />}
          />

          {/* ============================ */}
          {/* CITIZEN DASHBOARD            */}
          {/* LOGIN REQUIRED               */}
          {/* ============================ */}

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <CitizenDashboard />
              </ProtectedRoute>
            }
          />

          {/* ============================ */}
          {/* ADMIN DASHBOARD              */}
          {/* ADMIN ONLY                   */}
          {/* ============================ */}

          <Route
            path="/admin"
            element={
              <ProtectedRoute admin>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* ============================ */}
          {/* ADMIN COMPLAINT MANAGEMENT   */}
          {/* ADMIN ONLY                   */}
          {/* ============================ */}

          <Route
            path="/admin/complaints"
            element={
              <ProtectedRoute admin>
                <AdminComplaints />
              </ProtectedRoute>
            }
          />

          {/* ============================ */}
          {/* ADMIN GOVERNMENT E-SERVICES  */}
          {/* ADMIN ONLY                   */}
          {/* ============================ */}

          <Route
            path="/admin/gov-services"
            element={
              <ProtectedRoute admin>
                <AdminGovServices />
              </ProtectedRoute>
            }
          />

          {/* ============================ */}
          {/* ADMIN FEEDBACK MANAGEMENT    */}
          {/* ADMIN ONLY                   */}
          {/* ============================ */}

          <Route
            path="/admin/feedback"
            element={
              <ProtectedRoute admin>
                <AdminFeedback />
              </ProtectedRoute>
            }
          />

          {/* ============================ */}
          {/* ADMIN HELP CENTER            */}
          {/* ADMIN ONLY                   */}
          {/* ============================ */}

          <Route
            path="/admin/help-center"
            element={
              <ProtectedRoute admin>
                <AdminHelpCenter />
              </ProtectedRoute>
            }
          />

          {/* ============================ */}
          {/* PAGE NOT FOUND               */}
          {/* ============================ */}

          <Route
            path="*"
            element={
              <div className="container section center">
                <h2>404</h2>

                <p>
                  {t(
                    'পাতাটি পাওয়া যায়নি',
                    'Page not found'
                  )}
                </p>

                <Link to="/">
                  {t(
                    'হোম পেজে ফিরে যান',
                    'Return to Home'
                  )}
                </Link>
              </div>
            }
          />

        </Routes>
      </main>

      {/* ================================= */}
      {/* FLOATING HELP ASSISTANT          */}
      {/* ================================= */}

      <HelpChat />

      {/* ================================= */}
      {/* FOOTER                           */}
      {/* ================================= */}

      <footer className="footer">
        <div className="container">

          <p>
            © 2026{' '}
            {t(
              'জনসেবা পোর্টাল – ডিজিটাল গভর্নেন্স প্ল্যাটফর্ম',
              'Jonoseba Portal – Digital Governance Platform'
            )}
          </p>

          <small>
            {t(
              'জরুরি প্রয়োজনে ৯৯৯ নম্বরে কল করুন',
              'In an emergency, call 999'
            )}
          </small>

        </div>
      </footer>

    </div>
  );
}
