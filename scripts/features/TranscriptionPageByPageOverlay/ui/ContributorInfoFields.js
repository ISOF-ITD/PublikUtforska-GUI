import { l } from "../../../lang/Lang";


const field =
  "w-full border border-gray-300 rounded-lg p-3 font-serif leading-relaxed " +
  "disabled:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-isof " +
  "focus:border-isof transition !mb-2";

export default function ContributorInfoFields({
  nameInput,
  emailInput,
  onChange,
  emailId,
  emailValid,
  onEmailBlur,
  disabled = false,
}) {
  return (
    <>
      {/* GDPR blurb */}
      <aside
        role="note"
        className="text-sm leading-relaxed space-y-1 bg-isof/5 p-3 rounded flex flex-col gap-2 !sm:mb-12"
      >
        <span>
          {l(
            "Vill du att vi anger att det är du som har skrivit av uppteckningen? Ange i så fall ditt namn och din e-postadress nedan. E-postadressen publiceras inte."
          )}
        </span>
        <span>
          {l("Vi hanterar personuppgifter enligt dataskyddsförordningen.")}{" "}
          <a
            href="https://www.isof.se/om-oss/behandling-av-personuppgifter.html"
            target="_blank"
            rel="noreferrer"
            className="underline text-isof font-semibold"
          >
            {l("Läs mer.")}
          </a>
        </span>
      </aside>

      <div className="flex flex-col gap-2" aria-disabled={disabled}>
        {/* Namn */}
        <div>
          <label htmlFor="transcription_name" className="font-semibold mb-1">
            {l("Ditt namn (frivilligt)")}
          </label>
          <input
            id="transcription_name"
            name="nameInput"
            autoComplete="name"
            type="text"
            value={nameInput}
            onChange={onChange}
            className={field}
            disabled={disabled}
          />
        </div>

        {/* E-post */}
        <div>
          <label
            htmlFor={emailId}
            className="font-semibold mb-1 leading-snug"
          >
            {l("Din e-postadress (frivilligt)")}
          </label>
          <input
            id={emailId}
            name="emailInput"
            autoComplete="email"
            type="email"
            value={emailInput}
            onChange={onChange}
            onBlur={onEmailBlur}
            aria-invalid={!emailValid}
            aria-describedby={!emailValid ? `${emailId}-help` : undefined}
            className={
              field + (emailValid ? "" : " border-red-500 focus:ring-red-500")
            }
            disabled={disabled}
          />
          {!emailValid && (
            <p
              id={`${emailId}-help`}
              className="mt-1 text-xs text-red-600"
              aria-live="polite"
            >
              {l("Ogiltig e-postadress")}
            </p>
          )}
        </div>
      </div>
    </>
  );
}
