// Icon — the app's Phosphor icons (Regular at rest, Fill when active), with the
// exact path data of mobile/components/Icon.tsx (see ./phosphor.ts).
//
//   <Icon name="heart" />                       the name's own default weight
//   <Icon name="heart" weight="regular" />      idle
//   <Icon name="x" weight="bold" size={26} />   bold exists for x, carets, arrows, check
//
// Names: every app name (kebab-case, e.g. "person-walk", "more-horizontal"), every
// raw Phosphor glyph name ("person-simple-walk", "dots-three", "seal-check") and
// camelCase aliases ("checkCircle", "sealCheck", "mapPin", "handWaving",
// "personSimpleWalk", "dotsThree", "caretLeft", "appleLogo", "googleLogo",
// "arrowRight", "paperPlane", "chatCircle"). Brand glyphs: "apple", "google".
import React from "react";
import { C } from "./theme";
import { PHOSPHOR, type PhosphorGlyph } from "./phosphor";

export type IconWeight = "regular" | "fill" | "bold";

type Spec = {
  glyph: PhosphorGlyph;
  weight?: "regular" | "fill";
  extra?: readonly string[];
};

const SLASH =
  "M53.92,34.62A8,8,0,1,0,42.08,45.38l160,176a8,8,0,1,0,11.84-10.76Z";

/** App names (mobile/components/Icon.tsx ICONS) + camelCase aliases. */
const NAMED = {
  // navigation
  "chevron-left": { glyph: "caret-left" },
  "chevron-right": { glyph: "caret-right" },
  "chevron-down": { glyph: "caret-down" },
  "chevron-up": { glyph: "caret-up" },
  close: { glyph: "x" },
  "more-horizontal": { glyph: "dots-three" },
  "more-circle": { glyph: "dots-three-circle" },
  search: { glyph: "magnifying-glass" },
  refresh: { glyph: "arrow-clockwise" },
  "log-out": { glyph: "sign-out" },
  external: { glyph: "arrow-up-right" },
  // places
  pin: { glyph: "map-pin" },
  "pin-off": { glyph: "map-pin", extra: [SLASH] },
  map: { glyph: "map-trifold" },
  city: { glyph: "buildings" },
  // people and the loop
  heart: { glyph: "heart", weight: "fill" },
  "heart-outline": { glyph: "heart" },
  chats: { glyph: "chats-circle" },
  "person-walk": { glyph: "person-simple-walk" },
  ghost: { glyph: "ghost", weight: "fill" },
  star: { glyph: "star", weight: "fill" },
  spark: { glyph: "sparkle" },
  sparkle: { glyph: "sparkle", weight: "fill" },
  verified: { glyph: "seal-check", weight: "fill" },
  // time and the code
  "timer-ring": { glyph: "timer" },
  hourglass: { glyph: "hourglass-medium" },
  "code-grid": { glyph: "password" },
  keypad: { glyph: "dots-nine" },
  // safety and status
  "shield-check": { glyph: "shield-check", weight: "fill" },
  block: { glyph: "prohibit" },
  lock: { glyph: "lock-simple", weight: "fill" },
  "lock-open": { glyph: "lock-simple-open", weight: "fill" },
  warning: { glyph: "warning-circle" },
  // actions
  send: { glyph: "paper-plane-tilt", weight: "fill" },
  camera: { glyph: "camera", weight: "fill" },
  edit: { glyph: "pencil-simple" },
  settings: { glyph: "gear-six" },
  bell: { glyph: "bell", weight: "fill" },
  "bell-o": { glyph: "bell" },
  phone: { glyph: "phone", weight: "fill" },
  "no-smoking": { glyph: "cigarette-slash" },
  // tab bar
  "tab-swipe": { glyph: "cards", weight: "fill" },
  "tab-heart": { glyph: "heart", weight: "fill" },
  "tab-heart-o": { glyph: "heart" },
  "tab-chats": { glyph: "chats-circle", weight: "fill" },
  "tab-chats-o": { glyph: "chats-circle" },
  "tab-profile": { glyph: "user", weight: "fill" },
  "tab-profile-o": { glyph: "user" },
  // venue types (white glyphs, never rose)
  cocktail: { glyph: "martini" },
  music: { glyph: "music-notes" },
  utensils: { glyph: "fork-knife" },
  dumbbell: { glyph: "barbell" },
  landmark: { glyph: "bank" },
  bag: { glyph: "shopping-bag" },
  graduation: { glyph: "graduation-cap" },
  book: { glyph: "book-open" },
  // camelCase aliases
  checkCircle: { glyph: "check-circle" },
  sealCheck: { glyph: "seal-check", weight: "fill" },
  mapPin: { glyph: "map-pin" },
  chatCircle: { glyph: "chat-circle" },
  handWaving: { glyph: "hand-waving" },
  personSimpleWalk: { glyph: "person-simple-walk" },
  dotsThree: { glyph: "dots-three" },
  caretLeft: { glyph: "caret-left" },
  caretRight: { glyph: "caret-right" },
  arrowRight: { glyph: "arrow-right" },
  arrowUp: { glyph: "arrow-up" },
  arrowClockwise: { glyph: "arrow-clockwise" },
  paperPlane: { glyph: "paper-plane-tilt", weight: "fill" },
  shieldCheck: { glyph: "shield-check", weight: "fill" },
  lockSimple: { glyph: "lock-simple", weight: "fill" },
  hourglassMedium: { glyph: "hourglass-medium" },
  xCircle: { glyph: "x-circle" },
} as const satisfies Record<string, Spec>;

