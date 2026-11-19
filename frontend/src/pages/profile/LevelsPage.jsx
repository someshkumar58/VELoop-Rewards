import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  Crown,
  Sparkles,
  Zap,
  Shield,
  Coins,
  ChevronRight,
  TrendingUp,
  CheckCircle2,
  Lock,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { profileService } from '../../services/profileService';
import LevelAchievements from '../../components/profile/LevelAchievements';
import Skeleton from '../../components/common/Skeleton';
import Card from '../../components/common/Card';

const LevelsPage = () => {
  const { user, isDevPreview } = useAuth();
  const [loading, setLoading] = useState(true);
  const [levelProgress, setLevelProgress] = useState(user?.levelProgress || {});
  const [achievements, setAchievements] = useState(user?.achievements || []);

  useEffect(() => {
    let isMounted = true;
    const fetchLevelData = async () => {
      setLoading(true);
      try {
        const [lvlRes, achRes] = await Promise.all([
          profileService.getLevelProgress(),
          profileService.getAchievements()
        ]);
        if (isMounted) {
          setLevelProgress(lvlRes.data);
          setAchievements(achRes.data);
        }
      } catch (err) {
        console.error('[LevelsPage] Error loading level data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchLevelData();
    return () => {
      isMounted = false;
    };
  }, [isDevPreview]);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Breadcrumb & Return Link */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
          <Link to="/user-profile" style={{ color: 'var(--accent-gold)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ArrowLeft size={14} />
            <span>Profile Overview</span>
          </Link>
          <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Level & Achievements Roadmap</span>
        </div>
      </div>

      {/* Main Level Achievements Showcase Component */}
      <LevelAchievements
        levelProgress={levelProgress}
        achievements={achievements}
        loading={loading}
      />
    </div>
  );
};

export default LevelsPage;
