/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState, useCallback } from "react";
import RecordsCollection from "../../../components/collections/RecordsCollection";
import { fetchRecordMediaCount } from "../../../utils/helpers";
import config from "../../../config";

/**
 * Loads sub-records + derived counters for a one_accession_row.
 */
export default function useSubrecords({
  recordtype,
  id,
  numberofpages,
  numberofonerecord,
  numberoftranscribedonerecord,
  numberoftranscribedpages,
  transcriptiontype,
}) {
  const [subrecords, setSubrecords] = useState([]);
  const [visible, setVisible] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const [count, setCount] = useState(0);
  const [countDone, setCountDone] = useState(0);
  const [mediaCount, setMediaCount] = useState(0);
  const [mediaCountDone, setMediaCountDone] = useState(0);

  /* ---------- counters ---------- */
  const fetchRecordCount = async (query, setter) => {
    const queryStr = new URLSearchParams({
      ...config.requiredParams,
      ...query,
    }).toString();
    const res = await fetch(`${config.apiUrl}count?${queryStr}`);
    if (res.ok) setter((await res.json()).data.value);
  };

  useEffect(() => {
    if (recordtype !== "one_accession_row") return;

    const oneRecordParams = { search: id, recordtype: "one_record" };
    const transcribedParams = {
      ...oneRecordParams,
      transcriptionstatus: "published,transcribed",
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
  }, [id]);

  /* ---------- list ---------- */
  const loadList = useCallback(() => {
    if (loaded) return;
    const coll = new RecordsCollection((json) => setSubrecords(json.data));
    coll.fetch({ search: id, recordtype: "one_record" });
    setLoaded(true);
  }, [loaded, id]);

  useEffect(() => {
    if (
      recordtype === "one_accession_row" &&
      transcriptiontype === "audio" &&
      !loaded
    ) {
      loadList();
    }
  }, [recordtype, transcriptiontype, loaded, loadList]);

  const toggle = () => {
    setVisible((v) => !v);
    if (!loaded) loadList();
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
