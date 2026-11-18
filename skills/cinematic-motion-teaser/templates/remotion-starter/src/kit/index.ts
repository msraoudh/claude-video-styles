// Motion kit — import everything from "../kit".
//
// Re-skin for a new product by editing theme.ts (colours C, type T, springs, GLOW) and fonts.ts
// (the brand's font files in public/fonts). Components are product-agnostic:
//   Phone (3D-tilting device with glare)      Glass (Apple-style glass recipe)
//   Buttons (PillButton, CircleButton…)      Live (LiveDot, Chip, Badge, counters)
//   Clock (NumberRoll slot/odometer, Countdown, TimerRing, DigitWheel)
//   Type (KineticText word stacks, Highlight, StrikeThrough)
//   Effects (Burst, Sparkles, PulseRings, Bokeh, Grain, Glow, TapRipple, CheckMark)
//   Backgrounds (NightAurora, OnyxBg, RippleBg, Vignette)
// App UI parts are designed in APP POINTS (a 390 x 844 pt phone): put them inside
// <Phone height={px}>. Brand/kinetic parts take PX: multiply by `u` from useLayout().
// Product-specific screens (e.g. NearMatch's Screens/People/Chat/Code/MeetRing) live in the
// project — see examples/nearmatch/video/src/kit for a full rebuilt app.
export * from "./fonts";
export * from "./theme";
export * from "./Icon";
export * from "./Glass";
export * from "./Phone";
export * from "./Buttons";
export * from "./Live";
export * from "./Clock";
export * from "./Effects";
export * from "./Backgrounds";
export * from "./Type";
