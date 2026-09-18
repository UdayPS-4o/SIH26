# WATCHTOWER — Rehearsal Guide
## PS-26145 · NTRO · SIH26 · v2.4

**Purpose:** Step-by-step instructions to rehearse the video shoot before the real recording.
**Target:** 3 rehearsal sessions over 2 days, then final recording on day 3.

---

## DAY 1 — ENVIRONMENT SETUP & DRY RUN

### Morning (2 hours): Environment Setup

#### Step 1: Install Dependencies

```powershell
# Backend
cd C:\Users\udayp\Documents\code\SIH26\26145\backend
.\venv\Scripts\activate
pip install -r requirements.txt

# Frontend
cd C:\Users\udayp\Documents\code\SIH26\26145\frontend
npm install
```

**Verify:**
- [ ] Backend starts without errors: `python demo_server.py --host 0.0.0.0`
- [ ] Frontend starts without errors: `npm run dev`
- [ ] Dashboard loads at `http://localhost:5178`
- [ ] Dashboard shows WATCHTOWER header with live data

#### Step 2: Configure Browser

1. Open Chrome Incognito (Ctrl+Shift+N)
2. Set zoom to 100% (Ctrl+0)
3. Disable all extensions:
   - Chrome menu → More Tools → Extensions → toggle OFF every extension
4. Hide bookmark bar (Ctrl+Shift+B)
5. Set F11 fullscreen mode
6. Open 6 tabs:
   - `http://localhost:5178/` (Dashboard)
   - `http://localhost:5178/attack` (Attack Panel)
   - `http://localhost:5178/live-threats` (Live Threats)
   - `http://localhost:5178/analytics` (Analytics)
   - `http://localhost:5178/ai-analyzer` (AI Analyzer)
   - `http://localhost:8000/api/security/self-test` (Egress test)

#### Step 3: Configure Terminal

1. Open PowerShell
2. Right-click title bar → Properties → Font
3. Set font to JetBrains Mono, 14pt
4. Set colors to dark theme (dark background, light text)
5. Open 3 tabs:
   - Tab 1: Backend (`cd backend; .\venv\Scripts\activate; python demo_server.py --host 0.0.0.0`)
   - Tab 2: Frontend (`cd frontend; npm run dev`)
   - Tab 3: Attack commands (`cd backend; .\venv\Scripts\activate`)

#### Step 4: Configure OBS Studio

1. Open OBS Studio
2. Settings → Video:
   - Base Resolution: 1920×1080
   - Output Resolution: 1920×1080
   - FPS: 60
3. Settings → Output:
   - Recording Format: MP4
   - Encoder: NVIDIA NVENC H.264 (or x264 if no GPU)
   - Rate Control: CBR
   - Bitrate: 25,000 Kbps
4. Create 3 scenes:
   - Scene 1: Full Screen Browser (Window Capture → Chrome)
   - Scene 2: Terminal (Window Capture → Terminal)
   - Scene 3: Split Screen (if dual monitor)
5. Set hotkeys:
   - Start Recording: Ctrl+R
   - Stop Recording: Ctrl+S
   - Switch Scene 1: Ctrl+1
   - Switch Scene 2: Ctrl+2

#### Step 5: Disable Notifications

1. Windows Settings → System → Notifications → turn OFF
2. Close Slack, Discord, Teams, email clients
3. Windows Settings → Personalization → Lock Screen → turn off notifications on lock screen
4. Windows Settings → Gaming → Xbox Game Bar → turn OFF (prevents accidental overlay)

### Afternoon (2 hours): First Dry Run

#### Step 6: Rehearse All 9 Shots (No Recording)

**Goal:** Complete all 9 shots without recording. Time each one. Identify stumbling blocks.

**Shot 0: Title Card** (10s)
- [ ] Refresh Dashboard (F5)
- [ ] Wait for data to populate (10s)
- [ ] Verify all 6 KPI cards showing live numbers
- [ ] Verify alert feed scrolling

**Shot 1: Problem** (30s)
- [ ] Switch to Terminal scene in OBS
- [ ] Restart backend: Ctrl+C, then `python demo_server.py --host 0.0.0.0`
- [ ] Wait for startup banner (15s)
- [ ] Verify all 4 constraint lines visible
- [ ] Switch back to Dashboard scene

