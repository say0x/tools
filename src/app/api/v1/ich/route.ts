import { apiRoute, jsonAntwort } from "@/server/api/handler";

export const dynamic = "force-dynamic";

/** Zum Testen eines Tokens: wem gehört es, darf es schreiben? */
export const GET = apiRoute({}, async (k) =>
  jsonAntwort({
    nutzer: { id: k.userId, name: k.userName },
    token: { id: k.tokenId, name: k.tokenName, schreibzugriff: k.schreibzugriff },
    heute: k.heute,
  })
);
