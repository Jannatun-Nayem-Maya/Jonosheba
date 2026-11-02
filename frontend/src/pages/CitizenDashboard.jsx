
import { Link } from 'react-router-dom';

import { useLang } from '../context/LangContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import {
  PageHeader,
  useApi,
  Loader,
  ErrorBox
} from '../components/ui.jsx';

import { BLOOD_BANK_URL } from '../components/BloodBankLink.jsx';

export const STATUS = {
  pending: ['যাচাইাধীন', 'Pending', 'badge-warning'],
  approved: ['অনুমোদিত', 'Approved', 'badge-success'],
  rejected: ['বাতিল', 'Rejected', 'badge-danger']
};

const COMPLAINT_STATUS = {
  pending: ['অপেক্ষমাণ', 'Pending', 'badge-warning'],
  in_progress: ['কাজ চলছে', 'In Progress', 'badge-primary'],
  resolved: ['সমাধান হয়েছে', 'Resolved', 'badge-success'],
  rejected: ['বাতিল', 'Rejected', 'badge-danger'],
  reopened: ['পুনরায় চালু', 'Reopened', 'badge-warning']
};

export default function CitizenDashboard() {
  const { t, num, fmtDate, lang } = useLang();
  const { user } = useAuth();

  // Existing service/relief application data
  const {
    data: applicationData,
    loading: applicationsLoading,
    error: applicationsError
  } = useApi('/applications/mine');

  // New complaint tracking data
  const {
    data: complaintData,
    loading: complaintsLoading,
    error: complaintsError
  } = useApi('/complaints/mine');

  const apps = Array.isArray(applicationData)
    ? applicationData
    : [];

  const complaints = Array.isArray(complaintData)
    ? complaintData
    : [];

  const countApplications = status =>
    apps.filter(item => item.status === status).length;

  const countComplaints = status =>
    complaints.filter(item => item.status === status).length;

  const applicationStatusLabel = status =>
    STATUS[status] || [status, status, 'badge-soft'];

  const complaintStatusLabel = status =>
    COMPLAINT_STATUS[status] ||
    [status, status, 'badge-soft'];

  return (
    <>
      {/* Dashboard Header */}
      <PageHeader
        icon="fa-user-tie"
        title={t(
          `স্বাগতম, ${user?.name || ''}`,
          `Welcome, ${user?.name || ''}`
        )}
        subtitle={[
          user?.email,
          user?.phone,
          user?.district
        ].filter(Boolean).join(' · ')}
      />

      <div className="container section">

        {/* Existing Application Statistics */}
        <div className="stat-row">
          <div className="stat">
            <strong>{num(apps.length)}</strong>
            <span>
              {t('মোট আবেদন', 'Total applications')}
            </span>
          </div>

          <div className="stat ok">
            <strong>{num(countApplications('approved'))}</strong>
            <span>{t('অনুমোদিত', 'Approved')}</span>
          </div>

          <div className="stat warn">
            <strong>{num(countApplications('pending'))}</strong>
            <span>{t('যাচাইাধীন', 'Pending')}</span>
          </div>

          <div className="stat">
            <strong>
              {num(user?.savedScholarships?.length || 0)}
            </strong>
            <span>
              {t('সংরক্ষিত বৃত্তি', 'Saved scholarships')}
            </span>
          </div>
        </div>

        {/* Existing Quick Actions + New Complaint Action */}
        <div className="quick-actions">
          <Link
            to="/relief-apply"
            className="btn btn-outline"
          >
            <i className="fa-solid fa-hand-holding-dollar" />
            {' '}
            {t('ত্রাণ আবেদন', 'Relief application')}
          </Link>

          <Link
            to="/service-apply/general"
            className="btn btn-outline"
          >
            <i className="fa-solid fa-file-signature" />
            {' '}
            {t('সেবার আবেদন', 'Service request')}
          </Link>

          <Link
            to="/scholarship"
            className="btn btn-outline"
          >
            <i className="fa-solid fa-graduation-cap" />
            {' '}
            {t('বৃত্তি', 'Scholarships')}
          </Link>

          <a
            href={BLOOD_BANK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-accent"
          >
            <i className="fa-solid fa-droplet" />
            {' '}
            {t('জাতীয় ব্লাড ব্যাংক', 'National Blood Bank')}
          </a>

          {/* New Complaint Feature */}
          <Link
            to="/complaints"
            className="btn btn-outline"
          >
            <i className="fa-solid fa-clipboard-list" />
            {' '}
            {t('আমার অভিযোগ', 'My Complaints')}
          </Link>
        </div>

        {/* Existing Application History */}
        <div className="card pad">
          <h3 className="card-title">
            <i className="fa-solid fa-clock-rotate-left text-primary" />
            {' '}
            {t(
              'আবেদনের ইতিহাস ও অবস্থা',
              'Application History & Status'
            )}
          </h3>

          {applicationsLoading && <Loader />}

          <ErrorBox message={applicationsError} />

          {!applicationsLoading && !applicationsError &&
            apps.length === 0 && (
              <div className="notice">
                {t(
                  'আপনি এখনো কোনো আবেদন করেননি।',
                  'You have not submitted any applications yet.'
                )}
              </div>
            )}

          {apps.length > 0 && (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>{t('আইডি', 'ID')}</th>
                    <th>{t('সেবা', 'Service')}</th>
                    <th>{t('তারিখ', 'Date')}</th>
                    <th>{t('অবস্থা', 'Status')}</th>
                    <th>{t('মন্তব্য', 'Note')}</th>
                  </tr>
                </thead>

                <tbody>
                  {apps.map(item => {
                    const status = applicationStatusLabel(
                      item.status
                    );

                    return (
                      <tr key={item._id}>
                        <td>
                          <strong>{item.trackingId}</strong>
                        </td>

                        <td>
                          {item.service ||
                            t('ত্রাণ আবেদন', 'Relief application')}
                        </td>

                        <td>{fmtDate(item.createdAt)}</td>

                        <td>
                          <span className={`badge ${status[2]}`}>
                            {status[lang === 'bn' ? 0 : 1]}
                          </span>
                        </td>

                        <td className="muted small">
                          {item.note || '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* New Complaint Tracking Section */}
        <div
          className="card pad"
          style={{ marginTop: 24 }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
              marginBottom: 20
            }}
          >
            <div>
              <h3 className="card-title">
                <i className="fa-solid fa-clipboard-list text-primary" />
                {' '}
                {t(
                  'আমার অভিযোগ ও ট্র্যাকিং',
                  'My Complaints & Tracking'
                )}
              </h3>

              <p className="muted small">
                {t(
                  'আপনার অভিযোগের বর্তমান অবস্থা ও অগ্রগতি দেখুন।',
                  'View the current status and progress of your complaints.'
                )}
              </p>
            </div>

            <Link
              to="/complaints"
              className="btn btn-success btn-sm"
            >
              <i className="fa-solid fa-plus" />
              {' '}
              {t('নতুন অভিযোগ', 'New Complaint')}
            </Link>
          </div>

          {/* Complaint Statistics */}
          <div
            className="stat-row"
            style={{ marginBottom: 20 }}
          >
            <div className="stat">
              <strong>{num(complaints.length)}</strong>
              <span>
                {t('মোট অভিযোগ', 'Total Complaints')}
              </span>
            </div>

            <div className="stat warn">
              <strong>
                {num(countComplaints('pending'))}
              </strong>
              <span>
                {t('অপেক্ষমাণ', 'Pending')}
              </span>
            </div>

            <div className="stat">
              <strong>
                {num(
                  countComplaints('in_progress') +
                  countComplaints('reopened')
                )}
              </strong>
              <span>
                {t('কাজ চলছে', 'In Progress')}
              </span>
            </div>

            <div className="stat ok">
              <strong>
                {num(countComplaints('resolved'))}
              </strong>
              <span>
                {t('সমাধান হয়েছে', 'Resolved')}
              </span>
            </div>
          </div>

          {/* Complaint Data Loading */}
          {complaintsLoading && <Loader />}

          <ErrorBox message={complaintsError} />

          {/* Empty State */}
          {!complaintsLoading &&
            !complaintsError &&
            complaints.length === 0 && (
              <div className="notice">
                <i className="fa-solid fa-circle-info" />
                {' '}
                {t(
                  'আপনি এখনো কোনো অভিযোগ জমা দেননি।',
                  'You have not submitted any complaints yet.'
                )}
              </div>
            )}

          {/* Complaint History Table */}
          {complaints.length > 0 && (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>{t('ট্র্যাকিং আইডি', 'Tracking ID')}</th>
                    <th>{t('অভিযোগ', 'Complaint')}</th>
                    <th>{t('তারিখ', 'Date')}</th>
                    <th>{t('অবস্থা', 'Status')}</th>
                    <th>{t('অ্যাডমিনের উত্তর', 'Admin Response')}</th>
                  </tr>
                </thead>

                <tbody>
                  {complaints.slice(0, 8).map(item => {
                    const status =
                      complaintStatusLabel(item.status);

                    return (
                      <tr key={item._id}>
                        <td>
                          <strong>{item.trackingId}</strong>
                        </td>

                        <td>
                          {item.title}
                          <div className="muted small">
                            {item.district}
                          </div>
                        </td>

                        <td>
                          {fmtDate(item.createdAt)}
                        </td>

                        <td>
                          <span className={`badge ${status[2]}`}>
                            {status[lang === 'bn' ? 0 : 1]}
                          </span>
                        </td>

                        <td className="muted small">
                          {item.adminResponse || '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {complaints.length > 0 && (
            <div style={{ marginTop: 17 }}>
              <Link
                to="/complaints"
                className="btn btn-outline btn-sm"
              >
                {t(
                  'সব অভিযোগ ও বিস্তারিত দেখুন',
                  'View All Complaints & Details'
                )}
                {' '}
                <i className="fa-solid fa-arrow-right" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
