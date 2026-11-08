"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, ChevronDown, X } from "lucide-react";
import { SpeechInput } from "@/components/speech/speech-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { filterSessionGames, type SessionGameOption } from "@/components/sessions/session-game-options";
import { gameTextForRead } from "@/lib/game-text";

interface SessionGamePickerProps {
  games: SessionGameOption[];
  value: string;
  onValueChange: (value: string) => void;
  id: string;
  disabled?: boolean;
  error?: string;
  triggerRef?: React.RefObject<HTMLButtonElement | null>;
}

export function SessionGamePicker({ games, value, onValueChange, id, disabled, error, triggerRef }: SessionGamePickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);
  const localTriggerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const leavingByTabRef = useRef(false);
  const selectedGame = games.find((game) => game.id === value);
  const filteredGames = filterSessionGames(games, query);
  const activeGame = filteredGames[activeIndex];
  const trigger = triggerRef ?? localTriggerRef;
  const listboxId = `${id}-listbox`;
  const activeOptionId = activeGame ? `${id}-option-${encodeURIComponent(activeGame.id)}` : undefined;

  useEffect(() => {
    if (open && activeOptionId) {
      document.getElementById(activeOptionId)?.scrollIntoView?.({ block: "nearest" });
    }
  }, [activeOptionId, open]);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    setQuery("");
    if (nextOpen) {
      const selectedIndex = games.findIndex((game) => game.id === value);
      setActiveIndex(Math.max(0, selectedIndex));
    }
  }

  function chooseGame(game: SessionGameOption) {
    onValueChange(game.id);
    setQuery("");
    setOpen(false);
    trigger.current?.focus();
  }

  function leavePickerOnTab(event: React.KeyboardEvent<HTMLElement>) {
    if (event.key !== "Tab") return;
    const direction = event.shiftKey ? -1 : 1;
    const focusableInside = Array.from(
      contentRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      ) ?? []
    );
    const currentIndex = focusableInside.indexOf(event.target as HTMLElement);
    if (currentIndex >= 0 && focusableInside[currentIndex + direction]) return;

    event.preventDefault();
    leavingByTabRef.current = true;
    setOpen(false);
    setQuery("");
    const form = trigger.current?.closest("form");
    const focusableInForm = Array.from(
      (form ?? document).querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter((element) => element.tabIndex >= 0 && !element.hasAttribute("hidden"));
    const triggerIndex = focusableInForm.indexOf(trigger.current!);
    const target = focusableInForm[triggerIndex + direction];
    requestAnimationFrame(() => {
      target?.focus();
    });
  }

  function handleSearchKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      return;
    }
    if (event.key === "Tab") {
      leavePickerOnTab(event);
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (filteredGames.length === 0) return;
      setActiveIndex((index) => (index + (event.key === "ArrowDown" ? 1 : -1) + filteredGames.length) % filteredGames.length);
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      const nativeEvent = event.nativeEvent as KeyboardEvent;
      if (nativeEvent.isComposing || nativeEvent.keyCode === 229) return;
      if (activeGame) chooseGame(activeGame);
    }
  }

  const buttonName = selectedGame ? gameTextForRead(selectedGame.name) : "Spiel auswählen…";

  return (
    <div>
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            ref={trigger}
            id={id}
            type="button"
            variant="outline"
            className="h-11 w-full justify-between bg-card text-left font-normal"
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${id}-error` : undefined}
          >
            <span className={selectedGame ? "truncate" : "truncate text-muted-foreground"}>{buttonName}</span>
            <ChevronDown className="size-4 shrink-0 opacity-60" aria-hidden="true" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          ref={contentRef}
          className="p-2"
          onCloseAutoFocus={(event) => {
            if (leavingByTabRef.current) {
              event.preventDefault();
              leavingByTabRef.current = false;
            }
          }}
          aria-label="Spiel auswählen"
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            searchRef.current?.focus();
          }}
        >
          <div className="mb-2" onKeyDown={leavePickerOnTab}>
            <SpeechInput label="Spielsuche diktieren" maxLength={200} disabled={disabled} onAccept={(text) => { setQuery(text); setActiveIndex(0); searchRef.current?.focus(); }} />
          </div>
          <div className="relative">
            <Input
              ref={searchRef}
              type="search"
              role="combobox"
              aria-label="Spiele in deiner Sammlung suchen"
              aria-autocomplete="list"
              aria-expanded="true"
              aria-controls={listboxId}
              aria-activedescendant={activeOptionId}
              aria-describedby={`${id}-result-count`}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setActiveIndex(0);
              }}
              onKeyDown={handleSearchKeyDown}
              placeholder="Spiel suchen…"
              className="h-11 pr-12"
            />
            {query && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-1/2 size-11 -translate-y-1/2"
                aria-label="Suche leeren"
                onKeyDown={leavePickerOnTab}
                onClick={() => {
                  setQuery("");
                  setActiveIndex(0);
                  searchRef.current?.focus();
                }}
              >
                <X aria-hidden="true" />
              </Button>
            )}
          </div>
          <p id={`${id}-result-count`} className="sr-only" aria-live="polite">
            {filteredGames.length} {filteredGames.length === 1 ? "Spiel gefunden" : "Spiele gefunden"}
          </p>
          {games.length === 0 ? (
            <div className="px-2 py-4 text-sm text-muted-foreground">
              <p role="status">Noch keine Spiele in deiner Sammlung.</p>
              <Link className="mt-2 inline-block min-h-11 py-3 text-primary underline underline-offset-4" href="/dashboard/games/new" onKeyDown={leavePickerOnTab}>
                Spiel zur Sammlung hinzufügen
              </Link>
            </div>
          ) : filteredGames.length === 0 ? (
            <p className="px-2 py-4 text-sm text-muted-foreground" role="status">Keine passenden Spiele gefunden.</p>
          ) : null}
          <div id={listboxId} role="listbox" aria-label="Spiele in deiner Sammlung" className="mt-2 max-h-[min(18rem,var(--radix-popover-content-available-height))] overflow-y-auto overscroll-contain">
            {filteredGames.map((game, index) => {
              const optionId = `${id}-option-${encodeURIComponent(game.id)}`;
              const selected = game.id === value;
              const active = index === activeIndex;
              const name = gameTextForRead(game.name);
              return (
                <div
                  id={optionId}
                  key={game.id}
                  role="option"
                  aria-label={`${name}, ${game.minPlayers} bis ${game.maxPlayers} Spieler`}
                  aria-selected={selected}
                  data-active={active}
                  className="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-sm px-3 py-2 text-sm outline-none data-[active=true]:bg-accent data-[active=true]:text-accent-foreground"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => chooseGame(game)}
                >
                  <span className="min-w-0">
                    <span className="block truncate">{name}</span>
                    <span className="block text-xs text-muted-foreground">{game.minPlayers}–{game.maxPlayers} Spieler</span>
                  </span>
                  {selected && <Check className="size-4 shrink-0" aria-hidden="true" />}
                </div>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
      {error && <p id={`${id}-error`} className="mt-1 text-sm text-destructive">{error}</p>}
    </div>
  );
}
