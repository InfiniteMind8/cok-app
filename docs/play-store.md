# Play Store Submission Runbook — City of Karis

This runbook is the canonical procedure for packaging the City of Karis web app as a Play Store-ready Android app via Trusted Web Activity (TWA), and for submitting it through the Play Console. It is the mobile counterpart to [`production-deploy.md`](./production-deploy.md), which covers the web side.

**Audience:** Project owner (Dr. Munroe). The build agent has prepared every artifact possible; the steps below require provider dashboards, an Android-capable workstation, and a Play Console developer account, none of which the build agent can access.

For the chronological "what comes first" view, start at [`docs/go-live.md`](./go-live.md). This file zooms in on the mobile leg.

Cross-references:
- Web deploy procedure → [`docs/production-deploy.md`](./production-deploy.md)
- Data Safety form answers → [`docs/play-store-data-safety.md`](./play-store-data-safety.md)
- Listing copy → [`marketing/play-store/listing-copy.md`](../../marketing/play-store/listing-copy.md)
- Privacy / Terms drafts → [`legal/privacy.md`](../legal/privacy.md), [`legal/terms.md`](../legal/terms.md)

---

## 0. Prerequisites

- The web app is **already deployed to its production URL** (per `production-deploy.md` §2). The TWA wrap requires a live, HTTPS-reachable origin to verify domain ownership.
- The PWA installability audit passes against the production URL (see §1).
- A workstation with:
  - Node.js 20+ (`node -v`)
  - Java Development Kit (JDK) 17+ — required by Bubblewrap and for `keytool`
    - macOS: `brew install --cask temurin`
    - Windows: install Eclipse Temurin 17 from <https://adoptium.net/>
    - Linux: `sudo apt install openjdk-17-jdk`
  - Android Studio command-line tools (Bubblewrap auto-fetches Android SDK + build-tools on first run, but it needs `JAVA_HOME` set)
- A Google Play Console developer account ($25 one-time fee)
- Access to the City of Karis password manager for storing the upload-key passphrase
- Two-factor authentication enabled on the Google account that owns the Play Console

---

## 1. Verify the PWA against production (audit)

Open Chrome on your workstation and navigate to `https://<production-domain>/`.

1. Open DevTools → Application → Manifest. Confirm:
   - Name: "City of Karis"
   - Short name: "Karis"
   - Start URL: `/`
   - Display: `standalone`
   - Five icons present (192, 256, 384, 512, 512 maskable)
   - Theme color: `#1E2E23`
   - "Installable" badge with no warnings
2. DevTools → Application → Service Workers. Confirm `sw.js` is **activated**.
3. DevTools → Network → tick **Offline** → reload `/`. The page should fall back to the brand `/offline` view (instead of a Chrome dino).
4. On a real Android device, visit the production URL in Chrome and use the menu's **Add to Home Screen** option. The installed app should open in standalone mode (no address bar).

If any step fails, fix the underlying issue before continuing — the TWA cannot pass Play Store review if the underlying PWA is broken.

---

## 2. Install Bubblewrap

Bubblewrap is the Google-maintained CLI that wraps a PWA into an Android app.

```bash
# Install globally (writes to your user npm prefix)
npm install -g @bubblewrap/cli

# Verify
bubblewrap --version

# JAVA_HOME must point to a JDK 17+
java -version
```

