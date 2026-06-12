/**
 * Zentrale deutsche Fehlermeldungen fuer alle API-Routes.
 * Stellt Konsistenz sicher und ermoeglicht einfache Anpassungen.
 */
export const Errors = {
  // --- Allgemein ---
  INTERNAL_SERVER_ERROR: "Interner Serverfehler",
  NOT_AVAILABLE: "Nicht verfügbar",
  NOT_FOUND: "Nicht gefunden",
  UNAUTHORIZED: "Nicht autorisiert",
  ACCESS_DENIED: "Zugriff verweigert",
  MISSING_REQUIRED_FIELDS: "Pflichtfelder fehlen",
  INVALID_STATUS: "Ungültiger Status",

  // --- Auth ---
  USER_CREATED: "Benutzer erfolgreich erstellt",
  USER_ALREADY_EXISTS: "Benutzer existiert bereits",
  USER_NOT_FOUND: "Benutzer nicht gefunden",
  PASSWORD_MIN_LENGTH: "Passwort muss mindestens 8 Zeichen lang sein",
  PASSWORD_MAX_LENGTH: "Passwort darf maximal 128 Zeichen lang sein",
  INVALID_MIME_TYPE: "Dateityp stimmt nicht mit dem Dateiinhalt überein",
  CANNOT_MODIFY_OWN_ACCOUNT: "Eigenes Konto kann nicht geändert werden",
  INVALID_INVITE_TOKEN: "Ungültiger Einladungstoken",
  USER_STATUS_CHANGED: "Benutzer-Status geändert",
  PASSWORD_CHANGED: "Passwort geändert",

  // --- Events ---
  EVENT_NOT_FOUND: "Event nicht gefunden",
  INVITE_NOT_FOUND: "Einladung nicht gefunden",
  INVITE_DELETED: "Einladung gelöscht",
  REMINDER_SENT: "Erinnerung gesendet",
  EMAIL_OR_USERID_REQUIRED: "E-Mail oder Benutzer-ID ist erforderlich",
  USER_ALREADY_INVITED: "Benutzer bereits eingeladen",
  EMAIL_ALREADY_INVITED: "E-Mail bereits eingeladen",
  INVALID_INVITE_STATUS: "Ungültiger Status. Muss 'accepted' oder 'declined' sein.",
  MISSING_INVITE_ID: "Pflichtparameter fehlt: inviteId",
  INVALID_MAIL_TYPE: "Ungültiger Typ. Muss 'custom' oder 'reminder' sein.",
  MESSAGE_REQUIRED_FOR_CUSTOM: "Nachricht ist für benutzerdefinierte E-Mails erforderlich.",

  // --- Proposals / Votes ---
  PROPOSAL_NOT_FOUND: "Vorschlag nicht gefunden",
  PROPOSAL_DELETED: "Vorschlag gelöscht",
  MISSING_PROPOSAL_ID: "Pflichtfeld fehlt: proposalId",
  MISSING_GAME_ID: "Pflichtfeld fehlt: gameId",
  GAME_NOT_FOUND: "Spiel nicht gefunden",
  GAME_ALREADY_PROPOSED: "Spiel wurde bereits für dieses Event vorgeschlagen",
  VOTE_NOT_FOUND: "Stimme nicht gefunden",
  VOTE_REMOVED: "Stimme entfernt",
  VOTE_RECORDED: "Stimme erfasst",
  ALREADY_VOTED: "Benutzer hat bereits für diesen Vorschlag abgestimmt",

  // --- Date Proposals ---
  DATE_POLL_RESET: "Terminabstimmung zurückgesetzt",
  DATE_SELECTED: "Termin ausgewählt",
  DATE_PROPOSALS_DELETED: "Terminvorschläge gelöscht",
  ONLY_CREATOR_CAN_RESET: "Nur der Ersteller kann die Terminabstimmung zurücksetzen",
  ONLY_CREATOR_CAN_CREATE_DATES: "Nur der Ersteller kann Terminvorschläge erstellen",
  ONLY_CREATOR_CAN_SELECT: "Nur der Ersteller kann einen Termin auswählen",
  DATE_POLL_ALREADY_FINALIZED: "Terminabstimmung bereits abgeschlossen. Bitte zuerst zurücksetzen.",
  START_BEFORE_END: "Startdatum muss vor dem Enddatum liegen",
  DATE_RANGE_MAX_365: "Zeitraum darf maximal 365 Tage umfassen",
  NO_VALID_DATES: "Keine gültigen Termine angegeben",
  DATE_PROPOSAL_NOT_FOUND: "Terminvorschlag für dieses Event nicht gefunden",
  ONLY_CREATOR_CAN_DELETE_DATES: "Nur der Ersteller kann Terminvorschläge löschen",
  MISSING_DATE_FIELDS: "Pflichtfelder fehlen: dateProposalId, availability",
  MISSING_DATE_PROPOSAL_ID: "Pflichtfeld fehlt: dateProposalId",

  // --- Groups ---
  GROUP_NOT_FOUND: "Gruppe nicht gefunden",
  GROUP_NOT_FOUND_OR_NOT_OWNER: "Gruppe nicht gefunden oder kein Eigentümer",
  NOT_A_MEMBER: "Kein Mitglied",
  NOT_AUTHORIZED: "Nicht berechtigt",
  NOT_AUTHORIZED_TO_ADD: "Nicht berechtigt, Mitglieder hinzuzufügen",
  EMAIL_REQUIRED: "E-Mail ist erforderlich",
  USER_ALREADY_MEMBER: "Benutzer ist bereits Mitglied",
  USERID_REQUIRED: "Benutzer-ID ist erforderlich",
  ONLY_OWNER_CAN_REMOVE: "Nur der Eigentümer kann andere entfernen",
  MEMBER_NOT_FOUND: "Mitglied nicht gefunden",
  MEMBER_REMOVED: "Mitglied entfernt",
  CANNOT_REMOVE_OWNER: "Eigentümer kann nicht entfernt werden",
  INVALID_PASSWORD: "Ungültiges Passwort",
  GROUP_DELETED: "Gruppe gelöscht",

  // --- Polls ---
  POLL_NOT_FOUND: "Umfrage nicht gefunden",
  POLL_NOT_FOUND_OR_CLOSED: "Umfrage nicht gefunden oder geschlossen",
  POLL_DELETED: "Umfrage gelöscht",
  TITLE_AND_OPTIONS_REQUIRED: "Titel und mindestens 2 Optionen sind erforderlich",
  OPTION_IDS_REQUIRED: "optionIds-Liste ist erforderlich",
  SINGLE_CHOICE_ONLY_ONE: "Einzelauswahl-Umfrage: nur eine Option erlaubt",

  // --- Sessions ---
  SESSION_NOT_FOUND: "Sitzung nicht gefunden",

  // --- Games / BGG ---
  INVALID_BGG_ID: "Ungültige BGG-ID",
  GAME_NOT_FOUND_BGG: "Spiel auf BGG nicht gefunden",
  FAILED_TO_FETCH_GAME: "Spiel konnte nicht abgerufen werden",
  BGG_USERNAME_REQUIRED: "BGG-Benutzername ist erforderlich",
  COLLECTION_FETCH_FAILED: "Sammlung konnte nicht abgerufen werden",
  QUERY_MIN_LENGTH: "Suchbegriff muss mindestens 2 Zeichen lang sein",
  QUERY_MAX_LENGTH: "Suchbegriff darf maximal 200 Zeichen lang sein",
  SEARCH_FAILED: "Suche fehlgeschlagen",
  BGG_ID_REQUIRED: "BGG-ID ist erforderlich",
  GAME_ALREADY_EXISTS: "Spiel existiert bereits in deiner Sammlung",
  GAME_IMPORTED: "Spiel erfolgreich importiert",
  VALID_BARCODE_REQUIRED: "Gültiger EAN/UPC-Barcode erforderlich",
  IDS_REQUIRED: "1-500 IDs erforderlich",

  // --- Series ---
  SERIES_NOT_FOUND: "Serie nicht gefunden",
  ENTRY_NOT_FOUND: "Eintrag nicht gefunden",
  ENTRY_REMOVED: "Eintrag aus der Serie entfernt",
  RATING_RANGE: "Bewertung muss zwischen 1 und 5 liegen",
  ENTRIES_FORMAT: "entries muss ein Array aus { id, sortOrder } sein",
  ORDER_UPDATED: "Reihenfolge aktualisiert",
  GAME_ID_OR_BGG_ID_REQUIRED: "Entweder gameId oder bggId ist erforderlich",

  // --- Public / Guests ---
  GUEST_NOT_FOUND: "Gast nicht gefunden",
  GUEST_NOT_FOUND_FOR_EVENT: "Gast für dieses Event nicht gefunden",
  GUEST_ALREADY_VOTED: "Gast hat bereits abgestimmt",
  GUEST_ID_AND_PROPOSAL_REQUIRED: "guestId und proposalId sind erforderlich",
  MISSING_GUEST_VOTES: "Pflichtfelder fehlen: guestId, votes",
  POLL_VOTE_FIELDS_REQUIRED: "pollId, optionIds und voterName sind erforderlich",

  // --- Upload ---
  NO_IMAGE_FILE: "Keine Bilddatei angegeben",
  INVALID_FILE_TYPE: (allowed: string) => `Ungültiger Dateityp. Erlaubt: ${allowed}`,
  FILE_TOO_LARGE: (maxMB: number) => `Datei zu groß. Maximum: ${maxMB} MB`,

  // --- Tags ---
  TAG_ID_REQUIRED: "Tag-ID erforderlich",

  // --- DB Init ---
  DB_URL_NOT_SET: "SQL_DATABASE_URL Umgebungsvariable ist nicht gesetzt",
  DB_ALREADY_INITIALIZED: "Datenbank bereits initialisiert",
  DB_EMPTY: "Datenbank ist leer",
  UNKNOWN_ERROR: "Unbekannter Fehler",
  CHECK_DB_PERMISSIONS: "Prüfen Sie SQL_DATABASE_URL und Datenbankberechtigungen",

  // --- Misc ---
  MISSING_USER_IDS: "Fehlende oder ungültige userIds-Liste",
  TOO_MANY_VOTES: "Too many votes",
} as const;
