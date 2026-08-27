'use client';

import { useTranslations } from 'next-intl';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { uploadFile } from 'actions/upload-file';
import { saveFileMetadata } from 'actions/save-file-metadata';
import { Loader2, Upload } from 'lucide-react';
import { useToast } from 'hooks/use-toast';
import { useUser } from '@auth0/nextjs-auth0/client';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { processFileForQdrant } from 'actions/process-file';
import { extractTextFromPDF } from 'actions/pdf-processor';

type FilePurpose = 'TRANSCRIPT' | 'KNOWLEDGE';

export default function ImportResponsesModal({
  isOpen,
  onOpenChange,
  sessionId,
  onFileUploaded,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  onFileUploaded?: () => void;
}) {
  const t = useTranslations('importResponses');
  const tCommon = useTranslations('common');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [filePurpose, setFilePurpose] = useState<FilePurpose>('KNOWLEDGE');
  const { toast } = useToast();
  const { user } = useUser();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const readFileContent = async (file: File): Promise<string> => {
    if (file.type === 'application/pdf') {
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const pdfData = Array.from(uint8Array);
      return extractTextFromPDF(pdfData);
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        resolve(content);
      };
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      toast({
        title: t('toast.noFile'),
        description: t('toast.noFileDesc'),
        variant: 'destructive',
      });
      return;
    }

    if (!user?.sub) {
      toast({
        title: t('toast.authRequired'),
        description: t('toast.authRequiredDesc'),
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    try {
      if (file.type === 'application/pdf') {
        // For PDFs, extract text and process with Qdrant
        const fileContent = await readFileContent(file);

        // Process extracted text with Qdrant
        await processFileForQdrant({
          sessionId,
          fileContent,
          fileName: file.name,
          filePurpose,
        });

        // Save metadata without file URL since we don't store PDFs
        await saveFileMetadata({
          sessionId,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          fileUrl: '', // No URL since we don't store PDFs
          uploadedBy: user?.sub,
          filePurpose,
          fileContent,
        });

        toast({
          title: t('toast.pdfProcessed'),
          description: t('toast.pdfProcessedDesc'),
        });
      } else {
        // For other files, upload and process as before
        const formData = new FormData();
        formData.append('file', file);
        formData.append('sessionId', sessionId);

        const uploadResult = await uploadFile(formData);
        const fileContent = await readFileContent(file);

        await processFileForQdrant({
          sessionId,
          fileContent,
          fileName: file.name,
          filePurpose,
        });

        await saveFileMetadata({
          sessionId,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          fileUrl: uploadResult.url,
          uploadedBy: user?.sub,
          filePurpose,
          fileContent,
        });

        toast({
          title: t('toast.uploaded'),
          description: t('toast.uploadedDesc', { name: file.name }),
        });
      }

      // Close the modal and reset state
      onOpenChange(false);
      setFile(null);
      setFilePurpose('KNOWLEDGE'); // Reset to default

      // Refresh the file list
      if (onFileUploaded) {
        onFileUploaded();
      }
    } catch (error) {
      toast({
        title: t('toast.uploadFailed'),
        description:
          error instanceof Error ? error.message : tCommon('unknownError'),
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>
            {t('description')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="file">{tCommon('file')}</Label>
            <Input
              id="file"
              type="file"
              accept=".pdf,.txt,.json,application/pdf,text/plain,application/json"
              onChange={handleFileChange}
            />
            <p className="text-sm text-muted-foreground">{t('maxSize')}</p>
          </div>

          <div className="space-y-2">
            <Label>{t('purposeLabel')}</Label>
            <RadioGroup
              value={filePurpose}
              onValueChange={(value: string) =>
                setFilePurpose(value as FilePurpose)
              }
              className="flex flex-col space-y-1"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="KNOWLEDGE" id="knowledge" />
                <Label htmlFor="knowledge" className="font-normal">
                  {t('knowledgeFile')}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="TRANSCRIPT" id="transcript" />
                <Label htmlFor="transcript" className="font-normal">
                  {t('transcript')}
                </Label>
              </div>
            </RadioGroup>
            <p className="text-sm text-muted-foreground">
              {filePurpose === 'TRANSCRIPT'
                ? t('transcriptHint')
                : t('knowledgeHint')}
            </p>
          </div>

          {file && (
            <div className="text-sm">
              {t('selected')} <span className="font-medium">{file.name}</span> (
              {(file.size / 1024).toFixed(1)} KB)
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {tCommon('cancel')}
            </Button>
            <Button type="submit" disabled={!file || isUploading}>
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {tCommon('uploading')}
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  {tCommon('upload')}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
