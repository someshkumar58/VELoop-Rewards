import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ArrowLeft, Home } from 'lucide-react';
import Button from '../../components/common/Button';

const NotFoundPage = () => {
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
        backgroundColor: 'var(--accent-gold-soft)',
        color: 'var(--accent-gold)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '20px',
        border: '1px solid rgba(244, 199, 106, 0.4)'
      }}>
        <Compass size={36} />
      </div>

      <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '8px' }}>
        404 — Page Not Found
      </h1>

      <p style={{
        fontSize: '0.95rem',
        color: 'var(--text-secondary)',
        maxWidth: '440px',
        marginBottom: '24px',
        lineHeight: 1.5
      }}>
        The requested path does not exist in the VELoop Rewards portal. Check the URL or navigate back to the user or admin dashboard.
      </p>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link to="/user-profile">
          <Button variant="gold" icon={Home}>
            User Profile
          </Button>
        </Link>
        <Link to="/admin/dashboard">
          <Button variant="outline">
            Admin Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
