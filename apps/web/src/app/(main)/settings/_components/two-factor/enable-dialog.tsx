"use client";

import {
  useEnableTwoFactorMutation,
  useVerifyTotpMutation,
} from "@arcle/auth-client";
import { Button } from "@arcle/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@arcle/ui/components/dialog";
import { ShieldSlash } from "@phosphor-icons/react";
import { useState } from "react";
import { toast } from "sonner";
import { PasswordStep } from "./password-step";
import { QrStep } from "./qr-step";
import { VerifyStep } from "./verify-step";

type EnableStep = "password" | "qr" | "verify";

interface EnableTwoFactorData {
  totpURI: string;
  backupCodes: string[];
}

const stepDescriptions: Record<EnableStep, string> = {
  password: "Enter your password to continue.",
  qr: "Scan this QR code with your authenticator app.",
  verify: "Enter the 6-digit code from your authenticator app.",
};

export function EnableTwoFactor() {
  const [step, setStep] = useState<EnableStep>("password");
  const [open, setOpen] = useState(false);
  const [enableData, setEnableData] = useState<EnableTwoFactorData | null>(
    null,
  );

  const enableMutation = useEnableTwoFactorMutation();
  const verifyMutation = useVerifyTotpMutation();

  const resetState = () => {
    setStep("password");
    setEnableData(null);
  };

  const handlePasswordSubmit = (password: string) => {
    enableMutation.mutate(password, {
      onSuccess: (data) => {
        setEnableData(data);
        setStep("qr");
      },
      onError: (error) => {
        toast.error(error.message || "Failed to enable 2FA");
      },
    });
  };

  const handleVerifySubmit = (code: string) => {
    verifyMutation.mutate(
      { code },
      {
        onSuccess: () => {
          toast.success("Two-factor authentication enabled");
          setOpen(false);
          resetState();
        },
        onError: (error) => {
          toast.error(error.message || "Invalid code");
        },
      },
    );
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <ShieldSlash className="size-8 text-muted-foreground" />
        <div>
          <p className="font-medium">Not enabled</p>
          <p className="text-sm text-muted-foreground">
            Protect your account with 2FA
          </p>
        </div>
      </div>

      <Dialog
        open={open}
        onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) resetState();
        }}
      >
        <DialogTrigger render={<Button>Enable 2FA</Button>} />
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enable Two-Factor Authentication</DialogTitle>
            <DialogDescription>{stepDescriptions[step]}</DialogDescription>
          </DialogHeader>

          {step === "password" && (
            <PasswordStep
              onSubmit={handlePasswordSubmit}
              isPending={enableMutation.isPending}
            />
          )}

          {step === "qr" && enableData && (
            <QrStep
              totpURI={enableData.totpURI}
              backupCodes={enableData.backupCodes}
              onContinue={() => setStep("verify")}
            />
          )}

          {step === "verify" && (
            <VerifyStep
              onSubmit={handleVerifySubmit}
              isPending={verifyMutation.isPending}
              onBack={() => setStep("qr")}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
