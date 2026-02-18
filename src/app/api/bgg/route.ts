import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const bggId = searchParams.get("bggId");
  const query = searchParams.get("query");

  try {
    if (bggId) {
      // Spezifisches Spiel von BGG abrufen
      const response = await fetch(`https://boardgamegeek.com/xmlapi2/thing?id=${bggId}&stats=1`, {
        headers: {
          'Authorization': `Bearer ${process.env.BGG_AUTH_TOKEN}`,
          'User-Agent': 'BoardGameTools/1.0 (https://boardgametools.example.com)',
          'Accept': 'application/xml'
        }
      });
      
      if (!response.ok) {
        console.error('BGG API Error:', response.status, response.statusText);
        throw new Error('BGG API Error');
      }

      const xmlText = await response.text();
      
      // Einfache XML Parsing ohne externe Libraries
      const parseXML = (xml: string) => {
        const result: any = {};
        
        // Simple regex parsing für BGG XML
        const nameMatch = xml.match(/<name[^>]*value="([^"]*)"/);
        const descriptionMatch = xml.match(/<description[^>]*>([^<]*)<\/description>/);
        const yearMatch = xml.match(/<yearpublished[^>]*value="([^"]*)"/);
        const minPlayersMatch = xml.match(/<minplayers[^>]*value="([^"]*)"/);
        const maxPlayersMatch = xml.match(/<maxplayers[^>]*value="([^"]*)"/);
        const playTimeMatch = xml.match(/<playingtime[^>]*value="([^"]*)"/);
        const complexityMatch = xml.match(/<averageweight[^>]*value="([^"]*)"/);
        const imageMatch = xml.match(/<image[^>]*>([^<]*)<\/image>/);
        const ratingMatch = xml.match(/<average[^>]*value="([^"]*)"/);
        const rankMatch = xml.match(/<rank[^>]*value="([^"]*)"/);
        
        result.name = nameMatch ? nameMatch[1] : "";
        result.description = descriptionMatch ? descriptionMatch[1].substring(0, 500) : "";
        result.yearPublished = yearMatch ? yearMatch[1] : "";
        result.minPlayers = minPlayersMatch ? minPlayersMatch[1] : "";
        result.maxPlayers = maxPlayersMatch ? maxPlayersMatch[1] : "";
        result.playTimeMinutes = playTimeMatch ? playTimeMatch[1] : "";
        result.complexity = complexityMatch ? complexityMatch[1] : "";
        result.imageUrl = imageMatch ? imageMatch[1] : "";
        result.rating = ratingMatch ? ratingMatch[1] : "";
        result.rank = rankMatch ? rankMatch[1] : "";
        
        return result;
      };

      const game = parseXML(xmlText);
      game.bggId = bggId;

      if (!game.name) {
        return NextResponse.json({ error: "Game not found on BGG" }, { status: 404 });
      }

      return NextResponse.json(game);
    } else if (query) {
      // Suche nach Spielen mit korrektem query Parameter
      const response = await fetch(`https://boardgamegeek.com/xmlapi2/search?type=boardgame&query=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${process.env.BGG_AUTH_TOKEN}`,
          'User-Agent': 'BoardGameTools/1.0 (https://boardgametools.example.com)',
          'Accept': 'application/xml'
        }
      });
      
      if (!response.ok) {
        console.error('BGG API Error:', response.status, response.statusText);
        throw new Error('BGG API Error');
      }

      const xmlText = await response.text();
      
      // Einfache XML Parsing für Search Results
      const parseSearchXML = (xml: string) => {
        const games: any[] = [];
        
        // Remove all newlines and extra spaces to make parsing easier
        const cleanXml = xml.replace(/\s+/g, ' ').trim();
        
        // Find all item blocks using a more robust approach
        const itemBlocks = cleanXml.match(/<item[^>]*>.*?<\/item>/g);
        
        if (itemBlocks) {
          for (const itemBlock of itemBlocks) {
            // Extract bggId and type from item block
            const idMatch = itemBlock.match(/id="([^"]*)"/);
            const typeMatch = itemBlock.match(/type="([^"]*)"/);
            const nameMatch = itemBlock.match(/<name[^>]*value="([^"]*)"/) || 
                             itemBlock.match(/<name[^>]*>([^<]*)<\/name>/);
            const yearMatch = itemBlock.match(/<yearpublished[^>]*value="([^"]*)"/);
            
            const bggId = idMatch ? idMatch[1] : '';
            const type = typeMatch ? typeMatch[1] : 'boardgame';
            const name = nameMatch ? nameMatch[1] : '';
            const yearPublished = yearMatch ? yearMatch[1] : '';
            
            if (bggId && name) {
              games.push({
                bggId,
                name,
                yearPublished,
                type
              });
            }
          }
        }
        
        return games;
      };

      const games = parseSearchXML(xmlText);
      return NextResponse.json(games);
    } else {
      return NextResponse.json({ error: "Missing query parameter" }, { status: 400 });
    }
  } catch (error) {
    console.error("BGG API Error:", error);
    
    // Fallback zu Mock-Daten bei BGG API Problemen
    console.log("Falling back to mock data due to BGG API issues");
    
    if (query) {
      const mockGames = [
        { bggId: "13", name: "Catan", yearPublished: "1995", type: "boardgame" },
        { bggId: "822", name: "Carcassonne", yearPublished: "2000", type: "boardgame" },
        { bggId: "31260", name: "7 Wonders", yearPublished: "2010", type: "boardgame" },
        { bggId: "167791", name: "Terraforming Mars", yearPublished: "2016", type: "boardgame" },
        { bggId: "174430", name: "Gloomhaven", yearPublished: "2017", type: "boardgame" },
        { bggId: "823", name: "The Lord of the Rings: The Board Game", yearPublished: "2000", type: "boardgame" },
        { bggId: "122515", name: "The Lord of the Rings: The Card Game", yearPublished: "2011", type: "boardgame" },
        { bggId: "283864", name: "The Lord of the Rings: Journeys in Middle-earth", yearPublished: "2019", type: "boardgame" },
        { bggId: "317167", name: "The Lord of the Rings: The Confrontation", yearPublished: "2002", type: "boardgame" },
        { bggId: "315698", name: "War of the Ring: The Board Game", yearPublished: "2004", type: "boardgame" }
      ];
      
      const filteredGames = mockGames.filter(game => 
        game.name.toLowerCase().includes(query.toLowerCase())
      );
      
      return NextResponse.json(filteredGames);
    }
    
    return NextResponse.json({ 
      error: "Failed to fetch from BGG", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}
