'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { User, Mail, Lock, Save, Loader2, CheckCircle2, AlertCircle, Building2, Calendar, ShieldCheck, FlaskConical } from 'lucide-react';

interface ProfileData {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  country: string | null;
  company_name: string | null;
  company_rccm: string | null;
  company_idnat: string | null;
  kyc_status: string;
  mode: string;
  created_at: string;
}

export default function ProfilePage() {
  const t = useTranslations('dashboard');

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Editable fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [savingInfo, setSavingInfo] = useState(false);
  const [infoSaved, setInfoSaved] = useState(false);

  // Change email
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [savingEmail, setSavingEmail] = useState(false);

  // Change password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/merchant/profile', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load profile');
      const data = (await res.json()) as ProfileData;
      setProfile(data);
      setName(data.name);
      setPhone(data.phone ?? '');
      setCompanyName(data.company_name ?? '');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const handleSaveInfo = async () => {
    setSavingInfo(true);
    setInfoSaved(false);
    try {
      const res = await fetch('/api/merchant/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone: phone || undefined, company_name: companyName || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error ?? 'Failed to save');
      setProfile(data as ProfileData);
      setInfoSaved(true);
      showToast('Informations enregistrées', 'success');
    } catch (e) {
      showToast((e as Error).message, 'error');
    } finally {
      setSavingInfo(false);
    }
  };

  const handleChangeEmail = async () => {
    if (!newEmail || !emailPassword) return;
    setSavingEmail(true);
    try {
      const res = await fetch('/api/merchant/profile/change-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_email: newEmail, current_password: emailPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error ?? 'Failed to change email');
      await load();
      setShowEmailForm(false);
      setNewEmail('');
      setEmailPassword('');
      showToast('Email modifié — confirmation envoyée à vos deux adresses', 'success');
    } catch (e) {
      showToast((e as Error).message, 'error');
    } finally {
      setSavingEmail(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) return;
    if (newPassword !== confirmPassword) {
      showToast('Les mots de passe ne correspondent pas', 'error');
      return;
    }
    if (newPassword.length < 8) {
      showToast('Le nouveau mot de passe doit faire au moins 8 caractères', 'error');
      return;
    }
    setSavingPassword(true);
    try {
      const res = await fetch('/api/merchant/profile/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error ?? 'Failed to change password');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast('Mot de passe modifié — notification envoyée par email', 'success');
    } catch (e) {
      showToast((e as Error).message, 'error');
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-gray-400" size={28} />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center">
        <AlertCircle className="mx-auto text-red-500 mb-3" size={28} />
        <p className="text-gray-600 dark:text-text-secondary">{error || 'Profile not found'}</p>
      </div>
    );
  }

  const kycLabels: Record<string, string> = {
    pending: 'Non soumis',
    submitted: 'En attente',
    approved: 'Approuvé',
    rejected: 'Rejeté',
  };
  const kycColors: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-600 dark:bg-navy-panel dark:text-text-secondary',
    submitted: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    approved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };

  const inputClass = 'w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-text-secondary/20 bg-white dark:bg-navy-panel text-sm text-gray-900 dark:text-text-primary placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-deep/40 focus:border-transparent transition-colors';
  const labelClass = 'text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-text-secondary mb-1.5';
  const cardClass = 'bg-white dark:bg-navy-panel/60 border border-gray-200 dark:border-text-secondary/15 rounded-2xl p-6 space-y-4';

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-green-deep/10 dark:bg-green-deep/15">
            <User className="text-green-deep" size={20} />
          </div>
          <h1 className="text-xl font-serif font-bold text-gray-900 dark:text-text-primary">Profil du compte</h1>
        </div>
        <p className="text-sm text-gray-500 dark:text-text-secondary ml-11">Gérez vos informations personnelles et la sécurité de votre compte</p>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium ${
          toast.type === 'success'
            ? 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800/30'
            : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/30'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
        </div>
      )}

      {/* Read-only overview */}
      <div className={cardClass}>
        <h2 className="text-sm font-semibold text-gray-900 dark:text-text-primary">Vue d&rsquo;ensemble</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2.5">
            <Calendar size={16} className="text-gray-400" />
            <div>
              <p className={labelClass}>Inscrit le</p>
              <p className="text-sm text-gray-900 dark:text-text-primary">
                {new Date(profile.created_at).toLocaleDateString('fr-CD', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <ShieldCheck size={16} className="text-gray-400" />
            <div>
              <p className={labelClass}>Statut KYC</p>
              <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${kycColors[profile.kyc_status] ?? kycLabels.pending}`}>
                {kycLabels[profile.kyc_status] ?? profile.kyc_status}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <FlaskConical size={16} className="text-gray-400" />
            <div>
              <p className={labelClass}>Mode</p>
              <p className="text-sm text-gray-900 dark:text-text-primary capitalize">{profile.mode === 'sandbox' ? 'Test (Sandbox)' : 'Production (Live)'}</p>
            </div>
          </div>
          {profile.company_rccm && (
            <div className="flex items-center gap-2.5">
              <Building2 size={16} className="text-gray-400" />
              <div>
                <p className={labelClass}>RCCM</p>
                <p className="text-sm text-gray-900 dark:text-text-primary font-mono">{profile.company_rccm}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Editable account info */}
      <div className={cardClass}>
        <h2 className="text-sm font-semibold text-gray-900 dark:text-text-primary">Informations du compte</h2>

        <div>
          <label className={labelClass}>Nom</label>
          <input className={inputClass} value={name} onChange={(e) => { setName(e.target.value); setInfoSaved(false); }} placeholder="Votre nom" />
        </div>

        <div>
          <label className={labelClass}>Téléphone</label>
          <input className={inputClass} value={phone} onChange={(e) => { setPhone(e.target.value); setInfoSaved(false); }} placeholder="+243 8XX XXX XXX" />
        </div>

        <div>
          <label className={labelClass}>Société (raison sociale)</label>
          <input
            className={inputClass}
            value={companyName}
            onChange={(e) => { setCompanyName(e.target.value); setInfoSaved(false); }}
            placeholder="Nom de votre entreprise"
            disabled={profile.kyc_status === 'approved'}
          />
          {profile.kyc_status === 'approved' && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5">
              ⚠️ Verrouillé — votre KYC est approuvé. Contactez le support pour modifier.
            </p>
          )}
        </div>

        <button
          onClick={handleSaveInfo}
          disabled={savingInfo}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-deep text-white text-sm font-semibold hover:bg-green-deep/85 transition-all duration-200 disabled:opacity-50"
        >
          {savingInfo ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {savingInfo ? 'Enregistrement…' : 'Enregistrer'}
        </button>
        {infoSaved && (
          <span className="inline-flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400 ml-2">
            <CheckCircle2 size={14} /> Enregistré
          </span>
        )}
      </div>

      {/* Email section */}
      <div className={cardClass}>
        <div className="flex items-center gap-2.5">
          <Mail size={18} className="text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-900 dark:text-text-primary">Adresse email</h2>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-900 dark:text-text-primary font-mono">{profile.email}</p>
          <button
            onClick={() => setShowEmailForm(!showEmailForm)}
            className="text-sm font-semibold text-green-deep hover:text-green-deep/80 transition-colors"
          >
            {showEmailForm ? 'Annuler' : 'Changer'}
          </button>
        </div>

        {showEmailForm && (
          <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-text-secondary/10">
            <div>
              <label className={labelClass}>Nouvelle adresse email</label>
              <input className={inputClass} type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="nouvel@email.com" />
            </div>
            <div>
              <label className={labelClass}>Mot de passe actuel (sécurité)</label>
              <input className={inputClass} type="password" value={emailPassword} onChange={(e) => setEmailPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <button
              onClick={handleChangeEmail}
              disabled={savingEmail || !newEmail || !emailPassword}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-deep text-white text-sm font-semibold hover:bg-green-deep/85 transition-all duration-200 disabled:opacity-50"
            >
              {savingEmail ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
              {savingEmail ? 'Modification…' : 'Confirmer le changement'}
            </button>
          </div>
        )}
      </div>

      {/* Password section */}
      <div className={cardClass}>
        <div className="flex items-center gap-2.5">
          <Lock size={18} className="text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-900 dark:text-text-primary">Mot de passe</h2>
        </div>

        <div>
          <label className={labelClass}>Mot de passe actuel</label>
          <input className={inputClass} type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••" />
        </div>
        <div>
          <label className={labelClass}>Nouveau mot de passe</label>
          <input className={inputClass} type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Minimum 8 caractères" />
        </div>
        <div>
          <label className={labelClass}>Confirmer le nouveau mot de passe</label>
          <input className={inputClass} type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" />
        </div>

        <button
          onClick={handleChangePassword}
          disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-deep text-white text-sm font-semibold hover:bg-green-deep/85 transition-all duration-200 disabled:opacity-50"
        >
          {savingPassword ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
          {savingPassword ? 'Modification…' : 'Changer le mot de passe'}
        </button>
      </div>
    </div>
  );
}
