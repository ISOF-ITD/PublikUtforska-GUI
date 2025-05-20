import React, { useCallback, useContext, useMemo, useState } from "react";
import { useParams, useOutletContext } from "react-router-dom";
import { AudioContext } from "../../contexts/AudioContext";
import { getAudioTitle } from "../../utils/helpers";

import EditorHeader from "./ui/EditorHeader";
import UtterancesTableHeader from "./ui/UtterancesTableHeader";
import UtterancesList from "./ui/UtterancesList";
import ScrollTopButton from "./ui/ScrollTopButton";

import useUtterances from "./hooks/useUtterances";
import useEditorShortcuts from "./hooks/useEditorShortcuts";

export default function CorrectionEditor({ readOnly = true }) {
  /* -------- routing / context -------- */
  const { source } = useParams();
  const { data } = useOutletContext();
  const { playAudio, isPlaying } = useContext(AudioContext);

  /* -------- audio item & title -------- */
  const audioItem = useMemo(() => {
    const sameSrc =
      data?.media?.filter((m) => m.source === decodeURIComponent(source)) ?? [];
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
  } = useUtterances(audioItem);

  /* -------- editor state -------- */
  const [editingId, setEditingId] = useState(null);
  const [editedText, setEditedText] = useState("");
  const [followActive, setFollowActive] = useState(true);
  const [activeId, setActiveId] = useState(null);

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

  /* -------- play helper -------- */
  const handlePlay = (startTime, id) => {
    setActiveId(id); // highlight current row
    playAudio({
      record: { id: data?.id, title: audioTitle },
      audio: audioItem,
      time: startTime,
    });
  };

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
      activeId,
      query: searchState.query,
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
      activeId,
      searchState.query,
    ]
  );

  /* -------- render -------- */
  return (
    <div className="max-w-6xl mx-auto p-4">
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
            visibleUtterances.findIndex((u) => u.id === activeId)
          }
          followActive={followActive}
          readOnly={readOnly}
        />
      </div>

      <ScrollTopButton />
    </div>
  );
}
