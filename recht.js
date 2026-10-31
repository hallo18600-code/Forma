// Rechtstexte (Impressum + Datenschutz) – EINE Quelle für die App und für die Webseiten
// impressum.html / datenschutz.html (die brauchen Apple und Google als Link).
// Anbieter-Angaben hier zentral pflegen.
// strasse/ort: KEINE Wohnadresse eintragen. Sobald es eine Adresse von einem Impressum-Service gibt,
// hier eintragen (z. B. strasse:"c/o Firma XY, Musterstr. 1", ort:"12345 Stadt"). Leere Felder werden nicht angezeigt.
const ANBIETER={ name:"Simon Spieß", strasse:"", ort:"", land:"Deutschland", mail:"health.maxxing10@gmail.com" };
const anbieterHtml=()=>[ANBIETER.name,ANBIETER.strasse,ANBIETER.ort,ANBIETER.land].filter(Boolean).join("<br>");
// Läuft das hier als installierte Store-App (Capacitor) oder im Browser?
const istStoreApp=()=>!!(window.Capacitor&&window.Capacitor.isNativePlatform&&window.Capacitor.isNativePlatform());
const rechtLi=(t,d)=>`<div class="li"><b>${t}</b><div class="sub">${d}</div></div>`;
const okBtn=inApp=>inApp?`<div class="gap"></div><button class="pill primary" data-act="close">OK</button>`:"";

// Impressum (Angaben nach § 5 DDG)
function impressumSheet(inApp=true){
  const li=rechtLi;
  return `<h2>Impressum</h2>
    ${li("Anbieter",anbieterHtml())}
    ${li("Kontakt","E-Mail: "+ANBIETER.mail)}
    ${li("Verantwortlich für den Inhalt",ANBIETER.name+(ANBIETER.strasse?", Anschrift wie oben":""))}
    ${li("Produktdaten","Teils aus Open Food Facts (© Open Food Facts-Mitwirkende, Lizenz ODbL 1.0, openfoodfacts.org). Angaben ohne Gewähr, sie können Fehler enthalten. Maßgeblich ist die Packung.")}
    ${li("Hinweis","Alle Angaben in der App sind allgemeine Richtwerte für gesunde Erwachsene und keine medizinische Beratung. Sie ersetzen keinen Arzt. Nicht geeignet bei Essstörungen, in Schwangerschaft oder Stillzeit.")}
    ${li("Bewertungen","Die Scores sind eine Einschätzung der App nach eigenen Regeln. Sie sind kein Test und kein Urteil über einzelne Marken.")}
    ${li("So rechnet die App","Grundumsatz nach der Mifflin-St-Jeor-Formel, mal Aktivitätsfaktor, plus Training nach MET-Werten. BMI-Einteilung nach WHO. Abnehmen mit ca. 0,5 % des Körpergewichts pro Woche, höchstens 20 % unter dem Bedarf und nie unter 1.500 kcal (Männer) bzw. 1.200 kcal (Frauen). Bei Untergewicht kein Defizit. Alles sind Schätzwerte, keine Messung.")}
    ${li("Open-Source-Software","Barcode-Scanner: ZXing (© ZXing-Autoren), Apache License 2.0, apache.org/licenses/LICENSE-2.0. Quellcode: github.com/zxing-js/library")}
    ${okBtn(inApp)}`;
}

// Datenschutzerklärung in kurzen Punkten (Apple verlangt den Text in der App UND als Link)
function privacySheet(inApp=true){
  const li=rechtLi, app=inApp&&istStoreApp();
  const webHosting="Die Web-Version liegt bei GitHub Pages (GitHub Inc., USA). Beim Laden speichert GitHub technisch nötige Daten wie die IP-Adresse kurz in Server-Protokollen. Hat dein Gerät keinen eingebauten Barcode-Scanner, lädt die App beim ersten Scannen eine Scan-Bibliothek nach (falls nicht mitgeliefert: von cdn.jsdelivr.net, dabei wird die IP-Adresse übertragen). Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (sicherer Betrieb).";
  const storeApp="Die App aus dem App Store bzw. Google Play bringt alle Dateien mit und lädt beim Öffnen nichts von einem Server. Beim Herunterladen und für Updates verarbeiten Apple bzw. Google Daten nach ihren eigenen Datenschutzerklärungen; darauf haben wir keinen Einfluss.";
  return `<h2>Datenschutz</h2>
    ${li("Verantwortlich",anbieterHtml()+"<br>E-Mail: "+ANBIETER.mail)}
    ${li("Nur auf deinem Gerät","Profil, Essen, Training, Gewicht und Routine speichert die App nur auf diesem Gerät. Kein Konto, kein eigener Server, keine Werbung, kein Tracking, keine Analyse-Tools.")}
    ${li("Gesundheitsdaten","Angaben wie Gewicht, Essen oder Haut verlassen dein Gerät nicht. Wir haben keinen Zugriff darauf.")}
    ${li("Barcode-Suche","Fehlt ein Produkt in der eingebauten Liste, fragt die App die Barcode-Nummer bei Open Food Facts (openfoodfacts.org, Frankreich) ab. Gesendet wird nur die Nummer und, wie bei jeder Internet-Anfrage, deine IP-Adresse. Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO.")}
    ${li("Kamera","Nur zum Scannen von Barcodes. Bilder werden nicht gespeichert oder gesendet.")}
    ${li("Sprache","Nur wenn du „Sprechen“ tippst. Die Erkennung übernimmt dein Browser bzw. Handy; dessen Anbieter kann die Aufnahme dafür verarbeiten.")}
    ${app?li("App-Store-Version",storeApp):inApp?li("Hosting",webHosting):li("Web-Version",webHosting)+li("App-Store-Version",storeApp)}
    ${li("Exportieren und löschen","Profil → Daten exportieren. Profil → Alles löschen entfernt alles sofort und endgültig.")}
    ${li("Deine Rechte","Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragung und Widerspruch. Schreib dafür an die E-Mail oben. Du kannst dich auch beim Bayerischen Landesamt für Datenschutzaufsicht (lda.bayern.de) beschweren.")}
    ${li("Alter","Die App ist nur für Erwachsene ab 18 Jahren gedacht.")}
    <p class="sub">Stand: Oktober 2026</p>
    ${okBtn(inApp)}`;
}
