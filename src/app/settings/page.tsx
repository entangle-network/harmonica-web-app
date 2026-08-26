'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useUser } from '@auth0/nextjs-auth0/client';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoaderCircle, Check, Mail, KeyRound, Download, Trash2, AlertTriangle } from 'lucide-react';
import {
  fetchUserData,
  updateUserName,
  requestPasswordReset,
  deleteUserData,
  deleteUserAccount,
} from './actions';
import { useRouter, useSearchParams } from 'next/navigation';
import ApiKeysTab from './ApiKeysTab';

export default function SettingsPage() {
  const t = useTranslations('settings');
  const tCommon = useTranslations('common');
  const { user, error: userError, isLoading: userLoading } = useUser();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'profile';
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const router = useRouter();

  // Profile editing state
  const [editName, setEditName] = useState('');
  const [nameLoading, setNameLoading] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);

  // Password reset state
  const [passwordResetLoading, setPasswordResetLoading] = useState(false);
  const [passwordResetSent, setPasswordResetSent] = useState(false);

  // Account action states
  const [exportLoading, setExportLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [accountDeleteLoading, setAccountDeleteLoading] = useState(false);

  useEffect(() => {
    if (user && !userLoading) {
      loadUserData();
    }
  }, [user, userLoading]);

  // Initialize edit name from user data
  useEffect(() => {
    if (userData?.user?.name || user?.name) {
      setEditName(userData?.user?.name || user?.name || '');
    }
  }, [userData, user]);

  const showMessage = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const loadUserData = async () => {
    setLoading(true);
    try {
      const data = await fetchUserData();
      setUserData(data);
    } catch (error) {
      showMessage(t('messages.loadFailed'), 'error');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveName = async () => {
    const trimmed = editName.trim();
    if (!trimmed) return;

    // Don't save if unchanged
    const currentName = userData?.user?.name || user?.name || '';
    if (trimmed === currentName) return;

    setNameLoading(true);
    try {
      const result = await updateUserName(trimmed);
      if (result.success) {
        setNameSaved(true);
        setTimeout(() => setNameSaved(false), 2000);
        // Update local state
        if (userData?.user) {
          setUserData({ ...userData, user: { ...userData.user, name: trimmed } });
        }
      } else {
        showMessage(result.message || t('messages.nameUpdateFailed'), 'error');
      }
    } catch (error) {
      showMessage(t('messages.nameUpdateFailed'), 'error');
      console.error(error);
    } finally {
      setNameLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    setPasswordResetLoading(true);
    try {
      const result = await requestPasswordReset();
      if (result.success) {
        setPasswordResetSent(true);
        showMessage(t('messages.passwordResetSent'), 'success');
      } else {
        showMessage(result.message || t('messages.passwordResetFailed'), 'error');
      }
    } catch (error) {
      showMessage(t('messages.passwordResetSendFailed'), 'error');
      console.error(error);
    } finally {
      setPasswordResetLoading(false);
    }
  };

  const handleExportData = async () => {
    setExportLoading(true);
    try {
      if (!userData && !loading) {
        await loadUserData();
      }

      const exportData = {
        ...userData,
        permissions: undefined,
        exportDate: new Date().toISOString(),
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `harmonica-user-data-${new Date().toISOString()}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      showMessage(t('messages.exportSuccess'), 'success');
    } catch (error) {
      showMessage(t('messages.exportFailed'), 'error');
      console.error(error);
    } finally {
      setExportLoading(false);
    }
  };

  const handleDeleteData = async () => {
    if (
      !confirm(
        t('messages.deleteDataConfirm')
      )
    ) {
      return;
    }

    setDeleteLoading(true);
    try {
      const result = await deleteUserData();
      if (result.success) {
        setUserData(null);
        showMessage(t('messages.dataDeleted'), 'success');
      } else {
        showMessage(result.message || t('messages.deleteDataFailed'), 'error');
      }
    } catch (error) {
      showMessage(t('messages.deleteDataFailed'), 'error');
      console.error(error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (
      !confirm(
        t('messages.deleteAccountConfirm1')
      )
    ) {
      return;
    }

    if (
      !confirm(
        t('messages.deleteAccountConfirm2')
      )
    ) {
      return;
    }

    setAccountDeleteLoading(true);
    try {
      const result = await deleteUserAccount();
      if (result.success) {
        showMessage(t('messages.accountDeleted'), 'success');
        setTimeout(() => {
          window.location.href = '/api/auth/logout';
        }, 2000);
      } else {
        showMessage(result.message || t('messages.deleteAccountFailed'), 'error');
      }
    } catch (error) {
      showMessage(t('messages.deleteAccountFailed'), 'error');
      console.error(error);
    } finally {
      setAccountDeleteLoading(false);
    }
  };

  const isEmailPasswordUser = user?.sub?.toString().startsWith('auth0|');
  const loginProvider = isEmailPasswordUser
    ? t('loginProvider.emailPassword')
    : user?.sub?.toString().startsWith('google-oauth2|')
      ? 'Google'
      : user?.sub?.toString().startsWith('github|')
        ? 'GitHub'
        : t('loginProvider.social');

  if (userLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoaderCircle className="h-8 w-8 animate-spin" />
        <span className="ml-2">{tCommon('loading')}</span>
      </div>
    );
  }

  if (userError) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>{tCommon('errorPrefix', { message: userError.message })}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>{t('signInPrompt')}</p>
      </div>
    );
  }

  const messageStyles = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  return (
    <div className="container max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-semibold mb-6">{t('title')}</h1>

      {message && (
        <div
          className={`border rounded-lg px-4 py-3 mb-6 text-sm ${messageStyles[message.type]}`}
          role="alert"
        >
          {message.text}
        </div>
      )}

      <Tabs defaultValue={initialTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="profile">{t('tabs.profile')}</TabsTrigger>
          <TabsTrigger value="account">{t('tabs.account')}</TabsTrigger>
          <TabsTrigger value="api-keys">{t('tabs.apiKeys')}</TabsTrigger>
        </TabsList>

        {/* ── Profile Tab ── */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('profile.title')}</CardTitle>
              <CardDescription>
                {t('profile.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar */}
              <div className="flex items-center gap-4">
                {user.picture ? (
                  <Image
                    src={user.picture}
                    alt={t('profile.avatarAlt')}
                    width={64}
                    height={64}
                    className="rounded-full"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-xl font-medium text-muted-foreground">
                    {(editName || user.name || '?')[0]?.toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium">{editName || user.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {t('profile.avatarSynced', { provider: loginProvider })}
                  </p>
                </div>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="display-name">{t('profile.displayName')}</Label>
                <div className="flex gap-2">
                  <Input
                    id="display-name"
                    value={editName}
                    onChange={(e) => {
                      setEditName(e.target.value);
                      setNameSaved(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveName();
                    }}
                    placeholder={t('profile.displayNamePlaceholder')}
                    className="max-w-sm"
                    maxLength={255}
                  />
                  <Button
                    onClick={handleSaveName}
                    disabled={
                      nameLoading ||
                      !editName.trim() ||
                      editName.trim() === (userData?.user?.name || user?.name || '')
                    }
                    size="sm"
                    variant={nameSaved ? 'outline' : 'default'}
                    className="shrink-0"
                  >
                    {nameLoading ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : nameSaved ? (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        {tCommon('saved')}
                      </>
                    ) : (
                      tCommon('save')
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('profile.displayNameHint')}
                </p>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label>{t('profile.email')}</Label>
                <div className="flex items-center gap-2">
                  <p className="text-sm">{userData?.user?.email || user.email}</p>
                  <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {loginProvider}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('profile.emailHint')}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Password section — only for email/password users */}
          {isEmailPasswordUser && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('password.title')}</CardTitle>
                <CardDescription>
                  {t('password.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {t('password.hint')}
                </p>
                <Button
                  onClick={handlePasswordReset}
                  disabled={passwordResetLoading || passwordResetSent}
                  variant="outline"
                  size="sm"
                >
                  {passwordResetLoading ? (
                    <LoaderCircle className="h-4 w-4 animate-spin mr-2" />
                  ) : passwordResetSent ? (
                    <Mail className="h-4 w-4 mr-2" />
                  ) : (
                    <KeyRound className="h-4 w-4 mr-2" />
                  )}
                  {passwordResetSent ? t('password.sent') : t('password.send')}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Account Tab ── */}
        <TabsContent value="account" className="space-y-6">
          {/* Usage overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('usage.title')}</CardTitle>
              <CardDescription>
                {t('usage.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {userData ? (
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-2xl font-semibold">{userData.sessions?.length || 0}</p>
                    <p className="text-xs text-muted-foreground mt-1">{t('usage.sessionsJoined')}</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-2xl font-semibold">{userData.hostSessions?.length || 0}</p>
                    <p className="text-xs text-muted-foreground mt-1">{t('usage.sessionsOwned')}</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-2xl font-semibold">{userData.workspaces?.length || 0}</p>
                    <p className="text-xs text-muted-foreground mt-1">{t('usage.projects')}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{t('usage.noData')}</p>
              )}
            </CardContent>
          </Card>

          {/* Data export */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('export.title')}</CardTitle>
              <CardDescription>
                {t('export.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleExportData}
                disabled={exportLoading}
                variant="outline"
                size="sm"
              >
                {exportLoading ? (
                  <LoaderCircle className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                {exportLoading ? t('export.inProgress') : t('export.action')}
              </Button>
            </CardContent>
          </Card>

          {/* Danger zone */}
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                {t('danger.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium">{t('danger.deleteDataTitle')}</p>
                  <p className="text-xs text-muted-foreground">
                    {t('danger.deleteDataDescription')}
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={handleDeleteData}
                  disabled={deleteLoading}
                  size="sm"
                  className="shrink-0 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  {deleteLoading ? (
                    <LoaderCircle className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  {deleteLoading ? t('danger.deleting') : t('danger.deleteData')}
                </Button>
              </div>

              <div className="border-t pt-6 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium">{t('danger.deleteAccountTitle')}</p>
                  <p className="text-xs text-muted-foreground">
                    {t('danger.deleteAccountDescription')}
                  </p>
                </div>
                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  disabled={accountDeleteLoading}
                  size="sm"
                  className="shrink-0"
                >
                  {accountDeleteLoading ? (
                    <>
                      <LoaderCircle className="h-4 w-4 animate-spin mr-2" />
                      {t('danger.deleting')}
                    </>
                  ) : (
                    t('danger.deleteAccount')
                  )}
                </Button>
              </div>
            </CardContent>
            <CardFooter>
              <p className="text-xs text-muted-foreground">
                {t.rich('danger.gdpr', {
                  link: (chunks) => (
                    <a href="mailto:privacy@harmonica.chat" className="underline">
                      {chunks}
                    </a>
                  ),
                })}
              </p>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* ── API Keys Tab ── */}
        <TabsContent value="api-keys">
          <ApiKeysTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