On first run, Bubblewrap will prompt to download the Android SDK and build-tools. Accept; this is a one-time ~3 GB download into `~/.bubblewrap/` (or `%USERPROFILE%\.bubblewrap\` on Windows).

---

## 3. Initialise the TWA project

The repository already includes a pre-filled `marketing/play-store/twa-manifest.json` for reference, but Bubblewrap maintains its own copy in the build directory. Use that template as the source of truth for fields you set during init.

Choose a working directory **outside** the website repo (the AAB and keystore must never be committed):

```bash
mkdir -p ~/karis-twa
cd ~/karis-twa

# Initialise from the live web manifest
bubblewrap init --manifest=https://<production-domain>/manifest.webmanifest
```

Bubblewrap will prompt for:

| Prompt | Answer |
|---|---|
| Domain | `<production-domain>` (no scheme) |
| Application name | `City of Karis` |
| Launcher name | `Karis` |
| Display mode | `standalone` |
| Status bar colour | `#1E2E23` |
| Splash screen colour | `#FDFCFB` |
| Application icon URL | `https://<production-domain>/icons/icon-512.png` |
| Maskable icon URL | `https://<production-domain>/icons/icon-512-maskable.png` |
| Package id | `org.cityofkaris.app` |
| Start URL | `/` |
| Signing key generation | **Yes** (let Bubblewrap generate) |
| Keystore password | _generate a long random passphrase, store in password manager **and offline backup** — see §6_ |
| Key alias | `android` |
| Key password | _generate, store in password manager + offline backup_ |

Cross-check the resulting `~/karis-twa/twa-manifest.json` against `marketing/play-store/twa-manifest.json` in the repo. Field-for-field they should match (apart from the host placeholder, which is now your real domain).

---

## 4. Build the AAB

```bash
cd ~/karis-twa
bubblewrap build
```

You will be prompted for the keystore and key passwords from §3. Bubblewrap then:

1. Compiles the wrapper Android module.
2. Produces `app-release-bundle.aab` (the AAB to upload to Play Console).
3. Produces `app-release-signed.apk` (a signed APK for local install / testing).
4. Prints the **SHA-256 fingerprint** of the upload key — copy this value, you will need it in §5.

Verify the AAB:

```bash
# File should be a few MB
ls -lh app-release-bundle.aab

# Optional: install the APK on a connected Android device for a smoke test
adb install -r app-release-signed.apk
```

Open the installed app on the device and confirm:

- It opens full-screen with no Chrome address bar.
- Sign-in works.
- Wallet, treasury, dashboard, and the announcement timeline render identically to the web build.

If the address bar **does** show, the Digital Asset Links file is missing or has a wrong fingerprint — fix §5 and rebuild.

---

## 5. Asset Links — verify the TWA owns the domain

After §4 you have the upload key SHA-256 fingerprint. Open `website/public/.well-known/assetlinks.json` and replace `REPLACE_WITH_BUBBLEWRAP_UPLOAD_KEY_SHA256_FINGERPRINT` with that exact fingerprint:

```json
"sha256_cert_fingerprints": [
  "F7:8D:32:....:1A:0F"
]
```

You can also re-extract the fingerprint at any time:

```bash
keytool -list -v -keystore android.keystore -alias android \
  | grep "SHA256:" | head -1 | awk '{print $2}'
```

Commit, push, redeploy. Confirm the file is reachable:

```bash
curl -sI https://<production-domain>/.well-known/assetlinks.json
# expect: 200 OK, content-type: application/json
```

Re-run §4's smoke test (adb install) — the address bar should now disappear.

> If you later rotate the upload key (rare; only do this if the key is lost or compromised), update `assetlinks.json` and redeploy **before** publishing the AAB built with the new key, otherwise existing TWA installs will break.

---

## 6. Key Management

The upload keystore (`android.keystore`) and its passwords are the credentials that prove future updates of the City of Karis app come from you. **Lose them and you cannot ship updates ever again — Google does not have a recovery flow short of resetting the package id**, which would lose user reviews and stats.

Required handling:

- **Never** commit the keystore to git. (`.gitignore` patterns: `*.keystore`, `*.jks`, `keystore.json`.)
- Store the keystore + both passwords in the City of Karis password manager **and** an offline backup (encrypted USB, kept in a separate location).
- Treat passwords like the `STORAGE_ENCRYPTION_KEY` (R-D11-01) and `CRON_SECRET` — do not paste them into chat, ticket systems, or shared docs.
- Restrict access to the project owner. If you must delegate, document the access transfer in `qa/decision-log.md`.
- Rotation policy: do **not** rotate routinely. Only rotate if the keystore is suspected compromised. Rotation procedure: §5.

Convention: keystore lives at `~/karis-twa/android.keystore` on the build workstation. Off the build workstation, only the encrypted backup exists.

---

## 7. Play Console submission

### 7.1 Developer account

If you do not already have one, create a developer account at <https://play.google.com/console/signup>. Pay the one-time $25 fee. Verify your identity. This step usually completes within 48 hours.

### 7.2 Create the app

In Play Console → **All apps** → **Create app**.

| Field | Value |
|---|---|
| App name | City of Karis |
| Default language | English (United States) |
| App or game | App |
| Free or paid | Free |
| Declarations | (read & accept) |

### 7.3 Set up the listing

Navigate to **Grow → Store presence → Main store listing** and fill from `marketing/play-store/listing-copy.md`:

- App name: `City of Karis`
- Short description: from the listing copy file
- Full description: from the listing copy file
- App icon: upload `marketing/play-store/icon-512.png` (the 512×512 generated icon)
- Feature graphic: upload `marketing/play-store/feature-graphic.png`
- Phone screenshots: upload all PNGs from `marketing/play-store/screenshots/` (need at least 4)
- Email: `support@cityofkaris.org`
- Phone: optional
- Website: `https://<production-domain>/`
- Privacy policy URL: `https://<production-domain>/privacy`

Save and continue. Resolve any errors flagged in the right-hand checklist.

### 7.4 Content rating

**Policy → App content → Content ratings**. Answer the IARC questionnaire — anticipate **Everyone**:

- Violence: No
- Sex: No
- Profanity: No
- Drugs: No
- Gambling: No
- User-generated content: No (community announcements are moderated)
- User-to-user interaction: No (announcements are one-way; voting is structured)
- Shares user location: No
- Allows users to purchase digital content: No

### 7.5 Data Safety

**Policy → App content → Data safety**. Transcribe answers from [`docs/play-store-data-safety.md`](./play-store-data-safety.md). Save and submit.

### 7.6 Target audience

**Policy → App content → Target audience and content**. Audience: **18+** (per `legal/terms.md` §1). Confirm the app is **not** primarily aimed at children.

### 7.7 News app declaration

**No** — this is a community admin app, not a news publication.

### 7.8 Government app declaration

**No.**

### 7.9 Health app declaration

**No.**

### 7.10 Upload AAB → Internal testing

Go to **Test and release → Testing → Internal testing → Create new release**. Upload `app-release-bundle.aab`. Provide:

- Release name: `1.0.0`
- Release notes:
  ```
  Initial release for the City of Karis founding cohort. Wallet, governance, treasury, and community announcements.
  ```

Add testers: in **Testers** tab, create a tester list "Founding cohort." Add Dr. Munroe and the founding cohort emails. Save the opt-in link — share it only with that list.

Roll out to internal testing. Wait for Play Store review (usually a few hours; can be up to 7 days for a new app).

### 7.11 Closed → Open → Production

Promote the release through tracks **only after** internal testing has demonstrated stability. Each promotion requires:

- A new release of the same AAB (or an updated one).
- A reviewed change log.
- A larger tester audience or wider geographic availability.
- A green **Pre-launch report** in Play Console.

Do not skip directly from internal to production. The Play Console reviewer expects evidence of staged rollout.

---

## 8. Pre-submission checklist

Tick these before clicking **Roll out** on internal testing:

- [ ] Production URL is live and reachable (`curl -I https://<production-domain>/` returns 200 with all six security headers — verify per `production-deploy.md` §3.1).
- [ ] PWA passes Chrome installability audit on the production URL (this doc §1).
- [ ] `assetlinks.json` is live with the upload-key SHA-256 fingerprint (this doc §5).
- [ ] AAB built and signed with the upload key (this doc §4).
- [ ] APK installs on a real Android device, opens full-screen, all flows render (this doc §4).
- [ ] Keystore + both passwords stored in password manager **and** offline backup (this doc §6).
- [ ] Listing assets uploaded (icon, feature graphic, ≥4 screenshots).
- [ ] Privacy policy URL hosted at `/privacy` and Terms at `/terms` — both reviewed by counsel (this is the gate that promotes the app off the internal track).
- [ ] Data safety form completed per `docs/play-store-data-safety.md`.
- [ ] Content rating questionnaire completed (Everyone).
- [ ] Target-audience set to 18+.
- [ ] Internal-testing tester list defined and the opt-in link sent only to the founding cohort.

---

## 9. Post-submission

After the first release goes live in any track:

- Watch **Pre-launch reports** for issues. Each new AAB is auto-tested on a small device farm.
- Watch **Vitals → Crashes & ANRs**; correlate with Sentry events on the same time window.
- Monitor **Vitals → Permissions** if you add any new sensitive permissions later.
- Subscribe Dr. Munroe's email to **all** Play Console notifications. Policy violations are time-sensitive.

For each future release:

1. Bump `appVersionCode` (integer, +1) and `appVersionName` (semver) in `~/karis-twa/twa-manifest.json`.
2. `bubblewrap update`
3. `bubblewrap build`
4. Bump the `VERSION` constant in `website/public/sw.js` if any precached path changes — this is what evicts old caches in installed PWA + TWA clients (R-F2-05).
5. Upload to the appropriate Play Console track.

---

## 10. Rollback

If a release ships with a critical issue:

1. **Halt rollout** in Play Console (Production track → Releases → "..." → Halt rollout).
2. Build a fixed AAB and ship as a hotfix release (must have higher `appVersionCode`).
3. If the issue is web-side only, the rollback is on the web (per `production-deploy.md` §4) — the TWA reflects the live origin, so a successful web rollback fixes installed clients without a new AAB.

---

## 11. Common rejection reasons (Play Console)

Anticipate and pre-empt:

- **Privacy policy mismatch** — the live URL must literally be reachable and load without auth. (Mitigation: `/privacy` is public in this build.)
- **Sub-processor data sharing not declared** — Clerk, Resend, Sentry, Supabase, Upstash. We treat these as processors-not-sharers per `play-store-data-safety.md` §D — if the reviewer disagrees, edit the data safety form per their note and re-submit.
- **Permissions not justified** — TWA itself does not request runtime permissions in v1. If a future release adds notifications, justify in the Data Safety form.
- **Crashes during pre-launch** — usually surface in Sentry first. Fix the web side and rebuild the AAB.
