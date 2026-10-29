# Matkult i Folke – första kodetappen, 2026-10-29

Arbetet återupptogs efter datoromstarten. Den första etappen är redo för lokal utvärdering. Ingen driftsättning eller push har gjorts.

## Brancher

- PublikUtforska-GUI: `codex/matkult-temaplats`.
- sagendatabas_es_api: `codex/matkult-category-match`.
- Backendens befintliga otrackade fil har lämnats orörd.

## Implementerat

- `/matkult`: egen temastart med dagens recept, kategorier och redaktionella ingångar. Dagens recept roterar per kalenderdag i Stockholm mellan fyra utvalda riktiga post-ID:n; innehållet hämtas från Folkeservice.
- `theme=matkult` behåller sammanhanget genom sökning, karta, detaljvisning och återgång. Matkult använder publicerade `type=matkarta` utan Folkes grundkrav på media eller accessionsposter.
- Folkes riktiga karta används även för Matkult. Lista och karta har samma sökning och kategoriurval, och befintliga kartkontroller återanvänds.
- Kokboken har egna underkategorier, enligt Matkartans befintliga kategoriuppsättning. Köttrecept är `category=MK-10,MK-12`. Underkategorin går att rensa utan att lämna kokboken, och råvaran följer med när man öppnar kokboken från en råvarukategori.
- Recept och berättelser visar tillgänglig lästext från `metadata[type=matkarta_content]`, med text/contents som reserv. Källhänvisning fungerar även utan Folkes accessionsfält. Källänkar öppnar Matkult.se; delningslänkar behåller temat.
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

## Verifierat

- Hela frontendens Jest-samling: 41 sviter, 486 tester, passerar.
- Backendens unittest-samling utan Django eller live-ES: 16 tester passerar. Omfattar OR/AND, kategoriernas skiftläge, publicerings-/typfilter samt API-bekräftelsen.
- Produktionsbygget passerar. Tre Webpack-varningar kvarstår: vendorfil cirka 499 KiB, första laddningen cirka 776 KiB samt rekommendation om separat runtime-chunk. Ingen ändring av byggkonfigurationen ingår här.
- Nya filer lintar rent. Jämförelse med HEAD för alla 33 ändrade/nya JS-filer hittade inga tillkommande lintfel; äldre lintfel i berörda legacyfiler har lämnats utanför uppdraget.
- `git diff --check` passerar i båda reporna.
- Webbläsare med riktiga API-data: startsida och receptläsning, kokbok, skydd mot äldre API vid kombinationsfilter, karta med 2 711 poster / 716 platser, tangentbordsval av kartplats och ortens Matkult-lista.
- Mobilbredd 390 px kontrollerad för start och resultat, utan horisontell sidskroll. Kategorier testas också med tangentbord i Jest.
- Nya text-/bakgrundskombinationer och knappar har beräknad kontrast över 4,5:1 i både ljusa och mörka tokens. Mörkt läge har ännu inte granskats visuellt i en webbläsare.

## Nästa utvärdering

- Börja med `http://127.0.0.1:8091/matkult` och flödet dagens recept → kokboken → karta → ort → post → tillbaka.
- Kombinationsfilter behöver först backendens testdriftsättning enligt ovan. Den lokala servern använder fortfarande nuvarande publika Folkeservice.
- Bedöm receptens läsbarhet. Indexet har både platt text och radbruten text; full receptstruktur, bilder och CMS-innehåll behöver en egen innehållsetapp.
- Utöka och förankra urvalet för dagens recept och de redaktionella ingångarna.
- Granska mörkt läge visuellt, fler mobilbredder och ett bredare urval verkliga poster.
- Planera därefter gamla Matkarta-länkar, favoriter, innehållsinventering och avveckling. De ingår ännu inte i denna etapp.

## Lokal server och verktyg

Utvecklingsservern är startad på port 8091. Efter en ny omstart körs följande från PublikUtforska-GUI, med den bundlade Node-binären:

`C:\Users\ricsi850\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe node_modules/webpack-cli/bin/cli.js serve --config webpack.dev.js --host 127.0.0.1 --port 8091`

Git-kommandon kan behöva lokalt `-c safe.directory=C:/Users/ricsi850/proj/PublikUtforska-GUI` respektive motsvarande backend-sökväg. Ändra inte global Git-konfiguration.
