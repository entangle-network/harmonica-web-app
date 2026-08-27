'use client';

import { useTranslations } from 'next-intl';
import { AppearanceSettings } from '@/components/theme/AppearanceSettings';
import { MapPin, Upload, ImageIcon, Pencil } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useState, useCallback } from 'react';
import { deleteWorkspace, updateWorkspaceDetails } from 'app/workspace/[w_id]/actions';
import { useDropzone } from 'react-dropzone';
import { WorkspaceUpdate } from '@/lib/schema';
import { useRouter } from 'next/navigation';

interface WorkspaceHeroProps {
  workspaceId: string;
  exists: boolean;
  title?: string;
  description?: string;
  location?: string;
  isEditable?: boolean;
  bannerImageUrl?: string;
  initialGradientFrom?: string;
  initialGradientTo?: string;
  initialUseGradient?: boolean;
  onUpdate?: (updates: any) => void;
}

export default function WorkspaceHero({
  workspaceId,
  exists,
  title,
  description,
  location,
  isEditable = false,
  bannerImageUrl,
  initialGradientFrom,
  initialGradientTo,
  initialUseGradient,
  onUpdate,
}: WorkspaceHeroProps) {
  const t = useTranslations('workspaceHero');
  const tCommon = useTranslations('common');
  const [bannerImage, setBannerImage] = useState<string | undefined>(
    bannerImageUrl
  );
  const [gradientFrom, setGradientFrom] = useState(initialGradientFrom);
  const [gradientTo, setGradientTo] = useState(initialGradientTo);
  const [useGradient, setUseGradient] = useState(initialUseGradient);
  const [isEditing, setIsEditing] = useState(isEditable && !exists);
  const [values, setValues] = useState({ title, description, location });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const router = useRouter();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      // Store the file for later upload when user confirms
      setImageFile(file);

      // Just show a preview
      const reader = new FileReader();
      reader.onload = () => {
        setBannerImage(reader.result as string);
        setUseGradient(false);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 1,
    noClick: true,
  });

  const bannerStyle = useGradient
    ? {
        backgroundImage: `linear-gradient(to right, ${gradientFrom}, ${gradientTo})`,
      }
    : {
        backgroundImage: bannerImage ? `url(${bannerImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      };

  const handleSave = async () => {
    try {
      let finalBannerImage = useGradient ? undefined : bannerImageUrl; // Start with existing URL or otherwise a gradient
      // Only upload if we have a new image file
      if (imageFile && !useGradient) {
        // Import is inside the function to maintain client component compatibility
        const { uploadBanner } = await import('app/workspace/[w_id]/actions');
        // Create form data for upload
        const formData = new FormData();
        formData.append('file', imageFile);
        formData.append('workspaceId', workspaceId);

        // Upload the image and get the URL
        finalBannerImage = await uploadBanner(formData);
        console.log('Uploaded image to url:', finalBannerImage);
        // Reset the file state
        setImageFile(null);
      }

      // Create the update data object
      const updateData: WorkspaceUpdate = {
        ...values,
        bannerImage: finalBannerImage, // This will be either undefined, existing URL, or newly uploaded URL
        gradientFrom,
        gradientTo,
        useGradient,
        status: 'active',
      };

      // If we got a new URL, update the local state
      if (finalBannerImage && finalBannerImage !== bannerImage) {
        setBannerImage(finalBannerImage);
      }

      if (onUpdate) {
        onUpdate(updateData);
      }

      await updateWorkspaceDetails(workspaceId, updateData);
    } catch (error) {
      console.error('Error updating project:', error);
    }
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (
      confirm(
        `Are you sure you want to delete this project?`
      )
    ) {
      await deleteWorkspace(workspaceId)
      router.replace('/');
    }
    return false;
  }

  const content = (
    <div
      className="text-white rounded-lg p-8 relative group min-h-[200px]"
      style={bannerStyle}
    >
      {/* Add a semi-transparent overlay for text readability over light backgrounds */}
      <div className="absolute inset-0 bg-black/30 rounded-lg"></div>

      <div className="absolute top-2 right-2 z-20 flex gap-2">
        {/* Button in the top right corner*/}
        {isEditable && (
          <Button
            variant="ghost"
            size="icon"
            className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/20 hover:bg-white/50"
            onClick={() => setIsEditing(true)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div
        className={`relative z-10 group/edit ${exists ? '' : 'cursor-pointer'}`}
        onClick={() => !exists && isEditable && setIsEditing(true)}
      >
        <h1 className="text-4xl font-bold mb-4">
          {values.title || (!exists && t('addTitle'))}
        </h1>
        <p className="text-xl mb-4">
          {values.description ||
            (!exists && t('addDescription'))}
        </p>
        {(values.location || !exists) && (
          <div className="flex items-center gap-2 text-blue-100">
            <MapPin className="h-5 w-5" />
            <span>{values.location || (!exists && t('addLocation'))}</span>
          </div>
        )}
      </div>
    </div>
  );

  const editDialog = (
    <Dialog open={isEditing} onOpenChange={setIsEditing}>
      {/* The dialog grew past the viewport once appearance settings were added,
          and DialogContent does not scroll on its own — it just centres and
          clips. Cap it and let the body scroll instead. */}
      <DialogContent className="sm:max-w-[500px] max-h-[calc(100vh-4rem)] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('editTitle')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">{tCommon('title')}</Label>
            <Input
              id="title"
              value={values.title}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder={t('titlePlaceholder')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">{tCommon('description')}</Label>
            <Textarea
              id="description"
              value={values.description}
              onChange={(e) =>
                setValues((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder={t('descriptionPlaceholder')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">{t('locationLabel')}</Label>
            <Input
              id="location"
              value={values.location}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, location: e.target.value }))
              }
              placeholder={t('locationPlaceholder')}
            />
          </div>

          {/* Banner styling options */}
          <Tabs
            defaultValue={useGradient ? 'gradient' : 'image'}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="image" onClick={() => setUseGradient(false)}>
                <ImageIcon className="w-4 h-4 mr-2" />
                {t('tabImage')}
              </TabsTrigger>
              <TabsTrigger
                value="gradient"
                onClick={() => setUseGradient(true)}
              >
                <div className="w-4 h-4 rounded bg-gradient-to-r from-purple-600 to-purple-400 mr-2" />
                {t('tabGradient')}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="image" className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors">
                <input {...getInputProps()} />
                <Button
                  variant="ghost"
                  className="w-full h-full"
                  onClick={(e) => {
                    e.preventDefault();
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = () => {
                          setBannerImage(reader.result as string);
                          setImageFile(file);
                          setUseGradient(false);
                        };
                        reader.readAsDataURL(file);
                      }
                    };
                    input.click();
                  }}
                >
                  <Upload className="w-8 h-8 mx-auto mb-2 text-gray-500" />
                  <p>{t('dropImage')}</p>
                </Button>
              </div>
              {bannerImage && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setBannerImage(undefined)}
                >
                  {t('removeImage')}
                </Button>
              )}
            </TabsContent>
            <TabsContent value="gradient" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gradientFrom">{t('gradientFrom')}</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="gradientFrom"
                      type="color"
                      value={gradientFrom}
                      onChange={(e) => setGradientFrom(e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gradientTo">{t('gradientTo')}</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="gradientTo"
                      type="color"
                      value={gradientTo}
                      onChange={(e) => setGradientTo(e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
              <div
                className="w-full h-12 rounded-lg"
                style={{
                  backgroundImage: `linear-gradient(to right, ${gradientFrom}, ${gradientTo})`,
                }}
              />
            </TabsContent>
          </Tabs>

          {/* Participant-facing appearance. Saved on its own — the colours and
              images are stored per resource by their own action, not through
              this dialog's Save. */}
          <div className="border-t pt-6">
            <AppearanceSettings target={{ kind: 'WORKSPACE', id: workspaceId }} />
          </div>

          <div className="flex justify-between">
            <div className="flex">
                <Button variant="destructive" onClick={handleDelete}>
                  {t('deleteProject')}
                </Button>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                {tCommon('cancel')}
              </Button>
              <Button onClick={handleSave}>{tCommon('saveChanges')}</Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <>
      {content}
      {isEditable && editDialog}
    </>
  );
}
