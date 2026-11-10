import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Users,
  Search,
  Filter,
  UserCheck,
  UserX,
  ExternalLink,
  ShieldAlert,
  ArrowUpDown,
  RefreshCw
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import InputField from '../../components/common/InputField';
import SelectField from '../../components/common/SelectField';
import Pagination from '../../components/common/Pagination';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Modal from '../../components/common/Modal';
import styles from './AdminUsers.module.css';

const AdminUsersPage = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(1);
  const pageSize = 5;

  // Suspend/Restore Dialog
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionType, setActionType] = useState('Suspend'); // 'Suspend' | 'Restore'
  const [actionReason, setActionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminService.getUsers({
        search,
        status: statusFilter,
        page,
        limit: pageSize,
      });
      setUsers(response.data);
      setTotal(response.total);
    } catch (err) {
      console.error('[AdminUsersPage] Error fetching users:', err);
      setError(err.message || 'Unable to retrieve user directory.');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleOpenStatusDialog = (user, type) => {
    setSelectedUser(user);
    setActionType(type);
    setActionReason(type === 'Suspend' ? 'Violation of Terms: Automated reward scraping' : 'Account appeal reviewed and approved');
  };

  const handleConfirmStatusChange = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      const newStatus = actionType === 'Suspend' ? 'Suspended' : 'Active';
      await adminService.updateUserStatus(selectedUser.id, newStatus, actionReason);

      // Update local state
      setUsers((prev) =>
        prev.map((u) => (u.id === selectedUser.id ? { ...u, accountStatus: newStatus } : u))
      );

      addToast(`User ${selectedUser.fullName} has been ${actionType === 'Suspend' ? 'suspended' : 'restored'}.`, 'success');
      setSelectedUser(null);
    } catch (err) {
      addToast(err.message || 'Failed to update user status.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    {
      title: 'Member',
      dataIndex: 'fullName',
      render: (_, row) => (
        <div className={styles.userCell}>
          <div className={styles.avatarMini}>
            {row.fullName.charAt(0)}
          </div>
          <div className={styles.userNameCol}>
            <Link to={`/admin/users/${row.id}`} className={styles.userNameLink}>
              {row.fullName}
            </Link>
            <span className={styles.userEmail}>{row.email}</span>
          </div>
        </div>
      )
    },
    {
      title: 'User ID',
      dataIndex: 'userId',
      render: (val) => <code className={styles.codeUserId}>{val}</code>
    },
    {
      title: 'Status',
      dataIndex: 'accountStatus',
      render: (val) => <Badge dot>{val}</Badge>
    },
    {
      title: 'Level',
      dataIndex: 'level',
      render: (val) => <span className={styles.levelPill}>Lv.{val}</span>
    },
    {
      title: 'VEs Balance',
      dataIndex: 'vesBalance',
      align: 'right',
      render: (val) => (
        <span className={styles.balanceGold}>
          {Number(val).toLocaleString(undefined, { minimumFractionDigits: 2 })} VEs
        </span>
      )
    },
    {
      title: 'Referrals',
      dataIndex: 'referralsCount',
      align: 'center',
      render: (val) => <span className={styles.referralsCount}>{val}</span>
    },
    {
      title: 'Actions',
      align: 'right',
      render: (_, row) => (
        <div className={styles.actionBtns}>
          <Link to={`/admin/users/${row.id}`}>
            <Button variant="ghost" size="sm">
              Details
            </Button>
          </Link>

          {row.accountStatus === 'Suspended' ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenStatusDialog(row, 'Restore')}
            >
              Restore
            </Button>
          ) : (
            <Button
              variant="danger"
              size="sm"
              onClick={() => handleOpenStatusDialog(row, 'Suspend')}
            >
              Suspend
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className={styles.pageWrap}>
      {/* Header */}
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.pageTitle}>User Account Directory</h1>
          <p className={styles.pageSubtitle}>
            Search, inspect, and moderate registered member accounts across the platform.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          icon={RefreshCw}
          onClick={fetchUsers}
          loading={loading}
        >
          Refresh Directory
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className={styles.filterBar}>
        <div className={styles.searchWrap}>
          <InputField
            placeholder="Search by name, email, or User ID (e.g. VEL-894210)..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            leftIcon={Search}
          />
        </div>

        <div className={styles.filterSelect}>
          <SelectField
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { value: 'All', label: 'All Statuses' },
              { value: 'Active', label: 'Active' },
              { value: 'Suspended', label: 'Suspended' },
              { value: 'Pending Verification', label: 'Pending Verification' }
            ]}
          />
        </div>
      </div>

      {/* Users Table */}
      <Card bodyClassName={styles.tableCardBody}>
        <Table
          columns={columns}
          data={users}
          loading={loading}
          emptyTitle="No members match search query"
        />

        <Pagination
          currentPage={page}
          totalItems={total}
          pageSize={pageSize}
          onPageChange={(p) => setPage(p)}
        />
      </Card>

      {/* Suspend / Restore Confirmation Modal with Reason Field */}
      {selectedUser && (
        <Modal
          isOpen={!!selectedUser}
          onClose={() => setSelectedUser(null)}
          title={`${actionType} User Account`}
          subtitle={`Member: ${selectedUser.fullName} (${selectedUser.userId})`}
          maxWidth="500px"
          footer={
            <>
              <Button variant="ghost" onClick={() => setSelectedUser(null)} disabled={actionLoading}>
                Cancel
              </Button>
              <Button
                variant={actionType === 'Suspend' ? 'danger' : 'gold'}
                onClick={handleConfirmStatusChange}
                loading={actionLoading}
              >
                Confirm {actionType}
              </Button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>
              Are you sure you want to change the status of <strong>{selectedUser.fullName}</strong> to{' '}
              <span style={{ color: actionType === 'Suspend' ? 'var(--status-error)' : 'var(--status-success)', fontWeight: 700 }}>
                {actionType === 'Suspend' ? 'Suspended' : 'Active'}
              </span>?
            </p>

            <InputField
              label="Administrative Audit Reason"
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              placeholder="Provide a justification for the security audit log..."
              required
            />
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminUsersPage;
