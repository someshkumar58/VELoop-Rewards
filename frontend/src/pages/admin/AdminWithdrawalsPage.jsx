import React, { useState, useEffect, useCallback } from 'react';
import {
  Wallet,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  AlertTriangle
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import InputField from '../../components/common/InputField';
import SelectField from '../../components/common/SelectField';

const AdminWithdrawalsPage = () => {
  const { addToast } = useToast();
  const [withdrawals, setWithdrawals] = useState([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  // Review Modal
  const [selectedReq, setSelectedReq] = useState(null);
  const [decision, setDecision] = useState('Approved'); // 'Approved' | 'Rejected'
  const [reviewReason, setReviewReason] = useState('');
  const [reviewing, setReviewing] = useState(false);

  const fetchWithdrawals = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminService.getWithdrawals(filter);
      setWithdrawals(response.data);
    } catch (err) {
      addToast(err.message || 'Failed to load withdrawal requests.', 'error');
    } finally {
      setLoading(false);
    }
  }, [filter, addToast]);

  useEffect(() => {
    fetchWithdrawals();
  }, [fetchWithdrawals]);

  const handleOpenReview = (req, action) => {
    setSelectedReq(req);
    setDecision(action);
    setReviewReason(
      action === 'Approved'
        ? 'Administrative request approved. (Infrastructure verification recorded; real payout disabled)'
        : 'Payout address mismatched with registered identity.'
    );
  };

  const handleConfirmReview = async () => {
    if (!selectedReq) return;
    setReviewing(true);
    try {
      await adminService.reviewWithdrawal(selectedReq.id, decision, reviewReason);

      setWithdrawals((prev) =>
        prev.map((w) =>
          w.id === selectedReq.id
            ? { ...w, status: decision, rejectionReason: decision === 'Rejected' ? reviewReason : undefined }
            : w
        )
      );

      addToast(`Withdrawal #${selectedReq.requestId} marked as ${decision}.`, 'success');
      setSelectedReq(null);
    } catch (err) {
      addToast(err.message || 'Failed to update withdrawal status.', 'error');
    } finally {
      setReviewing(false);
    }
  };

  const columns = [
    {
      title: 'Request ID',
      dataIndex: 'requestId',
      render: (val) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-gold)' }}>
          #{val}
        </span>
      )
    },
    {
      title: 'Member',
      render: (_, row) => (
        <div>
          <strong style={{ color: 'var(--text-primary)', display: 'block' }}>{row.userName}</strong>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{row.userId}</span>
        </div>
      )
    },
    {
      title: 'Amount',
      align: 'right',
      render: (_, row) => (
        <div style={{ textAlign: 'right' }}>
          <strong style={{ fontSize: '1rem', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
            {Number(row.amount).toFixed(2)} Tokens
          </strong>
          <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Asset: {row.asset || 'tokens'}
          </span>
        </div>
      )
    },
    {
      title: 'Method / Network',
      dataIndex: 'currency',
      render: (val) => <Badge variant="info" size="sm">{val}</Badge>
    },
    {
      title: 'Payout Address',
      dataIndex: 'payoutAddress',
      render: (val) => (
        <code style={{ fontSize: '0.78rem', color: 'var(--accent-blue)', backgroundColor: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: '4px' }}>
          {val}
        </code>
      )
    },
    {
      title: 'Requested At',
      dataIndex: 'requestedAt',
      render: (val) => <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{val}</span>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (val) => <Badge dot>{val}</Badge>
    },
    {
      title: 'Review Controls',
      align: 'right',
      render: (_, row) => {
        if (row.status?.toLowerCase() !== 'pending') {
          return (
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Completed
            </span>
          );
        }
        return (
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <Button
              variant="gold"
              size="sm"
              onClick={() => handleOpenReview(row, 'Approved')}
            >
              Approve
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => handleOpenReview(row, 'Rejected')}
            >
              Reject
            </Button>
          </div>
        );
      }
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 4px 0' }}>Withdrawal Payout Approvals</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
            Inspect pending withdrawal requests, review recipient addresses, and perform administrative approvals.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          icon={RefreshCw}
          onClick={fetchWithdrawals}
          loading={loading}
        >
          Refresh Queue
        </Button>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        backgroundColor: 'rgba(110, 168, 254, 0.12)',
        border: '1px solid rgba(110, 168, 254, 0.35)',
        color: 'var(--accent-blue)',
        padding: '10px 14px',
        borderRadius: 'var(--radius-md)',
        fontSize: '0.82rem'
      }}>
        <AlertTriangle size={16} style={{ flexShrink: 0 }} />
        <span>
          <strong>Infrastructure Mode:</strong> Administrative approval verifies requests and records administrative token reservation audit status. Real-money fiat and cryptocurrency transfers remain disabled in this phase.
        </span>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {['All', 'Pending', 'Approved', 'Rejected'].map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setFilter(tab)}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border-color)',
              backgroundColor: filter === tab ? 'var(--accent-gold-soft)' : 'var(--bg-card)',
              color: filter === tab ? 'var(--accent-gold)' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.82rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            {tab} Requests
          </button>
        ))}
      </div>

      <Card bodyClassName="p-0">
        <Table
          columns={columns}
          data={withdrawals}
          loading={loading}
          emptyTitle="No withdrawal requests in this queue"
        />
      </Card>

      {/* Approve / Reject Modal */}
      {selectedReq && (
        <Modal
          isOpen={!!selectedReq}
          onClose={() => setSelectedReq(null)}
          title={`${decision} Withdrawal Request #${selectedReq.requestId}`}
          subtitle={`Amount: ${selectedReq.amount.toFixed(2)} Tokens • Member: ${selectedReq.userName}`}
          maxWidth="500px"
          footer={
            <>
              <Button variant="ghost" onClick={() => setSelectedReq(null)} disabled={reviewing}>
                Cancel
              </Button>
              <Button
                variant={decision === 'Approved' ? 'gold' : 'danger'}
                onClick={handleConfirmReview}
                loading={reviewing}
              >
                Confirm {decision}
              </Button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem'
            }}>
              <div><strong>Recipient Destination:</strong> <code>{selectedReq.payoutAddress}</code></div>
              <div><strong>Method / Network:</strong> {selectedReq.currency}</div>
              <div><strong>Reserved Amount:</strong> {selectedReq.amount.toFixed(2)} Tokens</div>
            </div>

            <InputField
              label="Reviewer Justification / Administrative Note"
              value={reviewReason}
              onChange={(e) => setReviewReason(e.target.value)}
              placeholder="e.g. Identity verified / Administrative record or reason for rejection"
              required
            />
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminWithdrawalsPage;
