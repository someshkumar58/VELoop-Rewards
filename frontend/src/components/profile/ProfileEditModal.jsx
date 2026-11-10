import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import InputField from '../common/InputField';
import Button from '../common/Button';
import { useToast } from '../../context/ToastContext';
import { profileService } from '../../services/profileService';

const ProfileEditModal = ({
  isOpen = false,
  onClose,
  user,
  onUpdated,
}) => {
  const { addToast } = useToast();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setErrors({});
    }
  }, [user, isOpen]);

  const validate = () => {
    const newErrors = {};
    if (!fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please provide a valid email format';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const response = await profileService.updateProfile({
        fullName,
        email,
        phone,
      });
      addToast('Profile updated successfully!', 'success');
      const updatedUser = response.data?.user || response.data || { fullName, email, phone };
      onUpdated(updatedUser);
      onClose();
    } catch (err) {
      addToast(err.message || 'Failed to update profile.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Profile Information"
      subtitle="Update personal credentials associated with your VELoop account"
      maxWidth="500px"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="gold" onClick={handleSubmit} loading={loading}>
            Save Changes
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        <InputField
          label="Full Name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          error={errors.fullName}
          placeholder="e.g. Alexander Wright"
          required
        />

        <InputField
          label="Email Address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          placeholder="name@veloop.io"
          required
        />

        <InputField
          label="Phone Number"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+1 (555) 000-0000"
          helperText="Used for SMS security verifications (optional)"
        />
      </form>
    </Modal>
  );
};

export default ProfileEditModal;
