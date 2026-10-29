# Matkult i Folke – lägesanteckning, 2026-10-29

Den andra etappen är redo för lokal utvärdering: redaktionellt innehåll från Sitevision och en karta bredvid temastarten. Arbetet sparas på samma frontendbranch som första etappen. Ingen driftsättning eller push har gjorts.

## Senaste ändring: Matkult i sidhuvudet

- Gemensam `MatkultHeaderLink` med besticksikon och synlig Matkult-text i sök-/kartvyn, detaljsidornas header och introduktionen. Den ersätter raden "Upptäck Matkult – recept och berättelser om mat".
- Ingången är 44 px hög, har en diskret ram och använder befintlig tangentbordsmarkering. Aktivt tema följer Matkults färgtokens; `aria-current=page` används bara på `/matkult`.
- Kontrollgruppen kan radbrytas under logotyperna. Texten behålls på mobil. Kategorinavigationen finns kvar, och länken i introduktionen stänger introduktionen.
- Den överflödiga "Utforska Matkult"-länken i temastartens header har tagits bort enligt användarens återkoppling. Detaljsidornas återgång till sökresultaten finns kvar.
- Verifierat med 32 tester i fyra relevanta Jest-sviter. Lintjämförelse mot föregående commit visar inga tillkommande fel; ett äldre oanvänt importnamn i IntroOverlay är lämnat orört.
- Webbläsarkontroll i ljust läge vid 320, 390 och 1 440 px: synlig text, mobil radbrytning, 44 px klickyta samt aktiv temamarkering. Beräknad textkontrast är 8,59:1 normalt/ljust, 5,89:1 normalt/mörkt, 10,65:1 aktivt/ljust och 10,75:1 aktivt/mörkt.
- Visuell kontroll i mörkt läge kunde inte slutföras: datorverktyget stoppade Firefox-kontrollen eftersom URL-policyhantering inte stöds där. Ingen ändring av systemets färgtema har gjorts.

## Brancher

- PublikUtforska-GUI: `codex/matkult-temaplats`.
- sagendatabas_es_api: `codex/matkult-category-match`.
- Backendens befintliga otrackade fil har lämnats orörd.

## Implementerat

- `/matkult`: egen temastart med dagens recept, kategorier och redaktionella ingångar. Dagens recept roterar per kalenderdag i Stockholm mellan fyra utvalda riktiga post-ID:n; innehållet hämtas från Folkeservice.
- `theme=matkult` behåller sammanhanget genom sökning, karta, detaljvisning och återgång. Matkult använder publicerade `type=matkarta` utan Folkes grundkrav på media eller accessionsposter.
- Folkes riktiga karta används även för Matkult. Lista och karta har samma sökning och kategoriurval, och befintliga kartkontroller återanvänds. Temastarten visar dessutom en fast kartspalt till höger från 1 440 px, samma brytpunkt och spaltbredd som Folkes delade sökvy. Den använder root-loaderns redan hämtade urval. På smalare skärmar monteras ingen startkarta; länken till helkartan finns kvar.
- Kokboken har egna underkategorier, enligt Matkartans befintliga kategoriuppsättning. Köttrecept är `category=MK-10,MK-12`. Underkategorin går att rensa utan att lämna kokboken, och råvaran följer med när man öppnar kokboken från en råvarukategori.
- Recept och berättelser med `sitevision_url` hämtar nu artikelns HTML direkt från Matkult.se och visar formatering, bilder, bildtexter och bilagelänkar med Folkes egna stilar. Indextext från `metadata[type=matkarta_content]`, sedan text/contents, finns som reserv under laddning och vid fel. Källhänvisning fungerar även utan Folkes accessionsfält. Källänkar öppnar Matkult.se; delningslänkar behåller temat.
- Matkult-poster utan uttryckligt licensfält får ingen automatiskt tillskriven CC BY 4.0-licens. Vyn visar att uppgiften saknas och länkar till originalsidan. Uttryckliga licenser och Folkes vanliga standardlicens behålls.
- Textposternas resultatkort får kompakta höjder och utdrag där indexet har text.
- Ort- och personsidor behåller Matkult-urvalet. Ortsidan visar inte en extra lista med hela Folkes accessioner under Matkult-rubriken.
- Sparade ID:n kan omfatta både Matkult- och Folke-material. Sökförslag använder rätt samling.
- Den dolda introduktionsiframen monteras inte i Matkult. Folkes allmänna statistik visas inte som om den gällde Matkult.

## API och driftsättningsordning

Den nu driftsatta tjänsten tolkar kommaseparerade kategorier som OR. Därför kräver korrekta receptunderkategorier backendändringen på `codex/matkult-category-match`.

Det nya API-valet är `category_match=all`. Det kräver samtliga kategorier, med samma querybyggare för dokument, antal och socknar. Utan valet behåller befintliga klienter sin OR-semantik. Svaret bekräftar stödet med `metadata.category_match = "all"`.

Frontend skickar valet för kombinerade Matkult-kategorier och kontrollerar bekräftelsen. Ett äldre API ger ett begripligt felmeddelande och tömmer träffarna; dess union visas inte som köttrecept. Vanliga kategorier och Alla recept fungerar mot nuvarande API.

