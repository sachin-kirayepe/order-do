/**
 * Emergency Recovery Utility
 * Generates official recovery instructions and system metadata for the Admin.
 */

export interface RecoveryData {
  shopName: string;
  shopId: string;
  ownerEmail: string;
  projectRef: string;
}

export function generateRecoveryCardText(data: RecoveryData): string {
  const date = new Date().toLocaleString();
  
  return `
================================================================================
                    ORDER-DO OFFICIAL EMERGENCY RECOVERY CARD
================================================================================
Generated On: ${date}
Owner Account: ${data.ownerEmail}

KEEP THIS DOCUMENT SECURE AND OFFLINE. DO NOT SHARE THESE DETAILS.
--------------------------------------------------------------------------------

1. SYSTEM IDENTIFIERS
----------------------
Shop Name   : ${data.shopName}
Shop ID     : ${data.shopId}
Project Ref : ${data.projectRef}

2. RECOVERY PROTOCOL (MASTER PIN RESET)
----------------------------------------
If you forget your Master PIN and are locked out:

STEP A: Contact Order-Do support at sachinkumar647422.office@gmail.com
STEP B: Verify your identity using this Shop ID and Owner Email.
STEP C: Support will reset your PIN using a secure server-side process.
STEP D: Login and immediately set a new secure PIN in Admin Settings.

IMPORTANT: Never share this document with anyone. Support will NEVER
ask for your current PIN or password.

3. RECOVERY PROTOCOL (ADMIN ACCESS)
------------------------------------
If you lose access to the Admin Panel:
- Use the "Forgot Password" link on the login screen.
- Reset your password via the automated email sent to ${data.ownerEmail}.

4. SECURITY ADVISORY
---------------------
- This document does not contain your current PIN (it is securely hashed).
- This project uses AES-256-GCM encryption for all customer data.
- Regularly download a Backup from the Admin Settings for data resilience.

--------------------------------------------------------------------------------
Official Project: Order-Do PWA
Security Level: Elite Hardened (Phase 4)
================================================================================
`;
}

export function downloadRecoveryCard(content: string, shopName: string) {
  const filename = `OrderDo_Recovery_${shopName.replace(/\s+/g, '_')}.txt`;
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