export type IconName =
  | PhosphorGlyph
  | keyof typeof NAMED
  | "apple"
  | "google"
  | "appleLogo"
  | "googleLogo";

const resolve = (name: IconName): Spec | null => {
  if (Object.prototype.hasOwnProperty.call(NAMED, name))
    return NAMED[name as keyof typeof NAMED];
  if (Object.prototype.hasOwnProperty.call(PHOSPHOR, name))
    return { glyph: name as PhosphorGlyph };
  return null;
};

/** SVG path(s) of a name in a weight (256 viewBox). `bold` falls back to regular. */
export const iconPaths = (name: IconName, weight?: IconWeight): string[] => {
  const spec = resolve(name);
  if (!spec) return [];
  const g = PHOSPHOR[spec.glyph] as {
    regular: string;
    fill: string;
    bold?: string;
  };
  const w = weight ?? spec.weight ?? "regular";
  const d =
    w === "fill" ? g.fill : w === "bold" ? (g.bold ?? g.regular) : g.regular;
  return spec.extra ? [d, ...spec.extra] : [d];
};

/** One glyph per venue type (VENUE_ICONS in the app). */
export const venueGlyph = (type: string): IconName => {
  const map: Record<string, IconName> = {
    bar: "martini",
    cafe: "coffee",
    club: "music",
    restaurant: "utensils",
    gym: "dumbbell",
    coworking: "laptop",
    hotel: "bed",
    park: "tree",
    museum: "landmark",
    shop: "bag",
    university: "graduation",
    library: "book",
    beach: "umbrella",
  };
  return map[type] ?? "map-pin";
};

export type IconProps = {
  name: IconName;
  /** Size in px (or pt inside a <Phone>). Default 22. */
  size?: number;
  color?: string;
  weight?: IconWeight;
  style?: React.CSSProperties;
};

const APPLE =
  "M17.05 12.04c.02-2.5 2.04-3.7 2.13-3.76-1.16-1.7-2.97-1.93-3.61-1.96-1.54-.16-3 .9-3.78.9s-1.99-.88-3.27-.86c-1.68.03-3.24.98-4.11 2.49-1.75 3.04-.45 7.54 1.26 10 .83 1.2 1.82 2.55 3.11 2.5 1.25-.05 1.72-.81 3.23-.81s1.94.81 3.27.78c1.35-.02 2.2-1.22 3.03-2.43.95-1.39 1.34-2.74 1.36-2.81-.03-.01-2.61-1-2.64-3.97zM14.62 4.7c.69-.84 1.16-2 1.03-3.16-1 .04-2.2.66-2.91 1.5-.64.74-1.2 1.92-1.05 3.05 1.11.09 2.24-.56 2.93-1.4z";

export const Icon: React.FC<IconProps> = ({
  name,
  size = 22,
  color = C.text,
  weight,
  style,
}) => {
  const box: React.CSSProperties = { display: "block", flex: "none", ...style };
  if (name === "apple" || name === "appleLogo") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={color}
        style={box}
      >
        <path d={APPLE} />
      </svg>
    );
  }
  if (name === "google" || name === "googleLogo") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" style={box}>
        <path
          d="M22.5 12.2c0-.8-.07-1.6-.2-2.4H12v4.5h5.9c-.25 1.4-1.04 2.6-2.22 3.4v2.8h3.6c2.1-1.95 3.3-4.8 3.3-8.3z"
          fill="#4285F4"
        />
        <path
          d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.8c-1 .67-2.3 1.07-3.7 1.07-2.85 0-5.27-1.93-6.13-4.5H2.18v2.83C4 20.5 7.8 23 12 23z"
          fill="#34A853"
        />
        <path
          d="M5.87 14.07A6.6 6.6 0 015.5 12c0-.72.13-1.42.37-2.07V7.1H2.18A11 11 0 001 12c0 1.78.42 3.46 1.18 4.93l3.69-2.86z"
          fill="#FBBC04"
        />
        <path
          d="M12 5.4c1.6 0 3.05.56 4.18 1.65l3.15-3.15C17.45 2 14.96 1 12 1 7.8 1 4 3.5 2.18 7.1l3.69 2.84C6.73 7.33 9.15 5.4 12 5.4z"
          fill="#EA4335"
        />
      </svg>
    );
  }
  const paths = iconPaths(name, weight);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 256 256"
      fill={color}
      style={box}
    >
      {paths.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
};
