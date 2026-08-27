'use client';

import { useTranslations } from 'next-intl';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoaderCircle, Copy, Trash2, MoreHorizontal, StopCircle, Pencil, Users } from 'lucide-react';
import * as db from '@/lib/db';
import { SummaryUpdateManager } from '../../summary/SummaryUpdateManager';
import { cloneSession } from '@/lib/serverUtils';
import { useRouter } from 'next/navigation';
import { toast } from 'hooks/use-toast';
import { encryptId } from '@/lib/encryptionUtils';
import { PromptSettings } from './ResultTabs/components/PromptSettings';
import { SessionOverviewModal } from './ResultTabs/components/SessionOverviewModal';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { VersionedPrompt } from 'app/create/creationFlow';
import ShareSettings from '@/components/ShareSettings';
import { QuestionInfo } from 'app/create/types';

interface SessionResultControlsProps {
  id: string;
  isFinished: boolean;
  readyToGetSummary: boolean;
  currentPrompt?: string;
  summaryPrompt?: string;
  crossPollination?: boolean;
  sessionTopic?: string;
  sessionData?: {
    topic: string;
    goal: string;
    critical: string;
    context: string;
    crossPollination: boolean;
    promptSummary: string;
    facilitationPrompt?: string;
  };
  questions?: QuestionInfo[];
}

