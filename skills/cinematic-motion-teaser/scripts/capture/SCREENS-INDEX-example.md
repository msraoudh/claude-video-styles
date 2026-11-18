# NearMatch: screen captures for the teaser

67 PNGs, every one **1170 × 2532** (a 390 × 844 pt phone at @3x, iPhone 14/15 size), plus 3 MP4 recordings in `video/`.
The app only has a dark theme (`app.json` `userInterfaceStyle: "dark"`, fixed colour tokens), so there is no light version.

## How these were made

- **The app:** the real NearMatch Expo app (`mobile/`, unchanged), served as a web build by Metro:
  `EXPO_NO_DOTENV=1 EXPO_PUBLIC_API_URL=http://localhost:4000/v1 EXPO_PUBLIC_WS_URL=http://localhost:4000 … expo start --web --port 8081 --no-dev`.
  I used `--no-dev` because in dev mode Expo 54 lets `mobile/.env*` override the shell's env vars, which would have pointed the app at the dev/prod API.
- **The data:** no real backend and no database. A small mock API plus Socket.io server (`../capture-tooling/mock-server.cjs`) answers every `/v1` route the app calls, using the same response shapes as `mobile/lib/api` and `backend/src/modules`. All the people, chats, venues and timers are made up. Google Places requests are answered with made-up venues around Av. Habib Bourguiba in Tunis. Requests to `*.getnearmatch.com`, `kolide.app` and Sentry were blocked.
- **The browser:** headless Chromium (Playwright). Viewport 390 × 844, deviceScaleFactor 3, mobile with touch, dark colour scheme, en-US, Africa/Tunis time zone, location set to 36.8065, 10.1815. The browser clock is moved to **21:40** so the app shows "Good evening" and evening times.
- **The story in the data:** you are **Youssef, 28**, checked in at the bar **Le Comptoir**, with 14 people there.
  - Matches still running: **Lina** (about 27 min left, chatting) and **Yasmine** (just matched, about 43 min left).
  - Met in person: **Amira** and **Sarra**.
  - Expired: **Nour**.
  - People in the deck: Inès, Mariem, Rania, Salma, Chloé. Liking Inès makes a match.
  - The meeting code is `4827`.
  - The match timer is **45 min** (`/config`), which is the product's design value. Production runs 10 min during the test phase. The number comes from the server, so the copy always matches it.
- **Photos:** free Unsplash portraits, used as placeholders. They are **not real users**. Each person has 3 photos: the original, a mirrored and zoomed crop, and a tighter crop.
- **Web-only fixes, made at capture time and never in the repo:**
  1. `svg, textarea, input { position: relative }`. On the web, glass layers otherwise covered icons and text-field text (on a phone, later elements always paint on top).
  2. Scrollbars, the text caret and browser focus outlines are hidden.
  3. Two web stubs were added to the JavaScript bundle as it was served: expo-notifications' `getLastNotificationResponse`, without which the tab bar crashed on web, and expo-location's unsubscribe, without which stopping the geofence watcher crashed on web.
- **Everything else is the real app UI**, reached by tapping through it (or by deep link where noted).

## Captures

"Reached" says how the screen was opened in the browser. Routes are expo-router paths.

