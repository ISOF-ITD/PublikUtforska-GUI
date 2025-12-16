import { faXmark } from "@fortawesome/free-solid-svg-icons";
import classNames from "classnames";
import React, {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useLocation, Link } from "react-router-dom";
import config from "../../config";
import { l } from "../../lang/Lang";
import { toastOk, toastError } from "../../utils/toast";
import { IconButton } from "../IconButton";

/**
 * Drop‑in modal with focus management, ESC + backdrop close,
 * scroll lock and createPortal. No external deps.
 */
function Modal({ open, onClose, titleId, descId, children, className }) {
  const dialogRef = useRef(null);
  const restoreFocusRef = useRef(null);

  // Ensure a portal root exists
  const modalRoot = useMemo(() => {
    let root = document.getElementById("modal-root");
    if (!root) {
      root = document.createElement("div");
      root.id = "modal-root";
      document.body.appendChild(root);
    }
    return root;
  }, []);

  // Lock body scroll + restore focus
  useEffect(() => {
    if (!open) return;

    // save focus
    restoreFocusRef.current = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // autofocus first control
    const node = dialogRef.current;
    const focusables = node?.querySelectorAll(
      'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])'
    );
    focusables?.[0]?.focus?.();

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose?.();
        return;
      }
      if (e.key === "Tab" && node) {
        const els = Array.from(
          node.querySelectorAll(
            'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])'
          )
        ).filter(
          (el) => !el.hasAttribute("disabled") && el.offsetParent !== null
        );
        if (els.length === 0) return;
        const first = els[0];
        const last = els[els.length - 1];
        const active = document.activeElement;
        if (e.shiftKey && active === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
      restoreFocusRef.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  const onBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose?.();
  };

  return createPortal(
    <div
      className={classNames(
        "overlay-container visible",
        "grid place-items-center fixed inset-0 p-4",
        "bg-[rgba(0,0,0,.5)] backdrop-blur-[2px]"
      )}
      onMouseDown={onBackdropClick}
      role="presentation"
    >
      <div
        ref={dialogRef}
        className={classNames(
          "overlay-window relative w-full max-w-[46rem] max-h-[90vh] overflow-auto",
          "bg-white rounded-md shadow-[0_10px_30px_rgba(0,0,0,.25)]",
          "focus:outline-none",
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    modalRoot
  );
}

export default function ContributeInfoOverlay() {
  /* ─── Modal + form state */
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [nameInput, setNameInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [emailValid, setEmailValid] = useState(true);

  // context passed from the event
  const [ctx, setCtx] = useState({
    type: "",
    title: "",
    country: "",
    url: "",
    appUrl: "",
    id: "",
  });

  /* ─── Accessibility ids */
  const titleId = useId();
  const descId = useId();
  const emailId = useId();
  const nameId = useId();
  const msgId = useId();

  const location = useLocation();

  /* ─── Derived state */
  const wordCount = useMemo(
    () => (messageInput.trim() ? messageInput.trim().split(/\s+/).length : 0),
    [messageInput]
  );
  const validateEmail = useCallback(
    (email) => email === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    []
  );
  const minWords = 2;
  const formValid = wordCount >= minWords && validateEmail(emailInput);

  /* ─── Open/close helpers */
  const ctxRef = useRef(ctx);
  useEffect(() => {
    ctxRef.current = ctx;
  }, [ctx]);

  const openWith = useCallback((payload) => {
    setCtx((prev) => ({ ...prev, ...payload }));
    setOpen((prev) => {
      const switchingRecord = payload?.id && payload.id !== ctxRef.current?.id;
      if (!prev || switchingRecord) {
        setNameInput("");
        setEmailInput("");
        setMessageInput("");
        setEmailValid(true);
        setErrorMsg("");
      }
      return true;
    });
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setSending(false);
    setErrorMsg("");
  }, []);

  /* ─── Event bus integration */
  useEffect(() => {
    const onOpen = (event) => {
      const src = event?.detail ?? event?.target ?? {};
      openWith({
        type: src.type ?? "",
        title: src.title ?? "",
        country: src.country ?? "",
        url: src.url ?? "",
        appUrl: src.appUrl ?? "",
        id: src.id ?? "",
      });
    };
    const onHide = () => close();

    if (window.eventBus) {
      window.eventBus.addEventListener("overlay.contributeinfo", onOpen);
      window.eventBus.addEventListener("overlay.hide", onHide);
    }
    return () => {
      if (window.eventBus) {
        window.eventBus.removeEventListener("overlay.contributeinfo", onOpen);
        window.eventBus.removeEventListener("overlay.hide", onHide);
      }
    };
  }, [openWith, close]);

  /* ─── Submit */
  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (!formValid || sending) return;

    setSending(true);
    setErrorMsg("");

    let subject = ctx.appUrl || window.location.origin || "";
    if (subject.endsWith("/")) subject = subject.slice(0, -1);

    const data = {
      from_email: emailInput,
      from_name: nameInput,
      subject: `${subject.split(/[/]+/).pop()}: ContributeInfo`,
      recordid: ctx.id,
      message:
        `${ctx.type}: ${ctx.title}\n${location.pathname}\n\n` +
        `Från: ${nameInput || l("Anonym")} (${
          emailInput || l("ingen e-post")
        })\n\n` +
        `${messageInput}`,
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000); // safety timeout

    try {
      const formData = new FormData();
      formData.append("json", JSON.stringify(data));

      const res = await fetch(`${config.restApiUrl}feedback/`, {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const ok = json?.success === true || json?.success === "true";

      if (ok) {
        toastOk(l("Tack för ditt bidrag. Meddelandet skickat."));
        close();
      } else {
        setErrorMsg(
          l(
            "Något gick fel. Meddelandet kunde inte skickas. Vänligen försök senare, eller kontakta oss på folke@isof.se."
          )
        );
        toastError(
          l(
            "Något gick fel. Meddelandet kunde inte skickas. Vänligen försök senare, eller kontakta oss på folke@isof.se."
          )
        );
      }
    } catch (err) {
      if (err?.name !== "AbortError") {
        setErrorMsg(
          l(
            "Något gick fel. Meddelandet kunde inte skickas. Vänligen försök senare, eller kontakta oss på folke@isof.se."
          )
        );
        toastError(
          l(
            "Något gick fel. Meddelandet kunde inte skickas. Vänligen försök senare, eller kontakta oss på folke@isof.se."
          )
        );
      }
    } finally {
      clearTimeout(timeout);
      setSending(false);
    }
  };

  const handleEmailBlur = (e) => setEmailValid(validateEmail(e.target.value));

  /* ─── UI */
  const headerTitleId = titleId; // alias for readability
  const headerDescId = descId;

  return (
    <Modal
      open={open}
      onClose={close}
      titleId={headerTitleId}
      descId={headerDescId}
    >
      <div className="overlay-header m-0 p-0">
        <div className="flex items-center justify-between !m-0 bg-center text-white font-bold text-[1.2rem] rounded-t-md">
          <h2 id={headerTitleId} className="m-0">
            {l("Vet du mer?")}
          </h2>
          <IconButton
            icon={faXmark}
            label={l("stäng")}
            tone="light"
            onClick={close}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="">
        {/* Intro / description */}
        <span id={headerDescId}>
          {config.siteOptions.contributeInfoText ||
            l(
              "Känner du till någon av personerna som nämns eller har mer sammanhang? " +
                "Kontakta oss gärna! Vill du hjälpa till mer? På Institutets webbplats publiceras frågelistor."
            )}
          &nbsp;
          <a
            href="https://www.isof.se/folkminnen/beratta-for-oss.html"
            target="_blank"
            rel="noreferrer"
            className="!mb-4"
          >
            <strong>{l("Läs mer.")}</strong>
          </a>
        </span>
        {/* Inline status */}
        {errorMsg && (
          <div
            className="mb-4 rounded border border-red-200 bg-red-50 text-red-800 px-3 py-2"
            role="status"
            aria-live="polite"
          >
            {errorMsg}
          </div>
        )}

        {/* Name */}
        <label htmlFor={nameId} className="block font-medium !mt-4">
          {l("Ditt namn (frivilligt)")}
        </label>
        <input
          id={nameId}
          name="name"
          autoComplete="name"
          className="u-full-width w-full mb-3"
          type="text"
          value={nameInput}
          disabled={sending}
          onChange={(e) => setNameInput(e.target.value)}
        />

        {/* Email */}
        <label htmlFor={emailId} className="block font-medium">
          {l("Din e-postadress (frivilligt)")}
        </label>
        <input
          id={emailId}
          name="email"
          autoComplete="email"
          className={classNames(
            "u-full-width w-full",
            !emailValid && "invalid"
          )}
          type="email"
          value={emailInput}
          disabled={sending}
          onChange={(e) => {
            setEmailInput(e.target.value);
            if (!emailValid) setEmailValid(true);
          }}
          onBlur={handleEmailBlur}
          aria-invalid={!emailValid}
          aria-describedby={!emailValid ? `${emailId}-help` : undefined}
        />
        <div className="min-h-[1.25rem]">
          {!emailValid && (
            <span
              id={`${emailId}-help`}
              className="form-help error"
              aria-live="polite"
            >
              {l("Ogiltig e-postadress")}
            </span>
          )}
        </div>

        {/* Message */}
        <div className="flex items-baseline justify-between">
          <label htmlFor={msgId} className="block font-medium">
            {l("Meddelande")}
          </label>
        </div>
        <textarea
          id={msgId}
          name="message"
          lang="sv"
          spellCheck="false"
          className="u-full-width w-full"
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          rows={6}
          required
          disabled={sending}
          aria-describedby={wordCount < minWords ? `${msgId}-help` : undefined}
        />

        {/* SR-only live status for sending */}
        <span className="sr-only" aria-live="polite">
          {sending ? l("Skickar…") : ""}
        </span>

        {/* GDPR blurb */}
        <aside role="note" className="form-help mb-4">
          <span>
            {l("Vi hanterar personuppgifter enligt dataskyddsförordningen.")}
            &nbsp;
            <a
              href="https://www.isof.se/om-oss/behandling-av-personuppgifter.html"
              target="_blank"
              rel="noreferrer"
            >
              {l("Läs mer.")}
            </a>
          </span>
        </aside>

        {/* Actions */}
        <div className="mt-2 flex w-full justify-end gap-2 items-center">
          <button
            type="button"
            className="button-secondary"
            onClick={close}
            disabled={sending}
          >
            {l("Avbryt")}
          </button>
          <button
            className={classNames(
              "primary",
              !formValid && "hover:cursor-not-allowed"
            )}
            type="submit"
            disabled={!formValid || sending}
            aria-busy={sending || undefined}
            title={
              !formValid
                ? l("Knappen aktiveras när du har skrivit minst två ord.")
                : undefined
            }
          >
            {sending ? l("Skickar…") : l("Skicka")}
          </button>
        </div>
      </form>
    </Modal>
  );
}
