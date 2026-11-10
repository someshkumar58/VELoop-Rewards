import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, LogIn } from 'lucide-react';
import Button from '../../components/common/Button';

const UnauthorizedPage = () => {
  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '24px'
    }}>
      <div style={{
        width: '68px',
        height: '68px',
        borderRadius: '50%',
        backgroundColor: 'var(--status-error-soft)',
        color: 'var(--status-error)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '20px',
        border: '1px solid rgba(248, 113, 113, 0.4)'
      }}>
        <ShieldAlert size={36} />
      </div>

      <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '8px' }}>
        Access Restricted (403)
      </h1>

      <p style={{
        fontSize: '0.95rem',
        color: 'var(--text-secondary)',
        maxWidth: '460px',
        marginBottom: '24px',
        lineHeight: 1.5
      }}>
        You do not possess the required administrative clearance to access this module. Authentication tokens are strictly checked both client-side and by backend API guards.
      </p>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link to="/user-profile">
          <Button variant="outline" icon={ArrowLeft}>
            Return to User Profile
          </Button>
        </Link>
        <Link to="/admin/login">
          <Button variant="gold" icon={LogIn}>
            Admin Login
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
