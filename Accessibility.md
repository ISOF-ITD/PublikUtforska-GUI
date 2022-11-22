# Tillgänglighet

Se https://webbriktlinjer.se/riktlinjer/?filter=on&guidelineorder=a&freetext-filter=&query-vlwebb-wcag%5B%5D=304&query-vlwebb-wcag%5B%5D=305&query-vlwebb-target%5B%5D=280&query-vlwebb-target%5B%5D=279

|Symbol|Status|
|---|---|
|✔️|klar|
|🟡 |delvis OK|
|❌|ej godkänd|
|➖|ej relevant|
|❔|ej granskad|

|WCAG|Nivå|Riktlinje|Status|Kommentar|
|---|---|---|:---:|---|
|	1.3.1 | (A) |	[Ange i kod vad sidans olika delar har för roll](https://webbriktlinjer.se/riktlinjer/121-ange-i-kod-vad-sidans-olika-delar-har-for-roll/) | 🟡 | - R105. Skapa rubriker med h-element ✔️<br/> - R104. Använd rätt html-element när ni gör listor ✔️<br/>- R98. Skriv rubriker till tabeller✔️<br/>- R101. Markera obligatoriska fält i formulär ➖<br/>- Betona innehåll med elementet em och inte bara kursivering, eftersom det inte går att kursivera skärmläsarens tal. ✔️<br/>- Använd WAI-ARIA för sådant som inte går att uttrycka med vanlig html. ❔
|	1.3.2 | (A) |	[Presentera innehållet i en meningsfull ordning för alla](https://webbriktlinjer.se/riktlinjer/122-meningsfull-ordning/) | ✔️ |
|	1.3.3 | (A) |	[Gör inte instruktioner beroende av sensoriska kännetecken](https://webbriktlinjer.se/riktlinjer/123-ej-beroende-av-sensoriska-kannetecken/) | ✔️ |
|	1.3.4 | (AA) |	[Se till att allt innehåll presenteras rätt oavsett skärmens riktning](https://webbriktlinjer.se/riktlinjer/153-fungerar-oavsett-skarmens-riktning/) | ✔️ |
|	1.3.5 | (AA) |	[Märk upp vanliga formulärfält i koden](https://webbriktlinjer.se/riktlinjer/154-mark-upp-vanliga-formularfalt-i-koden/) | ✔️ |
|	1.4.1 | (A) |	[Använd inte enbart färg för att förmedla information](https://webbriktlinjer.se/riktlinjer/124-inte-bara-farg/) | ✔️ | Kunde inte hitta ställen där information förmedlas med färg
|	1.4.10 | (AA) |	[Skapa en flexibel layout som fungerar vid förstoring eller liten skärm](https://webbriktlinjer.se/riktlinjer/91-skapa-en-flexibel-layout/) | ✔️ |
|	1.4.11 | (AA) |	[Använd tillräckliga kontraster i komponenter och grafik](https://webbriktlinjer.se/riktlinjer/156-anvand-tillrackliga-kontraster-i-komponenter-och-grafik/) | ✔️ | verkar OK
|	1.4.12 | (AA) |	[Se till att det går att öka avstånd mellan tecken, rader, stycken och ord](https://webbriktlinjer.se/riktlinjer/157-avstand-mellan-tecken-rader-stycken-och-ord/) | ❌ | Problem med stora avstånd mellan rader och tecken: ![](Accessibility_files/1.png)  ![](Accessibility_files/2.png)
|	1.4.13 | (AA) |	[Popup-funktioner ska kunna hanteras och stängas av alla](https://webbriktlinjer.se/riktlinjer/158-popup-funktioner-ska-kunna-hanteras-och-stangas-av-alla/) | ❌ | Fungerar inte med de nuvarande popup-meddelanden, de stängs för snabbt (Se också 4.1.3): ![](Accessibility_files/3.png)
|	1.4.2 | (A) |	[Ge användaren möjlighet att pausa, stänga av eller sänka ljud](https://webbriktlinjer.se/riktlinjer/125-kunna-pausa-ljud/) | ✔️ |
|	1.4.3 | (AA) |	[Använd tillräcklig kontrast mellan text och bakgrund](https://webbriktlinjer.se/riktlinjer/126-tillrackliga-kontraster/) | ✔️ |
|	1.4.4 | (AA) |	[Se till att text går att förstora utan problem](https://webbriktlinjer.se/riktlinjer/127-se-till-att-text-gar-att-forstora-utan-problem/) | ✔️&nbsp;/&nbsp;🟡 | - Fungerar med moderna webbläsare som kan förstora/zooma hela sidan.<br/>- Att bara zooma text fungerar inte: ![](Accessibility_files/5.png) 
|	1.4.5 | (AA) |	[Använd text, inte bilder, för att visa text](https://webbriktlinjer.se/riktlinjer/128-anvand-text-inte-bilder-for-att-visa-text/) | ✔️ |
|	2.1.1 | (A) |	[Utveckla systemet så att det går att hantera med enbart tangentbordet](https://webbriktlinjer.se/riktlinjer/129-gar-att-hantera-med-tangentbord/) | ✔️ | 
|	2.1.2 | (A) |	[Se till att markören inte fastnar vid tangentbordsnavigation](https://webbriktlinjer.se/riktlinjer/130-se-till-att-markoren-inte-fastnar-vid-tangentbordsnavigation/) | ✔️ | 
|	2.1.4 | (A) |	[Skapa kortkommandon med varsamhet](https://webbriktlinjer.se/riktlinjer/68-skapa-snabbkommandon-for-viktiga-funktioner/) | ✔️ | Inga kortkommandon
|	2.2.1 | (A) |	[Ge användarna möjlighet att justera tidsbegränsningar](https://webbriktlinjer.se/riktlinjer/131-ge-anvandarna-mojlighet-att-justera-tidsbegransningar/) | ➖ |
|	2.2.2 | (A) |	[Ge användarna möjlighet att pausa eller stänga av rörelser](https://webbriktlinjer.se/riktlinjer/132-ge-anvandarna-mojlighet-att-pausa-eller-stanga-av-rorelser/) | ➖ |
|	2.3.1 | (A) |	[Orsaka inte epileptiska anfall genom blinkande](https://webbriktlinjer.se/riktlinjer/133-orsaka-inte-epileptiska-anfall-genom-blinkande/) | ✔️ |
|	2.4.1 | (A) |	[Erbjud möjlighet att hoppa förbi återkommande innehåll](https://webbriktlinjer.se/riktlinjer/75-gruppera-och-skapa-mojlighet-att-hoppa-forbi-delar-pa-sidorna/) | ➖ |
|	2.4.3 | (A) |	[Gör en logisk tab-ordning](https://webbriktlinjer.se/riktlinjer/136-gor-en-logisk-tab-ordning/) | ✔️ | 
|	2.4.5 | (AA) |	[Erbjud användarna flera olika sätt att navigera](https://webbriktlinjer.se/riktlinjer/32-erbjud-besokaren-alternativa-orienteringsstod/) | 🟡 | - Det finns en sökfunktion och kartan. Borde vi även införa en lista/tabell med alla uppteckningar uppdelade efter landskap/socken? Eller är det utanför kartans användningsområde?<br/>- Borde vi ha en FAQ (Vanliga frågor)?
|	2.4.7 | (AA) |	[Markera tydligt vilket fält eller element som är i fokus](https://webbriktlinjer.se/riktlinjer/140-markera-element-i-fokus/) | ✔️ |
|	2.5.1 | (A) |	[Erbjud alternativ till komplexa fingerrörelser](https://webbriktlinjer.se/riktlinjer/160-erbjud-alternativ-till-komplexa-fingerrorelser/) | ❌ | Lägg till pilknappar för att förflytta sig i olika riktningar på kartan!
|	2.5.2 | (A) |	[Gör det möjligt att ångra klick](https://webbriktlinjer.se/riktlinjer/161-gor-det-mojligt-att-angra-klick/) | ➖ | Isofs kartor har kanske inte några viktiga transaktioner enligt exemplen. I så fall finns inget att åtgärda och denna regel uppfylls.
|	2.5.3 | (A) |	[Se till att text på knappar och kontroller överensstämmer med maskinläsbara etiketter](https://webbriktlinjer.se/riktlinjer/162-mojliggor-roststyrning-av-knappar-och-kontroller/) | ❌ |
|	2.5.4 | (A) |	[Erbjud alternativ till rörelsestyrning](https://webbriktlinjer.se/riktlinjer/163-erbjud-alternativ-till-rorelsestyrning/) | ➖ |
|	3.1.1 | (A) |	[Ange sidans språk i koden](https://webbriktlinjer.se/riktlinjer/141-ange-sidans-sprak-i-koden/) | ✔️ | OBS: Vid inbäddning måste SiteVision erbjuda lang.
|	3.1.2 | (AA) |	[Ange språkförändringar i koden](https://webbriktlinjer.se/riktlinjer/142-ange-sprakforandringar-koden/) | ➖ | Berör redaktionen
|	3.2.1 | (A) |	[Utför inga oväntade förändringar vid fokusering](https://webbriktlinjer.se/riktlinjer/143-utfor-inga-ovantade-forandringar-vid-fokusering/) | ✔️ |
|	3.2.2 | (A) |	[Utför inga oväntade förändringar vid inmatning](https://webbriktlinjer.se/riktlinjer/144-utfor-inga-ovantade-forandringar-vid-inmatning/) | ✔️ |
|	3.2.3 | (AA) |	[Var konsekvent i navigation, struktur och utformning](https://webbriktlinjer.se/riktlinjer/29-var-konsekvent-i-navigation-struktur-och-utformning/) | ✔️ |
|	3.2.4 | (AA) |	[Benämn funktioner konsekvent](https://webbriktlinjer.se/riktlinjer/146-benamn-funktioner-konsekvent/) | ✔️ |
|	3.3.1 | (A) |	[Visa var ett fel uppstått och beskriv det tydligt](https://webbriktlinjer.se/riktlinjer/2-ge-begripliga-felmeddelanden/) | ❔ |
|	3.3.2 | (A) |	[Skapa tydliga och klickbara fältetiketter](https://webbriktlinjer.se/riktlinjer/55-skapa-tydliga-och-klickbara-faltetiketter/) | ✔️ |
|	3.3.3 | (AA) |	[Ge förslag på hur fel kan rättas till](https://webbriktlinjer.se/riktlinjer/149-ge-forslag-pa-hur-fel-kan-rattas-till/) | ➖ |
|	3.3.4 | (AA) |	[Ge möjlighet att ångra, korrigera eller bekräfta vid viktiga transaktioner](https://webbriktlinjer.se/riktlinjer/150-ge-mojlighet-att-angra-korrigera-eller-bekrafta-viktiga-transaktioner/) | ➖ |
|	4.1.1 | (A) |	[Se till att koden validerar](https://webbriktlinjer.se/riktlinjer/84-se-till-att-koden-validerar/) | 🟡 | [HTML validerar](https://validator.w3.org/nu/?doc=https%3A%2F%2Fwww.isof.se%2Fmatkult%2Fkartan.html), [CSS validerar inte](http://jigsaw.w3.org/css-validator/validator?uri=https%3A%2F%2Fwww.isof.se%2Fmatkult%2Fkartan.html&profile=css3svg&usermedium=all&warning=1&vextwarning=&lang=en)
|	4.1.2 | (A) |	[Se till att skräddarsydda komponenter fungerar i hjälpmedel](https://webbriktlinjer.se/riktlinjer/152-se-till-att-skraddarsydda-komponenter-fungerar-hjalpmedel/) | ✔️ | 
|	4.1.3 | (AA) |	[Se till att hjälpmedel kan presentera meddelanden som inte är i fokus](https://webbriktlinjer.se/riktlinjer/164-meddelanden-som-inte-ar-fokus/) | ❌ | Se också 1.4.13
