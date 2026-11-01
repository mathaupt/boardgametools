# Vercel Spend Management

**Stand:** 01.11.2026 – lesende Vorprüfung, kein Budget konfiguriert oder geändert

## Verifizierter Iststand

- Der bestehende Vercel-Pipelinecheck liest den letzten Production-Deploymentstatus; er liest weder Billingplan noch Verbrauch oder Spend-Management-Einstellungen.
- Letzter gelesener Production-Deploy: `READY`, 01.11.2026 21:21:57 Europe/Berlin. Der Deploy liegt vor FEAT-006-Commit. Die Health-Laständerung ist daher nicht als Produktions-Kostenreduktion in die Budgetbasis einzurechnen.
- Vercel CLI ist in der lokalen Arbeitsumgebung nicht installiert. Die am 23.10.2026 veröffentlichte lesende CLI-Abfrage `vercel budgets` und `vercel budgets alerts` konnte nicht verwendet werden.
- Team, Tarif, Abrechnungsperiode, aktuelle Nutzung, existierende Budgetregel, Warnempfänger und betroffene Projekte sind noch nicht aus dem Vercel-Billingkonto verifiziert. Keine Secrets, Kontakte oder Rechnungsdetails in diesem Repository ablegen.

## Plattformgrenzen

Vercel dokumentiert Spend Management für Pro und Enterprise Flexible Commitment; Zugriff erfordert Owner- oder Billingrolle. Es bezieht sich auf gemessene Teamnutzung über die enthaltenen Credits hinaus, nicht auf Sitze, Integrationen und alle externen Lieferanten. Standardwarnungen liegen bei 50/75/100 Prozent; Vercel prüft den Verbrauch alle paar Minuten. Eine Budgetgrenze beendet Nutzung nicht automatisch. Bei aktivierter Pausenoption werden alle Production Deployments des Teams pausiert und liefern Besuchern 503. Projekte müssen einzeln wieder aufgenommen werden. Ein unter den bereits erreichten Verbrauch gesetztes Budget kann die Aktion beim nächsten Prüflauf auslösen.

Quellen: [Vercel Spend Management](https://vercel.com/docs/spend-management), [CLI Budgetabfragen](https://vercel.com/changelog/vercel-cli-adds-spend-management).

## Entscheidungsdatensatz vor einer Änderung

| Feld | Status |
|---|---|
| Verifiziertes Team, Tarif, Abrechnungszyklus und Projekte | Offen – im Konto lesen |
| Aktueller Verbrauch und letzte drei vollständigen Abrechnungsperioden | Offen – Nutzungsauswertung erforderlich |
| Freigegebenes Budget in USD | Offen – Betreiberentscheidung |
| Warnempfänger und erreichbare Stellvertretung | Offen – Betreiber bestätigt; keine personenbezogenen Kontaktdaten hier speichern |
| Aktion bei 100 % | Offen: nur Warnungen oder teamweite Production-Pause |
| Wirkung auf andere Teamprojekte | Offen – Projektliste und Betriebsfolgen abgleichen |
| Verfahren für Wiederaufnahme und Zuständigkeit | Offen – Betreiber muss bestätigen |

Kein Betrag wird aus einer allgemeinen Empfehlung abgeleitet. Wird die teamweite Pause nicht ausdrücklich akzeptiert, kann höchstens ein Warnbudget mit dokumentierter Restkostenwirkung gewählt werden. Ein Spend-Budget ist kein garantierter Rechnungsdeckel.

**Aktivierungsfreigabe, Konto-Readback und Abnahme:** ausstehend.