export default function SessionResultControls({
  id,
  isFinished,
  readyToGetSummary,
  currentPrompt = '',
  summaryPrompt = '',
  crossPollination = true,
  sessionTopic = '',
  sessionData,
  questions = [],
}: SessionResultControlsProps) {
  const t = useTranslations('sessionControls');
  const tCommon = useTranslations('common');
  const [loadSummary, setLoadSummary] = useState(false);
  const [isCloning, setIsCloning] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showSessionOverviewModal, setShowSessionOverviewModal] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [localCrossPollination, setLocalCrossPollination] =
    useState(crossPollination);
  const router = useRouter();

  const handlePromptChange = async (
    newPrompt: string,
    type: 'facilitation' | 'summary',
  ) => {
    try {
      const updateData =
        type === 'facilitation'
          ? { prompt: newPrompt }
          : { summary_prompt: newPrompt };

      await db.updateHostSession(id, updateData);
    } catch (error) {
      console.error('Failed to update prompt:', error);
      toast({
        title: t('toast.promptUpdateFailed'),
        description: t('toast.promptUpdateFailedDesc'),
        variant: 'destructive',
      });
    }
  };

  const handleCrossPollination = async (checked: boolean) => {
    try {
      // Update local state immediately for responsive UI
      setLocalCrossPollination(checked);

      // Update database
      await db.updateHostSession(id, { cross_pollination: checked });

      // Show success toast
      toast({
        title: t('toast.crossPollinationUpdated'),
        description: checked
          ? t('toast.crossPollinationOn')
          : t('toast.crossPollinationOff'),
      });

      // Refresh the page to ensure all components reflect the new state
      router.refresh();
    } catch (error) {
      // Revert local state on error
      setLocalCrossPollination(!checked);
      console.error('Failed to update cross-pollination:', error);
      toast({
        title: t('toast.settingUpdateFailed'),
        description: t('toast.settingUpdateFailedDesc'),
        variant: 'destructive',
      });
    }
  };

  const finishSession = async () => {
    await db.deactivateHostSession(id);
  };

  const reopenSession = async () => {
    console.log('Reopening session');
    await db.updateHostSession(id, { active: true });
  };

  const updateSummary = async () => {
    setLoadSummary(true);
    await SummaryUpdateManager.updateNow(id);
    setLoadSummary(false);
  };

  const handleCloneSession = async () => {
    setIsCloning(true);
    try {
      const newSessionId = await cloneSession(id);
      if (newSessionId) {
        toast({
          title: t('toast.cloned'),
          description: t('toast.clonedDesc'),
        });
        router.push(`/sessions/${encryptId(newSessionId)}`);
      } else {
        toast({
          title: t('toast.cloneFailed'),
          description: t('toast.cloneFailedDesc'),
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error cloning session:', error);
      toast({
        title: t('toast.cloneFailed'),
        description: t('toast.cloneFailedDesc'),
        variant: 'destructive',
      });
    } finally {
      setIsCloning(false);
    }
  };

  const handleDeleteSession = async () => {
    setIsDeleting(true);
    try {
      await db.deleteHostSession(id);
      toast({
        title: t('toast.deleted'),
        description: t('toast.deletedDesc'),
      });
      router.push('/');
    } catch (error) {
      console.error('Error deleting session:', error);
      toast({
        title: t('toast.deleteFailed'),
        description: t('toast.deleteFailedDesc'),
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleSessionUpdate = async (updates: any) => {
    try {
      // Map the field names to database field names
      const dbUpdates: any = {};
      if (updates.sessionName) dbUpdates.topic = updates.sessionName;
      if (updates.goal) dbUpdates.goal = updates.goal;
      if (updates.critical) dbUpdates.critical = updates.critical;
      if (updates.context) dbUpdates.context = updates.context;
      if (updates.crossPollination !== undefined) dbUpdates.cross_pollination = updates.crossPollination;

      await db.updateHostSession(id, dbUpdates);
      
      toast({
        title: t('toast.updated'),
        description: t('toast.updatedDesc'),
      });
      
      // Refresh the page to show updated data
      router.refresh();
    } catch (error) {
      console.error('Failed to update session:', error);
      toast({
        title: t('toast.updateFailed'),
        description: t('toast.updateFailedDesc'),
        variant: 'destructive',
      });
    }
  };

  const handleUpdatePrompt = async (prompt: VersionedPrompt) => {
    try {
      await db.updateHostSession(id, { prompt: prompt.fullPrompt, prompt_summary: prompt.summary });
      toast({
        title: t('toast.promptUpdated'),
        description: t('toast.promptUpdatedDesc'),
      });
      router.refresh();
    } catch (error) {
      console.error('Failed to update prompt:', error);
      toast({
        title: t('toast.promptUpdateFailed'),
        description: t('toast.promptUpdateFailedDesc'),
        variant: 'destructive',
      });
    }
  };

  const handleUpdateQuestions = async (updatedQuestions: QuestionInfo[]) => {
    try {
      // Convert questions array to JSON string format that the database expects
      const questionsJson = JSON.stringify(
        updatedQuestions.map((q) => ({
          id: q.id,
          label: q.label,
          type: q.type,
          typeValue: q.typeValue,
          required: q.required,
          options: q.options,
        }))
      ) as unknown as JSON;
      await db.updateHostSession(id, { questions: questionsJson });
      toast({
        title: t('toast.questionsUpdated'),
        description: t('toast.questionsUpdatedDesc'),
      });
      router.refresh();
    } catch (error) {
      console.error('Failed to update questions:', error);
      toast({
        title: t('toast.questionsUpdateFailed'),
        description: t('toast.questionsUpdateFailedDesc'),
        variant: 'destructive',
      });
    }
  };

  const handleEditSession = () => {
    // TODO: Navigate to the review step of the create session flow
    // This will need to be implemented to take users to the refine step
    // with the current session data pre-populated
    toast({
      title: t('toast.editSession'),
      description: t('toast.editSessionDesc'),
    });
  };

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-0">
        <div className="flex justify-between items-center">
          <CardTitle className="text-md">{t('title')}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div className="flex-1">
          {/* Content area - can be used for future controls */}
        </div>
        
        <div className="flex flex-wrap gap-2 mt-auto pt-4">
          <Button
            variant="outline"
            onClick={() => (isFinished ? reopenSession() : finishSession())}
            disabled={loadSummary || isCloning || isDeleting}
          >
            {isFinished ? (
              t('reopen')
            ) : (
              <>
                <StopCircle className="h-4 w-4 text-red-600" />
                <span className="px-1">{t('endSession')}</span>
              </>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={() => setShowSessionOverviewModal(true)}
            disabled={isCloning || isDeleting}
          >
            <Pencil className="h-4 w-4" />
            {t('editSession')}
          </Button>

          <Button
            variant="outline"
            onClick={() => setShowShareDialog(true)}
            disabled={isCloning || isDeleting}
          >
            <Users className="h-4 w-4" />
            {t('inviteTeam')}
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" disabled={isCloning || isDeleting}>
                {tCommon('more')}
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleCloneSession} disabled={isCloning}>
                <Copy className="h-4 w-4 mr-2" />
                {tCommon('duplicate')}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setShowDeleteDialog(true)} 
                disabled={isDeleting}
                className="text-red-600 focus:text-red-600 focus:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {tCommon('delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>


        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{tCommon('areYouSure')}</DialogTitle>
              <DialogDescription>
                {t('deleteWarning')}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
                disabled={isDeleting}
              >
                {tCommon('cancel')}
              </Button>
              <Button
                onClick={handleDeleteSession}
                disabled={isDeleting}
                variant="destructive"
              >
                {isDeleting ? tCommon('deleting') : tCommon('delete')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {sessionData && (
          <SessionOverviewModal
            isOpen={showSessionOverviewModal}
            onClose={() => setShowSessionOverviewModal(false)}
            sessionData={sessionData}
            questions={questions}
            onUpdateSession={handleSessionUpdate}
            onUpdatePrompt={handleUpdatePrompt}
            onUpdateQuestions={handleUpdateQuestions}
            onEditSession={handleEditSession}
          />
        )}

        {showShareDialog && (
          <ShareSettings
            resourceId={id}
            resourceType="SESSION"
            initialIsOpen={showShareDialog}
            onClose={() => setShowShareDialog(false)}
          />
        )}
      </CardContent>
    </Card>
  );
}
