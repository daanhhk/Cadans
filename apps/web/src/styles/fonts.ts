// Self-hosted IBM Plex — ALLEEN de gewichten die de tokens gebruiken:
//   sans (--fw-*):     400 body · 500 label · 600 display/h1/h2/h3/caption
//   mono (--fw-num-*): 500 num-sm · 600 num-md/num-lg
// @fontsource injecteert de @font-face-families "IBM Plex Sans" / "IBM Plex Mono"
// die --font-sans / --font-num verwachten. Geen CDN → PWA werkt offline, versie-gepind.
// Deze module wordt als EERSTE style-import in main.tsx geladen (vóór tokens.css).
import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/500.css";
import "@fontsource/ibm-plex-sans/600.css";
import "@fontsource/ibm-plex-mono/500.css";
import "@fontsource/ibm-plex-mono/600.css";
