import {
  useCallback, useEffect, useMemo, useState,
} from 'react';

const EMPTY_INTERACTION = {
  hovered: null,
  focused: null,
  latest: 'hovered',
  dismissed: false,
  data: null,
  resetKey: null,
};

function normalizeIds(ids) {
  const values = Array.isArray(ids) ? ids : [ids];
  const normalized = [...new Set(values
    .filter((id) => id !== null && id !== undefined && id !== '')
    .map(String))];
  return normalized.length > 0 ? normalized : null;
}

export default function useParishMapPreview({
  active,
  loading,
  onPreview,
  data,
  resetKey,
}) {
  const [interaction, setInteraction] = useState(EMPTY_INTERACTION);
  const contextMatches = interaction.data === data && interaction.resetKey === resetKey;
  const previewIds = useMemo(() => {
    if (!contextMatches || interaction.dismissed) return null;
    return interaction[interaction.latest] || interaction.hovered || interaction.focused;
  }, [contextMatches, interaction]);

  const handleInteraction = useCallback((field, ids) => {
    const normalizedIds = normalizeIds(ids);
    setInteraction((previous) => ({
      ...previous,
      [field]: normalizedIds,
      latest: normalizedIds ? field : previous.latest,
      dismissed: normalizedIds ? false : previous.dismissed,
      data,
      resetKey,
    }));
  }, [data, resetKey]);

  const resetPreview = useCallback(() => {
    setInteraction(EMPTY_INTERACTION);
  }, []);

  const dismissPreview = useCallback(() => {
    setInteraction((previous) => ({ ...previous, dismissed: true }));
  }, []);

  useEffect(() => {
    if (!active || loading) resetPreview();
  }, [active, loading, resetPreview]);

  useEffect(() => {
    onPreview(active && !loading ? previewIds : null);
    return () => onPreview(null);
  }, [active, loading, onPreview, previewIds]);

  useEffect(() => {
    if (!active || previewIds === null) return undefined;
    const handleEscape = (event) => {
      if (event.key === 'Escape') dismissPreview();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [active, dismissPreview, previewIds]);

  return {
    onHover: useCallback((ids) => handleInteraction('hovered', ids), [handleInteraction]),
    onFocus: useCallback((ids) => handleInteraction('focused', ids), [handleInteraction]),
    resetPreview,
  };
}
