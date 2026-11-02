
import { Routes, Route } from 'react-router-dom';

// Main Components
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

// Context
import { useLang } from './context/LangContext.jsx';

// Existing Pages
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

// Authentication Pages
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';

// Dashboard Pages
import CitizenDashboard from './pages/CitizenDashboard.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';

// Nearby Essential Services
import NearbyServices from './pages/NearbyServices.jsx';

// Citizen Complaint & Tracking System
import Complaints from './pages/Complaints.jsx';
import AdminComplaints from './pages/AdminComplaints.jsx';
import GovServices from './pages/GovServices.jsx';
import AdminGovServices from './pages/AdminGovServices.jsx';

export default function App() {
  const { t } = useLang();

  return (
    <div className="app">
      {/* Main Navigation */}
      <Navbar />

      {/* Main Page Content */}
      <main>
        <Routes>
          {/* Home */}
          <Route
            path="/"
            element={<Home />}
          />

          {/* Citizen Services */}
          <Route
            path="/services"
            element={<Services />}
          />

          {/* Health and Blood Donation */}
          <Route
            path="/health"
            element={<Health />}
          />

          <Route
            path="/blood-donors"
            element={<BloodDonors />}
          />

          {/* Education and Scholarships */}
          <Route
            path="/scholarship"
            element={<Scholarship />}
          />

          {/* Disaster and Emergency Services */}
          <Route
            path="/disaster-alerts"
            element={<DisasterAlerts />}
          />

          <Route
            path="/emergency-contacts"
            element={<EmergencyContacts />}
          />

          {/* Relief Application - Login Required */}
          <Route
            path="/relief-apply"
            element={
              <ProtectedRoute>
                <ReliefApply />
              </ProtectedRoute>
            }
          />

          {/* Service Application - Login Required */}
          <Route
            path="/service-apply/:name"
            element={
              <ProtectedRoute>
                <ServiceApply />
              </ProtectedRoute>
            }
          />

          {/* Volunteer Registration */}
          <Route
            path="/volunteer"
            element={<Volunteer />}
          />

          {/* Welfare Programs */}
          <Route
            path="/welfare-programs"
            element={<WelfarePrograms />}
          />

          {/* Nearby Essential Services */}
          <Route
            path="/nearby-services"
            element={<NearbyServices />}
          />

          {/* Citizen Complaint Submission and Tracking */}
          {/* Public page; submission requires login inside the page/API */}
          <Route
            path="/complaints"
            element={<Complaints />}
          />

          {/* Authentication */}
          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            path="/register"
            element={<Register />}
          />

          {/* Citizen Dashboard - Login Required */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <CitizenDashboard />
              </ProtectedRoute>
            }
          />

          {/* Admin Dashboard - Admin Only */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute admin>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Complaint Management - Admin Only */}
          <Route
            path="/admin/complaints"
            element={
              <ProtectedRoute admin>
                <AdminComplaints />
              </ProtectedRoute>
            }
          />

          <Route path="/gov-services" element={<GovServices />} />
          <Route path="/admin/gov-services" element={<ProtectedRoute admin><AdminGovServices /></ProtectedRoute>} />
          {/* 404 - Page Not Found */}
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
              </div>
            }
          />
        </Routes>
      </main>

      {/* Footer */}
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
