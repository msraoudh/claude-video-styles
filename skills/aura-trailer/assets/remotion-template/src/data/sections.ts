// PLACEHOLDER — overwritten by aura-trailer/scripts/plan.py from trailer.json.
export const SECTIONS = [
 {
  "id": "all",
  "from": 0,
  "to": 600,
  "what": "placeholder: run plan.py"
 }
] as const;
export const section = (id: string) => SECTIONS.find((s) => s.id === id)!;
/** one scene agent per part; a part spans sections from..to (inclusive) */
export const PARTS: {id: string; from: string; to: string}[] = [{"id": "all", "from": "all", "to": "all"}];
