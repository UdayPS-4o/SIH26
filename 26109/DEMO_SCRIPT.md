# Gaurogya-Setu — Demo Video Script (1.5 – 2 minutes)
**For:** Smart India Hackathon SI26109  
**Project:** AI-powered livestock health management platform  
**Presenter tone:** Confident, clear, slightly conversational. Imagine explaining to a panel of judges.

---

## Scene-by-Scene Breakdown

| # | Timestamp | Screen Action | Narration (what to speak) |
|---|-----------|---------------|---------------------------|
| 1 | 0:00 – 0:08 | **Opening:** Show login/landing or dashboard directly. Click through to Dashboard if needed. | "Gaurogya-Setu is an AI-powered platform built for Smart India Hackathon — to help dairy farmers protect their herd health and maximize milk yield using real-time IoT data and machine learning." |
| 2 | 0:08 – 0:18 | **Dashboard:** Scroll down to show KPI cards (Total Animals, Health Score, Alerts, Avg Milk Yield). Point to the Live Sensor Feed on the right (SCC, Temperature, Activity sensors updating every 3s). | "The Dashboard gives a live herd overview — total animals, average health score, active alerts, and today's milk yield. Our IoT sensors — smart collars, milk sensors, environment monitors — feed live data every few seconds." |
| 3 | 0:18 – 0:28 | **Live Sensor Feed:** Click one of the sensor readings (e.g., SCC). Then scroll to show the 7-day health trend chart. | "Here you see real-time sensor values — somatic cell count, temperature, and activity — all updating live. The trend chart shows health trajectory over the past week." |
| 4 | 0:28 – 0:40 | **Sidebar → Animals:** Click Animals in sidebar. Show the animal grid/list with health score badges (color-coded). Click on one high-risk animal. | "Now let's look at individual animal monitoring. Each animal has a health score, risk level, and breed details. This one is flagged as high risk — let me investigate." |
| 5 | 0:40 – 0:55 | **Animal Details:** Show the detailed animal profile — health vitals, milk yield chart, risk indicators. Mention the AI predictions. | "Here's the full profile — body temperature, milk output, rumination time, activity level. Our ML model uses these six parameters to predict mastitis risk up to 48 hours before symptoms appear." |
| 6 | 0:55 – 1:08 | **Sidebar → Detection (AI Page):** Click Detection. Show the AI chat interface. Type a symptom query like "udder swollen, reduced milk" and show the AI response. | "This is our AI-powered disease detection engine. Farmers can describe symptoms in plain language — the model cross-references with breed data, sensor history, and veterinary knowledge to suggest possible conditions and treatments." |
| 7 | 1:08 – 1:20 | **Still on Detection:** If the enhanced detection page is ready, show the X-Ray Vision tab with cow silhouette and scanning animation. | "We're also building an image-based scanner — farmers can point the camera at any body part and the AI highlights potential issues. Here, it's detecting early signs of mastitis in the udder region with 87% confidence." |
| 8 | 1:20 – 1:30 | **Sidebar → Analytics:** Click Analytics. Show the correlation matrix, seasonal risk chart, or pattern detector. | "The Analytics engine finds correlations across the herd — like how humidity spikes drive up mastitis risk in monsoon season. This helps farmers plan preventive care." |
| 9 | 1:30 – 1:38 | **Sidebar → Alerts:** Click Alerts. Show active alerts list with severity badges. | "Smart alerts notify farmers in real-time — via SMS, push notification, or IVR call — so they can act before a condition worsens." |
| 10 | 1:38 – 1:48 | **Sidebar → Milk Quality or Environment:** Quick click through to show breadth of features. Milk Quality shows SCC trends and taste/odor tests. | "We also track milk quality — somatic cell count trends, taste profiles, odor levels — to ensure premium pricing at dairy cooperatives." |
| 11 | 1:48 – 1:55 | **Sidebar → Reports:** Click Reports briefly. Show a report card with download icon. | "Veterinary reports auto-generate for every animal — downloadable PDFs with health history, vaccination records, and treatment plans." |
| 12 | 1:55 – 2:00 | **Back to Dashboard / Closing:** Return to dashboard. Show the AI Chat Assistant icon in bottom-right. End with the tagline. | "Gaurogya-Setu — bridging traditional farming with AI, IoT, and data science. Built for the farmers of India. Thank you." |

---

## Pre-Recording Checklist

- [ ] Browser in fullscreen mode (F11)
- [ ] Clear browser cache / use incognito
- [ ] Dev server running: `npm run dev` at http://localhost:5173
- [ ] Dashboard loaded and ready
- [ ] Mouse cursor visible but unobtrusive
- [ ] Screen recording software ready (OBS / built-in Windows Game Bar `Win + G`)
- [ ] Resolution: 1920×1080 minimum
- [ ] Microphone tested

## Recommended Screen Recorder Settings

| Setting | Value |
|---------|-------|
| Resolution | 1920×1080 |
| FPS | 30 |
| Codec | H.264 |
| Audio | 44100 Hz, 128 kbps |
| Output | MP4 (H.264) |

## Tips for Polished Demo

1. **Practice the flow twice** before recording — muscle memory beats script reading.
2. **Pause 1-2 seconds** between scenes so transitions are clean in edit.
3. **Hover before clicking** — let the highlight appear for ~0.5s before the click.
4. **Scroll slowly** — don't rush through pages.
5. **If something lags**, wait for it to load before moving on.
6. **Cut the onboarding tour** if it pops up — clear localStorage beforehand: `localStorage.removeItem('tour-completed')` in console, then reload and skip it fast.