**Shot 2: Architecture** (30s)
- [ ] Switch to Dashboard tab
- [ ] Pan across KPI strip (left to right)
- [ ] Pause on pipeline diagram
- [ ] Pause on compliance panel
- [ ] Verify all text readable

**Shot 3: SYN Flood** (30s)
- [ ] Switch to Attack Panel tab
- [ ] Click "Launch SYN Flood"
- [ ] Wait for detection log (2s)
- [ ] Switch to Dashboard tab
- [ ] Verify "THREATS BLOCKED" counter incrementing
- [ ] Verify CRITICAL alerts appearing

**Shot 4: C2 + DGA + Port Scan** (30s)
- [ ] Launch C2 Beacon → wait for detection
- [ ] Launch DGA Domain → wait for detection
- [ ] Launch Port Scan → wait for detection
- [ ] Switch to Live Threats tab
- [ ] Click "HIGH" filter
- [ ] Verify all three attack types visible

**Shot 5: Analytics** (30s)
- [ ] Click Analytics in sidebar
- [ ] Wait for charts to load
- [ ] Point to stat cards
- [ ] Point to donut chart
- [ ] Point to model performance table
- [ ] Verify all numbers readable

**Shot 6: Diode Toggle** (30s) — CRITICAL
- [ ] Navigate to Diode Lab / Degradation Matrix page
- [ ] Verify Diode Mode toggle set to OFF
- [ ] Verify ACK-Shadow toggle set to ON
- [ ] Click Diode Mode ON → watch matrix populate
- [ ] Click ACK-Shadow OFF → watch exfiltration drop to 0%
- [ ] Hold 2 seconds of silence
- [ ] Click ACK-Shadow ON → watch exfiltration recover to 0.83
- [ ] **Repeat this sequence 5 times** until it's muscle memory

**Shot 7: Egress Self-Test** (30s)
- [ ] Open new tab (Ctrl+T)
- [ ] Type self-test URL
- [ ] Wait for page to load (5s)
- [ ] Verify all 8 tests showing BLOCKED
- [ ] Verify "ALL TESTS PASSED" line

**Shot 8: Closing** (80s)
- [ ] Switch back to Dashboard tab
- [ ] Let it run for 10 seconds
- [ ] Verify all KPIs ticking
- [ ] Verify alert feed scrolling

#### Step 7: Identify Issues

After the dry run, write down:
- [ ] Which shots felt awkward or slow?
- [ ] Which clicks were hard to find?
- [ ] Which pages loaded slowly?
- [ ] Which numbers were hard to read?
- [ ] Which transitions felt jarring?

**Common issues and fixes:**
- Issue: Dashboard takes >5s to load → Fix: Pre-load dashboard 30s before recording
- Issue: Attack detection takes >5s → Fix: Increase attack duration to 15s
- Issue: Diode toggle hard to find → Fix: Bookmark the page, zoom to 125%
- Issue: Terminal text too small → Fix: Increase font to 16pt, zoom OBS capture

---

## DAY 2 — TARGETED REHEARSAL

### Morning (2 hours): Problem Shots

**Focus:** Shots that felt awkward in Day 1 dry run.

#### Rehearse Shot 1 (Problem) — 20 minutes
- [ ] Restart backend 3 times
- [ ] Record 3 takes of the terminal banner
- [ ] Pick the cleanest take
- [ ] Verify ASCII art is crisp, no compression artifacts

#### Rehearse Shot 3 (SYN Flood) — 20 minutes
- [ ] Launch SYN Flood 5 times
- [ ] Time each launch: should detect in 2-3 seconds
- [ ] If detection takes >5s, increase attack duration to 15s
- [ ] Verify Dashboard counter visibly incrementing

#### Rehearse Shot 6 (Diode Toggle) — 60 minutes — CRITICAL
- [ ] Navigate to Diode Lab page
- [ ] Practice the full sequence 20 times:
  1. Click Diode Mode ON
  2. Watch matrix populate (count rows out loud: "1, 2, 3, 4, 5, 6")
  3. Click ACK-Shadow OFF
  4. Hold 2 seconds of silence (count "one thousand one, one thousand two")
  5. Click ACK-Shadow ON
  6. Watch exfiltration recover to 0.83
