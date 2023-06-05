import React, { useState, useEffect } from 'react';

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
          <button className="button-primary" onClick={closeButtonClickHandler}>Stäng</button>
        </p>
      </div>
    );
  } else {
    overlayContent = (
      <div className="helptext">
        <p>Vill du hjälpa till att tillgängliggöra samlingarna? Här finns möjligheten att skriva av berättelser, t.ex. från en viss ort eller ett visst ämne. Detta gör inte bara berättelserna mer tillgängliga för fler personer utan möjliggör också fritextsökningar.</p>

        <p>
          <strong>Vilken information i vilken ruta? </strong>
          <br />
          Varje textfält som ska fyllas i motsvarar en särskild rad i uppteckningen som du ser på höger sida. Ibland saknas text på vissa rader. Lämna då samma textfält tomt.
        </p>

        <p>
          <strong>Om berättaren</strong>
          <br />
          Informationen som hör till berättaren börjar med fältet ”Berättat av”. I det textfältet skriver du in namnet på personen. Ibland kan det stå något mer direkt efter namnet, t.ex. namnet på en gård eller en ort. Ange den informationen istället i fältet ”Fält under berättat av”.
          <br />
          Kortfattat kan man säga att all information om berättaren som inte är ett namn (Berättat av), ett födelseår (Född år), eller en födelseort (Född i) kan skrivas i fältet ”Fält under berättat av”.
        </p>

        <p>
          <strong>Oläsliga ord?</strong>
          <br />
          Om du inte kan läsa något ord på uppteckningen, ange
          {' '}
          <code>###</code>
          {' '}
          istället för ordet ifråga. Är det flera ord bredvid varandra som inte kan tydas, skriv
          <code>###</code>
          {' '}
          för varje ord.
        </p>

        <p>
          <strong>Ny rad?</strong>
          <br />
          Skriv av raderna exakt som de står, även med radbrytningar och stavfel. Överstrukna ord kan ignoreras. Om texten radbryts i uppteckningen, klicka då på Enter för att påbörja en ny rad i textfältet.
        </p>

        <p>
          <strong>Specialtecken?</strong>
          <br />
          Ibland förekommer specialtecken i uppteckningarna. I den mån du kan, skriv även dessa tecken med i avskriften. Det kan till exempel vara ô, skrivet som ett o med ^ över.
        </p>

        <p>
          <strong>Text i marginalen?</strong>
          <br />
          Ibland har upptecknaren fortsatt på en mening nedanför raderna på blanketten. Skriv med det i textfältet. Övriga ord eller tecken som ligger i marginalerna men som inte hör till själva uppteckningen, behöver du inte transkribera. Däremot kan du skriva med marginaltexten som en kommentar till uppteckning.
        </p>

        <p>
          <strong>Flera sidor?</strong>
          <br />
          Består uppteckningen av flera sidor skriver du in samtliga sidor i samma textruta, men markera när du börjar skriva på en annan sida med tecknet
          {' '}
          <code>/</code>
          {' '}
          (snedstreck). Tryck på Enter innan och efter
          <code>/</code>
          . Snedstrecket ska alltså stå ensamt på en egen rad.
          <br />
          {' '}
          Sidorna ligger som en lista under den aktuella sidan. Tryck på en sida för att förstora.
        </p>

        <p>
          <strong>Zooma</strong>
          <br />
          Vill du se ännu tydligare vad det står i uppteckningen? Det går bra att zooma in och ut. Använd zoom-funktionen i övre vänstra hörnet och flytta fokus på sidan genom att röra muspekaren.
        </p>

        <p>
          <strong>Vilka är personerna som nämns i texten?</strong>
          <br />
          Känner du till någon av personerna som omnämns i uppteckningen och har du eventuellt fotografier eller liknande? Kontakta oss via knappen "Vet du mer" ovanför uppteckningen. Du kan även välja att skriva en kommentar om personen i kommentarsfältet.
        </p>

        <p>
          <strong>Kommentar till avskriften</strong>
          <br />
          Har du stött på något problem med avskriften eller har du någon annan kommentar till den? Skriv då i kommentarsfältet.
        </p>

        <p>
          <strong>Vad händer efter att du tryckt på ”Skicka in?”</strong>
          <br />
          Efter kvalitetssäkring kommer texten sedan att publiceras på Folke och införlivas i Isofs digitala arkiv.
        </p>

        <p><a href="https://www.isof.se/arkiv-och-insamling/digitala-arkivtjanster/folke/transkribera"><strong>{l('Läs mer om att skriva av.')}</strong></a></p>
      </div>
    );
  }

  return (
    <div className={`overlay-container feedback-overlay-container${state.visible ? ' visible' : ''}`}>
      <div className="overlay-window">
        <div className="overlay-header">
          {l('Instruktioner')}
          <button title="stäng" className="close-button white" onClick={closeButtonClickHandler} type='button' />
        </div>
        {overlayContent}
      </div>
    </div>
  );
}

export default TranscriptionHelpOverlay;
