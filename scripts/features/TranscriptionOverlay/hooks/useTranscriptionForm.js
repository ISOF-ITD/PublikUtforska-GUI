import { useState, useCallback } from "react";

const INITIAL = {
  informantNameInput: "",
  informantBirthDateInput: "",
  informantBirthPlaceInput: "",
  informantInformationInput: "",
  messageInput: "",
  messageCommentInput: "",
  nameInput: "",
  emailInput: "",
  titleInput: "",
};

/* Centralises every form field + change handler. */
export default function useTranscriptionForm(initial = {}) {
  const [fields, setFields] = useState({ ...INITIAL, ...initial });

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
  }, []);

  const reset = useCallback(() => setFields(INITIAL), []);

  return { fields, handleInputChange, reset, setFields };
}
