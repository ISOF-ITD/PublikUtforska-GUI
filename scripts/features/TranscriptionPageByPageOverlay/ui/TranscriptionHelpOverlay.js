import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { useState, useEffect } from "react";
import { IconButton } from "../../../components/IconButton";
import { l } from "../../../lang/Lang";

function TranscriptionHelpOverlay() {
  const [state, setState] = useState({
    visible: false,
    messageInputValue: '',
    nameInputValue: '',
    emailInputValue: '',
    messageSent: false,
  });

  useEffect(() => {
    if (window.eventBus) {
      const handleEventBus = (event) => {
        setState((prevState) => ({
          ...prevState,
          visible: true,
          type: event.target.type,
          title: event.target.title,
          url: event.target.url,
          appUrl: event.target.appUrl,
        }));
      };

      const handleOverlayHide = () => {
        setState((prevState) => ({ ...prevState, visible: false }));
      };

      window.eventBus.addEventListener('overlay.transcriptionhelp', handleEventBus);
      window.eventBus.addEventListener('overlay.hide', handleOverlayHide);

      // Cleanup function
      return () => {
        window.eventBus.removeEventListener('overlay.transcriptionhelp', handleEventBus);
        window.eventBus.removeEventListener('overlay.hide', handleOverlayHide);
      };
    }

    // only for eslint
    return () => {};
  }, []);

  const closeButtonClickHandler = () => {
    setState((prevState) => ({ ...prevState, visible: false }));
  };

  let overlayContent;
  if (state.messageSent) {
    overlayContent = (
      <div>
        <p>Meddelande skickat. Tack.</p>
        <p>
          <br />
          <IconButton
            icon={faXmark}
            label={l("Stäng")}
            tone="light"
            onClick={closeButtonClickHandler}
            className="absolute right-4 top-3"
          />
        </p>
      </div>
    );
  } else {
    overlayContent = (
      <div className="helptext">
        <p>
          Vill du hjälpa till att tillgängliggöra samlingarna? Här finns
          möjligheten att skriva av berättelser, t.ex. från en viss ort eller
          ett visst ämne. Detta gör inte bara berättelserna mer tillgängliga för
          fler personer utan möjliggör också fritextsökningar.
        </p>

        <p>
          <strong>Navigering på sidan</strong>
          <br />
          Transkribering sker en sida åt gången. När du har transkriberat en
          sida, tryck då på ”Skicka sida” och om det finns fler sidor i
          uppteckningen tas du till nästa transkriberbara sida. Du kan också
          välja sida att transkribera i listan under den valda sidan.
          <br />
          <br />
          Olika symboler betyder olika saker. En grön penna betyder att sidan
          går att transkribera. En orange asterisk betyder att du gjort
          ändringar på en sida. En grön bock betyder att sidan har
          transkriberats och skickats in. En mörkblå dokumentsymbol betyder att
          sidan är transkriberad och publicerad.
        </p>

        <p>
          <strong>Visa/dölj uppgifter om uppteckningen</strong>
          <br />
          I de fall uppteckningen består av en startsida för en
          uppteckningsblankett, öppnas dessa fält automatiskt. Varje textfält
          som ska fyllas i motsvarar en särskild rad i uppteckningen som du ser
          på höger sida. Ibland saknas text på vissa rader. Lämna då samma
          textfält tomt.
          <br />
          <br />
          Informationen som hör till berättaren börjar med fältet ”Berättat av”.
          I det textfältet skriver du in namnet på personen. Ibland kan det stå
          något mer direkt efter namnet, t.ex. namnet på en gård eller en ort.
          Ange den informationen i stället i fältet ”Fält under berättat av”.
          <br />
          Kortfattat kan man säga att all information om berättaren som inte är
          ett namn (Berättat av), ett födelseår (Född år), eller en födelseort
          (Född i) kan skrivas i fältet ”Fält under berättat av”.
          <br />
          <br />I de fall uppteckningen består av en sida med bara text, till
          exempel, öppnas inte dessa fält automatiskt. Vid behov kan du trycka
          på ”Visa” för att kunna fylla i till exempel en titel, om det finns en
          titel på sidan till höger.
        </p>

        <p>
          <strong>Transkribera text</strong>
          <br />
          Skriv av raderna exakt som de står, även med radbrytningar och
          stavfel. Överstrukna ord kan ignoreras. Om texten radbryts i
          uppteckningen, klicka då på Enter för att påbörja en ny rad i
          textfältet.
        </p>

        <p>
          <strong>Specialtecken eller landsmålsalfabet?</strong>
          <br />
          Ibland förekommer specialtecken i uppteckningarna. I den mån du kan,
          skriv även dessa tecken med i avskriften. Det kan till exempel vara ô,
          skrivet som ett o med ^ över.
          <br />
          Landsmålsalfabetet kan du läsa mer om{" "}
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://sok.folke.isof.se/?k=start/anvanda-folke/landsmalsalfabetet"
          >
            här
          </a>
          . När dessa fonetiska tecken förekommer i texten, skriv då{" "}
          <code>***</code> i stället för ordet ifråga. Bocka också i ”Innehåller
          landsmålsalfabetet eller andra fonetiska tecken”.
        </p>

        <p>
          <strong>Oläsliga ord?</strong>
          <br />
          Om du inte kan läsa något ord på uppteckningen, ange <code>
            ###
          </code>{" "}
          i stället för ordet ifråga. Är det flera ord bredvid varandra som inte
          kan tydas, skriv <code>###</code> för varje ord. Bocka också i ”Sidan
          innehåller svårtolkade eller oläsliga ord”.
        </p>

        <p>
          <strong>Text i marginalen?</strong>
          <br />
          Ibland har upptecknaren fortsatt på en mening nedanför raderna på
          blanketten. Skriv med det i textfältet. Övriga ord eller tecken som
          ligger i marginalerna men som inte hör till själva uppteckningen,
          behöver du inte transkribera. Däremot kan du skriva med marginaltexten
          som en kommentar till uppteckningen.
        </p>

        <p>
          <strong>Sidnummer</strong>
          <br />
          Ange korrekt sidnummer som står på uppteckningen till höger.
        </p>

        <p>
          <strong>Zooma</strong>
          <br />
          Vill du se ännu tydligare vad det står i uppteckningen? Det går bra
          att zooma in och ut. Använd zoom-funktionen i övre vänstra hörnet och
          flytta fokus på sidan genom att röra muspekaren.
        </p>

        <p>
          <strong>Vilka är personerna som nämns i texten?</strong>
          <br />
          Känner du till någon av personerna som omnämns i uppteckningen och har
          du eventuellt fotografier eller liknande? Kontakta oss via knappen
          &quot;Vet du mer&quot; ovanför uppteckningen. Du kan även välja att
          skriva en kommentar om personen i kommentarsfältet.
        </p>

        <p>
          <strong>Kommentar till avskriften</strong>
          <br />
          Har du stött på något problem med avskriften eller har du någon annan
          kommentar till den? Skriv då i kommentarsfältet.
        </p>

        <p>
          <strong>Ange namn och e-postadress?</strong>
          <br />
          Om du vill får du gärna ange namn och e-postadress, men det är helt
          frivilligt. I de fall du anger din e-postadress kan vi komma att
          kontakta dig.
        </p>

        <p>
          <strong>Vad händer efter att du tryckt på ”Skicka in?”</strong>
          <br />
          Efter kvalitetssäkring kommer texten sedan att publiceras på Folke och
          införlivas i Isofs digitala arkiv.
        </p>
      </div>
    );
  }

  return (
    <div className={`overlay-container z-[3100] ${state.visible ? ' visible' : ''}`}>
      <div className="overlay-window">
        <div className="overlay-header">
          {l("Instruktioner")}
          <IconButton
            icon={faXmark}
            label={l("Stäng")}
            tone="light"
            onClick={closeButtonClickHandler}
            className="absolute right-4 top-3"
          />
        </div>
        {overlayContent}
      </div>
    </div>
  );
}

export default TranscriptionHelpOverlay;
