HEXOVERRIDE: GHOST YEAR
=======================

You have two folders:

  deploy-this-folder/   <- the finished, built game (just static files)
  source/               <- the editable source code (for later changes)


────────────────────────────────────────────────────────
TO PUT IT ONLINE (no terminal, no npm):
────────────────────────────────────────────────────────
1. Go to  https://vercel.com/new
2. Look for "deploy a static folder" / drag-and-drop area
   (or use  https://app.netlify.com/drop  — same idea, dead simple)
3. Drag the  deploy-this-folder  into it.
4. Done. It gives you a live URL in ~10 seconds.

That folder is already built. Do NOT drag the "source" folder into a
drag-and-drop deploy — drag-and-drop does not build code, only hosts
finished files. "deploy-this-folder" is the finished files.


────────────────────────────────────────────────────────
IF YOU LATER WANT TO EDIT THE GAME:
────────────────────────────────────────────────────────
- Story/missions/dialogue all live in   source/src/campaign.js
- Game engine lives in                  source/src/HexOverride.jsx
- To rebuild after editing:  open source/ in a terminal, run
    npm install
    npm run build
  ...then deploy the new  source/dist/  folder the same way.


────────────────────────────────────────────────────────
HOW TO PLAY:
────────────────────────────────────────────────────────
- Pick a handle. Read the group chat. Hit "open terminal" on jobs.
- In a mission, type the commands. Stuck? type  hint
- Choices change REP / HEAT / DOUBT and steer you toward 1 of 5 endings.
- Progress auto-saves in your browser — "Continue" on the title screen.
- Beat the story to unlock endless Free Play.
