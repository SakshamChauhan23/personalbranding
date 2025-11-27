Got it — **this is a totally new direction and it makes MUCH more sense** for your long-term business and for cost efficiency.

You’re no longer building a CXO-facing content engine.
You’re building a **Social Media Manager Command Center** to manage multiple CXO clients at scale — *with very minimal LLM usage.*

This is smart because:

* LLM token costs drop by 70–90%
* AI becomes optional instead of mandatory
* UX becomes more predictable
* SMMs love operational dashboards
* You unlock team workflows later
* You don’t rely on unpredictable AI responses

Let’s build a completely new PRD based on this updated direction, including feedback workflow, admin → client flow, notifications, approval system, and minimal AI.

---

# ⭐ **NEW UPDATED PRODUCT REQUIREMENT DOCUMENT (PRD)**

## **SocialRipple — Social Media Manager Command Center MVP**

---

# **1. Product Summary**

SocialRipple is an operational dashboard for Social Media Managers (SMMs) to manage **multiple CXO clients**, their content calendars, brand positioning, scheduling readiness, and client approvals — all in one place.

This MVP is focused on:

* Admin Sign-Up / Sign-In
* Multi-Client Management Dashboard
* Comprehensive Client Onboarding
* Client Workspace with sections:

  * Onboarding Responses
  * Brand Positioning
  * Content Calendar
  * AI-Assist Writing (optional)
  * Media Uploads
  * Scheduled Posts
  * Feedback Workflow
* Client Approval System (email-based)
* Notifications for updates
* Minimal, token-efficient AI usage

This is **NOT** a heavy AI product.
This is a **workflow product** with optional “Write with AI.”

---

# **2. Target Users**

## **Primary User: Social Media Manager (Admin)**

* Manages 3–20 CXO clients
* Needs a centralized tool
* Needs structured workflows
* Needs predictable content approval process
* Wants to reduce chaos via calendar, reminders, and client feedback

## **Secondary User: CXO Client**

* Only interacts through:

  * Email approvals
  * Email feedback
  * Notifications
* Does NOT login into platform (MVP)

*(Optional: client login later)*

---

# **3. Key Concepts**

* **Admin Account:** Person managing all clients
* **Client Project:** Container of all content for one CXO
* **Content Cards:** Units representing a post
* **Feedback Loop:** Client can approve / reject content via email
* **AI Assist:** Optional writing assistance, NOT mandatory

---

# **4. Core Features (MVP)**

---

# ⭐ **4.1 Authentication**

* Admin Sign-Up
* Admin Log-In
* Forgot Password
* Simple profile page

---

# ⭐ **4.2 Admin Dashboard**

Admin sees:

* List of all clients
* Search & filter
* Quick cards showing:

  * Pending client approvals
  * Upcoming posts
  * Feedback received
  * Expired/scheduled posts
* Each client card shows:

  * Client name
  * Status updates (example: “3 posts need approval”)
  * Last activity
  * Alerts (new feedback, updated content)

---

# ⭐ **4.3 Add New Client**

Click “Add Client” → Opens a **Comprehensive Onboarding Form**.

Sections:

* Basic info
* LinkedIn URL
* Background
* Content objectives
* Tone/voice preferences
* Topics
* Brand info (colors, logos)
* Approval email address

Upon submission → Creates a **Client Workspace**.

---

# ⭐ **4.4 Client Workspace**

Left sidebar menu:

### 1. View Onboarding Form Responses

* Full view of responses
* “Edit Response” option
* Auto-save changes to client profile

### 2. Brand Positioning Page

Static layout with fields:

* Positioning Statement
* Target Audience
* Content Pillars
* Voice/Tone
* Days of Posting

Admin can:

* Fill manually
* Use optional “Generate with AI”

### 3. Content Calendar

The **Core of the Platform**.

Features:

* Calendar month view
* Add post by clicking a date
* Each post = Content Card containing:

  * Title
  * Short brief
  * Full caption/script
  * Upload media (image / carousel / PDF)
  * AI Assist button (optional)
  * Status: Draft / Sent / Approved / Revisions Needed / Scheduled

Admin can:

* Create multiple cards per day
* Drag & drop cards to rearrange dates
* Duplicate a post
* Delete a post
* Share posts with client (email)

### 4. Scheduled Posts Page

List view:

* All upcoming posts
* Date + time
* Content type
* “Mark as Scheduled” checkbox
* Status view (Done / Pending)

### 5. Settings

Client profile + remove/delete client.

---

# ⭐ **4.5 Sharing & Client Feedback Workflow**

### How It Works:

1. Admin selects posts → “Share with Client”
2. Client receives an email containing:

   * Preview of content
   * Buttons: **Approve** or **Request Changes**
3. If client clicks:

   * **Approve:** status is updated to "Approved"
   * **Request Changes:** opens a simple feedback form

     * Client writes comments
     * Admin receives notification
4. Admin sees updates in dashboard
5. Admin can revise content & resend for approval

### Requirements:

* Track version history
* Track approval timestamps
* Show feedback attachments (if client attaches documents or screenshots)

---

# ⭐ **4.6 Notification System**

Admin should see notifications for:

* New client feedback
* Post approved
* Post rejected
* Onboarding form updated
* Scheduled post deadline approaching

Notifications visible:

* In dashboard
* Overlay badge
* Email alerts (optional)

---

# ⭐ **4.7 AI Assist (Minimal, Token-Efficient)**

AI tools are optional, not required.

AI Assist must be **opt-in, per-card**, not always on.

Modes:

* “Write with AI”
* “Improve Caption”
* “Summarize Feedback”
* “Rewrite Hook Line”

This ensures:

* 90% fewer tokens
* Stable operations
* Costs stay predictable

---

# ⭐ **5. Non-Functional Requirements**

## **Performance**

* Fast content loading
* Efficient media upload handling
* Smooth calendar drag/drop

## **Reliability**

* Version control for content
* Preserve all client feedback
* Zero content loss

## **Scalability**

* SMM can manage 50+ clients
* 500+ posts per month

## **Usability**

* Extremely intuitive UI
* Low learning curve
* Mobile responsive

## **Minimal AI Cost**

* AI only used when admin explicitly clicks
* LLM calls cached
* No background AI processes

---

# ⭐ **6. Data Model (High-Level)**

### Entities:

* **Admin**
* **Client**
* **OnboardingResponse**
* **BrandPositioning**
* **PostCard**
* **MediaUpload**
* **ShareRequest**
* **FeedbackEntry**
* **ScheduleEntry**
* **Notification**

### Core States for Posts:

```
Draft → Sent to Client → Approved / Revisions Needed → Ready to Schedule → Scheduled
```

---

# ⭐ **7. User Flows**

## **Admin Flow**

Login → Dashboard → Add Client → Fill Onboarding → Brand Positioning → Create Posts → Share → Get Feedback → Update → Schedule → Done.

## **Client Feedback Flow**

Receive email → Click Approve / Request Changes → Submit → Admin notified → Version updates.

---

# ⭐ **8. MVP Success Criteria**

* SMM manages at least 3–10 clients smoothly
* Client approval loop runs smoothly
* Calendar becomes central workspace
* 90% of posts created & approved without friction
* AI usage < 5% of operational cost
* Minimal bugs in scheduling/workflow