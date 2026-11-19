import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  Award,
  Edit2,
  Users,
  CheckCircle,
  Sparkles,
  Zap,
  Shield,
  Compass,
  Rocket,
  Crown,
  Gem,
  Lock,
  ArrowUpRight
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import InputField from '../../components/common/InputField';
import Skeleton from '../../components/common/Skeleton';

// Tier styling metadata
const TIER_META = {
  1: {
    accent: '#CD7F32',
    glow: 'rgba(205, 127, 50, 0.25)',
    icon: Shield,
    themeClass: 'bronze'
  },
  2: {
    accent: '#C0C0C0',
    glow: 'rgba(192, 192, 192, 0.25)',
    icon: Compass,
    themeClass: 'silver'
  },
  3: {
    accent: '#48CAE4',
    glow: 'rgba(72, 202, 228, 0.25)',
    icon: Rocket,
    themeClass: 'titanium'
  },
  4: {
    accent: '#F4C76A',
    glow: 'rgba(244, 199, 106, 0.3)',
    icon: Crown,
    themeClass: 'gold'
  },
  5: {
    accent: '#00F2FE',
    glow: 'rgba(0, 242, 254, 0.35)',
    icon: Gem,
    themeClass: 'diamond'
  }
};

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

      addToast(`Level ${editingLevel.level} (${formName}) configuration updated successfully.`, 'success');
      setEditingLevel(null);
    } catch (err) {
      addToast(err.message || 'Failed to save level tier.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Aggregated metrics
  const totalActiveUsers = levels.reduce((sum, l) => sum + (Number(l.activeUsers) || 0), 0);

  const columns = [
    {
      title: 'Tier',
      dataIndex: 'level',
      width: '90px',
      render: (val) => {
        const meta = TIER_META[val] || TIER_META[1];
        return (
          <span style={{
            backgroundColor: 'rgba(10, 12, 20, 0.7)',
            border: `1px solid ${meta.accent}`,
            color: meta.accent,
            fontWeight: 800,
            padding: '4px 10px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.85rem',
            boxShadow: `0 0 8px ${meta.glow}`
          }}>
            Lv.{val}
          </span>
        );
      }
    },
    {
      title: 'Rank Title',
      dataIndex: 'name',
      render: (val, row) => {
        const meta = TIER_META[row.level] || TIER_META[1];
        const Icon = meta.icon;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Icon size={16} style={{ color: meta.accent }} />
            <strong style={{ color: 'var(--text-primary)' }}>{val}</strong>
          </div>
        );
      }
    },
    {
      title: 'XP Requirement Range',
      render: (_, row) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--accent-blue)', fontWeight: 600 }}>
          {row.minXP.toLocaleString()} - {row.maxXP > 900000 ? '∞' : row.maxXP.toLocaleString()} XP
        </span>
      )
    },
    {
      title: 'Multiplier',
      dataIndex: 'multiplier',
      align: 'center',
      render: (val) => (
        <span style={{
          backgroundColor: 'rgba(52, 211, 153, 0.12)',
          border: '1px solid rgba(52, 211, 153, 0.3)',
          color: '#34D399',
          fontWeight: 800,
          padding: '3px 8px',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.85rem'
        }}>
          {val}
        </span>
      )
    },
    {
      title: 'Perks & Privilege Matrix',
      dataIndex: 'perks',
      render: (val) => <span style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>{val}</span>
    },
    {
      title: 'Active Members',
      dataIndex: 'activeUsers',
      align: 'right',
      render: (val) => (
        <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
          {val ? Number(val).toLocaleString() : '0'}
        </span>
      )
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
          Configure
        </Button>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 900, margin: '0 0 4px 0', color: 'var(--text-primary)' }}>
            Level & Experience Hierarchy
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
            Configure server-authoritative tier progression milestones, reward multipliers, and member achievement graduation thresholds.
          </p>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px'
      }}>
        <div style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '18px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.5px' }}>
            Defined Tiers
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-primary)' }}>
              {levels.length || 5}
            </span>
            <span style={{ fontSize: '0.82rem', color: 'var(--status-success)', fontWeight: 600 }}>Active Tiers</span>
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '18px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.5px' }}>
            Total Active Members
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)' }}>
              {totalActiveUsers.toLocaleString()}
            </span>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Tracked users</span>
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '18px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.5px' }}>
            Apex Multiplier
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--accent-gold)' }}>
              1.50x
            </span>
            <span style={{ fontSize: '0.82rem', color: 'var(--accent-gold)' }}>Diamond Legend</span>
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '18px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.5px' }}>
            Engine Status
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#34D399', boxShadow: '0 0 8px #34D399' }} />
            <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Authoritative Sync
            </span>
          </div>
        </div>
      </div>

      {/* Visual Tier Showcase Cards */}
      <div>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 12px 0' }}>
          Visual Tier Showcase
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '14px'
        }}>
          {levels.map((lvl) => {
            const meta = TIER_META[lvl.level] || TIER_META[1];
            const Icon = meta.icon;
            return (
              <div
                key={lvl.id || lvl.level}
                style={{
                  background: 'linear-gradient(180deg, rgba(20, 24, 38, 0.9) 0%, rgba(12, 15, 26, 0.95) 100%)',
                  border: `1px solid ${meta.accent}`,
                  borderRadius: 'var(--radius-xl)',
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  boxShadow: `0 4px 18px ${meta.glow}`,
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(10, 12, 20, 0.8)',
                    border: `1px solid ${meta.accent}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: meta.accent,
                    boxShadow: `0 0 10px ${meta.glow}`
                  }}>
                    <Icon size={20} />
                  </div>
                  <span style={{
                    backgroundColor: 'rgba(10, 12, 20, 0.7)',
                    border: `1px solid ${meta.accent}`,
                    color: meta.accent,
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)'
                  }}>
                    Tier {lvl.level}
                  </span>
                </div>

                <div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
                    {lvl.name}
                  </h4>
                  <div style={{ fontSize: '0.78rem', color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)' }}>
                    {lvl.minXP.toLocaleString()} - {lvl.maxXP > 900000 ? '∞' : lvl.maxXP.toLocaleString()} XP
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'rgba(10, 12, 20, 0.5)',
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-md)'
                }}>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Multiplier</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: meta.accent }}>{lvl.multiplier}</span>
                </div>

                <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4, flex: 1 }}>
                  {lvl.perks}
                </p>

                <Button
                  variant="ghost"
                  size="sm"
                  icon={Edit2}
                  onClick={() => handleOpenEdit(lvl)}
                  style={{ width: '100%', marginTop: '4px' }}
                >
                  Configure Tier
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tier Management Table */}
      <Card bodyClassName="p-0">
        <Table
          columns={columns}
          data={levels}
          loading={loading}
          emptyTitle="No levels defined"
        />
      </Card>

      {/* Configuration Modal */}
      {editingLevel && (
        <Modal
          isOpen={!!editingLevel}
          onClose={() => setEditingLevel(null)}
          title={`Configure Level ${editingLevel.level}: ${editingLevel.name}`}
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
          <form onSubmit={handleSaveLevel} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
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
