# Ekadhara — Cyber Threat Detection System
## Video Demo Script (SIH26)

**Total Duration:** ~3 minutes
**Tone:** Confident, clear, technical but accessible
**Setting:** Screen recording of the live app at localhost:8000

---

## SCENE 1: The Problem (0:00 – 0:30)

### What to show:
- Start with a blank screen or a simple title card: "Cyber threats are evolving faster than traditional defenses"
- Show a quick stat graphic or text overlay:
  - "1.4 billion+ data records breached annually"
  - "Average breach detection time: 277 days"
  - "Traditional firewalls miss 80% of modern threats"

### What to speak:
> "Every 39 seconds, a cyber attack occurs somewhere in the world. Traditional signature-based detection systems can't keep up with modern threats like DDoS attacks, DNS tunneling, and C2 beaconing. Existing solutions are reactive, slow, and generate thousands of false positives that overwhelm security teams. We built Ekadhara to change that."

---

## SCENE 2: Introducing Ekadhara (0:30 – 1:00)

### What to show:
- Open the browser to `http://localhost:8000`
- The Dashboard page loads with the navy sidebar and stat cards
- Slowly pan across the dashboard showing:
  - Stat cards (Total Flows, Active Threats, Avg Confidence, Threat Level)
  - Alert timeline chart
  - Severity distribution donut chart
  - Real-time flows table with ATTACK/OK badges

### What to speak:
> "Meet Ekadhara — an AI-powered real-time cyber threat detection system. Built with a multi-layered architecture: a Python FastAPI backend handles high-throughput network traffic simulation and rule-based detection, a machine learning ensemble model identifies anomalous patterns, and a React frontend gives security analysts a live command center. Let me walk you through it."

---

## SCENE 3: The Dashboard (1:00 – 1:45)

### What to show (interact with the dashboard):
1. **Point to stat cards** — hover or click if interactive
   > "At the top, four key metrics give an instant security posture snapshot: total flows processed, active threats detected, average model confidence, and current threat level."

2. **Scroll to the charts**
   > "The alert timeline shows threat detection over time, while the severity distribution breaks down threats by criticality."

3. **Scroll to the flows table**
   > "Here's the real-time flow table — every network connection is tracked. Green means normal traffic, red flags an attack. Each entry shows source and destination IPs, protocol, port, bytes transferred, and duration."

4. **Scroll to the Live Threat Feed on the right**
   > "And on the right, the live threat feed. Each alert shows the threat type, severity badge, confidence level, and the IPs involved. Click to expand for detailed evidence."

### What to speak:
> "The dashboard processes thousands of flows per second. Every suspicious pattern triggers an alert that appears here in real-time. The confidence score tells analysts how certain the model is — higher confidence means faster triage."

---

## SCENE 4: Live Threats Page (1:45 – 2:15)

### What to show (click "Live Threats" in sidebar):
1. Page transitions to the Live Threats view
2. Point to the filter bar:
   > "The Live Threats page gives analysts powerful filtering. Search by IP address, filter by severity level — critical, high, medium, or low — or narrow down by threat type."

3. Click "CRITICAL" filter button
   > "For example, filtering for critical threats only."

4. Click "All" to reset
   > "The table updates instantly."

5. Type an IP in the search box
   > "Search by any source or destination IP to trace specific attack paths."

### What to speak:
> "Security analysts can filter threats by severity, search for specific IP addresses, and get a complete picture of ongoing attacks. Each row is clickable for full evidence details including packet counts, anomaly scores, and geolocation data."

---

## SCENE 5: Technical Architecture (2:15 – 2:40)

### What to show:
- Click "Network Map" in sidebar (or switch to a diagram view if available)
- Show a quick architecture diagram or code snippet overlay
- Key points to highlight visually:
  1. **Traffic Simulator** — generates realistic network flows with attack patterns
  2. **Threat Detector** — rule-based engine with sliding time windows
  3. **ML Ensemble** — multiple detection models working together
  4. **WebSocket** — pushes real-time data to the frontend
  5. **React Frontend** — live updating dashboard

### What to speak:
> "Under the hood, Ekadhara uses a three-layer detection approach. First, a traffic simulator generates realistic network flows including attack patterns. Second, a rule-based detector with time-windowed analysis identifies known attack signatures. Third, a machine learning ensemble cross-references patterns across multiple models. All data streams to the frontend via WebSocket for sub-second updates."

---

## SCENE 6: Impact & Conclusion (2:40 – 3:00)

### What to show:
- Return to the Dashboard
- Show the stats updating live (wait for new flows/alerts to appear)
- End with a clean shot of the full dashboard
- Title card: "Ekadhara — SIH26 | Smart India Hackathon"

### What to speak:
> "Ekadhara transforms threat detection from reactive to proactive. With real-time monitoring, AI-powered analysis, and an intuitive analyst interface, security teams can detect and respond to threats in minutes instead of months. Built for the challenges of modern cybersecurity. Thank you."

---

## RECORDING TIPS

1. **Browser setup:**
   - Use Firefox or Chrome in full-screen mode
   - Set zoom to 100%
   - Close all other tabs
   - Disable notifications

2. **Pre-recording checklist:**
   - Backend running: `python main.py` in backend folder
   - Open `http://localhost:8000` 
   - Wait for initial data to load (10-15 seconds)
   - Have the Live Threats page ready to navigate to

3. **Pacing:**
   - Speak slowly and clearly
   - Pause 2 seconds between sections
   - Let charts and tables breathe — don't rush through them

4. **If something breaks mid-recording:**
   - Keep going — the backend will auto-reconnect
   - The mock data generator ensures the page always shows activity

5. **Audio:**
   - Use a good microphone if available
   - Record in a quiet room
   - Speak 10-15% slower than normal conversation