- [ ] Record 5 takes
- [ ] Pick the cleanest take where:
  - Click is clearly visible
  - Bars animate smoothly
  - ACK-Shadow toggle click is sharp
  - No cursor wobble or unintended scroll
  - 2-second silence is clean (no VO, no background noise)

### Afternoon (2 hours): Full Run-Through

#### Step 8: Record All Shots (No VO)

**Goal:** Record all 9 shots without voiceover. Focus on visual quality only.

1. Shot 0: Title Card (10s)
2. Shot 1: Problem (30s) — 3 takes, pick best
3. Shot 2: Architecture (30s)
4. Shot 3: SYN Flood (30s)
5. Shot 4: C2 + DGA + Port Scan (30s)
6. Shot 5: Analytics (30s)
7. Shot 6: Diode Toggle (30s) — 5 takes, pick best
8. Shot 7: Egress Self-Test (30s)
9. Shot 8: Closing (80s)

**Total recording time:** ~5 minutes (without retakes)

**After recording:**
- [ ] Review each clip in OBS
- [ ] Verify no loading spinners visible
- [ ] Verify no error messages visible
- [ ] Verify all text readable
- [ ] Delete bad takes, keep only clean ones

#### Step 9: Record VO

1. Open Audacity
2. Plug in USB microphone (or use laptop mic as last resort)
3. Set input level: peak at -3dB
4. Record in a quiet room (no fans, no traffic noise)
5. Read the full VO script (see VIDEO_SCRIPT_FINAL.md)
6. Normalize to -16 LUFS
7. Export as WAV (48kHz, 16-bit)

**VO takes:**
- [ ] Take 1: Full read-through
- [ ] Take 2: Re-record any lines that felt off
- [ ] Take 3: Re-record Shot 6 (Diode Toggle) VO — this is the most important section

---

## DAY 3 — FINAL RECORDING

### Morning (1 hour): Final Checks

#### Step 10: Pre-Recording Checklist

**Machine:**
- [ ] Windows notifications OFF
- [ ] Slack/Discord/Teams closed
- [ ] Desktop clean (no personal files visible)
- [ ] Browser in Incognito mode
- [ ] Browser zoom 100%, F11 fullscreen
- [ ] Extensions disabled

**Terminal:**
- [ ] 3 tabs open (backend, frontend, attack commands)
- [ ] Backend running
- [ ] Frontend running
- [ ] Terminal font JetBrains Mono 14pt

**Browser:**
- [ ] 6 tabs pre-opened
- [ ] Dashboard fully loaded with live data
- [ ] Let dashboard run for 30 seconds before recording

**OBS:**
- [ ] 3 scenes configured
- [ ] Hotkeys set (Ctrl+R, Ctrl+S, Ctrl+1, Ctrl+2)
- [ ] Recording test (5s) confirms 1920×1080, 60fps
- [ ] Disk space: at least 5GB free

**Backup:**
- [ ] Screenshots pre-captured:
  - `kill-shot.png` (degradation matrix final state)
  - `evidence-panel.png` (alert detail with MEASURED chip)
  - `topology-critical.png` (threat map with critical node)
  - `self-test-complete.png` (all 8 tests passed)

### Midday (2 hours): Record All Shots

#### Step 11: Record Each Shot (With VO or Plan to Add in Post)

**Option A: Record VO separately (recommended)**
- Record all visual takes first (no VO)
- Record VO in Audacity afterwards
- Sync in post-production

**Option B: Record VO live (faster but riskier)**
- Record visual + VO simultaneously
- If you mess up, pause 5 seconds and restart from last clean frame
- Edit out mistakes in post

**Recording order:**

1. **Shot 0: Title Card** (10s)
   - Start recording
   - Refresh dashboard (F5)
   - Wait 3 seconds
   - Stop recording

2. **Shot 1: Problem** (30s)
   - Switch to Terminal scene
   - Restart backend if needed
   - Start recording
   - Wait for banner
   - Stop recording

3. **Shot 2: Architecture** (30s)
   - Switch to Dashboard scene
   - Start recording
   - Pan across KPIs
   - Stop recording

