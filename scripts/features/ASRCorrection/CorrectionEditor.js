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

export default function CorrectionEditor({
  data: propData = null,
  readOnly = false,
}) {
  /* -------- routing / context -------- */
  const { source } = useParams();
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
  const audioItem = useMemo(() => {
    const sameSrc =
      data?.media?.filter(
        (m) =>
          decodeURIComponent(m.source) === decodeURIComponent(source) ||
          m.source === source
      ) ?? [];
    return (
      sameSrc.find(
        (m) =>
          Array.isArray(m.utterances?.utterances) || Array.isArray(m.utterances)
      ) || sameSrc[0]
    );
  }, [data, source]);

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
  } = useUtterances(audioItem, activeSegmentId);

  /* -------- editor state -------- */
  const [editingId, setEditingId] = useState(null);
  const [editedText, setEditedText] = useState("");
  const [followActive, setFollowActive] = useState(true);

  /* -------- helpers -------- */
  const beginEdit = useCallback(
    (utt) => {
      if (readOnly || utt.status === "complete") return;
      setEditingId(utt.id);
      setEditedText(utt.text);
    },
    [readOnly]
  );

  /* -- keyboard shortcuts -- */
  useEditorShortcuts({
    enabled: !!editingId && !readOnly,
    onDiscard: () => setEditingId(null),
    onSaveCurrent: () => {
      const utt = utterances.find((u) => u.id === editingId);
      if (utt) {
        setUtterances((prev) =>
          prev.map((u) =>
            u.id === utt.id ? { ...u, text: editedText, status: "edited" } : u
          )
        );
        setEditingId(null);
      }
    },
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

  /* -------- listData passed to each row -------- */
  const listData = useMemo(
    () => ({
      rows: visibleUtterances,
      editingId,
      editedText,
      isPlaying,
      beginEdit,
      discardEdit: () => setEditingId(null),
      saveEdit: () => {}, // real API call extracted elsewhere
      gotoPrev: () => {}, // handled by shortcut hook
      gotoNext: () => {},
      readOnly,
      handlePlay,
      setEditedText,
      speakers: data?.speakers ?? [],
      activeId: activeSegmentId,
      query: searchState.query,
      followActive,
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
    ]
  );

  /* -------- render -------- */

  if (!visibleUtterances?.length) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center text-gray-600">
        <p>Det finns ingen transkription för den här inspelningen ännu.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto lg:p-4" ref={scrollRef}>
      <EditorHeader
        audioTitle={audioTitle}
        progress={progress}
        readOnly={readOnly}
        counts={counts}
        filterState={filterState}
        searchState={searchState}
        visibleUtterances={visibleUtterances}
        followActive={followActive}
        setFollowActive={setFollowActive}
      />

      <div className="bg-white shadow rounded-lg w-full">
        <UtterancesTableHeader readOnly={readOnly} />
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
      </div>

      <ScrollTopButton />
    </div>
  );
}
