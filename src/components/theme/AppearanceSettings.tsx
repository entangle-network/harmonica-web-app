'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Upload, X } from 'lucide-react';
import { useToast } from 'hooks/use-toast';
import {
  saveThemeColors,
  uploadThemeImage,
  clearThemeImage,
} from 'actions/theme';
import { EMPTY_THEME, themeImageUrl } from '@/lib/themeColors';
import { getOwnTheme } from '@/lib/theme';

type Target = { kind: 'SESSION' | 'WORKSPACE'; id: string };
type Slot = 'intro' | 'avatar' | 'logo';

/**
 * Appearance editor shared by the project and the session settings.
 *
 * An empty colour is meaningful: it clears the override so the value is
 * inherited again (a session falls back to its project, a project to the app
 * default). That is why the inputs pair a colour picker with a text field —
 * a bare `<input type="color">` cannot express "unset".
 */
export function AppearanceSettings({
  target,
  inheritedNote,
}: {
  target: Target;
  inheritedNote?: string;
}) {
  const t = useTranslations('appearance');
  const tCommon = useTranslations('common');
  const { toast } = useToast();

  const [colors, setColors] = useState({
    primary: '',
    gradientFrom: '',
    surface: '',
  });
  const [images, setImages] = useState<Record<Slot, string | null>>({
    intro: null,
    avatar: null,
    logo: null,
  });
  const [logoUrl, setLogoUrl] = useState('');
  const [privacyUrl, setPrivacyUrl] = useState('');
  const [introText, setIntroText] = useState('');

  useEffect(() => {
    getOwnTheme(target.kind, target.id).then((own) => {
      setColors({
        primary: own.primary ?? '',
        gradientFrom: own.gradientFrom ?? '',
        surface: own.surface ?? '',
      });
      setImages({
        intro: own.introImageId,
        avatar: own.avatarId,
        logo: own.logoId,
      });
      setLogoUrl(own.logoUrl ?? '');
      setPrivacyUrl(own.privacyUrl ?? '');
      setIntroText(own.introText ?? '');
    });
  }, [target.kind, target.id]);
  const [isSaving, setIsSaving] = useState(false);
  const [uploading, setUploading] = useState<Slot | null>(null);

  const introInput = useRef<HTMLInputElement>(null);
  const avatarInput = useRef<HTMLInputElement>(null);
  const logoInput = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveThemeColors(target, {
        primary: colors.primary || null,
        gradientFrom: colors.gradientFrom || null,
        surface: colors.surface || null,
        logoUrl: logoUrl.trim() || null,
        privacyUrl: privacyUrl.trim() || null,
        introText: introText.trim() || null,
      });
      toast({ title: t('saved') });
    } catch (error) {
      toast({
        title: t('saveFailed'),
        description: error instanceof Error ? error.message : undefined,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpload = async (slot: Slot, file: File) => {
    setUploading(slot);
    try {
      const formData = new FormData();
      formData.append('kind', target.kind);
      formData.append('id', target.id);
      formData.append('slot', slot);
      formData.append('file', file);

      const result = await uploadThemeImage(formData);
      setImages((prev) => ({ ...prev, [slot]: result.imageId }));
      toast({ title: t('imageUploaded') });
    } catch (error) {
      toast({
        title: t('uploadFailed'),
        description: error instanceof Error ? error.message : undefined,
        variant: 'destructive',
      });
    } finally {
      setUploading(null);
    }
  };

  const handleClear = async (slot: Slot) => {
    try {
      await clearThemeImage(target, slot);
      setImages((prev) => ({ ...prev, [slot]: null }));
    } catch (error) {
      toast({
        title: t('uploadFailed'),
        description: error instanceof Error ? error.message : undefined,
        variant: 'destructive',
      });
    }
  };

  const colorField = (
    key: 'primary' | 'gradientFrom' | 'surface',
    label: string,
    hint: string,
  ) => (
    <div className="space-y-2">
      <Label htmlFor={`theme-${key}`}>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={label}
          value={colors[key] || '#ffffff'}
          onChange={(e) =>
            setColors((prev) => ({ ...prev, [key]: e.target.value }))
          }
          className="h-9 w-12 cursor-pointer rounded border border-input bg-background p-1"
        />
        <Input
          id={`theme-${key}`}
          value={colors[key]}
          placeholder={t('inheritPlaceholder')}
          onChange={(e) =>
            setColors((prev) => ({ ...prev, [key]: e.target.value }))
          }
          className="max-w-[160px] font-mono text-sm"
        />
        {colors[key] && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setColors((prev) => ({ ...prev, [key]: '' }))}
          >
            {t('reset')}
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );

  const imageField = (
    slot: Slot,
    label: string,
    hint: string,
    inputRef: React.RefObject<HTMLInputElement>,
  ) => {
    const url = themeImageUrl(images[slot]);
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <div className="flex items-center gap-3">
          {url && (
            <img
              src={url}
              alt=""
              className="h-12 w-12 rounded-md border object-cover"
            />
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/svg+xml"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(slot, file);
              e.target.value = '';
            }}
          />
          <Button
            variant="outline"
            size="sm"
            disabled={uploading === slot}
            onClick={() => inputRef.current?.click()}
          >
            {uploading === slot ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {t('chooseImage')}
          </Button>
          {url && (
            <Button variant="ghost" size="sm" onClick={() => handleClear(slot)}>
              <X className="h-4 w-4" />
              {t('removeImage')}
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">{t('title')}</h3>
        <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
        {inheritedNote && (
          <p className="text-xs text-muted-foreground">{inheritedNote}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="theme-intro-text">{t('introText')}</Label>
        <Textarea
          id="theme-intro-text"
          value={introText}
          placeholder={t('inheritPlaceholder')}
          onChange={(e) => setIntroText(e.target.value)}
          rows={3}
          className="resize-none"
        />
        <p className="text-xs text-muted-foreground">{t('introTextHint')}</p>
      </div>

      {colorField('primary', t('buttonColor'), t('buttonColorHint'))}
      {colorField('gradientFrom', t('gradientColor'), t('gradientColorHint'))}
      {colorField('surface', t('surfaceColor'), t('surfaceColorHint'))}

      <div className="border-t pt-6 space-y-6">
        {imageField('intro', t('introImage'), t('introImageHint'), introInput)}
        {imageField('avatar', t('avatarImage'), t('avatarImageHint'), avatarInput)}
        {imageField('logo', t('logo'), t('logoHint'), logoInput)}

        <div className="space-y-2">
          <Label htmlFor="theme-logo-url">{t('logoUrl')}</Label>
          <Input
            id="theme-logo-url"
            type="url"
            value={logoUrl}
            placeholder="https://"
            onChange={(e) => setLogoUrl(e.target.value)}
            className="max-w-md"
          />
          <p className="text-xs text-muted-foreground">{t('logoUrlHint')}</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="theme-privacy-url">{t('privacyUrl')}</Label>
          <Input
            id="theme-privacy-url"
            type="url"
            value={privacyUrl}
            placeholder="https://"
            onChange={(e) => setPrivacyUrl(e.target.value)}
            className="max-w-md"
          />
          <p className="text-xs text-muted-foreground">{t('privacyUrlHint')}</p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {tCommon('saving')}
            </>
          ) : (
            tCommon('saveChanges')
          )}
        </Button>
      </div>
    </div>
  );
}
