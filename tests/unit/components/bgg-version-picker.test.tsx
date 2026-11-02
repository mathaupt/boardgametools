import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { BggVersionPicker } from "@/components/bgg/bgg-version-picker";
const editions=[{versionId:"101",name:"German edition",languages:["German"],yearPublished:2020,publishers:["Kosmos"],imageUrl:null,thumbnailUrl:null}];
const fetchMock=vi.fn();
const onChange=vi.fn();
const props={bggId:"13",value:null,onChange};
describe("BGG edition selection",()=>{
 beforeEach(()=>{vi.clearAllMocks();vi.stubGlobal("fetch",fetchMock);fetchMock.mockResolvedValue(Response.json(editions));});
 it("shows the loading state without blocking the explicit standard option",()=>{fetchMock.mockReturnValue(new Promise(()=>{}));render(<BggVersionPicker {...props}/>);expect(screen.getByRole("status")).toHaveTextContent("Ausgaben werden geladen");expect(screen.getByRole("radio",{name:/Standardausgabe/})).toBeChecked();});
 it("shows German edition metadata and permits a keyboard choice",async()=>{const user=userEvent.setup();const {container}=render(<BggVersionPicker {...props}/>);const radio=await screen.findByRole("radio",{name:/German edition/});expect(screen.getByText(/Kosmos/)).toBeInTheDocument();expect(screen.getByText(/2020/)).toBeInTheDocument();radio.focus();await user.keyboard(" ");expect(onChange).toHaveBeenCalledWith(editions[0]);expect((await axe(container)).violations).toEqual([]);});
 it("returns to the standard cover and explains a missing edition cover",async()=>{render(<BggVersionPicker {...props} value="101"/>);await screen.findByRole("radio",{name:/German edition/});expect(screen.getByText(/BGG-Hauptcover wird verwendet/)).toBeInTheDocument();fireEvent.click(screen.getByRole("radio",{name:/Standardausgabe/}));expect(onChange).toHaveBeenCalledWith(null);});
 it("explains an empty German edition list",async()=>{fetchMock.mockResolvedValue(Response.json([]));render(<BggVersionPicker {...props}/>);expect(await screen.findByText(/Keine deutsche Ausgabe/)).toBeInTheDocument();expect(screen.getByRole("radio",{name:/Standardausgabe/})).toBeEnabled();});
 it("distinguishes provider errors and supports retry",async()=>{fetchMock.mockResolvedValueOnce(Response.json({error:"BGG wartet"},{status:503})).mockResolvedValueOnce(Response.json(editions));const user=userEvent.setup();render(<BggVersionPicker {...props}/>);expect(await screen.findByRole("alert")).toHaveTextContent("BGG wartet");await user.click(screen.getByRole("button",{name:/Erneut versuchen/}));await screen.findByRole("radio",{name:/German edition/});});
 it("aborts an old game request and discards a late response",async()=>{let finish!:(r:Response)=>void;fetchMock.mockReturnValueOnce(new Promise<Response>(resolve=>{finish=resolve;})).mockResolvedValueOnce(Response.json([]));const {rerender}=render(<BggVersionPicker {...props}/>);const signal=fetchMock.mock.calls[0][1].signal as AbortSignal;rerender(<BggVersionPicker {...props} bggId="42"/>);await screen.findByText(/Keine deutsche Ausgabe/);expect(signal.aborted).toBe(true);finish(Response.json(editions));await waitFor(()=>expect(screen.queryByRole("radio",{name:/German edition/})).not.toBeInTheDocument());});
});