| # | File | Route | What it shows | How reached | Quality notes |
|---|---|---|---|---|---|
| 01 | 01-onboarding-welcome-intro.png | `/onboarding/welcome` | Welcome screen ~0.45 s in: the meet-ring logo still forming, title not yet shown | Signed out, direct load | Mid-animation frame on purpose. **Web:** only "Continue with Google" is shown. The Apple button only appears on iOS |
| 02 | 02-onboarding-welcome.png | `/onboarding/welcome` | Welcome screen settled: ring logo, "NearMatch", "Same place. 45 minutes to meet.", Google button, legal line | Same as 01, after 2.5 s | Apple button missing (iOS-only) |
| 03 | 03-onboarding-consent.png | `/onboarding/consent` | "Before you start": Terms and AI-photo-check consents, both unticked | New account (`hasProfile:false`, no consent) → `/` sends it here | — |
| 04 | 04-onboarding-consent-accepted.png | `/onboarding/consent` | Both consents ticked, "Agree and continue" enabled | Tapped both cards | — |
| 05 | 05-onboarding-name-empty.png | `/onboarding/name` | Step 1/4 "Who are you?": first name and birth date, empty | Tapped Agree and continue | — |
| 06 | 06-onboarding-name-filled.png | `/onboarding/name` | "Youssef", 07/24/1998, "You're 28." | Typed into the fields | Date order is MM/DD/YYYY because the browser is en-US (DD/MM in French) |
| 07 | 07-onboarding-photo-empty.png | `/onboarding/photo` | Step 2/4 "Your photos": 5 empty slots, "Add 2 more photos" | Continue | — |
| 08 | 08-onboarding-photo-one-added.png | `/onboarding/photo` | First photo in as Main, "Add 1 more photo" | Picked a photo with the browser's file chooser (stands in for the iOS photo picker) | The OS photo picker itself is not shown |
| 09 | 09-onboarding-photo-complete.png | `/onboarding/photo` | 3/5 photos, Continue enabled | Two more photos picked | — |
| 10 | 10-onboarding-interests-empty.png | `/onboarding/interests` | Step 3/4 "What you love", 0/5 picked | Continue | — |
| 11 | 11-onboarding-interests-selected.png | `/onboarding/interests` | 5/5 picked (Music, Travel, Food, Photography, Concerts), the rest dimmed | Tapped 5 chips | — |
| 12 | 12-onboarding-lifestyle-empty.png | `/onboarding/lifestyle` | Step 4/4 "Your lifestyle", with Skip | Continue | "Dating" already shows as picked: that is the app's default answer, not a glitch |
| 13 | 13-onboarding-lifestyle-selected.png | `/onboarding/lifestyle` | Non-smoker, Yes, Regularly, Dating picked; "Create my profile" | Tapped chips | — |
| 14 | 14-onboarding-notifications.png | `/onboarding/notifications` | "Don't miss a match" with a mock "It's a match" push preview | Create my profile | The system permission dialog is not shown (that is OS UI) |
| 15 | 15-onboarding-done.png | `/onboarding/done` | "You're in.": avatar in the gradient ring, "Youssef, 28", interest chips, "Let's go" | Not now | — |
| 16 | 16-home-checked-in.png | `/` (Swipe tab) | Home: "Good evening Youssef", checked-in card for Le Comptoir, 14 here, "2 matches in progress 27:5x", Swipe here / Leave, start of "Where it's happening" | Signed-in account, direct load | Tab bar floats at the bottom, as in the app |
| 17 | 17-home-checked-in-scrolled.png | `/` | Same, scrolled: the live venue list with head counts (Studio Lounge 23, Le Comptoir "You're here", …) | Scrolled with the mouse wheel | — |
| 18 | 18-home-not-checked-in.png | `/` | Not checked in: "Check in where you are" card and the live venue list | Mock check-in turned off | — |
| 19 | 19-home-leave-sheet.png | `/` | "Leave Le Comptoir?" sheet warning that 2 active matches will end | Tapped Leave | — |
| 20 | 20-checkin-places.png | `/checkin/places` | "Where are you?": closest venue (Le Comptoir, 14 here), "Check in here", other venues | From home | Venues are made up, not from Google |
| 21 | 21-swipe-deck.png | `/swipe/ChIJ-le-comptoir-tunis` | Swipe deck: Inès 24 (verified), "Here now", chips, venue pill "Le Comptoir · 14 here", "3 people here liked you", pass/like dock | Home → Swipe here | — |
| 22 | 22-swipe-drag-like.png | same | Card dragged right ~90 px mid-gesture: tilted, next card (Mariem) showing behind, like stamp coming in at the right edge | Mouse held mid-drag | Real gesture frame. The like stamp sits on the card's right edge, so it is half off-screen |
| 23 | 23-swipe-drag-pass.png | same | Card dragged left mid-gesture | Mouse held mid-drag | Same as 22, mirrored |
| 24 | 24-profile-view-from-deck.png | `/profile-view/u-ines?from=deck` | Full profile over the photo: name, "Here now at Le Comptoir", About, interests, with the pass/like dock floating | Tapped the ↑ button on the card | The dock floats over the chips: that is the design, not an overlap bug |
| 25 | 25-profile-view-from-deck-scrolled.png | same | Scrolled: lifestyle and "Report or block Inès" | Scrolled | — |
| 26 | 26-swipe-report-block-sheet.png | swipe | "Inès" sheet: Report / Block / Cancel | Tapped ⋯ on the deck | — |
| 27 | 27-match-celebration-burst.png | `/match/u-ines?matchId=m-ines` | Match screen ~0.65 s in: the two photos and heart arriving, title not yet in | Tapped like on Inès | Mid-animation frame on purpose |
| 28 | 28-match-celebration.png | same | "It's a match", "You're both at Le Comptoir", 44:58 countdown ring, Open chat / Keep swiping | 1.8 s later | — |
| 29 | 29-swipe-empty-deck.png | swipe | "Nobody else here right now" empty state | Empty deck in the mock | — |
| 30 | 30-chat-active-timer.png | `/chat/m-lina` | Live chat with Lina: 27:5x countdown card, "Come see me" / "I'm coming to you", messages including the "At the bar" location tag, quick replies, message box | Direct load | — |
| 31 | 31-chat-typing-reply.png | same | Lina's new "I'll wave 👋" arrived live, reply typed in the box ("On my way, two minutes 🏃"), send button active | Mock pushed a socket message, then typed | The web message box is a little taller than on iOS |
| 32 | 32-chat-reply-sent.png | same | The reply sent as a bubble | Tapped send | — |
| 33 | 33-chat-zone-sheet.png | same | "Where are you?" sheet: At the bar / On the terrace / On the dance floor / At the entrance | Tapped "Where I am" | — |
| 34 | 34-chat-meet-request-waiting.png | same | You asked "Come see me": "Waiting for Lina…", Cancel request | Tapped Come see me | — |
| 35 | 35-chat-meet-request-incoming.png | same | Lina asks to come to you: answer sheet "Lina wants to come to you — now?", Yes, come / Later | Mock meeting state = requested by Lina | — |
| 36 | 36-chat-paused-code-live.png | same | Meetup accepted: "Lina is coming to you", "Show my code", chat greyed out and paused, lock bar "Chat paused while you meet" | Mock meeting state = accepted, you show the code | — |
| 37 | 37-chat-code-show.png | `/chat/code-gen/m-lina` | "Show this to Lina": big 4 8 2 7, "Valid for 09:2x" bar, "Get a new code" | Tapped Show my code | A "Wake Lock denied" message is logged on web (no visible effect) |
| 38 | 38-chat-code-entry-empty.png | `/chat/code-entry/m-lina` | "Enter Lina's code", match timer chip, 4 empty boxes | Mock: Lina shows the code, you tapped Enter code | — |
| 39 | 39-chat-code-entry-typing.png | same | "4 8 _ _" typed | Keyboard | No on-screen keyboard (web) |
| 40 | 40-chat-code-entry-wrong.png | same | Wrong code: red boxes, "That's not the code. Check it with Lina." | Typed 4819 | — |
| 41 | 41-chat-code-entry-filled.png | same | "4 8 2 7" filled, Validate button showing a spinner | Typed 4827 (the mock delays the reply) | — |
| 42 | 42-chat-validated-celebration.png | `/chat/validated/m-lina` | "You met!": both photos with a green check, "Your chat with Lina is now permanent. No more timer.", Keep chatting | The code was accepted | Its entrance animation is too short to catch a separate frame |
| 43 | 43-chat-permanent.png | `/chat/m-amira` | Permanent chat with Amira ("Met at Café Bourguiba"), intro "This chat is yours to keep", day separators | Direct load | — |
| 44 | 44-chat-more-menu.png | same | ⋯ sheet: View profile / Unmatch / Report or block | Tapped ⋯ | — |
| 45 | 45-chat-new-match-empty.png | `/chat/m-yasmine` | New match, no messages yet: 42:5x timer card, "You matched at Le Comptoir" intro | Direct load | — |
| 46 | 46-chat-report-menu.png | `/chat/m-lina` | Report / Block sheet for Lina | ⋯ → Report or block | — |
| 47 | 47-chat-report-reasons.png | same | "Report Lina": reasons list, details box, Send report | Report Lina | — |
| 48 | 48-chat-match-expired.png | `/chat/expired/m-nour` | "This match has ended", "Your chat with Nour was deleted.", Find a venue | Direct load | — |
| 49 | 49-matches-active.png | `/matches` | Matches tab, Active: "7 people liked you" card, Lina 27:5x, Yasmine 42:5x | Direct load | — |
| 50 | 50-matches-validated.png | same | Validated: Amira and Sarra with "Met" badges | Tapped Validated | — |
| 51 | 51-matches-expired.png | same | Expired: Nour, greyed out | Tapped Expired | — |
| 52 | 52-chats-list.png | `/chats` | Chats tab: New matches (Yasmine, with a ring and "43m"), Messages (Lina with timer and 2 unread, Amira Met with 1 unread, Sarra Met) | Direct load | — |
| 53 | 53-profile.png | `/profile` | Profile tab: big photo card "Youssef 28 ✓", bio, zodiac and interest chips, 5 matches / 2 met in person | Direct load | — |
| 54 | 54-profile-scrolled.png | same | Scrolled to the stats and Settings | Scrolled | — |
| 55 | 55-profile-settings.png | same | Bottom: Settings, Legal, Sign out, Delete account, "NearMatch 1.0.0" | Scrolled to the bottom | — |
| 56 | 56-profile-edit.png | `/profile-edit` | Edit profile: photo grid 3/5 (Main), About you | Tapped Edit | — |
| 57 | 57-profile-edit-scrolled.png | same | Interests 5/5, zodiac (Leo / Libra), lifestyle questions | Scrolled | — |
| 58 | 58-profile-view.png | `/profile-view/u-lina` | Lina's full profile: photo, "Lina 26 ✓", About, interests, lifestyle | Direct load | — |
| 59 | 59-verify-id-intro.png | `/verify-id` | "Get verified": 3 trust points, Take a selfie | Direct load (account set to unverified) | The badge on the avatar is decoration, not your status |
| 60 | 60-verify-id-checking.png | same | "Verifying your identity…" with the selfie in a spinning gradient ring | Picked a selfie with the file chooser (stands in for the front camera) | The real camera view is not shown (OS UI) |
| 61 | 61-verify-id-verified.png | same | "Identity verified", badge on the photo, Done | Mock answered verified | — |
| 62 | 62-verify-id-failed.png | same | "Not quite": selfie doesn't match, Try again | Mock answered `no_match` | — |
| 63 | 63-blocked-list.png | `/blocked` | Blocked people: Emna, with Unblock | Direct load | — |
| 64 | 64-dev-screen-jumper.png | `/dev` | Hidden dev screen listing every screen | Direct load | Developer-only, not product UI |
| 65 | 65-checkin-confirm-sheet.png | `/checkin/places` | "Check in at Le Comptoir?" sheet: who sees you, "if you walk away your matches end", Cancel / Check in | Home → Check in → Check in here | — |
| 66 | 66-chat-unmatch-confirm.png | `/chat/m-amira` | "Unmatch Amira?" confirm sheet | ⋯ → Unmatch | — |
| 67 | 67-home-geofenced-out.png | `/` | After walking away: amber banner "You left your venue. Your active matches have expired." and the check-in card again | Checked in for real, then moved the browser location ~450 m away for 48 s, so the real geofence watcher checked the account out | Mock limitation: the Matches badge still says 2, because the mock does not expire matches on check-out |

