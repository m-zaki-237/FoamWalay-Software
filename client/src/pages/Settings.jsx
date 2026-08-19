import React, { useEffect, useState } from 'react';
import { settingsApi, backupApi, authApi } from '../api/services';
import { useSettingsStore } from '../stores/settingsStore';
import { toast } from '../stores/toastStore';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Store, Lock, Database, Download, CheckCircle2 } from 'lucide-react';

export default function Settings() {
  const { settings, fetchSettings, updateSettings } = useSettingsStore();

  // Business Profile Form
  const [businessName, setBusinessName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password Change Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  // Backup & Restore
  const [restoreFile, setRestoreFile] = useState(null);
  const [restoreJson, setRestoreJson] = useState(null);
  const [restoreConfirmOpen, setRestoreConfirmOpen] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState('');
  const [restoreError, setRestoreError] = useState('');
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (settings) {
      setBusinessName(settings.businessName || '');
      setAddress(settings.address || '');
      setPhone(settings.phone || '');
    }
  }, [settings]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileMessage('');
    setProfileError('');

    try {
      setSavingProfile(true);
      await updateSettings({ businessName, address, phone });
      toast.success('Business profile updated successfully!');
      setProfileMessage('Business profile updated.');
    } catch (err) {
      setProfileError(err.message || 'Failed to update settings');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordMessage('');
    setPasswordError('');

    if (!currentPassword || !newPassword) {
      setPasswordError('Both current and new passwords are required');
      return;
    }

    if (newPassword.trim().length < 4) {
      setPasswordError('New password must be at least 4 characters long');
      return;
    }

    try {
      setSavingPassword(true);
      await authApi.changePassword(currentPassword, newPassword);
      toast.success('Master admin password changed successfully.');
      setPasswordMessage('Admin password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setPasswordError(err.message || 'Failed to update password');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleDownloadBackup = async () => {
    try {
      const response = await fetch('/api/backup');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `foamwalay-backup-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      toast.success('Database backup JSON exported.');
    } catch (err) {
      toast.error('Failed to generate backup: ' + err.message);
    }
  };

  const handleFileSelect = (e) => {
    setRestoreError('');
    setRestoreMessage('');
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (parsed.app !== 'FoamWalay' || !parsed.data) {
          setRestoreError('Invalid backup file format. Must be a valid FoamWalay backup file.');
          return;
        }
        setRestoreJson(parsed);
        setRestoreFile(file);
      } catch (err) {
        setRestoreError('Corrupted JSON file. Unable to parse backup content.');
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmRestore = async () => {
    if (!restoreJson) return;

    try {
      setRestoring(true);
      const res = await backupApi.restore(restoreJson);
      toast.success(res.data.message || 'Database restored successfully!');
      setRestoreMessage('Database restored.');
      setRestoreConfirmOpen(false);
      setRestoreFile(null);
      setRestoreJson(null);
      fetchSettings();
    } catch (err) {
      setRestoreError(err.message || 'Failed to restore database');
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 font-heading">Settings & Business Profile</h1>
        <p className="text-xs text-slate-600 font-medium mt-0.5">Manage business information, master password, and database backup/restore</p>
      </div>

      {/* Business Profile Card */}
      <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 font-heading">Business Information</h3>
            <p className="text-xs text-slate-600 font-medium">Displayed on PDF reports, exports, and top header</p>
          </div>
        </div>

        {profileMessage && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{profileMessage}</span>
          </div>
        )}
        {profileError && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {profileError}
          </div>
        )}

        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <Input
            label="Shop Business Name"
            required
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Shop Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
            <Input
              label="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="pt-2 flex justify-end">
            <Button type="submit" loading={savingProfile} variant="primary">
              Save Profile Changes
            </Button>
          </div>
        </form>
      </div>

      {/* Security Form Card */}
      <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
          <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 font-heading">Security & Admin Password</h3>
            <p className="text-xs text-slate-600 font-medium">Update your single-admin access master password</p>
          </div>
        </div>

        {passwordMessage && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{passwordMessage}</span>
          </div>
        )}
        {passwordError && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {passwordError}
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Current Password"
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
            <Input
              label="New Password"
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          <div className="pt-2 flex justify-end">
            <Button type="submit" loading={savingPassword} variant="primary">
              Update Master Password
            </Button>
          </div>
        </form>
      </div>

      {/* Backup & Restore Card */}
      <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
          <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 font-heading">Database Backup & Restore</h3>
            <p className="text-xs text-slate-600 font-medium">Export local JSON database backup or restore collection data from file</p>
          </div>
        </div>

        {restoreMessage && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{restoreMessage}</span>
          </div>
        )}
        {restoreError && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {restoreError}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Backup */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">Backup Data</h4>
            <p className="text-xs text-slate-600 font-medium">
              Export a timestamped `.json` file containing products, inventory, and sales history.
            </p>
            <Button
              variant="secondary"
              icon={Download}
              className="w-full"
              onClick={handleDownloadBackup}
            >
              Backup Database Now
            </Button>
          </div>

          {/* Restore */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">Restore Data</h4>
            <p className="text-xs text-slate-600 font-medium">
              Upload a valid `.json` backup file to restore database records.
            </p>
            <div className="flex items-center gap-2">
              <label className="flex-1 cursor-pointer">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="w-full py-2 px-3 bg-white border border-slate-300 hover:border-slate-400 rounded-xl text-xs text-slate-800 text-center font-semibold truncate shadow-xs">
                  {restoreFile ? restoreFile.name : 'Choose Backup JSON File...'}
                </div>
              </label>
              {restoreJson && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setRestoreConfirmOpen(true)}
                >
                  Restore
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={restoreConfirmOpen}
        onClose={() => setRestoreConfirmOpen(false)}
        onConfirm={handleConfirmRestore}
        title="Confirm Database Restoration"
        message="WARNING: Restoring from a backup will overwrite your current products and sales database. Are you sure you want to proceed?"
        confirmText="Yes, Overwrite & Restore"
        isDanger={true}
        loading={restoring}
      />
    </div>
  );
}
