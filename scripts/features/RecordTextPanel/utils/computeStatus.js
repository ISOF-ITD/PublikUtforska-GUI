import {
  faAsterisk,
  faCheck,
  faLock,
  faNewspaper,
  faPen,
} from "@fortawesome/free-solid-svg-icons";

export function computeStatus(obj = {}) {
  const { isSent, unsavedChanges, transcriptionstatus } = obj;

  if (!isSent && unsavedChanges) {
    return {
      key: "unsaved",
      label: "Sidan har redigerats",
      color: "bg-orange-500",
      icon: faAsterisk,
    };
  }
  if (isSent && transcriptionstatus === "published") {
    return {
      key: "published",
      label: "Sidan har publicerats",
      color: "bg-isof",
      icon: faNewspaper,
    };
  }
  if (isSent) {
    return {
      key: "sent",
      label: "Sidan har skickats",
      color: "bg-green-600",
      icon: faCheck,
    };
  }
  if (!isSent && transcriptionstatus === "transcribed") {
    return {
      key: "transcribed",
      label: "Sidan kontrolleras",
      color: "bg-gray-400",
      icon: faLock,
    };
  }
  if (!isSent && transcriptionstatus === "published") {
    return {
      key: "published",
      label: "Sidan har publicerats",
      color: "bg-isof",
      icon: faNewspaper,
    };
  }
  if (transcriptionstatus === "readytotranscribe") {
    return {
      key: "ready",
      label: "Sidan kan skrivas av",
      color: "bg-lighter-isof",
      icon: faPen,
    };
  }
  return null;
}
