"use client";

import Modal from "@/components/Modal";
import PrivacyContent from "@/components/PrivacyContent";
import { useApp } from "@/context/AppContext";

/**
 * Privacy Policy — shown in an in-page modal from the registration form.
 */
export default function PrivacyModal({ onClose }: { onClose: () => void }) {
  const { platform } = useApp();
  const email = platform.supportEmail || "support@flux.app";
  const phone = platform.supportPhone;

  return (
    <Modal title="Privacy Policy" onClose={onClose} wide>
      <PrivacyContent email={email} phone={phone} />
    </Modal>
  );
}
