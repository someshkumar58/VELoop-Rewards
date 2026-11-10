import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  Search,
  Filter,
  RefreshCw,
  Gift,
  Tv,
  Coins,
  TrendingUp,
  Wallet
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import InputField from '../../components/common/InputField';
import SelectField from '../../components/common/SelectField';

const AdminActivityPage = () => {
  const { addToast } = useToast();
  const [activities, setActivities] = useState([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminService.getActivities();
      setActivities(response.data);
    } catch (err) {
      addToast(err.message || 'Failed to load activity stream.', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const filtered = activities.filter((act) => {
    const matchSearch =
      !search.trim() ||
      act.user?.toLowerCase().includes(search.toLowerCase()) ||
      act.type?.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'All' || act.type === typeFilter;
    return matchSearch && matchType;
  });

  const columns = [
    {
      title: 'Timestamp',
      dataIndex: 'time',
      render: (val) => <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{val}</span>
    },
    {
      title: 'Member / Entity',
      dataIndex: 'user',
      render: (val) => <strong style={{ color: 'var(--text-primary)' }}>{val}</strong>
    },
    {
      title: 'Action Event',
      dataIndex: 'type',
      render: (val) => <span style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>{val}</span>
    },
    {
      title: 'Transaction Impact',
      dataIndex: 'amount',
      render: (val) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: val.includes('$') || val.includes('+') ? 'var(--status-success)' : 'var(--text-primary)' }}>
          {val}
        </span>
      )
    },
    {
      title: 'Telemetry Status',
      dataIndex: 'status',
      align: 'right',
      render: (val) => <Badge dot>{val}</Badge>
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 4px 0' }}>Live System Activity Streams</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
            Unified real-time feed of all user engagement events, ad views, payouts, and level boosts.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          icon={RefreshCw}
          onClick={fetchActivities}
          loading={loading}
        >
          Live Poll
        </Button>
      </div>

      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '260px' }}>
          <InputField
            placeholder="Search member or action event..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={Search}
          />
        </div>
      </div>

      <Card bodyClassName="p-0">
        <Table
          columns={columns}
          data={filtered}
          loading={loading}
          emptyTitle="No activity records found"
        />
      </Card>
    </div>
  );
};

export default AdminActivityPage;