4. **Shot 3: SYN Flood** (30s)
   - Switch to Attack Panel
   - Start recording
   - Launch SYN Flood
   - Switch to Dashboard
   - Stop recording

5. **Shot 4: C2 + DGA + Port Scan** (30s)
   - Stay on Attack Panel
   - Start recording
   - Launch 3 attacks in sequence
   - Switch to Live Threats
   - Stop recording

6. **Shot 5: Analytics** (30s)
   - Click Analytics
   - Start recording
   - Point to charts and tables
   - Stop recording

7. **Shot 6: Diode Toggle** (30s) — 3 TAKES
   - Navigate to Diode Lab
   - Take 1: Start recording → full sequence → Stop
   - Take 2: Start recording → full sequence → Stop
   - Take 3: Start recording → full sequence → Stop
   - **Pick the cleanest take**

8. **Shot 7: Egress Self-Test** (30s)
   - Open new tab
   - Type self-test URL
   - Start recording
   - Wait for page to load
   - Stop recording

9. **Shot 8: Closing** (80s)
   - Switch to Dashboard
   - Start recording
   - Let it run for 10 seconds
   - Stop recording

### Afternoon (2 hours): Post-Production

#### Step 12: Edit in DaVinci Resolve / Premiere Pro

1. **Import clips:**
   - Import all 9 shots (or 11 if you recorded 3 takes of Shot 6)
   - Pick the best take for each shot

2. **Arrange timeline:**
   - Shot 0 (10s)
   - Shot 1 (30s)
   - Shot 2 (30s)
   - Shot 3 (30s)
   - Shot 4 (30s)
   - Shot 5 (30s)
   - Shot 6 (30s) — best take
   - Shot 7 (30s)
   - Shot 8 (80s)

3. **Add VO:**
   - Import VO WAV file
   - Sync to timeline (use clapboard or count-in if you recorded live)
   - If recorded separately, align VO to visual moments

4. **Add captions:**
   - Burn in captions for every spoken line
   - Font: Inter or Space Grotesk, 22-24pt, semi-bold
   - Position: Bottom third, centered
   - Background: Semi-transparent dark bar
   - Text color: White
   - Key stats in cyan

5. **Add SFX (optional):**
   - Alert chime when detections fire (-40 dB)
   - Click sound on toggle clicks (-30 dB)

