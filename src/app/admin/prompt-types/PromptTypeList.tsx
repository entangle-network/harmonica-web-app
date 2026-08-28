'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2 } from 'lucide-react';
import { EditPromptTypeDialog } from './EditPromptTypeDialog';
import { DeletePromptTypeDialog } from './DeletePromptTypeDialog';
import { fetchPromptTypes } from './api';
import { format } from 'date-fns';
import { useDateLocale } from '@/lib/dateLocale';
import { useTranslations } from 'next-intl';

interface PromptType {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export function PromptTypeList() {
  const t = useTranslations('admin');
  const dateLocale = useDateLocale();
  const [promptTypes, setPromptTypes] = useState<PromptType[]>([]);
  const [editingType, setEditingType] = useState<PromptType | null>(null);
  const [deletingType, setDeletingType] = useState<PromptType | null>(null);

  const loadPromptTypes = async () => {
    try {
      const data = await fetchPromptTypes();
      console.log('Loaded prompt types:', data); // Debug log
      setPromptTypes(data);
    } catch (error) {
      console.error('Failed to fetch prompt types:', error);
    }
  };

  useEffect(() => {
    loadPromptTypes();
  }, []);

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'PPp', { locale: dateLocale });
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('name')}</TableHead>
            <TableHead>{t('description')}</TableHead>
            <TableHead>{t('created')}</TableHead>
            <TableHead>{t('updated')}</TableHead>
            <TableHead className="w-[100px]">{t('actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {promptTypes.map((type) => (
            <TableRow key={type.id}>
              <TableCell className="font-medium">{type.name}</TableCell>
              <TableCell>{type.description}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDate(type.created_at)}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDate(type.updated_at)}
              </TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingType(type)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      console.log('Setting deleting type:', type); // Debug log
                      setDeletingType(type);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <EditPromptTypeDialog
        promptType={editingType}
        open={!!editingType}
        onOpenChange={(open) => !open && setEditingType(null)}
        onSuccess={loadPromptTypes}
      />

      <DeletePromptTypeDialog
        promptType={deletingType}
        open={!!deletingType}
        onOpenChange={(open) => !open && setDeletingType(null)}
        onSuccess={loadPromptTypes}
      />
    </>
  );
}
