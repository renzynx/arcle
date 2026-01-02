"use client";

import { Button } from "@arcle/ui/components/button";
import { DialogClose, DialogFooter } from "@arcle/ui/components/dialog";
import { Label } from "@arcle/ui/components/label";
import { DownloadSimple } from "@phosphor-icons/react";
import { QRCodeSVG } from "qrcode.react";

interface QrStepProps {
  totpURI: string;
  backupCodes: string[];
  onContinue: () => void;
}

function downloadBackupCodes(codes: string[]) {
  const content = `Arcle Backup Codes
==================
Generated: ${new Date().toISOString()}

Keep these codes safe. Each code can only be used once.

${codes.join("\n")}
`;
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "arcle-backup-codes.txt";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function QrStep({ totpURI, backupCodes, onContinue }: QrStepProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-center p-4 bg-white rounded-lg">
        <QRCodeSVG value={totpURI} size={200} />
      </div>
      {backupCodes.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Backup Codes (save these!)</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadBackupCodes(backupCodes)}
            >
              <DownloadSimple className="mr-2 size-4" />
              Download
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2 p-3 bg-muted rounded-md font-mono text-sm">
            {backupCodes.map((code) => (
              <span key={code}>{code}</span>
            ))}
          </div>
        </div>
      )}
      <DialogFooter>
        <DialogClose render={<Button variant="outline">Cancel</Button>} />
        <Button onClick={onContinue}>I&apos;ve scanned the code</Button>
      </DialogFooter>
    </div>
  );
}
