import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  Award,
  Edit2,
  Users,
  CheckCircle,
  Sparkles,
  Zap
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import InputField from '../../components/common/InputField';
import Skeleton from '../../components/common/Skeleton';

const AdminLevelsPage = () => {
  const { addToast } = useToast();
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit Modal
  const [editingLevel, setEditingLevel] = useState(null);
  const [formName, setFormName] = useState('');
  const [formMinXP, setFormMinXP] = useState('');
  const [formMaxXP, setFormMaxXP] = useState('');
  const [formMultiplier, setFormMultiplier] = useState('');
  const [formPerks, setFormPerks] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchLevels = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminService.getLevels();
      setLevels(response.data);
    } catch (err) {
      addToast(err.message || 'Failed to load level tiers.', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchLevels();
  }, [fetchLevels]);

  const handleOpenEdit = (lvl) => {
    setEditingLevel(lvl);
    setFormName(lvl.name);
    setFormMinXP(String(lvl.minXP));
    setFormMaxXP(String(lvl.maxXP));
    setFormMultiplier(lvl.multiplier);
    setFormPerks(lvl.perks);
  };

  const handleSaveLevel = async (e) => {
    e.preventDefault();
    if (!formName.trim()) {
      addToast('Level name is required', 'error');
      return;
    }

    setSaving(true);
    try {
      await adminService.updateLevel(editingLevel.id, {
        name: formName,
        minXP: Number(formMinXP),
        maxXP: Number(formMaxXP),
        multiplier: formMultiplier,
        perks: formPerks,
      });

      setLevels((prev) =>
        prev.map((l) =>
          l.id === editingLevel.id
            ? {
                ...l,
                name: formName,
                minXP: Number(formMinXP),
                maxXP: Number(formMaxXP),
                multiplier: formMultiplier,
                perks: formPerks,
              }
            : l
        )
      );

      addToast(`Level ${editingLevel.level} configuration saved.`, 'success');
      setEditingLevel(null);
    } catch (err) {
      addToast(err.message || 'Failed to save level tier.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      title: 'Tier',
      dataIndex: 'level',
      width: '80px',
      render: (val) => (
        <span style={{
          backgroundColor: 'var(--accent-gold-soft)',
          color: 'var(--accent-gold)',
          fontWeight: 800,
          padding: '4px 8px',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.85rem'
        }}>
          Lv.{val}
        </span>
      )
    },
    {
      title: 'Rank Name',
      dataIndex: 'name',
      render: (val) => <strong style={{ color: 'var(--text-primary)' }}>{val}</strong>
    },
    {
      title: 'XP Requirement',
      render: (_, row) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--accent-blue)' }}>
          {row.minXP.toLocaleString()} - {row.maxXP > 900000 ? '∞' : row.maxXP.toLocaleString()} XP
        </span>
      )
    },
    {
      title: 'Reward Multiplier',
      dataIndex: 'multiplier',
      align: 'center',
      render: (val) => (
        <span style={{ color: 'var(--status-success)', fontWeight: 700 }}>
          {val}
        </span>
      )
    },
    {
      title: 'Unlocked Perks & Benefits',
      dataIndex: 'perks',
      render: (val) => <span style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>{val}</span>
    },
    {
      title: 'Active Members',
      dataIndex: 'activeUsers',
      align: 'right',
      render: (val) => <span style={{ fontWeight: 600 }}>{val ? val.toLocaleString() : 0}</span>
    },
    {
      title: 'Actions',
      align: 'right',
      render: (_, row) => (
        <Button
          variant="ghost"
          size="sm"
          icon={Edit2}
          onClick={() => handleOpenEdit(row)}
        >
          Edit
        </Button>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 4px 0' }}>Level & Experience Hierarchy</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
            Configure tier progression milestones, reward multipliers, and member achievement graduation thresholds.
          </p>
        </div>
      </div>

      <Card bodyClassName="p-0">
        <Table
          columns={columns}
          data={levels}
          loading={loading}
          emptyTitle="No levels defined"
        />
      </Card>

      {editingLevel && (
        <Modal
          isOpen={!!editingLevel}
          onClose={() => setEditingLevel(null)}
          title={`Edit Level ${editingLevel.level}: ${editingLevel.name}`}
          subtitle="Configure XP graduation boundaries and multiplier perks"
          maxWidth="500px"
          footer={
            <>
              <Button variant="ghost" onClick={() => setEditingLevel(null)} disabled={saving}>
                Cancel
              </Button>
              <Button variant="gold" onClick={handleSaveLevel} loading={saving}>
                Save Changes
              </Button>
            </>
          }
        >
          <form onSubmit={handleSaveLevel}>
            <InputField
              label="Level Rank Title"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              required
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <InputField
                label="Minimum XP"
                type="number"
                value={formMinXP}
                onChange={(e) => setFormMinXP(e.target.value)}
                required
              />

              <InputField
                label="Maximum XP Threshold"
                type="number"
                value={formMaxXP}
                onChange={(e) => setFormMaxXP(e.target.value)}
                required
              />
            </div>

            <InputField
              label="Reward Multiplier (e.g. 1.25x)"
              value={formMultiplier}
              onChange={(e) => setFormMultiplier(e.target.value)}
              required
            />

            <InputField
              label="Exclusive Perks Description"
              value={formPerks}
              onChange={(e) => setFormPerks(e.target.value)}
              required
            />
          </form>
        </Modal>
      )}
    </div>
  );
};

export default AdminLevelsPage;
