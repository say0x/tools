import type { SzenarioAenderungFormValues, SzenarioFormValues } from "@/server/actions/szenario";

export function defaultSzenarioFormValues(): SzenarioFormValues {
  return {
    name: "",
    startjahr: new Date().getFullYear(),
    notizen: "",
    aenderungen: [],
  };
}

export function leereSzenarioAenderung(): SzenarioAenderungFormValues {
  return {
    typ: "IMMOBILIE_AUFNEHMEN",
    assetId: null,
    neueSparrateMonatlich: null,
    jahrAbHeute: null,
    bezeichnung: null,
    betrag: null,
    alternativanlageRenditeProzent: null,
  };
}
