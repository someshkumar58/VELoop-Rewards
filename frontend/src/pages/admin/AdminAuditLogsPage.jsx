import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Shield,
  Search,
  Filter,
  Lock,
  RefreshCw,
  Info
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import InputField from '../../components/common/InputField';

const AdminAuditLogsPage = () => {
  const { addToast } = useToast();
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminService.getAuditLogs();
      setLogs(response.data);
    } catch (err) {
      addToast(err.message || 'Failed to load audit security logs.', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filtered = logs.filter((log) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      log.adminUser.toLowerCase().includes(q) ||
      log.actionType.toLowerCase().includes(q) ||
      log.entityId.toLowerCase().includes(q) ||
      log.reason.toLowerCase().includes(q)
    );
  });

  const columns = [
    {
      title: 'Timestamp (UTC)',
      dataIndex: 'timestamp',
      render: (val) => <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{val}</span>
    },
    {
      title: 'Administrator Identity',
      dataIndex: 'adminUser',
      render: (val) => <strong style={{ color: 'var(--text-primary)', fontSize: '0.85rem' }}>{val}</strong>
    },
    {
      title: 'Action Event',
      dataIndex: 'actionType',
      render: (val) => <Badge variant="gold" size="sm">{val}</Badge>
    },
    {
      title: 'Target Entity',
      render: (_, row) => (
        <div>
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{row.entityType}: </span>
          <code style={{ color: 'var(--accent-blue)', backgroundColor: 'var(--bg-secondary)', padding: '2px 4px', borderRadius: '4px' }}>
            {row.entityId}
          </code>
        </div>
      )
    },
    {
      title: 'Delta (Before -> After)',
      render: (_, row) => (
        <div style={{ fontSize: '0.78rem' }}>
          <div style={{ color: 'var(--status-error)' }}>Prev: {row.previousValue}</div>
          <div style={{ color: 'var(--status-success)' }}>New: {row.newValue}</div>
        </div>
      )
    },
    {
      title: 'Mandatory Justification',
      dataIndex: 'reason',
      render: (val) => (
        <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
          "{val}"
        </span>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 4px 0' }}>Administrative Security Audit Logs</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
            Read-only, tamper-evident security ledger logging all state-mutating actions executed by staff.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          icon={RefreshCw}
          onClick={fetchLogs}
          loading={loading}
        >
          Refresh Log
        </Button>
      </div>

      <div style={{ maxWidth: '400px' }}>
        <InputField
          placeholder="Search by admin, action, or target ID..."
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
          emptyTitle="No audit records match search filter"
        />
      </Card>
    </div>
  );
};

export default AdminAuditLogsPage;