1. Driftsätt och verifiera backend i testmiljön först.
2. Kontrollera `documents`, `count` och `socken` med `type=matkarta&publishstatus=published&category=MK-10,MK-12&category_match=all`. Alla svar ska bekräfta AND-urvalet; listans poster ska ha båda kategorierna.
3. Driftsätt frontend i testmiljön och prova sökning, kategori, karta, ort, post och återgång.
4. Utvärdera lösningen innan beslut om nästa etapp eller produktionssättning.

Historisk kontroll mot live-API:t vid arbetets start gav 1 112 recept, 212 köttposter och 1 256 poster vid OR. Motsvarande snitt skulle då vara 68. Antalen är en ögonblicksbild, inte en hårdkodad förväntan.

## Sitevision-hämtningen

- Dagens Matkarta använder `.pagecontent` i den publicerade Sitevision-sidan. Samma avgränsning används här; om den saknas visas reservtexten, aldrig hela sidans navigation eller en inloggningssida.
- Sidan hämtas med CORS utan cookies. Endast HTTPS på `www.matkult.se` och `matkult.se` godtas som artikelkälla. Användaruppgifter i URL:en och andra portar godtas inte.
- Den befintliga `sanitize-html`-modulen används före DOM-tolkningen och igen efter normaliseringen. Skript, formulär, iframes, stilar, händelseattribut och CMS-klasser följer inte med. Bilder begränsas till Matkults `/images/` och relativa bild-/PDF-länkar görs absoluta.
- Bildtexter normaliseras till figure/figcaption. Responsiva bildkällor och lazy loading används. Den dubblerade sidtiteln tas bort, artikelrubriker får nivåer under Folkes h2 och länkar märks för nytt fönster.
- Hämtningen avbryts vid postbyte eller efter tio sekunder. Sena svar från föregående post ignoreras. Vid fel finns lästext, originallänk och nytt försök.
- Detta behåller ett runtimeberoende till Matkult.se. Innehållet lagras inte som en ny kopia i indexet, och sökningen baseras fortfarande på indextexten. Dynamiska CMS-widgetar ingår inte. Hela beståndets innehållsparitet är ännu inte verifierad.

## Verifierat

- Senaste helkörningen av frontendens Jest-samling: 43 sviter, 503 tester, passerar. Den efterföljande licensrättningen verifierades separat: två sviter och 48 tester, inklusive tre nya licenstester. Befintlig testkonfiguration har kompletterats så att de riktiga ESM-parsermodulerna i `sanitize-html` kan testas utan att HTML-rensningen mockas bort.
- Backendens unittest-samling utan Django eller live-ES: 16 tester passerar. Omfattar OR/AND, kategoriernas skiftläge, publicerings-/typfilter samt API-bekräftelsen.
- Produktionsbygget passerar. Tre Webpack-varningar kvarstår: vendorfil cirka 499 KiB, första laddningen cirka 781 KiB samt rekommendation om separat runtime-chunk. Ingen ändring av produktionsbyggkonfigurationen ingår här.
- Nya filer och ändrad app-/sidlayout lintar rent. Äldre lintfel i berörda legacyfiler har lämnats utanför uppdraget.
- `git diff --check` passerar i båda reporna.
- Webbläsare med riktiga API-data: startsida och receptläsning, kokbok, skydd mot äldre API vid kombinationsfilter, karta med 2 711 poster / 716 platser, tangentbordsval av kartplats och ortens Matkult-lista. Den nya startkartan är kontrollerad vid 1 600 px och ligger kvar vid rullning; tangentbordsval öppnar ort med tema och kartåtergång.
- Formaterad hämtning verifierad för Fläskpannkaka från Gårdstånga samt berättelsen "Medan mesostgrytan kokar…". Den senare visar 14 bilder och 14 bildtexter och innehåller inga skript/iframes/formulär i den importerade artikeln.
- Mobilbredd 390 px kontrollerad för start, resultat och den nya bildartikeln, utan horisontell sidskroll. Startens kartspalt är dold och kartan omonterad. Kategorier testas också med tangentbord i Jest.
- Nya text-/bakgrundskombinationer och knappar har beräknad kontrast över 4,5:1 i både ljusa och mörka tokens. Mörkt läge har ännu inte granskats visuellt i en webbläsare.

## Nästa utvärdering

- Börja med `http://127.0.0.1:8091/matkult` och flödet dagens recept → kokboken → karta → ort → post → tillbaka.
- Kombinationsfilter behöver först backendens testdriftsättning enligt ovan. Den lokala servern använder fortfarande nuvarande publika Folkeservice.
- Bedöm receptens läsbarhet och startens delade layout. Kontrollera fler verkliga Sitevision-mallar, bildtexter och bilagor. Hela innehållsbeståndet behöver inventeras innan avveckling.
- Utöka och förankra urvalet för dagens recept och de redaktionella ingångarna.
- Granska mörkt läge visuellt, fler mobilbredder och ett bredare urval verkliga poster.
- Planera därefter gamla Matkarta-länkar, favoriter, innehållsinventering och avveckling. De ingår ännu inte i denna etapp.

## Lokal server och verktyg

Utvecklingsservern är startad på port 8091. Efter en ny omstart körs följande från PublikUtforska-GUI, med den bundlade Node-binären:

`C:\Users\ricsi850\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe node_modules/webpack-cli/bin/cli.js serve --config webpack.dev.js --host 127.0.0.1 --port 8091`

Git-kommandon kan behöva lokalt `-c safe.directory=C:/Users/ricsi850/proj/PublikUtforska-GUI` respektive motsvarande backend-sökväg. Ändra inte global Git-konfiguration.
