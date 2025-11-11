/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState, useCallback } from "react";
import RecordsCollection from "../../../components/collections/RecordsCollection";
import { fetchRecordMediaCount } from "../../../utils/helpers";
import config from "../../../config";

/**
 * Loads sub-records + derived counters for a one_accession_row.
 * New data model: if the accession already contains `segments`,
 * we use those instead of fetching former `one_record`s.
 */
export default function useSubrecords({
  recordtype,
  id,
  numberofpages,
  numberofonerecord,
  numberoftranscribedonerecord,
  numberoftranscribedpages,
  transcriptiontype,
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

  /* ---------- counters / derived data for new model ---------- */
  useEffect(() => {
    if (recordtype !== "one_accession_row") return;

    //  everything lives on the accession
    if (hasEmbeddedSegments) {
      // map media by id so we can pick titles / transcriptionstatus
      const mediaById = new Map(media.map((m) => [m.id, m]));

      const virtualSubs = segments.map((seg) => {
        const m = mediaById.get(seg.start_media_id);
        const mediaIndex = m ? media.findIndex((mm) => mm.id === m.id) : -1;

        return {
          // we mimic the shape we previously got from ES
          _source: {
            // this ID will never be requested from the backend, it’s just for React keys
            id: `${id}#segment-${seg.id}`,
            archive: {
              // we don’t really have pages per segment, so use media position as page
              page: mediaIndex >= 0 ? mediaIndex + 1 : null,
            },
            title: m?.title ?? null,
            media_id: seg.start_media_id,
            transcriptionstatus: m?.transcriptionstatus ?? "readytotranscribe",
          },
        };
      });

      setSubrecords(virtualSubs);
      setLoaded(true);

      // counts
      setCount(segments.length);
      setCountDone(
        virtualSubs.filter((s) => s._source.transcriptionstatus === "published")
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

    if (Number.isInteger(numberofonerecord)) {
      setCount(numberofonerecord);
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
    numberofonerecord,
    numberoftranscribedonerecord,
    transcriptiontype,
  ]);

  /* ---------- list (old model) ---------- */
  const loadList = useCallback(() => {
    // for the new model we never fetch
    if (hasEmbeddedSegments) return;
    if (loaded) return;
    const coll = new RecordsCollection((json) => setSubrecords(json.data));
    coll.fetch({ search: id, recordtype: "one_record" });
    setLoaded(true);
  }, [hasEmbeddedSegments, loaded, id]);

  // audio-accessions in old model preloaded the list
  useEffect(() => {
    if (
      recordtype === "one_accession_row" &&
      transcriptiontype === "audio" &&
      !loaded &&
      !hasEmbeddedSegments
    ) {
      loadList();
    }
  }, [recordtype, transcriptiontype, loaded, hasEmbeddedSegments, loadList]);

  // Abort if this container unmounts during a fetch
  useEffect(() => {
    const coll = new RecordsCollection(() => {});
    return () => coll.abort();
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
