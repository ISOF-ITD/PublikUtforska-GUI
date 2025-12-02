import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useParams, useOutletContext } from "react-router-dom";
import { AudioContext } from "../../contexts/AudioContext";
import { getAudioTitle } from "../../utils/helpers";

import EditorHeader from "./ui/EditorHeader";
import UtterancesTableHeader from "./ui/UtterancesTableHeader";
import UtterancesList from "./ui/UtterancesList";
import ScrollTopButton from "./ui/ScrollTopButton";

import useUtterances from "./hooks/useUtterances";
import useEditorShortcuts from "./hooks/useEditorShortcuts";
import config from "../../config";

export default function CorrectionEditor({
  data: propData = null,
  readOnly = true,
  readOnly = true
}) {
  readOnly = !config.activateAudioCorrection;
  /* -------- routing / context -------- */
  const { source, id: fileId } = useParams();
  // prefer an explicit prop, otherwise fall back to the outlet context
  const outletCtx = useOutletContext() || {};
  const data = propData ?? outletCtx.data;
  const {
    playAudio,
    playing: isPlaying,
    audioRef,
    activeSegmentId,
    setActiveSegmentId,
  } = useContext(AudioContext);
  const scrollRef = useRef(null);

  /* -------- audio item & title -------- */
  // TEMP hack: this one recording is manually transcribed and contains <i>...</i> to be rendered.
  const allowItalicsHack = useMemo(
    () => data?.id === "bd10106_253556",
    [data?.id]
  );
  const audioItem = useMemo(() => {
    const sameFileId =
      data?.media?.filter((m) => String(m.id) === String(fileId)) ?? [];

    return (
      sameFileId.find(
        (m) =>
          Array.isArray(m.utterances?.utterances) || Array.isArray(m.utterances)
      ) || sameFileId[0]
    );
  }, [data, fileId]);

  const audioTitle = useMemo(
    () =>
      audioItem
        ? getAudioTitle(
            audioItem.title,
            data?.contents,
            data?.archive?.archive_org,
            data?.archive?.archive,
            audioItem.source,
            data?.year,
            data?.persons
          )
        : "",
    [audioItem, data]
  );

  /* -------- utterance logic -------- */
  const {
    utterances,
    setUtterances,
    filterState,
    searchState,
    visibleUtterances,
    counts,
    progress,
    searchHits,
  } = useUtterances(audioItem, activeSegmentId);

  // Editing state, only needed when *not* read-only
  const [editingId, setEditingId] = useState(() => (readOnly ? null : null));
  const [editedText, setEditedText] = useState(() => (readOnly ? "" : ""));
  const [followActive, setFollowActive] = useState(true);

  /* -------- helpers -------- */
  const beginEdit = useCallback(
    (utt) => {
      if (readOnly || utt.status === "complete") return;
      audioRef.current?.pause();
      setEditingId(utt.id);
      setEditedText(utt.text);
    },
    [readOnly]
  );

  /* -- keyboard shortcuts -- */
  const saveCurrentEdit = useCallback(() => {
    const utt = utterances.find((u) => u.id === editingId);
    if (!utt) return;
    setUtterances((prev) =>
      prev.map((u) =>
        u.id === utt.id ? { ...u, text: editedText, status: "edited" } : u
      )
    );
    setEditingId(null);
  }, [editingId, editedText, utterances, setUtterances]);

  useEditorShortcuts({
    enabled: !!editingId && !readOnly,
    onDiscard: () => setEditingId(null),
    onSaveCurrent: saveCurrentEdit,
    onPrev: () => {
      const idx = visibleUtterances.findIndex((u) => u.id === editingId);
      if (idx > 0) beginEdit(visibleUtterances[idx - 1]);
    },
    onNext: () => {
      const idx = visibleUtterances.findIndex((u) => u.id === editingId);
      if (idx < visibleUtterances.length - 1)
        beginEdit(visibleUtterances[idx + 1]);
    },
  });

  /* -- search navigation (prev/next match) -- */
  const goToMatch = useCallback(
    (dir) => {
      const ids = searchState.matchIds || [];
      if (!ids.length) return;
      const curr = ids.indexOf(activeSegmentId);
      let nextIdx;
      if (dir > 0) {
        nextIdx = curr >= 0 ? (curr + 1) % ids.length : 0;
      } else {
        nextIdx = curr > 0 ? curr - 1 : ids.length - 1;
      }
      setActiveSegmentId(ids[nextIdx]);
    },
    [searchState.matchIds, activeSegmentId, setActiveSegmentId]
  );

  /**
   * Play-/pause-toggle, same everywhere:
   * – clicking the active segment toggles play/pause
   * – clicking a different segment jumps there and starts playing
   */
  const handlePlay = useCallback(
    (startTime, id) => {
      // Same segment → toggle
      if (id === activeSegmentId) {
        if (audioRef.current?.paused) {
          audioRef.current.play();
        } else {
          audioRef.current.pause();
        }
        return;
      }

      // New segment → jump + play
      setActiveSegmentId(id);
      playAudio({
        record: { id: data?.id, title: audioTitle },
        audio: { ...audioItem, utterances },
        time: startTime,
      });
    },
    [
      activeSegmentId,
      audioRef,
      playAudio,
      data?.id,
      audioTitle,
      audioItem,
      utterances,
      setActiveSegmentId,
    ]
  );

  useEffect(() => {
    if (!followActive || !activeSegmentId || !scrollRef.current) return;

    const activeElement = document.querySelector(
      `[data-utt="${activeSegmentId}"]`
    );
    if (activeElement) {
      activeElement.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest",
      });
    }
  }, [activeSegmentId, followActive]);

  useEffect(() => {
    document.title = audioTitle || "Transkription";
  }, [audioTitle]);

  /* -------- listData passed to each row -------- */
  const listData = useMemo(
    () => ({
      rows: visibleUtterances,
      editingId,
      editedText,
      isPlaying,
      beginEdit,
      discardEdit: () => setEditingId(null),
      saveEdit: () => saveCurrentEdit(), // real API call extracted elsewhere
      gotoPrev: () => {}, // handled by shortcut hook
      gotoNext: () => {},
      readOnly,
      handlePlay,
      setEditedText,
      speakers: data?.speakers ?? [],
      activeId: activeSegmentId,
      query: searchState.query,
      followActive,
      saveCurrentEdit,
      allowItalics: allowItalicsHack,
    }),
    [
      visibleUtterances,
      editingId,
      editedText,
      isPlaying,
      beginEdit,
      readOnly,
      handlePlay,
      setEditedText,
      data?.speakers,
      activeSegmentId,
      searchState.query,
      allowItalicsHack,
    ]
  );

  /* -------- render -------- */

  if (!utterances?.length) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center text-gray-600">
        <p>Det finns ingen transkription för den här inspelningen ännu.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto lg:p-4 overflow-y-auto" ref={scrollRef}>
      <EditorHeader
        audioTitle={audioTitle}
        progress={progress}
        readOnly={readOnly}
        counts={counts}
        filterState={filterState}
        searchState={searchState}
        searchHits={searchHits}
        visibleUtterances={visibleUtterances}
        followActive={followActive}
        setFollowActive={setFollowActive}
        onSearchPrev={() => goToMatch(-1)}
        onSearchNext={() => goToMatch(1)}
        showAutoWarning={!allowItalicsHack}
      />

      <div className="bg-white shadow rounded-lg w-full">
        <UtterancesTableHeader readOnly={readOnly} />
        {visibleUtterances.length ? (
          <UtterancesList
            rows={visibleUtterances}
            editingId={editingId}
            editedText={editedText}
            listData={listData}
            getActiveIndex={() =>
              visibleUtterances.findIndex((u) => u.id === activeSegmentId)
            }
            followActive={followActive}
            readOnly={readOnly}
            activeId={activeSegmentId}
          />
        ) : (
          <p className="p-6 text-center text-gray-500">
            Inga träffar – prova ett annat sökord eller justera filtret.
          </p>
        )}
      </div>
    </div>
  );
}
