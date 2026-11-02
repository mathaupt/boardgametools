import { beforeEach, describe, expect, it, vi } from "vitest";
const { fetchXml } = vi.hoisted(() => ({ fetchXml: vi.fn() }));
vi.mock("@/lib/bgg-fetch", () => ({ fetchBggXml: fetchXml }));
import { parseBggVersions, getGermanBggVersions } from "@/lib/bgg-versions";

const xml = `<items><item type="boardgame" id="13"><name type="primary" value="Catan"/><versions>
<item id="101" type="boardgameversion"><name value="German &amp; English edition" type="primary"/><yearpublished value="2020"/><link value="German" type="language"/><link type="language" value="English"/><link value="Kosmos &amp; Co" type="boardgamepublisher"/><image>https://cf.geekdo-images.com/cover.jpg?a=1&amp;b=2</image><thumbnail>https://cf.geekdo-images.com/thumb.jpg</thumbnail></item>
<item type="boardgameversion" id="102"><name value="German edition in title only"/><link type="language" value="English"/></item>
<item type="boardgameversion" id="103"><name value="German printing"/><link type="language" value="German"/><image>https://evil.test/cover.jpg</image><yearpublished value="unknown"/></item>
</versions></item></items>`;

describe("BGG editions", () => {
  beforeEach(() => vi.clearAllMocks());
  it("parses edition metadata independently from the parent game", () => {
    expect(parseBggVersions(xml, "13")[0]).toEqual({ versionId:"101", name:"German & English edition", languages:["German","English"], yearPublished:2020, publishers:["Kosmos & Co"], imageUrl:"https://cf.geekdo-images.com/cover.jpg?a=1&b=2", thumbnailUrl:"https://cf.geekdo-images.com/thumb.jpg" });
  });
  it("offers only explicitly German editions, without trusting title heuristics", async () => {
    fetchXml.mockResolvedValue(xml);
    expect((await getGermanBggVersions("13")).map(v=>v.versionId)).toEqual(["101","103"]);
    expect(fetchXml).toHaveBeenCalledWith("thing?id=13&versions=1", undefined);
  });
  it("drops unsafe cover URLs and invalid years while keeping an incomplete edition selectable", () => {
    expect(parseBggVersions(xml,"13")[2]).toMatchObject({imageUrl:null,thumbnailUrl:null,yearPublished:null,publishers:[]});
  });
  it("returns no editions when the parent game has none", () => {
    expect(parseBggVersions('<items><item id="13" type="boardgame"><name value="Catan"/></item></items>',"13")).toEqual([]);
  });
  it.each(["<html>no XML</html>",'<items><item id="13"><versions></item></versions></items>',xml.replace('id="13"','id="99"')])("rejects malformed XML and mismatched parent games", value => {
    expect(()=>parseBggVersions(value,"13")).toThrow();
  });
  it("does not request BGG for invalid identifiers", async () => {
    await expect(getGermanBggVersions("13&url=evil")).rejects.toThrow();
    expect(fetchXml).not.toHaveBeenCalled();
  });
  it("preserves provider errors instead of reporting an empty edition list", async () => {
    fetchXml.mockRejectedValue(new Error("provider unavailable"));
    await expect(getGermanBggVersions("13")).rejects.toThrow("provider unavailable");
  });
});
