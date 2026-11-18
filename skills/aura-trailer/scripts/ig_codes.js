// Collect every reel code from an Instagram profile grid (run with the browser's javascript tool on
// https://www.instagram.com/<handle>/reels/ while the user is logged in; it scrolls ~25 times).
// Returns "CODE | views" lines; save the codes one per line to <project>/source/codes.txt, then run ig_download.sh.
// Instagram's own web API rate-limits fast (HTTP 429): only scroll the grid, never fetch post pages in a loop.
const seen = new Map();
for (let i = 0; i < 25; i++) {
  document.querySelectorAll('a[href*="/reel/"]').forEach((a) => {
    const h = a.getAttribute("href");
    const m = h && h.match(/\/reel\/([^/?#]+)/);
    if (m && !seen.has(m[1])) seen.set(m[1], a.innerText.replace(/\n/g, " "));
  });
  window.scrollTo(0, document.body.scrollHeight);
  await new Promise((r) => setTimeout(r, 1200));
}
window.__reels = [...seen.entries()].map(([code, views]) => ({ code, views }));
window.__reels.map((r) => `${r.code} | ${r.views}`).join("\n");
