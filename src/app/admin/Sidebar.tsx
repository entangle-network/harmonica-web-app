'use client';

import { cn } from '@/lib/clientUtils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Boxes, // For types/categories
  FileText, // For instructions/prompts
  FlaskConical, // For evals
  Settings,
} from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useTranslations } from 'next-intl';

const navigation = [
  {
    nameKey: 'promptTypes',
    href: '/admin/prompt-types',
    icon: Boxes, // Changed to Boxes to represent different types/categories
  },
  {
    nameKey: 'prompts',
    href: '/admin/prompts',
    icon: FileText, // Changed to FileText to represent instructions/documents
  },
  {
    nameKey: 'evals.nav',
    href: '/admin/evals',
    icon: FlaskConical,
  },
  {
    nameKey: 'settings',
    href: '/admin/settings',
    icon: Settings,
  },
] as const;

export function Sidebar() {
  const t = useTranslations('admin');
  const pathname = usePathname();

  return (
    <div className="w-64 bg-white dark:bg-gray-800 border-r dark:border-gray-700 min-h-screen p-4 flex flex-col">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">
          {t('panelTitle')}
        </h2>
      </div>
      <nav className="space-y-1 flex-grow">
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center px-4 py-2 text-sm rounded-md',
                isActive
                  ? 'bg-purple-50 text-purple-700 dark:bg-purple-900 dark:text-purple-200'
                  : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700',
              )}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {t(item.nameKey)}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto pt-4">
        <ThemeToggle />
      </div>
    </div>
  );
}
