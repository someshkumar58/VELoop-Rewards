import React, { useState, useEffect, useCallback } from 'react';
import {
  Share2,
  Users,
  Search,
  Filter,
  CheckCircle,
  Clock,
  Coins,
  RefreshCw
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import InputField from '../../components/common/InputField';
import Pagination from '../../components/common/Pagination';

const AdminReferralsPage = () => {
  const { addToast } = useToast();
  const [referrals, setReferrals] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchReferrals = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminService.getReferrals();
      setReferrals(response.data);
    } catch (err) {
      addToast(err.message || 'Failed to load referral tree.', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchReferrals();
  }, [fetchReferrals]);

  const filtered = referrals.filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      r.referralCode.toLowerCase().includes(q) ||
      r.referrerName.toLowerCase().includes(q) ||
      r.referredUser.toLowerCase().includes(q)
    );
  });

  const columns = [
    {
      title: 'Referral Code',
      dataIndex: 'referralCode',
      render: (val) => (
        <code style={{ color: 'var(--accent-gold)', fontWeight: 700, backgroundColor: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: '4px' }}>
          {val}
        </code>
      )
    },
    {
      title: 'Referrer Account',
      dataIndex: 'referrerName',
      render: (val) => <strong style={{ color: 'var(--text-primary)' }}>{val}</strong>
    },
    {
      title: 'Attributed Sign-up',
      render: (_, row) => (
        <div>
          <span style={{ color: 'var(--text-primary)', display: 'block' }}>{row.referredUser}</span>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{row.referredUserId}</span>
        </div>
      )
    },
    {
      title: 'Registration Date',
      dataIndex: 'date',
      render: (val) => <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{val}</span>
    },
    {
      title: 'Referral Status',
      dataIndex: 'status',
      render: (val) => <Badge dot>{val}</Badge>
    },
    {
      title: 'Issued Reward',
      dataIndex: 'rewardEarned',
      align: 'right',
      render: (val) => (
        <span style={{ color: 'var(--status-success)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
          {val}
        </span>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 4px 0' }}>Referral Tracking & Attribution</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
            Inspect invitation link activations, fraud-check referral clusters, and monitor viral loop bonuses.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          icon={RefreshCw}
          onClick={fetchReferrals}
          loading={loading}
        >
          Refresh Tree
        </Button>
      </div>

      <div style={{ maxWidth: '400px' }}>
        <InputField
          placeholder="Filter by code or member name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={Search}
        />
      </div>

      <Card bodyClassName="p-0">
        <Table
          columns={columns}
          data={filtered}
          loading={loading}
          emptyTitle="No referrals match query"
        />
      </Card>
    </div>
  );
};

export default AdminReferralsPage;
