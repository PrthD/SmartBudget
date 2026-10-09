import { useRef, useState } from 'react';
import { Link } from 'react-router';
import { Camera, ImageIcon, Loader2, Sparkles, X } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

import { compressImage } from '@/lib/image';
import { useAiStatus, useParseTransaction } from './api';

const EXAMPLES = [
  'Groceries at Costco 84.20 yesterday',
  'Netflix 16.99 monthly',
  'Got paid 2,150 salary today',
];

/**
 * Natural language (or a receipt photo) → a draft transaction that opens in
 * the normal form for review. Nothing is saved without the user confirming.
 */
export default function SmartAddDialog({ open, onOpenChange, onDraftReady }) {
  const { data: aiStatus } = useAiStatus();
  // Receipts need both: AI configured on the server and the user's opt-in.
  const aiEnabled = Boolean(aiStatus?.configured && aiStatus?.enabled);
  const parse = useParseTransaction();
  const [text, setText] = useState('');
  const [receipt, setReceipt] = useState(null);
  const fileInput = useRef(null);

  const onPickReceipt = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      // Large enough to read line items, small enough for the free tier.
      setReceipt(
        await compressImage(file, {
          maxSize: 1600,
          type: 'image/jpeg',
          quality: 0.8,
        })
      );
    } catch (error) {
      toast.error(error.message);
    }
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!text.trim() && !receipt) return;
    const result = await parse.mutateAsync({
      text: text.trim(),
      image: receipt ?? undefined,
    });
    if (result.notice)
      toast.info('AI was unavailable, so the basic parser was used.');
    setText('');
    setReceipt(null);
    onDraftReady(result.draft);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="text-primary size-4" /> Smart add
          </DialogTitle>
          <DialogDescription>
            Describe a transaction in your own words
            {aiEnabled ? ' or snap a receipt' : ''}. You'll review it before
            saving.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-3">
          <Textarea
            autoFocus
            rows={3}
            maxLength={300}
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && (event.metaKey || event.ctrlKey))
                onSubmit(event);
            }}
            placeholder={EXAMPLES[0]}
            aria-label="Describe the transaction"
          />
          <div className="flex flex-wrap gap-1.5">
            {EXAMPLES.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => setText(example)}
                className="bg-muted hover:bg-accent text-muted-foreground rounded-full px-2.5 py-1 text-xs transition-colors"
              >
                {example}
              </button>
            ))}
          </div>

          {aiEnabled ? (
            <div className="flex items-center gap-3">
              <input
                ref={fileInput}
                type="file"
                accept="image/*"
                capture="environment"
                hidden
                onChange={onPickReceipt}
              />
              {receipt ? (
                <div className="relative">
                  <img
                    src={receipt}
                    alt="Receipt preview"
                    className="h-20 rounded-md border object-cover"
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="absolute -top-2 -right-2 size-6 rounded-full"
                    onClick={() => setReceipt(null)}
                    aria-label="Remove receipt"
                  >
                    <X className="size-3" />
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInput.current?.click()}
                >
                  <Camera className="size-4" /> Scan a receipt
                </Button>
              )}
            </div>
          ) : (
            <Alert>
              <ImageIcon />
              {/* AlertDescription is a grid: keep inline content in one <p>. */}
              <AlertDescription>
                {aiStatus?.configured === false ? (
                  <p>
                    Using the built-in parser. AI receipt scanning isn&apos;t
                    set up on this server.
                  </p>
                ) : (
                  <p>
                    Using the built-in parser. For receipt scanning and smarter
                    parsing, enable AI in{' '}
                    <Link
                      to="/settings?tab=ai"
                      className="text-primary font-medium underline-offset-4 hover:underline"
                      onClick={() => onOpenChange(false)}
                    >
                      Settings
                    </Link>
                    .
                  </p>
                )}
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={(!text.trim() && !receipt) || parse.isPending}
            >
              {parse.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Sparkles className="size-4" />
              )}
              {parse.isPending ? 'Reading…' : 'Create draft'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
