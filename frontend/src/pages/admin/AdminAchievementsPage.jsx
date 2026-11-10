import React, { useState, useEffect, useCallback } from 'react';
import {
  Award,
  PlusCircle,
  Edit2,
  Flame,
  Rocket,
  Coins,
  Users,
  Crown,
  Shield,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import InputField from '../../components/common/InputField';
import SelectField from '../../components/common/SelectField';
import Badge from '../../components/common/Badge';

const AdminAchievementsPage = () => {
  const { addToast } = useToast();
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit/Create Modal
  const [editingAch, setEditingAch] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [xpReward, setXpReward] = useState('250');
  const [category, setCategory] = useState('Loyalty');
  const [icon, setIcon] = useState('Flame');
  const [saving, setSaving] = useState(false);

  const fetchAchievements = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminService.getAchievements();
      setAchievements(response.data);
    } catch (err) {
      addToast(err.message || 'Failed to load achievements.', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  const handleOpenEdit = (ach) => {
    setEditingAch(ach);
    setTitle(ach.title);
    setDescription(ach.description);
    setXpReward(String(ach.xpReward));
    setCategory(ach.category || 'General');
    setIcon(ach.icon || 'Flame');
  };

  const handleOpenCreate = () => {
    setEditingAch({ id: `new_${Date.now()}`, isNew: true });
    setTitle('');
    setDescription('');
    setXpReward('500');
    setCategory('Loyalty');
    setIcon('Flame');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      addToast('Title and description are required.', 'error');
      return;
    }

    setSaving(true);
    try {
      await adminService.updateAchievement(editingAch.id, {
        title,
        description,
        xpReward: Number(xpReward),
        category,
        icon,
      });

      if (editingAch.isNew) {
        setAchievements((prev) => [
          ...prev,
          {
            id: editingAch.id,
            title,
            description,
            xpReward: Number(xpReward),
            category,
            icon,
            totalUnlocked: 0,
          }
        ]);
        addToast('New achievement badge created successfully.', 'success');
      } else {
        setAchievements((prev) =>
          prev.map((a) =>
            a.id === editingAch.id
              ? { ...a, title, description, xpReward: Number(xpReward), category, icon }
              : a
          )
        );
        addToast('Achievement badge updated.', 'success');
      }
      setEditingAch(null);
    } catch (err) {
      addToast(err.message || 'Failed to save achievement.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      title: 'Badge',
      render: (_, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--accent-gold-soft)',
            color: 'var(--accent-gold)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Award size={18} />
          </div>
          <div>
            <strong style={{ color: 'var(--text-primary)', display: 'block' }}>{row.title}</strong>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Code: {row.code || row.id}</span>
          </div>
        </div>
      )
    },
    {
      title: 'Description',
      dataIndex: 'description',
      render: (val) => <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{val}</span>
    },
    {
      title: 'Category',
      dataIndex: 'category',
      render: (val) => <Badge variant="purple" size="sm">{val}</Badge>
    },
    {
      title: 'XP Award',
      dataIndex: 'xpReward',
      align: 'right',
      render: (val) => (
        <span style={{ color: 'var(--accent-gold)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
          +{val} XP
        </span>
      )
    },
    {
      title: 'Unlocked Count',
      dataIndex: 'totalUnlocked',
      align: 'right',
      render: (val) => <span style={{ fontWeight: 600 }}>{val ? val.toLocaleString() : 0} members</span>
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
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 4px 0' }}>Achievement Badges</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
            Manage collectible milestones, unlock requirements, and automatic level bonus distribution.
          </p>
        </div>

        <Button
          variant="gold"
          size="md"
          icon={PlusCircle}
          onClick={handleOpenCreate}
        >
          Create Badge
        </Button>
      </div>

      <Card bodyClassName="p-0">
        <Table
          columns={columns}
          data={achievements}
          loading={loading}
          emptyTitle="No achievements found"
        />
      </Card>

      {editingAch && (
        <Modal
          isOpen={!!editingAch}
          onClose={() => setEditingAch(null)}
          title={editingAch.isNew ? 'Create Achievement Badge' : `Edit: ${editingAch.title}`}
          subtitle="Configure unlock conditions and experience awards"
          maxWidth="500px"
          footer={
            <>
              <Button variant="ghost" onClick={() => setEditingAch(null)} disabled={saving}>
                Cancel
              </Button>
              <Button variant="gold" onClick={handleSave} loading={saving}>
                {editingAch.isNew ? 'Create Badge' : 'Save Changes'}
              </Button>
            </>
          }
        >
          <form onSubmit={handleSave}>
            <InputField
              label="Badge Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Century Club"
              required
            />

            <InputField
              label="Unlock Requirement Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Complete 100 daily bonus check-ins"
              required
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <InputField
                label="XP Reward Awarded"
                type="number"
                value={xpReward}
                onChange={(e) => setXpReward(e.target.value)}
                required
              />

              <SelectField
                label="Badge Category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                options={[
                  { value: 'Loyalty', label: 'Loyalty' },
                  { value: 'Onboarding', label: 'Onboarding' },
                  { value: 'Community', label: 'Community' },
                  { value: 'Rewards', label: 'Rewards' },
                  { value: 'Elite', label: 'Elite' }
                ]}
                required
              />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default AdminAchievementsPage;
