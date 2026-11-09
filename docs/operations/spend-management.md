# Vercel Spend Management

**Stand:** 09.11.2026 – Hobby-Tarif und 0 USD vom Nutzer bestätigt; kein Budget konfiguriert oder geändert

## Verifizierter Iststand

- Der bestehende Vercel-Pipelinecheck liest den letzten Production-Deploymentstatus; er liest weder Billingplan noch Verbrauch oder Spend-Management-Einstellungen.
- Letzter gelesener Production-Deploy: `READY`, 01.11.2026 21:21:57 Europe/Berlin. Der Deploy liegt vor FEAT-006-Commit. Die Health-Laständerung ist daher nicht als Produktions-Kostenreduktion in die Budgetbasis einzurechnen.
- Vercel CLI ist in der lokalen Arbeitsumgebung nicht installiert. Die am 23.10.2026 veröffentlichte lesende CLI-Abfrage `vercel budgets` und `vercel budgets alerts` konnte nicht verwendet werden.
- Der Nutzer bestätigt am 09.11.2026 den Hobby-Tarif und 0 USD. Team, Tarif, aktuelle Nutzung, bestehende Nutzungshinweise und betroffene Projekte wurden nicht aus dem Vercel-Billingkonto zurückgelesen. Keine Secrets, Kontakte oder Rechnungsdetails in diesem Repository ablegen.

## Plattformgrenzen

Vercel dokumentiert Spend Management für Pro und Enterprise Flexible Commitment; es ist im Hobby-Tarif nicht verfügbar. Hobby hat keinen monatlichen Abrechnungszyklus und pausiert Projekte automatisch beim Überschreiten der enthaltenen Gratislimits. Damit ist der vom Nutzer genannte 0-USD-Betrieb über das native Hobby-Verhalten abgedeckt; ein konfigurierbares Team-Budget mit 50/75/100-Prozent-Warnungen gibt es dafür nicht. Tarif-/Usage-Readback aus dem Konto liegt nicht vor. Keine Team- oder Billingeinstellung geändert.

Quellen: [Vercel Spend Management](https://vercel.com/docs/spend-management), [CLI Budgetabfragen](https://vercel.com/changelog/vercel-cli-adds-spend-management).

## Entscheidungsdatensatz vor einer Änderung

| Feld | Status |
|---|---|
| Verifizierter Tarif | Hobby laut Nutzerbestätigung vom 09.11.2026; Kontoreadback ausstehend |
| Freigegebenes Budget | 0 USD laut Nutzer; separates Spend Management auf Hobby nicht verfügbar |
| Verhalten oberhalb Gratislimits | Vercel pausiert Hobby-Projekte automatisch gemäß Planregeln; nicht per Konto-Readback überprüft |
| Teamweite 100-%-Pausenoption | Pro-/Enterprise-Spend-Management-Funktion; für den bestätigten Hobby-Tarif nicht konfigurierbar |
| Nutzungshinweise | Vercel-Usage-Benachrichtigungen gemäß Hobby-Plan; konkrete Empfänger/Präferenzen nicht gelesen |

Der Nutzer akzeptiert den Hobby-Standardmechanismus als Schutz für 0 USD. Die Umsetzung ist durch die Planwahl abgedeckt; es wurde kein Billing-Write ausgeführt. Diese Funktion bietet kein selbst gesetztes Team-Budget und keinen benutzerdefinierten 100-%-Trigger.

**Status FEAT-008:** gemäß Nutzerangabe zum Hobby-Tarif abgeschlossen; externer Tarif-Readback nicht verfügbar.
