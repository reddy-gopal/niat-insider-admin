"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type RejectModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  articleTitle: string;
  articleId: string;
  onConfirm: (id: string, reason: string) => void;
};

export function RejectModal({
  open,
  onOpenChange,
  articleTitle,
  articleId,
  onConfirm,
}: RejectModalProps) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const handleConfirm = () => {
    const trimmed = reason.trim();
    if (trimmed.length < 10) {
      setError("Reason must be at least 10 characters.");
      return;
    }
    setError("");
    onConfirm(articleId, trimmed);
    setReason("");
    onOpenChange(false);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setReason("");
      setError("");
    }
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent showClose={true} className="border-zinc-800 bg-zinc-900">
        <DialogHeader>
          <DialogTitle className="text-white">Reject Article</DialogTitle>
          <DialogDescription className="text-zinc-400">
            {articleTitle}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <label className="text-sm text-zinc-300">Reason for rejection</label>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explain why this article is being rejected..."
            className="min-h-[100px] border-zinc-700 bg-zinc-800 text-white placeholder:text-zinc-500"
            rows={4}
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            className="border-zinc-700 bg-zinc-800 text-white hover:bg-zinc-700"
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={handleConfirm}
          >
            Reject Article
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
