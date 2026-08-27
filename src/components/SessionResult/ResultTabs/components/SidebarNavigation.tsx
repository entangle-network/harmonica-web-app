'use client';

import { FileText, Settings, FormInput, Palette } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/clientUtils';

type TabType = 'session-details' | 'edit-session' | 'pre-survey' | 'appearance';

interface SidebarNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export function SidebarNavigation({
  activeTab,
  onTabChange,
}: SidebarNavigationProps) {
  const t = useTranslations('sessionNav');

  return (
    <nav className="flex flex-col pt-2 pb-2 px-2 gap-[2px] overflow-y-auto">
      <button
        onClick={() => onTabChange('edit-session')}
        role="tab"
        aria-selected={activeTab === 'edit-session'}
        className={`select-none transition-[background] duration-200 ease-in cursor-pointer flex items-center justify-between px-2 py-0 rounded-md mt-[2px] mb-0 h-7 relative ${
          activeTab === 'edit-session'
            ? 'bg-muted text-foreground'
            : 'text-muted-foreground hover:bg-muted/50'
        }`}
      >
        <div className="flex items-center font-medium leading-none">
          <div className={cn(
            "w-6 h-6 mr-2 flex-shrink-0 flex items-center justify-center",
            activeTab === 'edit-session' ? "text-foreground" : "text-muted-foreground"
          )}>
            <Settings className="w-5 h-5" />
          </div>
          <div className="text-sm leading-none text-foreground flex items-center">
            {t('editSession')}
          </div>
        </div>
      </button>

      <button
        onClick={() => onTabChange('session-details')}
        role="tab"
        aria-selected={activeTab === 'session-details'}
        className={`select-none transition-[background] duration-200 ease-in cursor-pointer flex items-center justify-between px-2 py-0 rounded-md mt-[2px] mb-0 h-7 relative ${
          activeTab === 'session-details'
            ? 'bg-muted text-foreground'
            : 'text-muted-foreground hover:bg-muted/50'
        }`}
      >
        <div className="flex items-center font-medium leading-none">
          <div className={cn(
            "w-6 h-6 mr-2 flex-shrink-0 flex items-center justify-center",
            activeTab === 'session-details' ? "text-foreground" : "text-muted-foreground"
          )}>
            <FileText className="w-5 h-5" />
          </div>
          <div className="text-sm leading-none text-foreground flex items-center">
            {t('sessionDetails')}
          </div>
        </div>
      </button>

      <button
        onClick={() => onTabChange('pre-survey')}
        role="tab"
        aria-selected={activeTab === 'pre-survey'}
        className={`select-none transition-[background] duration-200 ease-in cursor-pointer flex items-center justify-between px-2 py-0 rounded-md mt-[2px] mb-0 h-7 relative ${
          activeTab === 'pre-survey'
            ? 'bg-muted text-foreground'
            : 'text-muted-foreground hover:bg-muted/50'
        }`}
      >
        <div className="flex items-center font-medium leading-none">
          <div className={cn(
            "w-6 h-6 mr-2 flex-shrink-0 flex items-center justify-center",
            activeTab === 'pre-survey' ? "text-foreground" : "text-muted-foreground"
          )}>
            <FormInput className="w-5 h-5" />
          </div>
          <div className="text-sm leading-none text-foreground flex items-center">
            {t('preSurvey')}
          </div>
        </div>
      </button>

      <button
        onClick={() => onTabChange('appearance')}
        role="tab"
        aria-selected={activeTab === 'appearance'}
        className={`select-none transition-[background] duration-200 ease-in cursor-pointer flex items-center justify-between px-2 py-0 rounded-md mt-[2px] mb-0 h-7 relative ${
          activeTab === 'appearance'
            ? 'bg-muted text-foreground'
            : 'text-muted-foreground hover:bg-muted/50'
        }`}
      >
        <div className="flex items-center font-medium leading-none">
          <div className={cn(
            "w-6 h-6 mr-2 flex-shrink-0 flex items-center justify-center",
            activeTab === 'appearance' ? "text-foreground" : "text-muted-foreground"
          )}>
            <Palette className="w-5 h-5" />
          </div>
          <div className="text-sm leading-none text-foreground flex items-center">
            {t('appearance')}
          </div>
        </div>
      </button>
    </nav>
  );
}

