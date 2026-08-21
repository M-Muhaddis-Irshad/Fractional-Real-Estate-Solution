"use client";

import Modal from "@/components/Modal";
import TermsContent from "@/components/TermsContent";
import { useApp } from "@/context/AppContext";

/**
 * Terms & Conditions — shown in an in-page modal from the registration form.
 */
export default function TermsModal({ onClose }: { onClose: () => void }) {
  const { platform } = useApp();
  const email = platform.supportEmail || "support@flux.app";
  const phone = platform.supportPhone;

  return (
    <Modal title="Terms & Conditions" onClose={onClose} wide>
      <TermsContent email={email} phone={phone} />
    </Modal>
  );
}
