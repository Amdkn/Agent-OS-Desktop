# Gates: agent-os/desktop — travail en cours non commité

OWNS: verif/**, GATES.md

Scope: prouver que l'état courant (17 fichiers modifiés, ~20 apps nouvelles) compile, se bundle, sert le bureau et ses endpoints API sans marqueur d'inachevé.

- [x] G1: TypeScript compile sans erreur sur l'ensemble du projet
  CHECK: npx tsc --noEmit && echo TS_CLEAN
  EXPECT: TS_CLEAN
  EVIDENCE: exit=0; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\amado\agent-os\desktop; path=eedcfca3d0a1/91 entries; output=TS_CLEAN

- [x] G2: Le bundle de production se construit sans erreur
  CHECK: npx vite build && echo VITE_BUILD_OK
  EXPECT: VITE_BUILD_OK
  EVIDENCE: exit=0; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\amado\agent-os\desktop; path=eedcfca3d0a1/91 entries; output=- Use build.rollupOptions.output.manualChunks to improve chunking: https://rollupjs.org/configuration-options/#output-manualchunks | - Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.[39m

- [x] G3: Aucun marqueur d'inacheve (TODO/FIXME/XXX/HACK/not implemented) dans les fichiers changes
  CHECK: node verif/verif_marqueurs.mjs
  EXPECT: NO_PLACEHOLDER_MARKERS
  EVIDENCE: exit=0; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\amado\agent-os\desktop; path=eedcfca3d0a1/91 entries; output=NO_PLACEHOLDER_MARKERS (0 fichiers changes scannes)

- [x] G4: Le bureau et ses 8 endpoints API repondent en HTTP 200 avec le bon type de contenu
  CHECK: node verif/verif_http.mjs
  EXPECT: HTTP_ENDPOINTS_OK
  EVIDENCE: exit=0; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\amado\agent-os\desktop; path=eedcfca3d0a1/91 entries; output=/api/tech-os/kernel-state -> 200 json | HTTP_ENDPOINTS_OK

- [ ] G5: Verification visuelle Playwright (fond d'ecran, icones, redimensionnement) executee par verifie_v3.mjs
  ABANDON: G5 Playwright absent de ~/gauntlet-eyes sous WSL (mesure : grep -c playwright = 0). Le port du script a ete repare 5199 -> 5555. Reprise : installer Playwright sous WSL puis executer node verifie_v3.mjs app lance sur 5555.
