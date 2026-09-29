# Profile assets

`npm install && npm run build` regenerates the SVGs in `../assets`: cards, buttons,
the systems diagram and the tech stack.

GitHub strips CSS and web fonts from READMEs, so text is drawn as Lekton outlines and
the rounded corners live in the SVGs themselves. Edit the texts in `build.mjs`, rebuild,
commit.

- Font: Lekton (SIL Open Font License, `fonts/OFL.txt`)
- Icons: Lucide (ISC), Simple Icons (CC0), Devicon (MIT); the Windows mark is drawn in `build.mjs`
