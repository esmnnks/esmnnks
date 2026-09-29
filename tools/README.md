# Profile assets

`npm install && npm run build` regenerates everything from `content.mjs`: the README in
10 languages (`README.md` is English, the default; `README.<code>.md` for the others) and the
SVGs in `../assets` (section cards, buttons, diagram, tech stack, language buttons).

GitHub strips CSS, web fonts and scripts from READMEs, so text is drawn as glyph outlines,
rounded corners live in the SVGs and the language buttons are links to the other README files.
To change a text: edit `content.mjs`, rebuild, commit.

- Fonts (SIL Open Font License, see `fonts/OFL-*.txt`): Lekton (Latin), IBM Plex Mono (Cyrillic),
  IBM Plex Sans Arabic (Arabic, right-to-left), Noto Sans SC / JP (fetched from Google Fonts
  during the build as subsets of the characters used, so the build needs internet access)
- Icons: Lucide (ISC), Simple Icons (CC0), Devicon (MIT); the Windows mark is drawn in `build.mjs`
- Flags: flag-icons (MIT); Spain uses the civil flag (no coat of arms) to keep the buttons small
- Banner: `../assets/banner.jpg` is the source; `banner.svg` wraps it with the cards' radius and border
