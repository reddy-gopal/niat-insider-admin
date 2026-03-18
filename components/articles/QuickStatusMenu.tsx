"use client";

import { useState } from "react";
import { MoreHorizontal, Check, Send, Ban, FileText, RotateCcw } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { RejectModal } from "./RejectModal";
import type { ArticleListItem } from "@/types/article";

type ArticleStatus = ArticleListItem["status"];

const STATUS_OPTIONS: {
  value: ArticleStatus;
  label: string;
  icon: React.ReactNode;
}[] = [
  { value: "published", label: "Publish", icon: <Check className="h-4 w-4" /> },
  {
    value: "pending_review",
    label: "Send to Review",
    icon: <Send className="h-4 w-4" />,
  },
  { value: "rejected", label: "Reject", icon: <Ban className="h-4 w-4" /> },
  { value: "draft", label: "Draft", icon: <FileText className="h-4 w-4" /> },
];

type QuickStatusMenuProps = {
  article: ArticleListItem;
  onStatusChange: (
    id: string,
    status: ArticleStatus,
    rejectionReason?: string
  ) => void;
};

export function QuickStatusMenu({ article, onStatusChange }: QuickStatusMenuProps) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const currentStatus = article.status;

  const handleSelect = (status: ArticleStatus) => {
    if (status === "rejected") {
      setRejectOpen(true);
      return;
    }
    onStatusChange(article.id, status);
  };

  const handleRejectConfirm = (id: string, reason: string) => {
    onStatusChange(id, "rejected", reason);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Change status</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="min-w-[180px] border-zinc-700 bg-zinc-800 shadow-xl z-20"
        >
          {STATUS_OPTIONS.map((opt) => (
            <DropdownMenuItem
              key={opt.value}
              onClick={() => handleSelect(opt.value)}
              className="px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white flex items-center gap-2"
            >
              {opt.icon}
              {opt.label}
              {currentStatus === opt.value && (
                <Check className="ml-auto h-4 w-4 text-[#991b1b]" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <RejectModal
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        articleTitle={article.title}
        articleId={article.id}
        onConfirm={handleRejectConfirm}
      />
    </>
  );
}
