"use client";

import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { ReactNode } from "react";

interface ConfirmDialogProps {
  trigger: ReactNode;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  variant?: "danger" | "default";
}

export function ConfirmDialog({
  trigger,
  title = "Xác nhận",
  description = "Bạn có chắc chắn muốn thực hiện thao tác này?",
  confirmLabel = "Xác nhận",
  cancelLabel = "Hủy",
  onConfirm,
  variant = "danger",
}: ConfirmDialogProps) {
  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger asChild>{trigger}</AlertDialog.Trigger>

      <AlertDialog.Portal>
        {/* Overlay */}
        <AlertDialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        {/* Content */}
        <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 w-[90vw] max-w-sm -translate-x-1/2 -translate-y-1/2 bg-card border border-border rounded-2xl p-6 shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          {/* Icon */}
          {variant === "danger" && (
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-6 h-6 text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </div>
          )}

          <AlertDialog.Title className="text-base font-semibold text-center mb-1">
            {title}
          </AlertDialog.Title>

          <AlertDialog.Description className="text-sm text-gray-400 text-center mb-6">
            {description}
          </AlertDialog.Description>

          <div className="flex gap-3">
            <AlertDialog.Cancel asChild>
              <button className="flex-1 py-2.5 rounded-xl border border-border bg-background text-sm font-medium hover:bg-border/50 transition">
                {cancelLabel}
              </button>
            </AlertDialog.Cancel>

            <AlertDialog.Action asChild>
              <button
                onClick={onConfirm}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition text-white ${
                  variant === "danger"
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-accent hover:bg-accent/80"
                }`}
              >
                {confirmLabel}
              </button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
