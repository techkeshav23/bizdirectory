'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isEditing?: boolean;
  createTitle: string;
  editTitle?: string;
  description?: string;
  submitLabel?: string;
  isSubmitting?: boolean;
  onSubmit: () => void;
  children: React.ReactNode;
}

export function CrudFormDialog({
  open,
  onOpenChange,
  isEditing,
  createTitle,
  editTitle,
  description,
  submitLabel,
  isSubmitting,
  onSubmit,
  children,
}: Props) {
  const title = isEditing ? (editTitle ?? createTitle) : createTitle;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          className="space-y-4"
        >
          <div className="space-y-4">{children}</div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : (submitLabel ?? (isEditing ? 'Save changes' : 'Create'))}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
