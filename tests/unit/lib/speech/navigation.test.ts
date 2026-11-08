// @vitest-environment node
import { afterEach, expect, it, vi } from "vitest";
import { navigateSpeechDocument } from "@/lib/speech/navigation";
afterEach(() => vi.unstubAllGlobals());
it("loads the collection document after successful edits so its microphone policy is applied", () => {
  const assign=vi.fn(); vi.stubGlobal("window", { location: { assign } });
  navigateSpeechDocument("/dashboard/games");
  expect(assign).toHaveBeenCalledExactlyOnceWith("/dashboard/games");
});
