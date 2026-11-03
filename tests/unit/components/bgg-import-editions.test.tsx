import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
const mocks=vi.hoisted(()=>({push:vi.fn(),refresh:vi.fn(),toast:vi.fn(),fetch:vi.fn()}));
vi.mock("next/navigation",()=>({useRouter:()=>({push:mocks.push,refresh:mocks.refresh})}));
vi.mock("@/components/ui/use-toast",()=>({useToast:()=>({toast:mocks.toast})}));
vi.mock("next/image",()=>({default:({src,alt}:{src:string;alt:string})=><img src={src} alt={alt}/>}));
vi.mock("@/components/barcode-scanner",()=>({BarcodeScanner:()=>null}));
vi.mock("@/app/(dashboard)/dashboard/games/import/collection-import-dialog",()=>({CollectionImportDialog:()=>null}));
import ImportPage from "@/app/(dashboard)/dashboard/games/import/page";
import BggPage from "@/app/(dashboard)/dashboard/bgg/page";
const base={bggId:"13",name:"Catan",description:"BGG original",yearPublished:1995,minPlayers:3,maxPlayers:4,playTimeMinutes:60,complexity:null,imageUrl:"https://cf.geekdo-images.com/base.jpg",thumbnailUrl:null,categories:[],designers:[],mechanics:[],rating:null};
const edition={versionId:"101",name:"German edition",languages:["German"],yearPublished:2020,publishers:["Kosmos"],imageUrl:"https://cf.geekdo-images.com/german.jpg",thumbnailUrl:null};
describe("edition import entry points",()=>{
 beforeEach(()=>{vi.clearAllMocks();vi.stubGlobal("fetch",mocks.fetch);mocks.fetch.mockImplementation(async(input:string,init?:RequestInit)=>{
  if(input==="/api/games")return Response.json([]);
  if(input==="/api/games/bgg-presence") { const {bggIds}=JSON.parse(String(init?.body)); return Response.json({matches:Object.fromEntries(bggIds.map((id:string)=>[id,null]))}); }
  if(input.endsWith("/versions"))return Response.json([edition]);
  if(input.includes("query=")||input.includes("search?q="))return Response.json([{bggId:"13",name:"Catan"}]);
  if(input==="/api/games/import-bgg" && init?.method==="POST")return Response.json({game:{id:"saved",name:"Catan"}},{status:201});
  return Response.json(base);
 });});
 it.each(["import","bgg"] as const)("uses a checked server import and selected edition cover from %s",async kind=>{
  const user=userEvent.setup();render(kind==="import"?<ImportPage/>:<BggPage/>);
  if(kind==="import"){
   await user.type(screen.getByRole("textbox",{name:"BGG-ID"}),"13");await user.click(screen.getByRole("button",{name:"Laden"}));
  }else{
   await user.type(screen.getByRole("textbox",{name:"Spiel suchen"}),"Catan");await user.click(screen.getByRole("button",{name:"Suchen"}));await user.click(await screen.findByRole("button",{name:"Details für Catan"}));
  }
  await user.click(await screen.findByRole("radio",{name:/German edition/}));
  if(kind === "import") expect(screen.getByRole("button",{name:"Zur Sammlung hinzufügen"})).toHaveClass("whitespace-normal", "min-w-0");
  expect(screen.getByRole("img",{name:"Catan"})).toHaveAttribute("src",edition.imageUrl);
  await user.click(screen.getByRole("button",{name:kind==="import"?"Zur Sammlung hinzufügen":"Importieren"}));
  await waitFor(()=>expect(mocks.fetch).toHaveBeenCalledWith("/api/games/import-bgg",expect.objectContaining({method:"POST",body:JSON.stringify({bggId:"13",versionId:"101"})})));
  expect(mocks.fetch.mock.calls.some(([url,init])=>url==="/api/games"&&(init as RequestInit | undefined)?.method==="POST")).toBe(false);
 });
 it("verlinkt ein eigenes Spiel und sperrt den unnötigen BGG-Import",async()=>{
  mocks.fetch.mockImplementation(async(input:string,init?:RequestInit)=>{
   if(input==="/api/games")return Response.json([]);
   if(input==="/api/games/bgg-presence")return Response.json({matches:{"13":{id:"owned-game",name:"Catan in meiner Sammlung"}}});
   if(input.includes("query="))return Response.json([{bggId:"13",name:"Catan"}]);
   if(input==="/api/games/import-bgg")return Response.json({game:{id:"new"}},{status:201});
   return Response.json(base);
  });
  const user=userEvent.setup();render(<ImportPage/>);
  await user.type(screen.getByRole("textbox",{name:"BGG-ID"}),"13");await user.click(screen.getByRole("button",{name:"Laden"}));
  const link=await screen.findByRole("link",{name:"Catan in meiner Sammlung"});
  expect(link).toHaveAttribute("href","/dashboard/games/owned-game");
  expect(screen.getByRole("button",{name:"Zur Sammlung hinzufügen"})).toBeDisabled();
  expect(mocks.fetch).not.toHaveBeenCalledWith("/api/games/import-bgg",expect.anything());
 });
 it("zeigt auch auf der BGG-Importseite vorhandenen Bestand statt einer Importaktion",async()=>{
  mocks.fetch.mockImplementation(async(input:string,init?:RequestInit)=>{
   if(input==="/api/games/bgg-presence")return Response.json({matches:{"13":{id:"owned-game",name:"Catan vorhanden"}}});
   if(input.includes("query="))return Response.json([{bggId:"13",name:"Catan"}]);
   if(input==="/api/games/import-bgg")return Response.json({game:{id:"new"}},{status:201});
   return Response.json(base);
  });
  const user=userEvent.setup();render(<BggPage/>);
  expect(screen.getByRole("heading",{name:"BoardGameGeek Import"})).toHaveClass("break-words", "[overflow-wrap:anywhere]");
  await user.type(screen.getByRole("textbox",{name:"Spiel suchen"}),"Catan");await user.click(screen.getByRole("button",{name:"Suchen"}));
  await user.click(await screen.findByRole("button",{name:"Details für Catan"}));
  expect(await screen.findByRole("link",{name:"Catan vorhanden"})).toHaveAttribute("href","/dashboard/games/owned-game");
  expect(screen.getByRole("button",{name:"Importieren"})).toBeDisabled();
 });
 it("shows success instead of a duplicate warning while collection navigation is pending",async()=>{
  const user=userEvent.setup();render(<ImportPage/>);
  await user.type(screen.getByRole("textbox",{name:"BGG-ID"}),"13");await user.click(screen.getByRole("button",{name:"Laden"}));
  await screen.findByRole("radio",{name:/German edition/});
  await user.click(screen.getByRole("button",{name:"Zur Sammlung hinzufügen"}));
  await waitFor(()=>expect(mocks.push).toHaveBeenCalledWith("/dashboard/games"));
  expect(screen.queryByText("Dieses Spiel befindet sich bereits in deiner Sammlung.")).not.toBeInTheDocument();
  expect(screen.getByRole("status")).toHaveTextContent("Spiel erfolgreich importiert");
  expect(screen.getByRole("button",{name:"Importiert"})).toBeDisabled();
 });

});