## Videos (`video/`, 780 × 1688, 30 fps, H.264)

| File | Length | What it shows |
|---|---|---|
| swipe-to-match.mp4 | 18.4 s | Home → Swipe here → a small drag on Mariem that springs back → swipe left on her → slow swipe right on Inès → "It's a match" celebration → Open chat |
| meet-and-validate.mp4 | 13.8 s | Lina's chat → her message arrives → "Come see me" → waiting → she says yes (socket event) → "Show this to Lina 4827" → she enters it (socket event) → "You met!" |
| welcome-intro.mp4 | 6.8 s | The welcome screen's opening animation: the two dots meet and form the ring |

These are recorded at @2x (Playwright records video at the viewport size). For crisp stills, use the PNGs.

## Not captured, and why

| Screen or state | Why |
|---|---|
| `/(tabs)/notifications` | Not a screen any more: a hidden route that redirects to Matches (tab removed 2026-10-08). |
| Sign in with Apple button, and the Google or Apple sign-in sheets | The Apple button only renders on iOS. The OAuth sheets belong to the OS or browser and need real credentials. |
| OS permission prompts (location, notifications, camera, photos), the photo picker and camera, push banners | OS UI that a web build cannot show. The app screens around them are captured (14, 08/09, 60). |
| Splash screen (`app/index.tsx`) | On web it shows the same view as Welcome (02). The native splash image is `brand/app-icon/splash-icon-1024.png`. |
| Error and offline states (chat load error, "Oops" error boundary, check-in "location denied" or "no venues") | Reachable, but left out as not useful for a teaser. Ask if you want them. |
| Match running out on its own (timer at zero), a code expiring | The result is captured (48 Match expired). The live transition was not recorded. |
| French version | The app follows the device language (EN/FR). Everything here is English. A French set is one more run with locale `fr-FR`. |

## Re-running

Everything is in `../capture-tooling/` (mock server, harness, scripts, placeholder photos):

- `npm i` there, then `npx playwright install chromium`.
- Start the mock: `node mock-server.cjs`.
- Start the web app from `mobile/` with the env vars above and `--no-dev --clear`.
- Run `node capture.mjs [scene …]` for the PNGs and `node video.mjs` for the videos.
- To change the story (names, messages, timers, the code), edit `freshState()` in `mock-server.cjs`.
