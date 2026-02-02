/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState, useCallback, useRef } from "react";
import RecordsApiClient from "../api/RecordsApiClient";
import { fetchRecordMediaCount } from "../../../utils/helpers";
import config from "../../../config";
import buildSegments from "../../../utils/buildSegments";

/**
 * Loads sub-records + derived counters for a one_accession_row.
 * New data model: if the accession already contains `segments`,
 * we use those instead of fetching former `one_record`s.
 */
export default function useSubrecords({
  recordtype,
  id,
  numberofpages,
  numberoftranscribedonerecord,
  numberoftranscribedpages,
  transcriptiontype,
  transcriptionstatus,
  persons = [],
  // new fields that now arrive on the accession
  segments = [],
  media = [],
  update_status,
}) {
  const [subrecords, setSubrecords] = useState([]);
  const [visible, setVisible] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const [count, setCount] = useState(0);
  const [countDone, setCountDone] = useState(0);
  const [mediaCount, setMediaCount] = useState(0);
  const [mediaCountDone, setMediaCountDone] = useState(0);

  const hasEmbeddedSegments =
    update_status === "segments" ||
    (Array.isArray(segments) && segments.length > 0);

  const numberOfSegments = segments.length;

  /* ---------- counters / derived data for new model ---------- */
  useEffect(() => {
    if (recordtype !== "one_accession_row") return;

    //  everything lives on the accession
    if (hasEmbeddedSegments) {
      const mediaImages =
        transcriptiontype === "audio"
          ? media
          : media.filter((m) => m?.type === "image");

      const base = mediaImages.length ? mediaImages : media;

      // Use global buildSegments util
      const virtualSubs = buildSegments({
        mediaImages: base,
        rawSegments: segments,
        transcriptionstatus,
        persons,
      });

      setSubrecords(virtualSubs);
      setLoaded(true);

      // counts
      setCount(virtualSubs.length);
      setCountDone(
        virtualSubs.filter((s) => s.segmentTranscriptionstatus === "published")
          .length
      );

      // page-based progress still makes sense
      const publishedMedia = media.filter(
        (m) => m.transcriptionstatus === "published"
      );
      setMediaCount(media.length || numberofpages || 0);
      setMediaCountDone(publishedMedia.length || numberoftranscribedpages || 0);

      return; // ← do NOT run the old fetching path
    }

    // OLD MODEL (still around for older indexes) ----------------
    if (recordtype !== "one_accession_row") return;

    const oneRecordParams = { search: id, recordtype: "one_record" };
    const transcribedParams = {
      ...oneRecordParams,
      transcriptionstatus: "published,transcribed",
    };

    const fetchRecordCount = async (query, setter) => {
      const queryStr = new URLSearchParams({
        ...config.requiredParams,
        ...query,
      }).toString();
      const res = await fetch(`${config.apiUrl}count?${queryStr}`);
      if (res.ok) setter((await res.json()).data.value);
    };

    if (transcriptiontype === "sida") {
      if (Number.isInteger(numberofpages)) {
        setMediaCount(numberofpages);
        setMediaCountDone(numberoftranscribedpages);
      } else {
        fetchRecordMediaCount({ search: id }, setMediaCount, setMediaCountDone);
      }
    }

    if (Number.isInteger(numberOfSegments)) {
      setCount(numberOfSegments);
      setCountDone(numberoftranscribedonerecord);
    } else {
      fetchRecordCount(oneRecordParams, setCount);
      fetchRecordCount(transcribedParams, setCountDone);
    }
  }, [
    id,
    recordtype,
    hasEmbeddedSegments,
    segments,
    media,
    numberofpages,
    numberoftranscribedpages,
    numberOfSegments,
    numberoftranscribedonerecord,
    transcriptiontype,
    transcriptionstatus,
    persons,
  ]);

  /* ---------- list (old model) ---------- */
  const clientRef = useRef(null);

  const loadList = useCallback(() => {
    // for the new model we never fetch
    if (hasEmbeddedSegments) return;
    if (loaded) return;

    if (!clientRef.current) {
      clientRef.current = new RecordsApiClient(
        (json) => {
          setSubrecords(json.data);
          // loaded is already true when we first call loadList
        },
        (err) => {
          console.error("Failed to fetch subrecords", err);
        }
      );
    }

    setLoaded(true); // only load once
    clientRef.current.fetch({ search: id, recordtype: "one_record" });
  }, [hasEmbeddedSegments, loaded, id]);

  // Abort if this container unmounts during a fetch
  useEffect(() => {
    return () => {
      if (clientRef.current) {
        clientRef.current.abort();
      }
    };
  }, []);

  const toggle = () => {
    setVisible((v) => !v);
    if (!loaded && !hasEmbeddedSegments) loadList();
  };

  return {
    subrecords,
    visible,
    toggle,
    count,
    countDone,
    mediaCount,
    mediaCountDone,
  };
}