6. **Color grade:**
   - Raise contrast +5-10 for projector visibility
   - Keep dark ops-center aesthetic (#0a0e17)
   - Preserve cyan (#00d4ff) accent

7. **Export:**
   - Resolution: 1920×1080
   - FPS: 60
   - Codec: H.264, CRF 18
   - Audio: AAC, 192 kbps, stereo
   - File size target: ≤ 100 MB

#### Step 13: Final QC

- [ ] Watch once muted at 1.5× speed — does the story still land?
- [ ] Watch once with sound at 1× — does narration sync with actions?
- [ ] Verify all numbers on screen match the PPT
- [ ] Verify no personal information, file paths, or usernames visible
- [ ] Verify no loading spinners visible
- [ ] Verify ACK-Shadow toggle sequence is clean
- [ ] Verify captions are readable on a phone screen (test at 360px width)
- [ ] Verify file size ≤ 100 MB
- [ ] Upload to YouTube (unlisted)
- [ ] Verify link works from a phone on mobile data
- [ ] Copy MP4 to USB stick

---

## KEYBOARD SHORTCUTS

### Browser
- F5: Refresh page
- F11: Toggle fullscreen
- Ctrl+T: New tab
- Ctrl+W: Close tab
- Ctrl+Tab: Next tab
- Ctrl+Shift+Tab: Previous tab
- Ctrl+0: Reset zoom to 100%
- Ctrl+Shift+N: New Incognito window

### Terminal
- Ctrl+C: Stop running process
- Ctrl+L: Clear screen
- Up Arrow: Previous command
- Tab: Auto-complete

### OBS
- Ctrl+R: Start recording
- Ctrl+S: Stop recording
- Ctrl+1: Switch to Scene 1
- Ctrl+2: Switch to Scene 2
- Ctrl+3: Switch to Scene 3

### Windows
- Alt+Tab: Switch between windows
- Win+Tab: Task View
- Win+Left/Right: Snap window to left/right half

---

## TIPS FOR SMOOTH NAVIGATION

### Pre-Load Everything
- Open all 6 browser tabs before recording
- Let Dashboard run for 30 seconds before recording
- Pre-load Analytics and AI Analyzer pages (they have heavy charts)

### Use Tab Pre-Loading
- Keep all tabs open during recording
- Switch tabs with Ctrl+Tab (faster than clicking)
- The browser doesn't reload tabs that are already open

### Cursor Movement
- Move cursor deliberately, not quickly
- Pause 1 second on each click target
- Use a bright cursor or cursor highlighter
- Slow down for 0.3 seconds on important clicks (toggle switches)

### Avoid Common Mistakes
- Don't click on loading spinners
- Don't scroll too fast (let animations finish)
- Don't switch tabs while charts are animating
- Don't type in the URL bar during recording

### If Something Breaks Mid-Recording
- Pause for 5 seconds
- Restart from the last clean frame
- It's easier to cut than to re-record everything
- If it's a major issue, stop recording and re-record that shot

---

## FINAL RECORDING CHECKLIST

**24 hours before recording:**
- [ ] Backend tested and working
- [ ] Frontend tested and working
- [ ] All 6 browser tabs pre-opened and tested
- [ ] All 3 terminal tabs configured
- [ ] OBS installed and configured
- [ ] Microphone tested and working
- [ ] Audacity installed and tested
- [ ] Screenshots pre-captured (4 backup images)
- [ ] VO script printed and rehearsed 3 times

**1 hour before recording:**
- [ ] Windows notifications OFF
- [ ] Slack/Discord/Teams closed
- [ ] Desktop clean
- [ ] Browser in Incognito mode
- [ ] Terminal ready
- [ ] Backend running
- [ ] Frontend running
- [ ] Dashboard loaded and populated
- [ ] OBS ready
- [ ] Microphone ready
- [ ] Room quiet (no fans, no traffic)

**During recording:**
- [ ] Record at 1920×1080, 60fps
- [ ] One continuous take per shot
- [ ] Deliberate cursor movements
- [ ] No hunting for UI elements
- [ ] Pause 1 second on important clicks
- [ ] Hold 2 seconds of silence after ACK-Shadow OFF
- [ ] If mistake, pause 5s and restart from last clean frame

**After recording:**
- [ ] Review all clips
- [ ] Pick best takes
- [ ] Record VO in Audacity
- [ ] Sync VO to clips
- [ ] Add captions
- [ ] Add SFX (optional)
- [ ] Color grade
- [ ] Export at 1920×1080, H.264, ≤100MB
- [ ] Upload to YouTube (unlisted)
- [ ] Copy MP4 to USB stick
- [ ] Watch once muted at 1.5× speed
- [ ] Verify link works on phone

---

## REHEARSAL SCHEDULE SUMMARY

| Day | Time | Activity | Duration |
|-----|------|----------|----------|
| Day 1 AM | 9:00-11:00 | Environment setup | 2h |
| Day 1 PM | 12:00-14:00 | First dry run (no recording) | 2h |
| Day 2 AM | 9:00-11:00 | Targeted rehearsal (problem shots) | 2h |
| Day 2 PM | 12:00-14:00 | Full run-through (record all shots) | 2h |
| Day 3 AM | 9:00-10:00 | Final checks | 1h |
| Day 3 AM | 10:00-12:00 | Final recording (all shots) | 2h |
| Day 3 PM | 13:00-15:00 | Post-production | 2h |

**Total rehearsal + recording time: 9 hours over 3 days**

---

## MOTIVATION

This is a 5-minute video that will be watched once by NTRO judges. Every second counts. The diode toggle sequence (Shot 6) is the single most important moment in the entire submission. Rehearse it until it's automatic. Rehearse it until you can do it with your eyes closed.

When in doubt, remember:
1. **Every frame must be real.** No mockups, no fake numbers.
2. **The toggle is the hero.** Cut anything that steals seconds from Shot 6.
3. **Silence is a tool.** The 2-second hold after ACK-Shadow OFF is the most persuasive moment.
4. **Show the weakness.** The encrypted-malware row degrading on camera is not a flaw — it's why the rest of the numbers are believable.

Good luck. You've got this.
