import { useState, useCallback, useEffect } from 'react';

const CONTRIBUTOR_INFO_STORAGE_KEY = 'transcriptionContributorInfo';

const readPersistedContributorFields = () => {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const raw = window.sessionStorage.getItem(CONTRIBUTOR_INFO_STORAGE_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw);
    return {
      nameInput: parsed?.nameInput || '',
      emailInput: parsed?.emailInput || '',
    };
  } catch {
    return {};
  }
};

const persistContributorFields = ({ nameInput = '', emailInput = '' }) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    if (!nameInput && !emailInput) {
      window.sessionStorage.removeItem(CONTRIBUTOR_INFO_STORAGE_KEY);
      return;
    }

    window.sessionStorage.setItem(
      CONTRIBUTOR_INFO_STORAGE_KEY,
      JSON.stringify({ nameInput, emailInput }),
    );
  } catch {
    // Ignore storage failures and keep the in-memory form working.
  }
};

export const INITIAL_FIELDS = {
  informantNameInput: '',
  informantBirthDateInput: '',
  informantBirthPlaceInput: '',
  informantInformationInput: '',
  messageInput: '',
  messageCommentInput: '',
  nameInput: '',
  emailInput: '',
  titleInput: '',
  pagenumberInput: '',
  foneticSignsInput: false,
  unreadableInput: false,
};

export const getPersistedContributorFields = () => readPersistedContributorFields();

/* Centralises every form field + change handler. */
export default function useTranscriptionForm(initial = {}) {
  const [fields, setFields] = useState({
    ...INITIAL_FIELDS,
    ...readPersistedContributorFields(),
    ...initial,
  });

  const handleInputChange = useCallback((e) => {
    // handle checkboxes vs text inputs
    const { target } = e;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const { name } = target;
    setFields((prev) => ({ ...prev, [name]: value }));
  }, []);

  useEffect(() => {
    persistContributorFields({
      nameInput: fields.nameInput,
      emailInput: fields.emailInput,
    });
  }, [fields.emailInput, fields.nameInput]);

  const reset = useCallback(() => {
    setFields({
      ...INITIAL_FIELDS,
      ...readPersistedContributorFields(),
    });
  }, []);

  return {
    fields, handleInputChange, reset, setFields,
  };
}
