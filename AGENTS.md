# Build & Release Plan

## Setup (one-time)
```bash
# Generate updater signing keypair
npm run release:keygen   # creates src-tauri/.updater-key (private) + prints public key
# Copy the printed public key into tauri.conf.json → plugins.updater.pubkey
# Store private key from src-tauri/.updater-key as GitHub secret TAURI_UPDATER_PRIVATE_KEY
# Store the password you entered as TAURI_UPDATER_PRIVATE_KEY_PASSWORD
# Delete src-tauri/.updater-key after storing (do not commit it)
```

## Releasing
```bash
./scripts/release.ps1 1.2.0
```
This bumps version in all files, commits, tags, and pushes. GitHub Actions handles the build.



## Current State (v1.1.1)
- **Installation**: Manual `npm run tauri build` → MSI + NSIS installers
- **Uninstallation**: Standard Windows uninstaller — IndexedDB/localStorage data persists
- **Updates**: None — users must manually download and reinstall
- **Release process**: Manual version bump (5 files), commit, tag, push, build, upload to GitHub Releases

## Plan

### 1. Auto-updates via `tauri-plugin-updater`
- Add `tauri-plugin-updater` to `Cargo.toml` and `@tauri-apps/plugin-updater` to `package.json`
- Add updater block in `tauri.conf.json` — endpoint: `https://github.com/Jnr011/POS/releases/latest/download/latest.json`
- Add `updater:default` to capabilities/default.json
- Register plugin in `lib.rs`
- Add sidebar badge — `checkUpdate()` → `installUpdate()` with `app.exit(0)` before install to avoid tray-lock

### 2. CI/CD via `tauri-apps/tauri-action`
- Create `.github/workflows/release.yml` — trigger on tag push `v*`
- `tauri-action` handles build, GitHub Release, artifact upload, `latest.json` manifest generation
- Takes `TAURI_UPDATER_PRIVATE_KEY` + `TAURI_UPDATER_PRIVATE_KEY_PASSWORD` as secrets
- This merges fix #1 and fix #2 — no hand-rolled workflow needed

### 3. Code signing
- Acquire cert — Azure Trusted Signing or SignPath (free for OSS)
- Store PFX as base64 secret in GitHub repo
- CI step to import PFX into runner cert store before `tauri build`
- `tauri.conf.json` bundle → windows: `certificateThumbprint`, `digestAlgorithm`, `timestampUrl`

### 4. NSIS as primary installer channel
- Add `nsis` object to `tauri.conf.json` bundle — `installMode: "currentUser"`
- Keep MSI in targets but do NOT wire into updater (MSI only for IT-managed manual deploy)
- Avoids MSI→NSIS upgrade corruption (double uninstall entries)

### 5. Uninstall cleanup (opt-in)
- Create `src-tauri/windows/hooks.nsh` with `NSIS_HOOK_POSTUNINSTALL`
- Custom NSIS page with checkbox: "Also remove all sales data"
- On confirm, delete `%LOCALAPPDATA%\com.pharmacy.pos\EBWebView\`
- Default is unchecked — data preserved

### 6. Release automation script
- `scripts/release.sh` (or `.ps1`) — bumps version in all 5 files, commits, tags, pushes
- Guardrails to prevent partial bumps

### Constraints
- Updater HTTP check runs in Rust backend (reqwest) — CSP does not need GitHub entry
- Must call `app.exit(0)` before installer runs (tray keeps process alive)
- NSIS only for auto-update; MSI not wired to updater
- Data deletion on uninstall is opt-in and off by default
