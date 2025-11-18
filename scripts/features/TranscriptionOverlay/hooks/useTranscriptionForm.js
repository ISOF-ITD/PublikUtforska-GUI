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
  pagenumberInput: "",
  foneticSignsInput: false,
  unreadableInput: false,
};

/* Centralises every form field + change handler. */
export default function useTranscriptionForm(initial = {}) {
  const [fields, setFields] = useState({ ...INITIAL, ...initial });

  const handleInputChange = useCallback((e) => {
    // handle checkboxes vs text inputs
    const target = e.target;
    const value = target.type === "checkbox" ? target.checked : target.value;
    const name = target.name;
    setFields((prev) => ({ ...prev, [name]: value }));
  }, []);

  const reset = useCallback(() => setFields(INITIAL), []);

  return { fields, handleInputChange, reset, setFields };
}
