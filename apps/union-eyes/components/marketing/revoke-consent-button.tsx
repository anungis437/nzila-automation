/**
 * Revoke Consent Button Component
 * 
 * Allows organizations to opt out of data sharing at any time.
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface RevokeConsentButtonProps {
  consentId: string;
}

export default function RevokeConsentButton({ consentId }: RevokeConsentButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState('');

  const handleRevoke = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/consent', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          consentId,
          reason: reason.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to revoke consent');
      }

      // Close dialog and refresh page
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <XCircle className="mr-2 h-4 w-4" />
          Revoke Consent
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Revoke Data Sharing Consent</DialogTitle>
          <DialogDescription>
            Are you sure you want to stop contributing to movement insights? You can always opt back
            in later.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">
              Reason for Revoking (Optional)
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="This helps us improve the program (optional)"
              rows={3}
            />
          </div>

          <Alert>
            <AlertDescription className="text-sm">
              <strong>What happens when you revoke:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Your data will no longer be included in new aggregations</li>
                <li>Previously aggregated data cannot be removed (it&apos;s already anonymized)</li>
                <li>You can re-enable sharing at any time</li>
              </ul>
            </AlertDescription>
          </Alert>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleRevoke} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Revoking...
              </>
            ) : (
              'Revoke Consent'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
