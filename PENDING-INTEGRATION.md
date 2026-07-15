# Pending integration — non-Proofkit changes not on live

Hand-off doc for porting local changes into the **outdated hosted repo**. Everything
Proofkit-related is **excluded** on purpose (see "Excluded" below). Generated 2026-07-15
from `main` @ `81b413a`.

Each section below gives the file, what changed, and a full unified diff you can apply
(`git apply`, or paste into an agent). Diffs are against the state noted per file.

---

## What to integrate (3 files)

| File | What changed | Diff base |
|---|---|---|
| `src/components/sections/HeroLeadForm.astro` | **Dependency for nps.** Shared hero lead-capture card made data-driven (`rows` prop for custom field layouts); no-prop default unchanged. Already on live `main`, but the outdated repo likely predates it — apply it first or nps breaks. | commit `cf16855` (parent `1163312`) |
| `src/pages/nps.astro` | Full NPS page rework (~840 insertions). Uses the new `HeroLeadForm` `rows` prop, so it depends on the file above. | working tree vs `HEAD` |
| `src/pages/currency.astro` | "Currency Futures Vs Currency Options" section reworked from a comparison table into two shared `.check-card` boxes; adds a `.fvo-ar` gold right-arrow marker. Self-contained. | working tree vs `HEAD` |

### Apply order
1. `HeroLeadForm.astro` (dependency)
2. `nps.astro` (needs #1)
3. `currency.astro` (independent — any order)

> **Check first:** if the outdated repo already has a data-driven `HeroLeadForm`
> (props include `rows`), skip diff #1. If it still has the old no-prop-only version,
> apply #1 before #2.

---

## Excluded (Proofkit — per instruction)

Not in this doc: all Proofkit v3 (`src/plugins/proofkit-v3/`, `review3`/`reviewdash3`/`teamdash3`
pages, `docs/proofkit-*.md`, `internal/proofkit-verdict.html`), the Proofkit v2 dashboard changes,
and the two files whose **only** diffs are Proofkit v3 wiring — `src/layouts/BaseLayout.astro`
(v3 overlay import) and `src/pages/404.astro` (v3 router).

---

## 1. src/components/sections/HeroLeadForm.astro (dependency for nps)

~~~~diff
commit cf16855b15992d6bbe85748ce99c16dd1c6ec7b8
Author: Shon <shonydjjv@gmail.com>
Date:   Wed Jul 15 14:31:07 2026 +0530

    HeroLeadForm: data-driven rows (custom field layouts) with backward-compatible defaults
    
    Make the shared hero lead-capture card accept a `rows` field-layout array so a
    page can supply its own field set; the no-prop default reproduces the canonical
    contact-us card (Mobile / Name+City / Purpose) verbatim, and validation is scoped
    per-field so a card only checks the fields it renders. Existing no-prop consumers
    (product heroes) are unchanged.
    
    Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>

diff --git a/src/components/sections/HeroLeadForm.astro b/src/components/sections/HeroLeadForm.astro
index 1520a56..e537905 100644
--- a/src/components/sections/HeroLeadForm.astro
+++ b/src/components/sections/HeroLeadForm.astro
@@ -8,24 +8,49 @@
  *
  *   <Hero ...>
  *     <Fragment slot="title">...</Fragment>
- *     <Fragment slot="lead">...</Fragment>
- *     <HeroLeadForm slot="aside" heading="..." purposes={[...]} />
+ *     <HeroLeadForm slot="aside" heading="..." />
  *   </Hero>
  *
  * Layout (width / gap / mobile stacking) is canonical in global.css
- * (.hero-grid / .hero-aside); the shared field atom is .hf-field (rule 8).
- * Only the card's own look (.hero-form / .hf-head / .hf-body / .hf-otp /
- * .hf-success + the .hf-field.tel decoration) and the submit→OTP→done flow
- * live here, so a change lands once for every page that uses it.
+ * (.hero-grid / .hero-aside); every field is the shared .hf-field atom
+ * (rule 8). Only the card's own look (.hero-form / .hf-head / .hf-body /
+ * .hf-otp / .hf-success + the .hf-field.tel decoration) and the
+ * submit → OTP → thank-you flow live here, so a change lands once for
+ * every page that uses it.
+ *
+ * The card is data-driven: `rows` is an array of rows, each row an array of
+ * field descriptors (1 field = full width, 2 = side by side). The default
+ * reproduces the contact-us card exactly (Mobile / Name+City / Purpose). Pass
+ * a custom `rows` for a page with its own field set (see nps.astro).
+ *
+ * Field descriptor
+ *   { kind: 'text' | 'tel' | 'select' | 'city',
+ *     name, label, placeholder?, required?, error?,
+ *     flag?  (tel only - India flag + +91 prefix; default true),
+ *     options? (select only) }
  *
  * Props
- *   heading?      form title (default "Let's Schedule A Quick Call")
- *   purposes?     Purpose dropdown options (default: the contact-us set)
- *   submitLabel?  submit button label (default "Submit")
+ *   heading?      form title
+ *   description?  optional line under the title
+ *   rows?         field layout (default: Mobile / Name+City / Purpose)
+ *   purposes?     Purpose options for the DEFAULT rows (ignored if `rows` set)
+ *   submitLabel?  submit button label
  *   ariaLabel?    accessible name for the <form> (default = heading)
  */
+interface Field {
+  kind: 'text' | 'tel' | 'select' | 'city';
+  name: string;
+  label: string;
+  placeholder?: string;
+  required?: boolean;
+  error?: string;
+  flag?: boolean;
+  options?: string[];
+}
 interface Props {
   heading?: string;
+  description?: string;
+  rows?: Field[][];
   purposes?: string[];
   submitLabel?: string;
   ariaLabel?: string;
@@ -33,6 +58,8 @@ interface Props {
 
 const {
   heading = "Let's Schedule A Quick Call",
+  description,
+  rows,
   purposes = ['Product related', 'Service related', 'Demat account related', 'Others'],
   submitLabel = 'Submit',
   ariaLabel,
@@ -49,69 +76,78 @@ const cities = [
   'Rajkot', 'Ranchi', 'Salem', 'Surat', 'Thane', 'Thiruvananthapuram', 'Tiruchirappalli',
   'Udaipur', 'Vadodara', 'Varanasi', 'Vijayawada', 'Visakhapatnam', 'Warangal', 'Other',
 ];
+
+/* Default layout = the contact-us card (Mobile / Name+City / Purpose). */
+const defaultRows: Field[][] = [
+  [{ kind: 'tel', name: 'mobile', label: 'Mobile Number', placeholder: '00000 00000', flag: true, required: true }],
+  [
+    { kind: 'text', name: 'name', label: 'Name', placeholder: 'Name', required: true },
+    { kind: 'city', name: 'city', label: 'City', placeholder: 'City', required: true },
+  ],
+  [{ kind: 'select', name: 'purpose', label: 'Purpose', placeholder: 'Purpose', options: purposes, required: true }],
+];
+const layout = rows ?? defaultRows;
+
+/* per-field fallbacks (id / error copy / autocomplete keyed off the field name) */
+const DEFAULT_ERR: Record<string, string> = {
+  mobile: 'Enter a valid 10-digit mobile number.',
+  name: 'Please enter your name.',
+  city: 'Please select your city.',
+  purpose: 'Please select a purpose.',
+};
+const fieldId = (f: Field) => `cf-${f.name}`;
+const errId = (f: Field) => `err-${f.name}`;
+const errText = (f: Field) => f.error ?? DEFAULT_ERR[f.name] ?? 'This field is required.';
+const autoComplete = (f: Field) =>
+  f.name === 'name' ? 'name' : f.kind === 'tel' ? 'tel-national' : undefined;
+const optionsFor = (f: Field) => (f.kind === 'city' ? cities : f.options ?? []);
 ---
 
 <form class="hero-form hero-lead-form hero-aside" aria-label={ariaLabel ?? heading} onsubmit="return false;">
   <div class="hf-head">
     <h2>{heading}</h2>
+    {description && <p>{description}</p>}
   </div>
   <div class="hf-body">
-    <!-- Row 1: Mobile Number (full width) - India flag + +91 treatment on the shared .hf-field -->
-    <div class="hf-row">
-      <div class="hf-unit">
-        <div class="hf-field tel">
-          <span class="tel-flag" aria-hidden="true"><img src="/images/india-flag.png" alt="" /></span>
-          <span class="tel-div" aria-hidden="true"></span>
-          <div class="hf-field-in">
-            <label for="cf-mobile">Mobile Number</label>
-            <div class="tel-row">
-              <span class="tel-cc">+91</span>
-              <input id="cf-mobile" name="mobile" type="tel" inputmode="numeric" autocomplete="tel-national" placeholder="00000 00000" aria-describedby="err-mobile" required />
-            </div>
-          </div>
-        </div>
-        <p class="hf-err" id="err-mobile">Enter a valid 10-digit mobile number.</p>
-      </div>
-    </div>
-    <!-- Row 2: Name + City -->
-    <div class="hf-row">
-      <div class="hf-unit">
-        <div class="hf-field">
-          <div class="hf-field-in">
-            <label for="cf-name">Name</label>
-            <input id="cf-name" name="name" type="text" autocomplete="name" placeholder="Name" aria-describedby="err-name" required />
-          </div>
-        </div>
-        <p class="hf-err" id="err-name">Please enter your name.</p>
-      </div>
-      <div class="hf-unit">
-        <div class="hf-field sel">
-          <div class="hf-field-in">
-            <label for="cf-city">City</label>
-            <select id="cf-city" name="city" aria-describedby="err-city" required>
-              <option value="">City</option>
-              {cities.map((c) => <option>{c}</option>)}
-            </select>
-          </div>
-        </div>
-        <p class="hf-err" id="err-city">Please select your city.</p>
-      </div>
-    </div>
-    <!-- Row 3: Purpose (full width) -->
-    <div class="hf-row">
-      <div class="hf-unit">
-        <div class="hf-field sel">
-          <div class="hf-field-in">
-            <label for="cf-purpose">Purpose</label>
-            <select id="cf-purpose" name="purpose" aria-describedby="err-purpose" required>
-              <option value="">Purpose</option>
-              {purposes.map((p) => <option>{p}</option>)}
-            </select>
+    {layout.map((row) => (
+      <div class="hf-row">
+        {row.map((f) => (
+          <div class="hf-unit">
+            {f.kind === 'tel' && f.flag !== false ? (
+              <div class="hf-field tel">
+                <span class="tel-flag" aria-hidden="true"><img src="/images/india-flag.png" alt="" /></span>
+                <span class="tel-div" aria-hidden="true"></span>
+                <div class="hf-field-in">
+                  <label for={fieldId(f)}>{f.label}</label>
+                  <div class="tel-row">
+                    <span class="tel-cc">+91</span>
+                    <input id={fieldId(f)} name={f.name} type="tel" inputmode="numeric" autocomplete="tel-national" placeholder={f.placeholder} aria-describedby={errId(f)} required={f.required} />
+                  </div>
+                </div>
+              </div>
+            ) : f.kind === 'select' || f.kind === 'city' ? (
+              <div class="hf-field sel">
+                <div class="hf-field-in">
+                  <label for={fieldId(f)}>{f.label}</label>
+                  <select id={fieldId(f)} name={f.name} aria-describedby={errId(f)} required={f.required}>
+                    <option value="">{f.placeholder ?? f.label}</option>
+                    {optionsFor(f).map((o) => <option>{o}</option>)}
+                  </select>
+                </div>
+              </div>
+            ) : (
+              <div class="hf-field">
+                <div class="hf-field-in">
+                  <label for={fieldId(f)}>{f.label}</label>
+                  <input id={fieldId(f)} name={f.name} type={f.kind === 'tel' ? 'tel' : 'text'} inputmode={f.kind === 'tel' ? 'numeric' : undefined} autocomplete={autoComplete(f)} placeholder={f.placeholder} aria-describedby={errId(f)} required={f.required} />
+                </div>
+              </div>
+            )}
+            <p class="hf-err" id={errId(f)}>{errText(f)}</p>
           </div>
-        </div>
-        <p class="hf-err" id="err-purpose">Please select a purpose.</p>
+        ))}
       </div>
-    </div>
+    ))}
   </div>
   <button class="btn btn-primary btn-xl" type="submit">{submitLabel}</button>
   <div class="hf-otp" role="group" aria-label="OTP Verification">
@@ -262,16 +298,16 @@ const cities = [
 
 <script>
   /* Hero lead-capture card: mobile-number grouping + inline validation +
-     submit → OTP → thank-you flow. Scoped per-form so multiple cards on a page
-     (or one per page) each behave independently. */
+     submit → OTP → thank-you flow. Scoped per-form and per-field so a card
+     with a custom field set (e.g. no Purpose) validates only the fields it
+     actually renders. */
   (function () {
     'use strict';
     var forms = Array.prototype.slice.call(document.querySelectorAll('.hero-lead-form'));
     forms.forEach(function (form) {
       var q = function (sel) { return form.querySelector(sel); };
 
-      /* mobile: +91 is a fixed visual prefix, so the value holds only the 10
-         digits grouped "##### #####". A pasted +91 12-digit number is trimmed. */
+      /* mobile: grouped "##### #####"; a pasted +91 12-digit number is trimmed. */
       var mob = q('#cf-mobile');
       if (mob) {
         mob.addEventListener('input', function () {
@@ -282,12 +318,15 @@ const cities = [
         });
       }
 
-      var fields = [
+      /* candidate validators, keyed by field id; only those present are wired */
+      var candidates = [
         { id: '#cf-name', err: '#err-name', test: function (v) { return v.trim().length >= 2; } },
         { id: '#cf-mobile', err: '#err-mobile', test: function (v) { var d = v.replace(/\D/g, ''); if (d.length === 12 && d.slice(0, 2) === '91') { d = d.slice(2); } return d.length === 10; } },
         { id: '#cf-city', err: '#err-city', test: function (v) { return !!v; } },
         { id: '#cf-purpose', err: '#err-purpose', test: function (v) { return !!v; } },
       ];
+      var fields = candidates.filter(function (f) { return q(f.id); });
+
       var check = function (f, showErr) {
         var input = q(f.id), errEl = q(f.err);
         if (!input || !errEl) { return true; }
@@ -299,7 +338,6 @@ const cities = [
       };
       fields.forEach(function (f) {
         var input = q(f.id);
-        if (!input) { return; }
         input.addEventListener('input', function () {
           if (input.closest('.hf-field').classList.contains('invalid')) check(f, true);
         });
~~~~

---

## 2. src/pages/nps.astro

~~~~diff
diff --git a/src/pages/nps.astro b/src/pages/nps.astro
index a4f967a..fef4adb 100644
--- a/src/pages/nps.astro
+++ b/src/pages/nps.astro
@@ -1,99 +1,84 @@
 ---
 /**
- * NPS - /nps/
- * Long-form National Pension System guide. Built entirely from the shared
- * design-system components in global.css (hero, .section/.sec-title, .card,
- * .cat-grid, .product-page_table, .steps, .risks, FaqAccordion, .cta-box).
- * The only page-scoped CSS is a generic responsive card grid (.nps-cards),
- * token-bound. Nested route → BaseLayout / component imports at ../../ depth.
+ * NPS - /nps
+ * Long-form National Pension System guide. Content applied from the V3 content
+ * doc (NPS Page_Shriram Financial Services_V3_BA; July 10). Built from the shared
+ * design-system components (hero, .section/.sec-title, .product-page_table,
+ * .cat-grid/.card/.row-2, StepsRow/StepsRows, .check-list/.bullets, the shared
+ * .calc-* calculator, FaqAccordion, .cta-box). `.doc-flag` banners are TEMPORARY
+ * review markers on things that don't match the doc — remove before ship.
  */
 import BaseLayout from '../layouts/BaseLayout.astro';
 import Hero from '../components/sections/Hero.astro';
 import HeroLeadForm from '../components/sections/HeroLeadForm.astro';
 import StepsRow from '../components/sections/StepsRow.astro';
+import StepsRows from '../components/sections/StepsRows.astro';
 import FaqAccordion from '../components/sections/FaqAccordion.astro';
 import { faqPageSchema, breadcrumbSchema, organizationSchema } from '../lib/seo';
 
-// Asset classes an NPS subscriber can invest across.
-const ASSETS = [
-  {
-    h: 'Equity (E)',
-    p: 'Invests in equity market instruments for long-term growth. Allocation is capped at 75% until age 50, tapering with age under most schemes.',
-  },
-  {
-    h: 'Corporate Debt (C)',
-    p: 'Invests in bonds issued by companies and financial institutions, offering steadier returns than equity with moderate credit risk.',
-  },
-  {
-    h: 'Government Securities (G)',
-    p: 'Invests in central and state government bonds - the lowest-risk asset class in NPS, backed by sovereign issuers.',
-  },
-  {
-    h: 'Alternative Assets (A)',
-    p: 'Invests in instruments such as REITs, InvITs and AIFs. Available only under Active Choice, with allocation capped at 5%.',
-  },
+// How NPS works - 5-step process.
+const WORK_STEPS = [
+  { icon: 'account', title: 'Open & Get PRAN', desc: 'Open an NPS account and receive a Permanent Retirement Account Number (PRAN).' },
+  { icon: 'coins', title: 'Contribute', desc: 'Contribute at your preferred frequency, subject to minimum contribution rules.' },
+  { icon: 'portfolio', title: 'Professionally Invested', desc: 'Your money is invested by professional Pension Fund Managers (PFMs).' },
+  { icon: 'growth', title: 'Grow Over Time', desc: 'The investments grow over time based on market performance.' },
+  { icon: 'withdraw', title: 'Withdraw & Annuity', desc: 'At retirement, withdraw the eligible lump-sum amount, while the remaining corpus generates regular pension income through an annuity.' },
 ];
 
-// Active vs Auto investment choice.
-const CHOICE = [
-  {
-    h: 'Active Choice',
-    p: 'You decide the split across Equity, Corporate Debt, Government Securities and Alternatives yourself - within regulatory caps - and can switch the mix as your risk appetite changes.',
-  },
-  {
-    h: 'Auto Choice (Lifecycle Fund)',
-    p: 'Your allocation is set automatically by a lifecycle fund - Aggressive (LC75), Moderate (LC50) or Conservative (LC25) - that gradually shifts from equity to debt as you age.',
-  },
+// 5 applicant types.
+const APPLICANTS = [
+  { h: 'Individual Subscriber', p: 'Any Indian citizen aged 18–70 can open an NPS account to build a retirement corpus with flexible contributions and long-term tax benefits.' },
+  { h: 'Corporate Subscriber', p: "Employers can contribute to employees' NPS accounts, unlocking additional tax benefits for both — a smart, low-effort retirement solution for the modern workplace." },
+  { h: 'Non-Resident Indian (NRI) Subscriber', p: 'Eligible NRIs can open an NPS account online and build a retirement corpus in India, subject to applicable RBI and FEMA regulations.' },
+  { h: 'Overseas Citizen of India (OCI) Subscriber', p: 'Overseas Citizens of India can also invest in NPS to secure their retirement in India, enjoying the same benefits as resident subscribers.' },
+  { h: 'NPS Vatsalya (Minor) Subscriber', p: 'Parents or guardians can start an NPS account for their child early, letting long-term compounding build a strong retirement corpus by adulthood.' },
 ];
 
-// Withdrawal & annuity considerations at exit.
-const EXIT = [
-  {
-    h: 'Lump-Sum at 60',
-    p: 'On maturity at 60, up to 60% of the corpus can be withdrawn as a lump sum, and this portion is currently tax-free in the subscriber’s hands.',
-  },
-  {
-    h: 'Mandatory Annuity',
-    p: 'At least 40% of the corpus must be used to buy an annuity from a PFRDA-empanelled insurer, which pays you a regular pension for life.',
-  },
-  {
-    h: 'Partial Withdrawal',
-    p: 'From Tier I, you may withdraw up to 25% of your own contributions after three years for specified needs such as education, marriage, home purchase or medical treatment.',
-  },
-  {
-    h: 'Early Exit',
-    p: 'If you exit before 60, at least 80% of the corpus must go towards an annuity and only up to 20% can be taken as a lump sum, subject to conditions.',
-  },
+// Open account - online & offline steps.
+const OPEN_ONLINE = [
+  { icon: 'link', title: 'Visit the Portal', desc: "Visit the eNPS portal or Shriram Financial Services' NPS registration page." },
+  { icon: 'select', title: 'Select Subscriber Type', desc: 'Select your subscriber type: Individual or Corporate NPS. No physical documents are needed at this stage.' },
+  { icon: 'account', title: 'Choose Your PFM', desc: 'Choose your Pension Fund Manager (PFM) from 10 PFRDA-registered options.' },
+  { icon: 'portfolio', title: 'Pick Investment Option', desc: 'Select Active Choice (you define equity, debt, and alternative allocation) or Auto Choice (age-based automatic rebalancing across Aggressive, Moderate, or Conservative Life Cycle Funds).' },
+  { icon: 'bank', title: 'Add Nominee & Bank', desc: 'Add nominee details and bank account information.' },
+  { icon: 'verify', title: 'PRAN Generated', desc: 'Your 12-digit PRAN is generated instantly and sent to your mobile and email.' },
+];
+const OPEN_OFFLINE = [
+  { icon: 'bank', title: 'Visit a PoP', desc: 'Visit your nearest Shriram Financial Services branch or any empanelled PoP location.' },
+  { icon: 'document', title: 'Complete the Form', desc: 'Collect and complete the Composite Application Form (CAF)/Subscriber Registration Form (CSRF).' },
+  { icon: 'upload', title: 'Submit Documents', desc: 'Submit self-attested copies of PAN card, Aadhaar or other address proof, a recent passport-size photograph, and your initial contribution cheque or demand draft.' },
+  { icon: 'verify', title: 'Verification', desc: 'The PoP verifies your documents, processes the registration, and forwards it to the CRA.' },
+  { icon: 'mail', title: 'PRAN Dispatched', desc: 'Your PRAN card is dispatched to your registered address within 10–15 working days.' },
+];
+
+// Corporate documents list.
+const DOCS_CORPORATE = [
+  'Company PAN copy',
+  'Company Incorporation certificate copy',
+  'Company Address Proof',
+  'MOU as per format',
+  'Original Cancelled Cheque',
+  'GST Certificate',
 ];
 
-// Got Questions? - the first 6 FAQs from the compliance doc (display cap; the
-// remainder was stripped and can be restored from the doc if needed). Feeds both
-// the accordion and the FAQPage JSON-LD, so markup and schema cannot drift.
+// "How we verify" trust cards.
+const VERIFY = [
+  { h: 'Primary Source', p: 'All regulatory, eligibility, tax, and contribution information is sourced directly from the Pension Fund Regulatory and Development Authority (PFRDA), the NPS Trust, and official PFRDA circulars and gazette notifications.' },
+  { h: 'Tax Provisions', p: 'All Income Tax Act references are verified against the Income Tax Act, 1961, as amended for FY 2025–26 (AY 2026–27). Provisions cited are applicable as of the date of publication.' },
+  { h: 'CRA Fee Data', p: 'Charge structures are sourced from the official NSDL CRA and KFintech CRA fee schedules, updated as of June 2026.' },
+  { h: 'Return Data', p: "Historical NPS fund performance data is sourced from the NPS Trust's published performance disclosures. No guaranteed return projections are made; all calculator outputs are illustrative." },
+  { h: 'Content Update Schedule', p: 'This page is reviewed and updated quarterly/within 30 days of any PFRDA circular or regulatory amendment that materially affects NPS rules, charges, or tax treatment.' },
+];
+
+// FAQ - capped at 6 (standing display cap for replicated pages). Drives the
+// accordion AND the FAQPage JSON-LD from one array, so they cannot drift.
 const FAQS = [
-  {
-    q: 'What is the National Pension System (NPS)?',
-    a: 'NPS is a voluntary, long-term retirement savings scheme regulated by the Pension Fund Regulatory and Development Authority (PFRDA). You contribute during your working years, the money is invested in a market-linked mix of equity and debt, and it builds a retirement corpus that provides a lump sum and a regular pension at retirement.',
-  },
-  {
-    q: 'Who can open an NPS account?',
-    a: 'Any Indian citizen - resident or non-resident - between 18 and 70 years of age can open an NPS account. It is open to salaried employees, self-employed individuals and NRIs, and requires a PAN, KYC and a bank account.',
-  },
-  {
-    q: 'What is the difference between a Tier I and Tier II account?',
-    a: 'Tier I is the primary retirement account with restricted withdrawals and tax benefits; a PRAN is issued for it. Tier II is a voluntary, savings-style add-on with no withdrawal lock-in and no tax benefit (except for certain government employees). You need an active Tier I account to open a Tier II account.',
-  },
-  {
-    q: 'What is a PRAN?',
-    a: 'A PRAN - Permanent Retirement Account Number - is a unique 12-digit number assigned to every NPS subscriber. It stays with you for life and remains the same even if you change jobs, employers or cities.',
-  },
-  {
-    q: 'How much tax can I save with NPS?',
-    a: 'Contributions to Tier I qualify for deduction under Section 80CCD(1) within the overall ₹1.5 lakh limit of Section 80C, plus an exclusive additional deduction of up to ₹50,000 under Section 80CCD(1B). Employer contributions are separately deductible under Section 80CCD(2), subject to limits.',
-  },
-  {
-    q: 'What returns can I expect from NPS?',
-    a: 'NPS returns are market-linked and not guaranteed - they depend on your asset mix and the performance of your chosen pension fund managers. Historically, the equity and debt schemes have delivered competitive long-term returns, and the low cost structure helps compounding over time.',
-  },
+  { q: 'What is the difference between NPS Tier I and Tier II accounts?', a: 'Tier I is the mandatory primary pension account. It has withdrawal restrictions, offers all NPS tax benefits, and requires a minimum annual contribution of ₹1,000. Tier II is an optional, flexible savings account with no lock-in, full withdrawal flexibility, and no mandatory annual contribution, but tax benefits are limited to Central Government employees only.' },
+  { q: 'Is NPS better than PPF for retirement planning?', a: 'Both are excellent, PFRDA/government-backed, long-term instruments. NPS offers the exclusive ₹50,000 additional deduction under 80CCD(1B), market-linked return potential, and the Corporate NPS benefit for employer contributions. PPF offers full liquidity at maturity with no mandatory annuity purchase. For most investors, a combination of both is optimal.' },
+  { q: 'Can I have both an NPS account and a PPF/EPF account?', a: 'Yes. NPS, PPF, and EPF are entirely separate instruments. You can maintain all three, as each serves a distinct function in a comprehensive retirement plan.' },
+  { q: 'What happens to my NPS if I change jobs?', a: "Nothing changes. Your PRAN (Permanent Retirement Account Number) and all accumulated corpus remain intact regardless of employer changes. In Corporate NPS, if your new employer also offers NPS, contributions simply shift to the new employer's PoP. If the new employer does not offer Corporate NPS, you can continue contributing to your existing account as an individual subscriber under the All Citizen Model, using the same PRAN." },
+  { q: 'Can I withdraw from NPS in an emergency?', a: 'Yes, through the partial withdrawal facility, after 3 years of account holding. You can withdraw up to 25% of your own accumulated contributions (not employer contributions or market gains) for specified life events: children’s education, marriage, medical emergencies, critical illness treatment, home purchase, and skill development. A maximum of three such withdrawals are permitted across the entire tenure.' },
+  { q: 'Is NPS available for self-employed individuals?', a: 'Yes. Self-employed individuals, freelancers, business owners, and those in the unorganised sector can open an NPS account under the All Citizen Model through any PFRDA-empanelled PoP or via the eNPS portal.' },
 ];
 
 const site = Astro.site!.href;
@@ -122,113 +107,520 @@ const seo = {
   <!-- ===== Hero ===== -->
   <Hero
     breadcrumb={[{ name: 'Products', href: '/products' }, { name: 'NPS' }]}
-    cta={{ label: 'Start Investing', href: '/open-demat-account' }}
   >
-    <Fragment slot="title">Build a Retirement Corpus With the <span class="g">National Pension System</span></Fragment>
-    <Fragment slot="lead">A voluntary, market-linked retirement scheme regulated by PFRDA - with an exclusive extra tax benefit, low costs and the flexibility to shape your own asset mix.</Fragment>
-    <HeroLeadForm slot="aside" />
+    <Fragment slot="title">National Pension System: Your Path to a <span class="g">Financially Secure Retirement</span></Fragment>
+    <Fragment slot="lead">Build a retirement corpus with disciplined investing, tax benefits, and flexible pension planning through the National Pension System.</Fragment>
+    <div class="cta-row" slot="cta">
+      <a class="btn btn-primary" href="/open-demat-account">Open NPS Account</a>
+      <a class="btn btn-secondary-inverse" href="/contact-us">Reach an Advisor</a>
+    </div>
+    <div class="hero-aside hero-aside-col" slot="aside">
+      <HeroLeadForm
+        heading="Open Your NPS Account"
+        description="Leave your details — our NPS specialist will call you back to help you open your PRAN and pick the right allocation."
+        submitLabel="Request a Callback"
+        rows={[
+          [{ kind: 'text', name: 'name', label: 'Name', placeholder: 'Your full name', required: true }],
+          [
+            { kind: 'tel', name: 'mobile', label: 'Mobile Number', placeholder: '10-digit mobile', flag: false, required: true },
+            { kind: 'city', name: 'city', label: 'City', placeholder: 'Select your city', required: true },
+          ],
+        ]}
+      />
+      <div class="hero-links">
+        <a href="#">
+          Login with NSDL
+          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"></path></svg>
+        </a>
+        <a href="#">
+          Login with KFintech
+          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"></path></svg>
+        </a>
+        <a href="#">
+          Pay your Monthly SIP
+          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"></path></svg>
+        </a>
+      </div>
+    </div>
   </Hero>
 
-  <!-- ===== What Is NPS ===== -->
-  <section class="section stack sec-light" id="sec-about" data-section="about" style="gap:56px;justify-content:center" data-enter="2">
+  <!-- ===== Intro ===== -->
+  <section class="section stack sec-light" id="sec-about" data-section="about" style="gap:32px;justify-content:center" data-enter="2">
+    <p class="doc-flag">Not in doc: the "Pay your Monthly SIP" hero link, the "Reach an Advisor" button, and the lead-capture form are site additions. Doc hero CTA = Login with NSDL · Login with KFintech · Open NPS Account.</p>
     <div class="stack" style="gap:16px">
-      <h2 class="sec-title">What Is the National Pension System?</h2>
-      <p class="sec-lead">The National Pension System (NPS) is a voluntary, defined-contribution retirement savings scheme regulated by the Pension Fund Regulatory and Development Authority (PFRDA). You contribute regularly during your working years; the money is invested by professional pension fund managers across a market-linked mix of equity and debt; and it accumulates into a retirement corpus that provides both a lump sum and a lifelong pension. Open to every Indian citizen aged 18 to 70, NPS is portable across jobs, employers and locations through a single Permanent Retirement Account Number (PRAN).</p>
+      <h2 class="sec-title">National Pension System: Secure Your Retirement Journey</h2>
+      <p class="sec-lead">Plan your retirement with NPS and start building the corpus that gives you financial independence in the years ahead. Open your National Pension System (NPS) account online, let your contributions grow through market-linked returns and claim attractive tax benefits along the way. It is retirement planning made simple, a fast digital experience that puts you in control from day one.</p>
     </div>
   </section>
 
-  <!-- ===== Tier I vs Tier II ===== -->
-  <section class="section stack sec-tint" id="sec-tiers" data-section="tiers" style="gap:56px;justify-content:center">
+  <!-- ===== How does NPS work? ===== -->
+  <section class="section stack sec-tint" id="sec-work" data-section="work" style="gap:56px;justify-content:center">
     <div class="stack" style="gap:16px">
-      <h2 class="sec-title">Tier I vs Tier II Accounts</h2>
-      <p class="sec-lead" style="color:var(--color-text-secondary)">NPS offers two account types. Tier I is the core retirement account with tax benefits and a withdrawal lock-in; Tier II is an optional, flexible savings account you can open alongside it.</p>
-    </div>
-    <div class="t-scroll"><div class="product-page_table t3 bordered">
-      <div class="cell th"><p>Feature</p></div><div class="cell th"><p>Tier I</p></div><div class="cell th"><p>Tier II</p></div>
-      <div class="cell tb"><p class="k">Purpose</p></div><div class="cell tb"><p class="v">Primary retirement account (PRAN issued)</p></div><div class="cell tb"><p class="v">Voluntary savings add-on to an active Tier I</p></div>
-      <div class="cell tb"><p class="k">Withdrawal</p></div><div class="cell tb"><p class="v">Restricted - locked in until 60, partial withdrawal after 3 years</p></div><div class="cell tb"><p class="v">Fully flexible - withdraw anytime, no lock-in</p></div>
-      <div class="cell tb"><p class="k">Tax Benefit</p></div><div class="cell tb"><p class="v">Yes - 80CCD(1), 80CCD(1B) and 80CCD(2)</p></div><div class="cell tb"><p class="v">None, except a 3-year lock-in option for government employees</p></div>
-      <div class="cell tb"><p class="k">Minimum Contribution</p></div><div class="cell tb"><p class="v">₹500 to open, ₹1,000 per financial year to stay active</p></div><div class="cell tb"><p class="v">₹1,000 to open, no minimum annual balance</p></div>
-    </div></div>
-    <a class="btn btn-primary" href="/open-demat-account" style="align-self:flex-start">Start Investing</a>
+      <h2 class="sec-title">How does NPS work?</h2>
+      <p class="sec-lead" style="color:var(--color-text-secondary)">NPS follows a simple investment process:</p>
+    </div>
+    <StepsRow steps={WORK_STEPS} />
   </section>
 
-  <!-- ===== Asset Classes & Investment Choice ===== -->
-  <section class="section stack sec-light" id="sec-assets" data-section="assets" style="gap:56px;justify-content:center">
+  <!-- ===== Who can use NPS? ===== -->
+  <section class="section stack sec-light" id="sec-who-uses" data-section="who-uses" style="gap:56px;justify-content:center">
     <div class="stack" style="gap:16px">
-      <h2 class="sec-title">Asset Classes &amp; Investment Choice</h2>
-      <p class="sec-lead">Your NPS contributions are invested across four asset classes. You control the mix either directly, or let a lifecycle fund manage it for you as you age.</p>
+      <h2 class="sec-title">Who can use NPS — individuals or corporate employees?</h2>
+      <p class="sec-lead">NPS is available to both individual investors and employees enrolled through an employer-sponsored Corporate NPS plan.</p>
     </div>
-    <div class="stack" style="gap:32px">
-      <div class="stack" style="gap:16px">
-        <h3 class="sub-title">The Four Asset Classes</h3>
-        <p class="sub-lead">Each carries its own risk-return profile, and NPS blends them to balance growth with stability.</p>
+    <div class="row-2" data-reveal-row>
+      <div class="card check-card">
+        <h4 class="ch-title">For Individual Subscribers</h4>
+        <ul class="bullets">
+          <li>Suitable for salaried and self-employed individuals</li>
+          <li>Flexible contribution amounts</li>
+          <li>Choice of investment options and pension fund managers</li>
+          <li>Tax-saving opportunities under applicable Income Tax provisions.</li>
+        </ul>
       </div>
-      <div class="cat-grid" data-reveal-row>
-        {ASSETS.map((a) => (
-          <div class="cat"><h4>{a.h}</h4><p>{a.p}</p></div>
-        ))}
+      <div class="card check-card">
+        <h4 class="ch-title">For Corporate Employees</h4>
+        <ul class="bullets">
+          <li>Employers may offer Corporate NPS as part of employee retirement benefits.</li>
+          <li>Employees continue to enjoy portability even when changing jobs.</li>
+          <li>Employer contributions may offer additional tax advantages as per prevailing tax laws.</li>
+        </ul>
       </div>
     </div>
+    <p class="sec-lead">Whether you invest independently or through your employer, NPS provides a disciplined framework for building long-term retirement wealth.</p>
+  </section>
+
+  <!-- ===== Key Features & Benefits ===== -->
+  <section class="section stack sec-tint" id="sec-features" data-section="features" style="gap:56px;justify-content:center">
+    <div class="stack" style="gap:16px">
+      <h2 class="sec-title">What are the Key Features &amp; Benefits of NPS?</h2>
+      <p class="sec-lead" style="color:var(--color-text-secondary)">Some of the key features and benefits of NPS include:</p>
+    </div>
+    <div class="t-scroll"><div class="product-page_table t2 bordered" style="grid-template-columns:minmax(220px,1fr) minmax(320px,2fr);min-width:640px">
+      <div class="cell th"><p>Features &amp; Benefits</p></div><div class="cell th"><p>Description</p></div>
+      <div class="cell tb"><p class="k">Government-regulated retirement savings framework</p></div><div class="cell tb"><p class="v">NPS is regulated by the Pension Fund Regulatory and Development Authority (PFRDA), ensuring transparency, security, and investor protection.</p></div>
+      <div class="cell tb"><p class="k">Professionally managed investment portfolio</p></div><div class="cell tb"><p class="v">Your NPS contributions are managed by experienced Pension Fund Managers who invest across diversified asset classes.</p></div>
+      <div class="cell tb"><p class="k">Choice of Pension Fund Managers</p></div><div class="cell tb"><p class="v">You can choose from multiple registered Pension Fund Managers and switch between them as per applicable guidelines.</p></div>
+      <div class="cell tb"><p class="k">Flexible contribution amounts</p></div><div class="cell tb"><p class="v">Contribute at your own pace by investing amounts that suit your financial goals, subject to the minimum contribution requirements.</p></div>
+      <div class="cell tb"><p class="k">Market-linked wealth creation potential</p></div><div class="cell tb"><p class="v">Your retirement savings have the opportunity to grow over time through investments linked to the performance of financial markets.</p></div>
+      <div class="cell tb"><p class="k">Low fund management charges</p></div><div class="cell tb"><p class="v">NPS offers one of the lowest fund management costs among retirement investment products, helping maximise your long-term savings.</p></div>
+      <div class="cell tb"><p class="k">Portable account across employers and locations</p></div><div class="cell tb"><p class="v">Your NPS account and PRAN remain the same even if you change jobs, cities, or employers, ensuring uninterrupted retirement planning.</p></div>
+      <div class="cell tb"><p class="k">Attractive tax benefits under the Income Tax Act</p></div><div class="cell tb"><p class="v">Eligible subscribers can avail tax deductions on NPS contributions under the applicable provisions of the Income Tax Act.</p></div>
+      <div class="cell tb"><p class="k">Online account management and contribution facility</p></div><div class="cell tb"><p class="v">Easily manage your NPS account, make contributions, and track your investments through convenient online platforms.</p></div>
+      <div class="cell tb"><p class="k">Suitable for long-term retirement planning</p></div><div class="cell tb"><p class="v">With disciplined investing and the power of compounding, NPS helps you build a retirement corpus for long-term financial security.</p></div>
+    </div></div>
+    <p class="sec-lead" style="color:var(--color-text-secondary)">These features make NPS an effective option for individuals looking to build a retirement corpus while maintaining flexibility throughout their working years.</p>
+  </section>
+
+  <!-- ===== Types of NPS Accounts ===== -->
+  <section class="section stack sec-light" id="sec-types" data-section="types" style="gap:56px;justify-content:center">
+    <div class="stack" style="gap:16px">
+      <h2 class="sec-title">Types of NPS Accounts</h2>
+      <p class="sec-lead">NPS offers two types of accounts: Tier I (the core retirement account) and Tier II (a flexible no-lock-in savings account).</p>
+    </div>
+    <div class="row-2" data-reveal-row>
+      <div class="card"><h4 class="card-h">Tier I Account — The Primary Retirement Account</h4><p class="card-p">Tier I is the core NPS account designed for long-term retirement savings. It offers all major NPS tax benefits and has withdrawal restrictions to help build a dedicated retirement corpus. A minimum annual contribution is required to keep the account active.</p></div>
+      <div class="card"><h4 class="card-h">Tier II Account — The Flexible Savings Account</h4><p class="card-p">This optional account is available only to existing Tier I subscribers. It offers complete flexibility with no lock-in period and allows contributions and withdrawals at any time, making it suitable for short- to medium-term investment goals.</p></div>
+    </div>
+  </section>
+
+  <!-- ===== Types of Applicants ===== -->
+  <section class="section stack sec-tint" id="sec-applicants" data-section="applicants" style="gap:56px;justify-content:center">
+    <div class="stack" style="gap:16px">
+      <h2 class="sec-title">Types of Applicants</h2>
+      <p class="sec-lead" style="color:var(--color-text-secondary)">Applicants refer to the category of subscribers applying for the NPS account. There are 5 types of applicants:</p>
+    </div>
+    <div class="cat-grid cat-grid-3" data-reveal-row>
+      {APPLICANTS.map((a) => (
+        <div class="cat"><h4>{a.h}</h4><p>{a.p}</p></div>
+      ))}
+    </div>
+  </section>
+
+  <!-- ===== How to Open ===== -->
+  <section class="section stack sec-light" id="sec-open" data-section="open" style="gap:56px;align-items:center;justify-content:center">
+    <div class="stack" style="gap:16px;width:100%">
+      <h2 class="sec-title">How to Open an NPS Account?</h2>
+      <p class="sec-lead">You can open an NPS account online in under 30 minutes using Aadhaar OTP e-KYC via the eNPS portal, or offline at a PFRDA-empanelled PoP branch by submitting a Composite Application Form with PAN, Aadhaar, a photo, and your initial contribution.</p>
+    </div>
+    <div class="stack" style="gap:32px;width:100%">
+      <h3 class="sub-title">Online Process</h3>
+      <p class="sub-lead">The online route is available through Shriram Financial Services' digital Point of Presence (PoP) interface. Here is the step-by-step process:</p>
+      <StepsRows perRow={3} steps={OPEN_ONLINE} />
+    </div>
+    <div class="stack" style="gap:32px;width:100%">
+      <h3 class="sub-title">Offline Process — PoP/Bank Branch</h3>
+      <p class="sub-lead">Best for subscribers who prefer an in-person experience, including senior citizens, first-time investors, and those in semi-urban or rural locations. NPS accounts can be opened through any PFRDA-empanelled PoP, which includes major banks, post offices, and NBFCs.</p>
+      <StepsRows perRow={3} steps={OPEN_OFFLINE} />
+    </div>
+    <p class="sec-lead" style="width:100%">Existing NPS subscribers can manage their accounts, including contributions, fund manager switches, nomination changes, and withdrawal requests, through the CRA portals.</p>
+    <div class="two-btn">
+      <a class="btn btn-primary" href="#">Open via NSDL</a>
+      <a class="btn btn-secondary" href="#">Open via KFintech</a>
+    </div>
+  </section>
+
+  <!-- ===== Eligibility ===== -->
+  <section class="section stack sec-tint" id="sec-eligibility" data-section="eligibility" style="gap:56px;justify-content:center">
+    <div class="stack" style="gap:16px">
+      <h2 class="sec-title">Who is Eligible to Open an NPS Account?</h2>
+      <p class="sec-lead" style="color:var(--color-text-secondary)">Any Indian citizen — resident, NRI, or OCI — aged 18 to 85 with a valid PAN and Aadhaar can open an NPS account. HUFs and PIOs are not eligible. Only one PRAN is allowed per person. Government employees joining on or after 1 January 2004 are mandatorily covered.</p>
+    </div>
+    <div class="stack" style="gap:32px">
+      <h3 class="sub-title">Eligibility for Individual Subscribers</h3>
+      <div class="t-scroll"><div class="product-page_table t2 bordered" style="grid-template-columns:minmax(180px,1fr) minmax(320px,2fr);min-width:640px">
+        <div class="cell th"><p>Eligibility Parameters</p></div><div class="cell th"><p>Requirement</p></div>
+        <div class="cell tb"><p class="k">Citizenship</p></div><div class="cell tb"><p class="v">Indian citizen (resident, non-resident, or Overseas Citizen of India / OCI)</p></div>
+        <div class="cell tb"><p class="k">Age</p></div><div class="cell tb"><p class="v">18 years to 85 years at the time of account opening</p></div>
+        <div class="cell tb"><p class="k">KYC Compliance</p></div><div class="cell tb"><p class="v">Valid KYC mandatory — PAN + Aadhaar (OTP-based eKYC accepted online)</p></div>
+        <div class="cell tb"><p class="k">Not Eligible</p></div><div class="cell tb"><p class="v">Hindu Undivided Families (HUFs) and Persons of Indian Origin (PIOs)</p></div>
+        <div class="cell tb"><p class="k">Legal Competency</p></div><div class="cell tb"><p class="v">Must be legally competent to execute a contract under the Indian Contract Act, 1872</p></div>
+        <div class="cell tb"><p class="k">Existing Account</p></div><div class="cell tb"><p class="v">An individual can hold only one NPS account (one PRAN). Duplicate accounts are not permitted.</p></div>
+        <div class="cell tb"><p class="k">NPS Vatsalya</p></div><div class="cell tb"><p class="v">Minors below 18 years can be enrolled by parents/guardians under NPS Vatsalya</p></div>
+      </div></div>
+    </div>
     <div class="stack" style="gap:32px">
-      <div class="stack" style="gap:16px">
-        <h3 class="sub-title">Active vs Auto Choice</h3>
-        <p class="sub-lead">Two ways to decide how your money is allocated across those asset classes.</p>
+      <h3 class="sub-title">Eligibility for Corporate Subscribers</h3>
+      <div class="t-scroll"><div class="product-page_table t2 bordered" style="grid-template-columns:minmax(180px,1fr) minmax(320px,2fr);min-width:640px">
+        <div class="cell th"><p>Parameters</p></div><div class="cell th"><p>Requirement</p></div>
+        <div class="cell tb"><p class="k">Entity Type</p></div><div class="cell tb"><p class="v">Companies (private/public limited), LLPs, partnerships, trusts, NGOs, and other legal entities</p></div>
+        <div class="cell tb"><p class="k">Registration</p></div><div class="cell tb"><p class="v">Entity must register with a PFRDA-empanelled PoP. Shriram Financial Services facilitates Corporate NPS registration end-to-end.</p></div>
+        <div class="cell tb"><p class="k">Employee Coverage</p></div><div class="cell tb"><p class="v">Corporate can enrol individual employees under the Corporate NPS model</p></div>
+        <div class="cell tb"><p class="k">Mandatory Contribution</p></div><div class="cell tb"><p class="v">Not mandated by law for the private sector; voluntary adoption as an employee benefit</p></div>
+        <div class="cell tb"><p class="k">Minimum Employees</p></div><div class="cell tb"><p class="v">No prescribed minimum — even small businesses can adopt Corporate NPS</p></div>
+        <div class="cell tb"><p class="k">Government Entities</p></div><div class="cell tb"><p class="v">Central and State Government employees are mandatorily covered under NPS (joining on/after 1 Jan 2004)</p></div>
+      </div></div>
+    </div>
+    <p class="note-line">Note: NPS is strictly an individual account — it cannot be opened jointly or on behalf of another person (except NPS Vatsalya, where a guardian manages the minor's account).</p>
+  </section>
+
+  <!-- ===== Documents Needed ===== -->
+  <section class="section stack sec-light" id="sec-docs" data-section="docs" style="gap:56px;justify-content:center">
+    <div class="stack" style="gap:16px">
+      <h2 class="sec-title">Documents Needed to Open an NPS Account</h2>
+    </div>
+    <div class="stack" style="gap:32px">
+      <h3 class="sub-title">For Individual Subscribers</h3>
+      <div class="t-scroll"><div class="product-page_table t2 bordered" style="grid-template-columns:minmax(200px,1fr) minmax(320px,2fr);min-width:640px">
+        <div class="cell th"><p>Documents</p></div><div class="cell th"><p>Details / Accepted Formats</p></div>
+        <div class="cell tb"><p class="k">Identity Proof</p></div><div class="cell tb"><p class="v">PAN Card — mandatory for all subscribers</p></div>
+        <div class="cell tb"><p class="k">Address &amp; Identity (KYC)</p></div><div class="cell tb"><p class="v">Aadhaar Card (OTP-based eKYC for online; physical copy for offline)</p></div>
+        <div class="cell tb"><p class="k">Address Proof (offline only)</p></div><div class="cell tb"><p class="v">Voter ID, Passport, Driving Licence, or utility bill (within 3 months)</p></div>
+        <div class="cell tb"><p class="k">Bank Account Proof</p></div><div class="cell tb"><p class="v">Bank account number, which will be confirmed through the Penny Drop verification process</p></div>
+        <div class="cell tb"><p class="k">Initial Contribution</p></div><div class="cell tb"><p class="v">Minimum ₹500 (Tier I) — via UPI/net banking/debit card (online) or cheque/DD (offline)</p></div>
+      </div></div>
+    </div>
+    <div class="stack" style="gap:32px">
+      <h3 class="sub-title">For Corporate Subscribers</h3>
+      <ul class="bullets">
+        {DOCS_CORPORATE.map((d) => <li>{d}</li>)}
+      </ul>
+    </div>
+    <p class="sec-lead">Most individual documents are verified digitally through Aadhaar OTP during online registration. Physical document submission is required only for offline PoP-based applications or for non-standard applicant profiles.</p>
+  </section>
+
+  <!-- ===== Calculator ===== -->
+  <section class="section stack sec-tint" id="sec-calc" data-section="calc" style="gap:24px" data-enter="2">
+    <div class="stack" style="gap:16px">
+      <h2 class="sec-title">NPS Calculators &amp; Tools</h2>
+      <p class="sec-lead" style="color:var(--color-text-secondary)">How much will your NPS corpus be worth at retirement? The answer depends on how much you invest, how long you invest, and the returns your chosen fund earns. Our NPS Return Calculator removes the guesswork, giving you an instant, personalised projection of your retirement corpus and estimated monthly pension.</p>
+    </div>
+    <p class="doc-flag">Doc shows a "[Calculator To Be Added Here]" placeholder — the live calculator module is retained in its place.</p>
+    <div class="calc-row">
+      <!-- inputs -->
+      <div class="card calc-panel">
+        <div class="fields">
+          <div class="field">
+            <div class="field-top">
+              <label for="age">Current Age</label>
+              <div class="field-val"><input id="age" type="text" inputmode="numeric" value="30" aria-label="Current age in years" /><span class="sfx">yrs</span></div>
+            </div>
+            <input class="slider" id="ageR" type="range" min="18" max="59" step="1" value="30" aria-label="Current age in years" />
+            <div class="slider-scale"><span>18 yrs</span><span>59 yrs</span></div>
+          </div>
+
+          <div class="field">
+            <div class="field-top">
+              <label for="rage">Retirement Age</label>
+              <div class="field-val"><input id="rage" type="text" inputmode="numeric" value="60" aria-label="Retirement age in years" /><span class="sfx">yrs</span></div>
+            </div>
+            <input class="slider" id="rageR" type="range" min="40" max="70" step="1" value="60" aria-label="Retirement age in years" />
+            <div class="slider-scale"><span>40 yrs</span><span>70 yrs</span></div>
+          </div>
+
+          <div class="field">
+            <div class="field-top">
+              <label for="amt">Monthly Contribution</label>
+              <div class="field-val"><span class="pfx">₹</span><input id="amt" type="text" inputmode="numeric" value="5,000" aria-label="Monthly contribution in rupees" /></div>
+            </div>
+            <input class="slider" id="amtR" type="range" min="500" max="100000" step="500" value="5000" aria-label="Monthly contribution" />
+            <div class="slider-scale"><span>₹500</span><span>₹1,00,000</span></div>
+          </div>
+
+          <div class="field">
+            <div class="field-top">
+              <label for="rate">Expected Return (% p.a.)</label>
+              <div class="field-val"><input id="rate" type="text" inputmode="decimal" value="10" aria-label="Expected annual rate of return in percent" /><span class="sfx">%</span></div>
+            </div>
+            <input class="slider" id="rateR" type="range" min="4" max="15" step="0.5" value="10" aria-label="Expected annual rate of return in percent" />
+            <div class="slider-scale"><span>4%</span><span>15%</span></div>
+          </div>
+
+          <div class="field">
+            <div class="field-top">
+              <label for="ann">Annuity Purchase (%)</label>
+              <div class="field-val"><input id="ann" type="text" inputmode="numeric" value="40" aria-label="Share of corpus used to buy an annuity, in percent" /><span class="sfx">%</span></div>
+            </div>
+            <input class="slider" id="annR" type="range" min="40" max="100" step="5" value="40" aria-label="Share of corpus used to buy an annuity" />
+            <div class="slider-scale"><span>40%</span><span>100%</span></div>
+          </div>
+
+          <div class="field">
+            <div class="field-top">
+              <label for="arate">Annuity Rate (% p.a.)</label>
+              <div class="field-val"><input id="arate" type="text" inputmode="decimal" value="6" aria-label="Expected annuity rate in percent per year" /><span class="sfx">%</span></div>
+            </div>
+            <input class="slider" id="arateR" type="range" min="4" max="10" step="0.5" value="6" aria-label="Expected annuity rate" />
+            <div class="slider-scale"><span>4%</span><span>10%</span></div>
+          </div>
+        </div>
       </div>
-      <div class="row-2" data-reveal-row>
-        {CHOICE.map((c) => (
-          <div class="card"><h4 class="card-h">{c.h}</h4><p class="card-p">{c.p}</p></div>
-        ))}
+
+      <!-- results -->
+      <div class="calc-results">
+        <div class="bar-wrap">
+          <div class="bar-top">
+            <div class="bar-head">
+              <span class="bar-cap">Total Corpus</span>
+              <span class="bar-tot" id="d-tot">₹1,13,96,627</span>
+            </div>
+            <div class="stack-bar" role="img" aria-label="Corpus split between tax-free lump sum and the annuitised portion">
+              <div class="seg seg-inv" id="seg-inv" style="width:60%"></div>
+              <div class="seg seg-ret" id="seg-ret" style="width:40%"></div>
+            </div>
+          </div>
+
+          <div class="res-cards" data-reveal-row>
+            <div class="res-card">
+              <div class="res-top"><span class="dot" style="background:var(--c-inv)"></span>Lump Sum (Tax-Free)</div>
+              <div class="res-val" id="r-lump">₹68,37,976</div>
+            </div>
+            <div class="res-card">
+              <div class="res-top"><span class="dot" style="background:var(--c-ret)"></span>Monthly Pension</div>
+              <div class="res-val" id="r-pen">₹22,793/mo</div>
+            </div>
+          </div>
+
+          <div class="bar-div" role="presentation"></div>
+
+          <p class="bar-note">Results are estimates. Actual returns, annuity rates and tax rules may vary.</p>
+        </div>
+
+        <div class="ready-bar">
+          <p class="ready-text">Put your plan into action - <b>open a free Demat account</b></p>
+          <a class="ready-btn" href="/open-demat-account">Open Demat Account</a>
+        </div>
       </div>
     </div>
+
+    <p class="sr-only" id="sr-summary" aria-live="polite"></p>
+  </section>
+
+  <!-- ===== Contribution Limits & Rules ===== -->
+  <section class="section stack sec-light" id="sec-limits" data-section="limits" style="gap:56px;justify-content:center">
+    <div class="stack" style="gap:16px">
+      <h2 class="sec-title">NPS Contribution Limits &amp; Rules</h2>
+      <p class="sec-lead">NPS offers substantial flexibility in contribution amounts, with no upper limit on how much you can invest annually. What the rules do define are minimum thresholds to keep the account active and the tax-deductibility ceilings. Here is a complete breakdown:</p>
+    </div>
+    <div class="t-scroll"><div class="product-page_table t3 bordered" style="min-width:720px">
+      <div class="cell th"><p>Contribution Parameters</p></div><div class="cell th"><p>Tier I Account</p></div><div class="cell th"><p>Tier II Account</p></div>
+      <div class="cell tb"><p class="k">Minimum to Open an Account</p></div><div class="cell tb"><p class="v">₹500</p></div><div class="cell tb"><p class="v">₹1,000 (requires active Tier I)</p></div>
+      <div class="cell tb"><p class="k">Minimum Annual Contribution</p></div><div class="cell tb"><p class="v">₹1,000 (to keep the account active)</p></div><div class="cell tb"><p class="v">No minimum annual requirement</p></div>
+      <div class="cell tb"><p class="k">Maximum Annual Contribution</p></div><div class="cell tb"><p class="v">No upper limit</p></div><div class="cell tb"><p class="v">No upper limit</p></div>
+      <div class="cell tb"><p class="k">Frequency</p></div><div class="cell tb"><p class="v">No restriction — contribute any number of times</p></div><div class="cell tb"><p class="v">No restriction</p></div>
+      <div class="cell tb"><p class="k">Mode</p></div><div class="cell tb"><p class="v">UPI, net banking, debit card, cheque, NACH auto-debit</p></div><div class="cell tb"><p class="v">Same as Tier I</p></div>
+      <div class="cell tb"><p class="k">Tax Deductibility</p></div><div class="cell tb"><p class="v">As per the Income Tax provisions [Section 80CCD(1), 80CCD(1B), Section 80CCE, 80C/80CCD(1), 80CCD(2)]</p></div><div class="cell tb"><p class="v">Only Central Govt. employees (₹1.5 lakh, 80C, 3-year lock-in)</p></div>
+    </div></div>
+  </section>
+
+  <!-- ===== Returns ===== -->
+  <section class="section stack sec-tint" id="sec-returns" data-section="returns" style="gap:56px;justify-content:center">
+    <div class="stack" style="gap:16px">
+      <h2 class="sec-title">What Returns Does NPS Offer?</h2>
+      <p class="sec-lead" style="color:var(--color-text-secondary)">NPS offers market-linked non-guaranteed returns from a diversified equity-debt portfolio managed by a Pension Fund Manager (PFM). Historically, NPS equity funds have delivered roughly 10%–14% annualised returns over 10-year periods, while debt funds have generated returns broadly in line with long-term fixed-income benchmarks. Past performance does not guarantee future results.</p>
+    </div>
+  </section>
+
+  <!-- ===== Active vs Auto Choice ===== -->
+  <section class="section stack sec-light" id="sec-allocation" data-section="allocation" style="gap:56px;justify-content:center">
+    <div class="stack" style="gap:16px">
+      <h2 class="sec-title">Active Choice vs. Auto Choice — which allocation mode fits you?</h2>
+      <p class="sec-lead">NPS gives subscribers full control over how their corpus is invested through two distinct allocation modes:</p>
+    </div>
+    <div class="row-2" data-reveal-row>
+      <div class="card"><h4 class="card-h">Active Choice</h4><p class="card-p">It lets you decide how your investments are allocated across Equity, Corporate Bonds, Government Securities, and Alternate Investment Funds, making it suitable for investors with specific risk-return preferences.</p></div>
+      <div class="card"><h4 class="card-h">Auto Choice</h4><p class="card-p">It automatically adjusts your asset allocation based on your age, gradually reducing equity exposure as retirement approaches. It offers Aggressive, Moderate, and Conservative Life Cycle Funds, making it an ideal option for investors who prefer a professionally managed, hands-off investment approach.</p></div>
+    </div>
+    <p class="doc-flag">Doc's asset-class table lists only Equity (E), Corporate Bonds (C), and Government Securities (G). Class A (Alternative Investment Funds) is mentioned in Active Choice copy but has no table row in the doc.</p>
+    <div class="t-scroll"><div class="product-page_table t4 bordered" style="min-width:720px">
+      <div class="cell th"><p>Asset Class</p></div><div class="cell th"><p>Description</p></div><div class="cell th"><p>Risk Profile</p></div><div class="cell th"><p>Typical Allocation (Active, age &lt; 50)</p></div>
+      <div class="cell tb"><p class="k">Equity (E)</p></div><div class="cell tb"><p class="v">PFRDA-regulated, diversified equity funds</p></div><div class="cell tb"><p class="v">Moderate–High</p></div><div class="cell tb"><p class="v">Up to 75%</p></div>
+      <div class="cell tb"><p class="k">Corporate Bonds (C)</p></div><div class="cell tb"><p class="v">AAA-rated and government-owned corporate debt</p></div><div class="cell tb"><p class="v">Low–Moderate</p></div><div class="cell tb"><p class="v">Up to 100%</p></div>
+      <div class="cell tb"><p class="k">Government Securities (G)</p></div><div class="cell tb"><p class="v">Central and State Government bonds</p></div><div class="cell tb"><p class="v">Low</p></div><div class="cell tb"><p class="v">Up to 100%</p></div>
+    </div></div>
   </section>
 
-  <!-- ===== Tax Benefits ===== -->
-  <section class="section stack sec-tint" id="sec-tax" data-section="tax" style="gap:56px;justify-content:center">
+  <!-- ===== Withdrawal & Exit Rules ===== -->
+  <section class="section stack sec-tint" id="sec-withdrawal" data-section="withdrawal" style="gap:56px;justify-content:center">
     <div class="stack" style="gap:16px">
-      <h2 class="sec-title">Tax Benefits</h2>
-      <p class="sec-lead" style="color:var(--color-text-secondary)">NPS is one of the few instruments that stacks multiple deductions - including one that sits over and above the ₹1.5 lakh Section 80C ceiling.</p>
-    </div>
-    <div class="t-scroll"><div class="product-page_table t3 bordered">
-      <div class="cell th"><p>Section</p></div><div class="cell th"><p>Who It Applies To</p></div><div class="cell th"><p>Deduction Limit</p></div>
-      <div class="cell tb"><p class="k">80CCD(1)</p></div><div class="cell tb"><p class="v">Your own contribution (within 80C)</p></div><div class="cell tb"><p class="v">Part of the overall ₹1.5 lakh 80C limit</p></div>
-      <div class="cell tb"><p class="k">80CCD(1B)</p></div><div class="cell tb"><p class="v">Your own contribution (exclusive to NPS)</p></div><div class="cell tb"><p class="v">Additional up to ₹50,000, over and above 80C</p></div>
-      <div class="cell tb"><p class="k">80CCD(2)</p></div><div class="cell tb"><p class="v">Employer contribution</p></div><div class="cell tb"><p class="v">Up to 10% of salary (14% for government employees)</p></div>
+      <h2 class="sec-title">NPS Withdrawal &amp; Exit Rules</h2>
+      <p class="sec-lead" style="color:var(--color-text-secondary)">Understanding NPS withdrawal rules is essential before you invest. PFRDA has progressively liberalised withdrawal norms, and the 2024–25 amendments have given subscribers meaningfully greater control over their corpus.</p>
+    </div>
+    <div class="t-scroll"><div class="product-page_table t4 bordered" style="min-width:820px">
+      <div class="cell th"><p>Exit Type</p></div><div class="cell th"><p>Condition</p></div><div class="cell th"><p>Total Corpus</p></div><div class="cell th"><p>Withdrawal Rule</p></div>
+      <div class="cell tb"><p class="k">Normal Exit</p></div><div class="cell tb"><p class="v">On attaining 60 years of age / employer's retirement age / completion of 15+ years of subscription</p></div><div class="cell tb"><p class="v">Up to ₹8 lakh</p></div><div class="cell tb"><p class="v">100% withdrawal as lump sum</p></div>
+      <div class="cell tb"><p class="k">Normal Exit</p></div><div class="cell tb"><p class="v">On attaining 60 years of age / employer's retirement age / completion of 15+ years of subscription</p></div><div class="cell tb"><p class="v">More than ₹8 lakh and up to ₹12 lakh</p></div><div class="cell tb"><p class="v">Up to ₹6 lakh as a lump sum; the remaining amount to be used for annuity purchase</p></div>
+      <div class="cell tb"><p class="k">Normal Exit</p></div><div class="cell tb"><p class="v">On attaining 60 years of age / employer's retirement age / completion of 15+ years of subscription</p></div><div class="cell tb"><p class="v">More than ₹12 lakh</p></div><div class="cell tb"><p class="v">Up to 80% as a lump sum; at least 20% to be used for lifetime annuity purchase</p></div>
+      <div class="cell tb"><p class="k">Premature Exit</p></div><div class="cell tb"><p class="v">Before attaining 60 years of age or before completing 15 years of subscription</p></div><div class="cell tb"><p class="v">More than ₹5 lakh</p></div><div class="cell tb"><p class="v">Up to 20% as a lump sum; at least 80% to be used for lifetime annuity purchase</p></div>
+      <div class="cell tb"><p class="k">Premature Exit</p></div><div class="cell tb"><p class="v">Before attaining 60 years of age or before completing 15 years of subscription</p></div><div class="cell tb"><p class="v">₹5 lakh or less</p></div><div class="cell tb"><p class="v">100% withdrawal as a lump sum</p></div>
+      <div class="cell tb"><p class="k">Exit Due to Death</p></div><div class="cell tb"><p class="v">On the death of the subscriber</p></div><div class="cell tb"><p class="v">Any corpus amount</p></div><div class="cell tb"><p class="v">Nominee receives 100% as a lump sum, OR nominee may use the entire corpus to purchase an annuity, OR nominee may continue under NPS by opening an individual NPS account</p></div>
     </div></div>
-    <a class="btn btn-primary" href="/open-demat-account" style="align-self:flex-start">Start Investing</a>
   </section>
 
-  <!-- ===== How to Open & Contribute ===== -->
-  <section class="section stack sec-light" id="sec-open" data-section="open" style="gap:56px;justify-content:center">
+  <!-- ===== Taxation ===== -->
+  <section class="section stack sec-light" id="sec-tax" data-section="tax" style="gap:56px;justify-content:center">
     <div class="stack" style="gap:16px">
-      <h2 class="sec-title">How to Open &amp; Contribute</h2>
-      <p class="sec-lead">Getting started takes just a few steps - from generating your PRAN to making your first contribution.</p>
-    </div>
-    <StepsRow steps={[
-      { icon: 'account', title: 'Generate Your PRAN', desc: 'Register online via eNPS or a Point of Presence (POP) to get your Permanent Retirement Account Number.' },
-      { icon: 'kyc', title: 'Complete PAN / KYC', desc: 'Submit your PAN, complete Aadhaar-based eKYC and link your bank account.' },
-      { icon: 'select', title: 'Choose Fund Manager & Allocation', desc: 'Select a PFRDA-registered pension fund manager and pick Active or Auto Choice for your asset mix.' },
-      { icon: 'fund', title: 'Contribute & Track', desc: 'Invest via one-off or recurring contributions and monitor your corpus as it grows.' },
-    ]} />
-    <a class="btn btn-primary" href="/open-demat-account" style="align-self:center">Start Investing</a>
+      <h2 class="sec-title">How is NPS Taxed?</h2>
+      <p class="sec-lead">NPS enjoys an EET (Exempt-Exempt-Tax) tax treatment structure — contributions and investment growth are exempt from tax, while annuity income in retirement is taxed. Here is the complete tax picture at exit:</p>
+    </div>
+    <div class="t-scroll"><div class="product-page_table t3 bordered" style="min-width:720px">
+      <div class="cell th"><p>NPS Component at Exit</p></div><div class="cell th"><p>Tax Treatment</p></div><div class="cell th"><p>Applicable Section</p></div>
+      <div class="cell tb"><p class="k">60% Lump Sum Withdrawal at Maturity</p></div><div class="cell tb"><p class="v">Fully tax-free</p></div><div class="cell tb"><p class="v">Section 10(12A)</p></div>
+      <div class="cell tb"><p class="k">Annuity Purchase Amount (20% minimum)</p></div><div class="cell tb"><p class="v">Exempt at time of purchase</p></div><div class="cell tb"><p class="v">Section 80CCD(5)</p></div>
+      <div class="cell tb"><p class="k">Monthly Annuity Income (post-retirement)</p></div><div class="cell tb"><p class="v">Taxable — at slab rate as ordinary income</p></div><div class="cell tb"><p class="v">Section 80CCD(3)</p></div>
+      <div class="cell tb"><p class="k">Partial Withdrawal (up to 25% of own contributions)</p></div><div class="cell tb"><p class="v">Tax-free</p></div><div class="cell tb"><p class="v">Section 10(12B)</p></div>
+      <div class="cell tb"><p class="k">Premature Exit — Annuity Purchase (80%)</p></div><div class="cell tb"><p class="v">Exempt at time of purchase; annuity income taxable</p></div><div class="cell tb"><p class="v">Section 80CCD(5) / (3)</p></div>
+      <div class="cell tb"><p class="k">Death of Subscriber — Corpus to Nominee</p></div><div class="cell tb"><p class="v">Entire corpus paid out; tax treatment per nominee's slab</p></div><div class="cell tb"><p class="v">PFRDA Regulations</p></div>
+    </div></div>
+  </section>
+
+  <!-- ===== Fees & Charges ===== -->
+  <section class="section stack sec-tint" id="sec-fees" data-section="fees" style="gap:56px;justify-content:center">
+    <div class="stack" style="gap:16px">
+      <h2 class="sec-title">NPS Fees &amp; Charges</h2>
+      <p class="sec-lead" style="color:var(--color-text-secondary)">The complete breakdown of the NPS fee structure:</p>
+    </div>
+    <div class="stack" style="gap:32px">
+      <h3 class="sub-title">PRAN Card &amp; CRA Annual Maintenance Costs</h3>
+      <div class="t-scroll"><div class="product-page_table t3 bordered" style="min-width:640px">
+        <div class="cell th"><p>Charge Type</p></div><div class="cell th"><p>Protean (NSDL) CRA</p></div><div class="cell th"><p>KFintech CRA</p></div>
+        <div class="cell tb"><p class="k">PRAN (Account Opening)</p></div><div class="cell tb"><p class="v">₹40 (physical PRAN card) / ₹18 (ePRAN)</p></div><div class="cell tb"><p class="v">₹39.36 (ePRAN) / ₹4 (physical)</p></div>
+        <div class="cell tb"><p class="k">Annual Maintenance Charge (AMC)</p></div><div class="cell tb"><p class="v">₹69 per year</p></div><div class="cell tb"><p class="v">₹57.63 per year</p></div>
+        <div class="cell tb"><p class="k">Per-Transaction Charge</p></div><div class="cell tb"><p class="v">₹3.75 per financial transaction</p></div><div class="cell tb"><p class="v">₹3.36 per financial transaction</p></div>
+      </div></div>
+    </div>
+    <div class="stack" style="gap:32px">
+      <h3 class="sub-title">PoP Charges</h3>
+      <div class="t-scroll"><div class="product-page_table t4 bordered" style="min-width:720px">
+        <div class="cell th"><p>Charge Type</p></div><div class="cell th"><p>Rate</p></div><div class="cell th"><p>Minimum Charge</p></div><div class="cell th"><p>Deduction Frequency</p></div>
+        <div class="cell tb"><p class="k">POP Charges</p></div><div class="cell tb"><p class="v">0.20% p.a. of Assets Under Management (AUM)</p></div><div class="cell tb"><p class="v">₹30</p></div><div class="cell tb"><p class="v">Deducted quarterly at 0.05% of AUM (end of each quarter)</p></div>
+      </div></div>
+    </div>
+    <p class="sec-lead" style="color:var(--color-text-secondary)">Contribution payments via UPI and net banking are free of gateway charges. Credit card contributions attract a payment gateway surcharge, typically 0.90%–1.80% charged by the payment gateway provider, not PFRDA. The single most compelling cost advantage of NPS is its Fund Management Charge (FMC), capped by PFRDA at 0.01% per annum of Assets Under Management.</p>
+    <p class="note-line">For the latest charge/fee structure for NPS, please visit <a href="https://npstrust.org.in/charges-under-nps" target="_blank" rel="noopener">npstrust.org.in/charges-under-nps</a>.</p>
   </section>
 
-  <!-- ===== Withdrawal & Annuity ===== -->
-  <section class="section stack sec-tint" id="sec-exit" data-section="exit" style="gap:56px;justify-content:center">
+  <!-- ===== How We Verify ===== -->
+  <section class="section stack sec-light" id="sec-verify" data-section="verify" style="gap:56px;justify-content:center">
     <div class="stack" style="gap:16px">
-      <h2 class="sec-title">Withdrawal &amp; Annuity at 60</h2>
-      <p class="sec-lead" style="color:var(--color-text-secondary)">NPS is designed for the long haul, so access to the corpus is structured. Here is how withdrawals, the mandatory annuity and early exits work.</p>
+      <h2 class="sec-title">How We Verify NPS Information</h2>
+      <p class="sec-lead">At Shriram Financial Services, all NPS content published across our website is researched, verified, and updated using primary regulatory sources. Our methodology is designed to meet the highest standards of accuracy, transparency, and trustworthiness for our readers:</p>
     </div>
-    <div class="nps-cards" data-reveal-row>
-      {EXIT.map((e) => (
-        <div class="card"><h4 class="card-h">{e.h}</h4><p class="card-p">{e.p}</p></div>
+    <div class="cat-grid cat-grid-3" data-reveal-row>
+      {VERIFY.map((v) => (
+        <div class="cat"><h4>{v.h}</h4><p>{v.p}</p></div>
       ))}
     </div>
-    <p class="sec-lead" style="color:var(--color-text-secondary)">Because a large part of the corpus converts into a lifelong annuity, treat NPS as a dedicated retirement allocation - align your contributions, asset choice and horizon with the pension you want at 60.</p>
   </section>
 
-  <!-- ===== General Questions ===== -->
-  <section class="faq-wrap sec-light" id="sec-faq" data-section="faq">
+  <!-- ===== Compare ===== -->
+  <section class="section stack sec-tint" id="sec-compare" data-section="compare" style="gap:56px;justify-content:center">
+    <div class="stack" style="gap:16px">
+      <h2 class="sec-title">NPS vs. Mutual Funds vs. Direct Equity</h2>
+    </div>
+    <div class="t-scroll"><div class="product-page_table t4 bordered" style="min-width:900px">
+      <div class="cell th"><p>Parameters</p></div><div class="cell th"><p>National Pension System (NPS)</p></div><div class="cell th"><p>Mutual Funds</p></div><div class="cell th"><p>Direct Equity</p></div>
+      <div class="cell tb"><p class="k">Primary Objective</p></div><div class="cell tb"><p class="v">Long-term retirement planning with regular pension income</p></div><div class="cell tb"><p class="v">Goal-based wealth creation and financial planning</p></div><div class="cell tb"><p class="v">Long-term wealth creation through stock investments</p></div>
+      <div class="cell tb"><p class="k">Returns</p></div><div class="cell tb"><p class="v">Market-linked returns based on chosen asset allocation and Pension Fund Manager</p></div><div class="cell tb"><p class="v">Market-linked returns based on the selected mutual fund scheme</p></div><div class="cell tb"><p class="v">Market-linked returns based on individual stock performance</p></div>
+      <div class="cell tb"><p class="k">Liquidity</p></div><div class="cell tb"><p class="v">Limited, with withdrawals governed by PFRDA regulations</p></div><div class="cell tb"><p class="v">High liquidity with easy redemption (except lock-in schemes like ELSS)</p></div><div class="cell tb"><p class="v">High liquidity; shares can generally be bought and sold on trading days</p></div>
+      <div class="cell tb"><p class="k">Tax Benefits</p></div><div class="cell tb"><p class="v">Eligible tax deductions under applicable sections of the Income Tax Act, including an additional deduction under Section 80CCD(1B)</p></div><div class="cell tb"><p class="v">Tax benefits are available only on eligible schemes such as ELSS</p></div><div class="cell tb"><p class="v">No tax deduction on investments</p></div>
+      <div class="cell tb"><p class="k">Retirement Income</p></div><div class="cell tb"><p class="v">Mandatory annuity purchase (subject to applicable rules) helps provide a regular pension after retirement</p></div><div class="cell tb"><p class="v">No annuity or pension feature</p></div><div class="cell tb"><p class="v">No annuity or pension feature</p></div>
+      <div class="cell tb"><p class="k">Risk Level</p></div><div class="cell tb"><p class="v">Moderate, with diversified investments across equity and debt</p></div><div class="cell tb"><p class="v">Varies based on the type of mutual fund</p></div><div class="cell tb"><p class="v">Generally higher, as investments are concentrated in individual stocks</p></div>
+      <div class="cell tb"><p class="k">Investment Management</p></div><div class="cell tb"><p class="v">Managed by professional Pension Fund Managers</p></div><div class="cell tb"><p class="v">Managed by professional fund managers</p></div><div class="cell tb"><p class="v">Managed by the investor, requiring active monitoring and decision-making</p></div>
+      <div class="cell tb"><p class="k">Best Suited For</p></div><div class="cell tb"><p class="v">Investors looking to build a retirement corpus with tax benefits</p></div><div class="cell tb"><p class="v">Investors pursuing financial goals such as education, home purchase, or wealth creation</p></div><div class="cell tb"><p class="v">Experienced investors seeking higher return potential and willing to take higher risks</p></div>
+    </div></div>
+    <div class="acct-grid" data-reveal-row>
+      <div class="acct-card">
+        <span class="acct-ico" aria-hidden="true"><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 3l7 2.5v5c0 4.5-3 7.8-7 9-4-1.2-7-4.5-7-9v-5z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="m9 12 2 2 4-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
+        <div class="acct-body">
+          <h4>Open an NPS Account</h4>
+          <div class="acct-btns">
+            <a class="btn btn-primary" href="#">With NSDL</a>
+            <a class="btn btn-secondary" href="#">With KFintech</a>
+          </div>
+        </div>
+        <p class="acct-cap">Secure • Regulated • Trusted by millions</p>
+      </div>
+      <div class="acct-card">
+        <span class="acct-ico" aria-hidden="true"><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M4 20V4M4 20h16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M8 16v-3M12 16v-6M16 16v-4M20 16V7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></span>
+        <div class="acct-body">
+          <h4>Open a Demat Account</h4>
+          <div class="acct-btns">
+            <a class="btn btn-secondary" href="/open-demat-account">Open Demat Account</a>
+          </div>
+        </div>
+        <p class="acct-cap">Invest directly in stocks</p>
+      </div>
+      <div class="acct-card">
+        <span class="acct-ico" aria-hidden="true"><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="3" y="6" width="18" height="12.5" rx="2.5" stroke="currentColor" stroke-width="1.8"/><path d="M3 9.5h18" stroke="currentColor" stroke-width="1.8"/><circle cx="16.5" cy="13.75" r="1.5" fill="currentColor"/></svg></span>
+        <div class="acct-body">
+          <h4>Open Purse+</h4>
+          <div class="acct-btns">
+            <a class="btn btn-secondary" href="/terms-of-use-purse">Open Purse+</a>
+          </div>
+        </div>
+        <p class="acct-cap doc-flag" style="margin-top:auto">Doc lists "Open Purse+" as a CTA but gives no destination — link points to the Purse+ terms page as a placeholder.</p>
+      </div>
+    </div>
+    <div class="stack" style="gap:16px">
+      <h3 class="sub-title">Key Takeaway</h3>
+      <p class="sec-lead" style="color:var(--color-text-secondary)">NPS is best suited as a core retirement planning solution, offering long-term wealth creation, tax benefits, and a regular pension through an annuity. Mutual funds are ideal for achieving diverse financial goals with greater liquidity, while direct equity is better suited for experienced investors seeking potentially higher returns through active portfolio management.</p>
+    </div>
+  </section>
+
+  <!-- ===== Contact ===== -->
+  <section class="section stack sec-light" id="sec-contact" data-section="contact" style="gap:56px;justify-content:center">
+    <div class="stack" style="gap:16px">
+      <h2 class="sec-title">Contact &amp; Support</h2>
+      <p class="sec-lead">Contact Shriram Financial Services for personalised NPS guidance.</p>
+    </div>
+    <div class="contact-grid" data-reveal-row>
+      <div class="contact-card">
+        <h4 class="card-h">Customer Care</h4>
+        <p class="contact-val">080-47185579</p>
+        <p class="contact-val">080-43676869 Extn. 825 / 831</p>
+        <a class="btn btn-secondary btn-md" href="tel:08047185579">Call Now</a>
+      </div>
+      <div class="contact-card">
+        <h4 class="card-h">Email Support</h4>
+        <p class="contact-val">support@shriramfs.com</p>
+        <a class="btn btn-secondary btn-md" href="mailto:support@shriramfs.com">Send an Email</a>
+      </div>
+    </div>
+  </section>
+
+  <!-- ===== FAQ ===== -->
+  <section class="faq-wrap sec-tint" id="sec-faq" data-section="faq">
     <div class="faq-cols">
       <div class="faq-left">
         <h2 class="faq-title">Got Questions?</h2>
@@ -238,48 +630,325 @@ const seo = {
         <div class="usr"><img src="/assets/user.svg" alt="" /></div>
         <div class="side-in">
           <div class="side-tx">
-            <h3>Need A Clearer Direction?</h3>
-            <p>Let's get in touch on a 15-minute call where we can answer any questions you may have. Our advisor will help map your wealth mix and show what a dedicated, research-led retirement plan would do differently.</p>
+            <h3>Still got questions?</h3>
+            <p>Our NPS experts will help you choose the right allocation, PFM, and tax strategy for your retirement goals.</p>
           </div>
-          <a class="btn btn-primary" href="/contact-us">Book A Discovery Call</a>
+          <a class="btn btn-primary" href="/contact-us">Book a Call</a>
         </div>
       </div>
     </div>
   </section>
 
   <!-- ===== Final CTA ===== -->
-  <section class="cta-sec sec-tint" id="sec-final-cta" data-section="final-cta">
+  <section class="cta-sec sec-light" id="sec-final-cta" data-section="final-cta">
     <div class="cta-box">
       <div class="ct-tt">
-        <h3>Start Building Your Retirement Corpus</h3>
-        <p class="ct-sub">Open your account in minutes and begin contributing to NPS with zero paperwork.</p>
+        <h3>Secure Your Retirement with NPS Today</h3>
+        <p class="ct-sub">Open your NPS PRAN account with Shriram Financial Services. Save up to ₹2 lakh in tax, grow wealth, and ensure a guaranteed monthly pension.</p>
       </div>
-      <a class="btn btn-primary" href="/open-demat-account">Start Investing</a>
+      <a class="btn btn-primary" href="/open-demat-account">Open NPS Account</a>
     </div>
   </section>
 </BaseLayout>
 
 <style>
-  /* ===== nps - page-specific only ===== */
+  /* ===== nps - page-specific only (token-bound) ===== */
+
+  /* TEMPORARY review markers - flag content that doesn't match the V3 doc.
+     Remove all `.doc-flag` elements + this rule before shipping. */
+  .doc-flag {
+    display: block;
+    margin: 0;
+    padding: 10px 16px;
+    border: 1px dashed #b45309; /* amber-700 - temp, page-local */
+    border-radius: 8px;
+    background: #fff7ed; /* amber-50 - temp, page-local */
+    color: #9a3412; /* amber-800 - temp, page-local */
+    font-weight: 600;
+    font-size: 13px;
+    line-height: 1.5;
+    align-self: stretch;
+  }
+
+  /* Hero: two-CTA row + quick-login link row. */
+  .cta-row { display: flex; flex-wrap: wrap; gap: 16px; }
+  .two-btn { display: flex; flex-wrap: wrap; gap: 16px; justify-content: center; }
+
+  /* Right hero column: form card + the quick-login links stacked beneath it. */
+  .hero-aside-col { display: flex; flex-direction: column; gap: 24px; }
+
+  .hero-links { display: flex; flex-direction: column; align-items: flex-start; gap: 12px; }
+  .hero-links a {
+    display: inline-flex;
+    align-items: center;
+    gap: 8px;
+    font-weight: 600;
+    font-size: 14px;
+    color: var(--color-white);
+    transition: color 0.2s ease;
+  }
+  .hero-links svg { width: 16px; height: 16px; flex: none; }
+  @media (min-width: 1024px) and (hover: hover) {
+    .hero-links a:hover { color: var(--color-gold-400); }
+  }
 
-  /* Generic responsive card grid for the withdrawal/annuity card set (the shared
-     .row-2 is 2-up and .cat-grid's border math is tuned for its own cell count;
-     this handles arbitrary counts). Values are on the 8px grid. */
-  .nps-cards {
+  /* Recurring "note" bar (eligibility / fees notes). */
+  .note-line {
+    background: var(--color-surface-card);
+    border: 1px solid var(--color-border-card);
+    border-radius: 12px;
+    padding: 16px 20px;
+    font-weight: 400;
+    font-size: 14px;
+    color: var(--color-text-secondary);
+  }
+  .note-line a { color: var(--color-link); font-weight: 500; }
+
+  /* Eligibility: 2x2 grid on desktop (global collapses it below 1024/560). */
+  @media (min-width: 1025px) {
+    #sec-eligibility .encl-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
+  }
+
+  /* Account / contact CTA card grids. */
+  .acct-grid, .contact-grid {
     display: grid;
-    grid-template-columns: repeat(2, minmax(0, 1fr));
-    gap: 24px;
+    grid-template-columns: repeat(3, minmax(0, 1fr));
+    gap: 28px;
     align-items: stretch;
   }
-  .nps-cards .card {
+  .contact-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
+  .contact-card {
+    background: var(--color-surface-card);
+    border: 1px solid var(--color-border-card);
+    border-radius: 20px;
+    padding: 28px;
     display: flex;
     flex-direction: column;
     gap: 12px;
+    align-items: flex-start;
+  }
+  .contact-val { font-weight: 600; font-size: 18px; color: var(--color-text-heading-dark); overflow-wrap: anywhere; }
+  .contact-card .btn { margin-top: auto; }
+
+  /* Account CTA cards - icon chip, heading + actions, footer caption. */
+  .acct-card {
+    background: var(--color-surface-card);
+    border: 1px solid var(--color-border-card);
+    border-radius: 24px;
+    padding: 36px 32px;
+    display: flex;
+    flex-direction: column;
+    gap: 24px;
+    align-items: flex-start;
+  }
+  .acct-ico {
+    width: 56px;
+    height: 56px;
+    flex: none;
+    border-radius: 16px;
+    background: var(--color-gold-100);
+    color: var(--color-text-heading-dark);
+    display: flex;
+    align-items: center;
+    justify-content: center;
+  }
+  .acct-ico svg { width: 28px; height: 28px; display: block; }
+  .acct-body { display: flex; flex-direction: column; gap: 20px; align-items: flex-start; }
+  .acct-card h4 { font-weight: 600; font-size: 22px; color: var(--color-text-heading-dark); }
+  /* Buttons sit side by side and fill the card width, sharing it equally. */
+  .acct-btns { display: flex; gap: 12px; width: 100%; }
+  .acct-btns .btn { flex: 1 1 0; min-width: 0; }
+  .acct-cap {
+    margin-top: auto;
+    padding-top: 20px;
+    width: 100%;
+    border-top: 1px solid var(--color-border-hairline);
+    font-weight: 500;
+    font-size: 13px;
+    color: var(--color-text-muted);
   }
 
-  @media (max-width: 560px) {
-    .nps-cards {
-      grid-template-columns: 1fr;
+  /* NPS calculator has six inputs - lay the sliders out two-across from tablet up. */
+  @media (min-width: 640px) {
+    .fields {
+      flex: 1;
+      display: grid;
+      grid-template-columns: repeat(2, minmax(0, 1fr));
+      column-gap: 64px;
+      row-gap: 32px;
+      align-content: space-between;
     }
   }
+
+  @media (max-width: 900px) {
+    .acct-grid, .contact-grid { grid-template-columns: 1fr; }
+  }
 </style>
+
+<script>
+  // NPS calculator - SIP-style corpus to retirement, then annuitisation split.
+  import { createFlow } from '../scripts/number-flow';
+
+  const fmt = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
+  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
+
+  const age = document.getElementById('age') as HTMLInputElement;
+  const ageR = document.getElementById('ageR') as HTMLInputElement;
+  const rage = document.getElementById('rage') as HTMLInputElement;
+  const rageR = document.getElementById('rageR') as HTMLInputElement;
+  const amt = document.getElementById('amt') as HTMLInputElement;
+  const amtR = document.getElementById('amtR') as HTMLInputElement;
+  const rate = document.getElementById('rate') as HTMLInputElement;
+  const rateR = document.getElementById('rateR') as HTMLInputElement;
+  const ann = document.getElementById('ann') as HTMLInputElement;
+  const annR = document.getElementById('annR') as HTMLInputElement;
+  const arate = document.getElementById('arate') as HTMLInputElement;
+  const arateR = document.getElementById('arateR') as HTMLInputElement;
+
+  const segInv = document.getElementById('seg-inv') as HTMLElement;
+  const segRet = document.getElementById('seg-ret') as HTMLElement;
+
+  // odometer reels for the three result values
+  const flowTot = createFlow(document.getElementById('d-tot') as HTMLElement);
+  const flowLump = createFlow(document.getElementById('r-lump') as HTMLElement);
+  const flowPen = createFlow(document.getElementById('r-pen') as HTMLElement);
+  let started = false; // first paint snaps; every change after that rolls
+
+  function digits(s: string) {
+    return String(s).replace(/[^0-9.]/g, '');
+  }
+  function clamp(v: number, mn: number, mx: number) {
+    return Math.max(mn, Math.min(mx, v));
+  }
+  function fillSlider(sl: HTMLInputElement) {
+    const p = ((+sl.value - +sl.min) / (+sl.max - +sl.min)) * 100;
+    sl.style.background =
+      'linear-gradient(90deg, var(--color-olive-600) 0%, var(--color-olive-600) ' + p + '%, var(--color-gray-100) ' + p + '%, var(--color-gray-100) 100%)';
+  }
+
+  const DUR = 300;
+  function animateCount(
+    el: HTMLElement & { _raf?: number | null },
+    to: number,
+    read: (el: HTMLElement) => number,
+    write: (el: HTMLElement, v: number) => void
+  ) {
+    const from = read(el);
+    if (el._raf) {
+      cancelAnimationFrame(el._raf);
+      el._raf = null;
+    }
+    if (reduce || Math.abs(to - from) < 1) {
+      write(el, to);
+      return;
+    }
+    let t0: number | null = null;
+    function tick(ts: number) {
+      if (t0 === null) t0 = ts;
+      const t = Math.min(1, (ts - t0) / DUR);
+      const e = 1 - Math.pow(1 - t, 3);
+      write(el, from + (to - from) * e);
+      el._raf = t < 1 ? requestAnimationFrame(tick) : null;
+    }
+    el._raf = requestAnimationFrame(tick);
+  }
+  function countInput(el: HTMLInputElement, to: number, fn: (n: number) => string) {
+    animateCount(el, to, (e) => parseFloat(digits((e as HTMLInputElement).value)) || 0, (e, v) => {
+      (e as HTMLInputElement).value = fn(v);
+    });
+  }
+
+  function render() {
+    const curAge = clamp(+ageR.value, +ageR.min, +ageR.max);
+    const retAge = clamp(+rageR.value, +rageR.min, +rageR.max);
+    const monthly = clamp(+amtR.value, +amtR.min, +amtR.max);
+    const ratePct = clamp(+rateR.value, +rateR.min, +rateR.max);
+    const annPct = clamp(+annR.value, +annR.min, +annR.max);
+    const annRatePct = clamp(+arateR.value, +arateR.min, +arateR.max);
+
+    const months = Math.max(0, Math.round((retAge - curAge) * 12));
+    const i = ratePct / 100 / 12;
+    const corpus = i > 0 ? monthly * ((Math.pow(1 + i, months) - 1) / i) * (1 + i) : monthly * months;
+    const annuityValue = corpus * (annPct / 100);
+    const lump = corpus - annuityValue;
+    const pension = (annuityValue * (annRatePct / 100)) / 12;
+    const rupee = (v: number) => '₹' + fmt.format(Math.round(v));
+    const perMonth = (v: number) => '₹' + fmt.format(Math.round(v)) + '/mo';
+
+    const roll = started && !reduce;
+    flowTot(rupee(corpus), roll);
+    flowLump(rupee(lump), roll);
+    flowPen(perMonth(pension), roll);
+    started = true;
+
+    const lumpPct = corpus > 0 ? (lump / corpus) * 100 : 0;
+    segInv.style.width = lumpPct + '%';
+    segRet.style.width = 100 - lumpPct + '%';
+
+    (document.getElementById('sr-summary') as HTMLElement).textContent =
+      'By age ' + retAge + ' your corpus is ' + rupee(corpus) + ', giving a ' + rupee(lump) + ' tax-free lump sum and about ' + perMonth(pension) + ' pension.';
+
+    ageR.setAttribute('aria-valuetext', curAge + ' years');
+    rageR.setAttribute('aria-valuetext', retAge + ' years');
+    amtR.setAttribute('aria-valuetext', '₹' + fmt.format(monthly));
+    rateR.setAttribute('aria-valuetext', ratePct + ' percent');
+    annR.setAttribute('aria-valuetext', annPct + ' percent');
+    arateR.setAttribute('aria-valuetext', annRatePct + ' percent');
+  }
+
+  function pairNumberAndSlider(numEl: HTMLInputElement, slEl: HTMLInputElement, group: boolean) {
+    const dec = ((slEl.step || '').split('.')[1] || '').length;
+    const fmtField = (v: number) =>
+      group ? fmt.format(Math.round(v)) : String(+v.toFixed(dec));
+
+    slEl.addEventListener('input', function () {
+      countInput(numEl, +slEl.value, fmtField);
+      fillSlider(slEl);
+      render();
+    });
+    numEl.addEventListener('input', function () {
+      const raw = parseFloat(digits(numEl.value)) || 0;
+      if (group) numEl.value = raw ? fmt.format(raw) : '';
+      slEl.value = String(clamp(raw, +slEl.min, +slEl.max));
+      fillSlider(slEl);
+      render();
+    });
+    numEl.addEventListener('change', function () {
+      const v = clamp(parseFloat(digits(numEl.value)) || +slEl.min, +slEl.min, +slEl.max);
+      const nf = numEl as HTMLInputElement & { _raf?: number | null };
+      if (nf._raf) {
+        cancelAnimationFrame(nf._raf);
+        nf._raf = null;
+      }
+      numEl.value = fmtField(v);
+      slEl.value = String(v);
+      fillSlider(slEl);
+      render();
+    });
+  }
+  pairNumberAndSlider(age, ageR, false);
+  pairNumberAndSlider(rage, rageR, false);
+  pairNumberAndSlider(amt, amtR, true);
+  pairNumberAndSlider(rate, rateR, false);
+  pairNumberAndSlider(ann, annR, false);
+  pairNumberAndSlider(arate, arateR, false);
+
+  (function initFromUrl() {
+    const p = new URLSearchParams(location.search);
+    function setNum(el: HTMLInputElement, sl: HTMLInputElement, key: string, group: boolean) {
+      if (!p.has(key)) return;
+      const v = clamp(parseFloat(p.get(key) || '') || +sl.min, +sl.min, +sl.max);
+      sl.value = String(v);
+      el.value = group ? fmt.format(v) : String(v);
+    }
+    setNum(age, ageR, 'age', false);
+    setNum(rage, rageR, 'rage', false);
+    setNum(amt, amtR, 'amt', true);
+    setNum(rate, rateR, 'rate', false);
+    setNum(ann, annR, 'ann', false);
+    setNum(arate, arateR, 'arate', false);
+  })();
+
+  [ageR, rageR, amtR, rateR, annR, arateR].forEach(fillSlider);
+  render();
+</script>
~~~~

---

## 3. src/pages/currency.astro

~~~~diff
diff --git a/src/pages/currency.astro b/src/pages/currency.astro
index e8ac66c..ba3880f 100644
--- a/src/pages/currency.astro
+++ b/src/pages/currency.astro
@@ -141,16 +141,30 @@ const seo = {
       <h2 class="sec-title">Currency Futures Vs Currency Options</h2>
       <p class="sec-lead" style="color:var(--color-text-secondary)">Currency derivatives are primarily traded through Futures and Options contracts. While both allow traders to participate in currency market movements, they differ in terms of risk, capital requirements, and trading flexibility. Futures obligate both parties to settle at a future date; options give the buyer the right — but not the obligation — to buy or sell at a predetermined price.</p>
     </div>
-    <div class="t-scroll"><div class="product-page_table t3 bordered">
-      <div class="cell th"><p>Features</p></div><div class="cell th"><p>Currency Futures</p></div><div class="cell th"><p>Currency Options</p></div>
-      <div class="cell tb"><p class="k">Obligation</p></div><div class="cell tb"><p class="v">Buyer and seller both obligated to settle</p></div><div class="cell tb"><p class="v">Buyer has a right, not an obligation; seller is obligated</p></div>
-      <div class="cell tb"><p class="k">Upfront cost</p></div><div class="cell tb"><p class="v">Margin only, no premium</p></div><div class="cell tb"><p class="v">Buyer pays a premium; seller receives it and posts margin</p></div>
-      <div class="cell tb"><p class="k">Maximum loss (buyer)</p></div><div class="cell tb"><p class="v">Theoretically unlimited if the market moves against you</p></div><div class="cell tb"><p class="v">Capped at the premium paid</p></div>
-      <div class="cell tb"><p class="k">Leverage</p></div><div class="cell tb"><p class="v">High — small margin controls a full lot</p></div><div class="cell tb"><p class="v">Premium cost is small relative to lot value</p></div>
-      <div class="cell tb"><p class="k">Typical use</p></div><div class="cell tb"><p class="v">Directional trades, hedging known exposure</p></div><div class="cell tb"><p class="v">Defined-risk speculation, hedging with optionality</p></div>
-      <div class="cell tb"><p class="k">Expiry cycle</p></div><div class="cell tb"><p class="v">Monthly contracts, several months listed at once</p></div><div class="cell tb"><p class="v">Monthly expiry, generally on USD/INR, EUR/INR, GBP/INR, JPY/INR</p></div>
-      <div class="cell tb"><p class="k">Obligation</p></div><div class="cell tb"><p class="v">Buyer and seller both obligated to settle</p></div><div class="cell tb"><p class="v">Buyer has a right, not an obligation; seller is obligated</p></div>
-    </div></div>
+    <div class="row-2" data-reveal-row>
+      <div class="card check-card">
+        <h3 class="ch-title">Currency Futures</h3>
+        <div class="check-list">
+          <div class="check-row"><span class="fvo-ar" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M4 10h11m0 0-4-4m4 4-4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path></svg></span><p class="tx">Buyer and seller both obligated to settle</p></div>
+          <div class="check-row"><span class="fvo-ar" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M4 10h11m0 0-4-4m4 4-4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path></svg></span><p class="tx">Margin only, no premium</p></div>
+          <div class="check-row"><span class="fvo-ar" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M4 10h11m0 0-4-4m4 4-4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path></svg></span><p class="tx">Theoretically unlimited if the market moves against you</p></div>
+          <div class="check-row"><span class="fvo-ar" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M4 10h11m0 0-4-4m4 4-4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path></svg></span><p class="tx">High — small margin controls a full lot</p></div>
+          <div class="check-row"><span class="fvo-ar" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M4 10h11m0 0-4-4m4 4-4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path></svg></span><p class="tx">Directional trades, hedging known exposure</p></div>
+          <div class="check-row"><span class="fvo-ar" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M4 10h11m0 0-4-4m4 4-4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path></svg></span><p class="tx">Monthly contracts, several months listed at once</p></div>
+        </div>
+      </div>
+      <div class="card check-card">
+        <h3 class="ch-title">Currency Options</h3>
+        <div class="check-list">
+          <div class="check-row"><span class="fvo-ar" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M4 10h11m0 0-4-4m4 4-4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path></svg></span><p class="tx">Buyer has a right, not an obligation; seller is obligated</p></div>
+          <div class="check-row"><span class="fvo-ar" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M4 10h11m0 0-4-4m4 4-4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path></svg></span><p class="tx">Buyer pays a premium; seller receives it and posts margin</p></div>
+          <div class="check-row"><span class="fvo-ar" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M4 10h11m0 0-4-4m4 4-4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path></svg></span><p class="tx">Capped at the premium paid</p></div>
+          <div class="check-row"><span class="fvo-ar" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M4 10h11m0 0-4-4m4 4-4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path></svg></span><p class="tx">Premium cost is small relative to lot value</p></div>
+          <div class="check-row"><span class="fvo-ar" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M4 10h11m0 0-4-4m4 4-4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path></svg></span><p class="tx">Defined-risk speculation, hedging with optionality</p></div>
+          <div class="check-row"><span class="fvo-ar" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M4 10h11m0 0-4-4m4 4-4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path></svg></span><p class="tx">Monthly expiry, generally on USD/INR, EUR/INR, GBP/INR, JPY/INR</p></div>
+        </div>
+      </div>
+    </div>
     <div class="stack" style="gap:16px">
       <h3 class="sub-title">What is a Call Option vs a Put Option in Currency Trading?</h3>
       <p class="sub-lead" style="color:var(--color-text-secondary)">A Call Option gives the buyer the right to buy a currency pair at a predetermined strike price before expiry, while a Put Option gives the right to sell. Traders buy calls when they expect the currency pair to rise. Traders buy puts when they expect the pair to fall.</p>
@@ -312,6 +326,12 @@ const seo = {
   .vstep h4 { font-weight: 500; font-size: 20px; color: var(--color-text-primary); }
   .vstep p { font-weight: 400; font-size: 16px; color: var(--color-text-tertiary); }
 
+  /* Futures-vs-options: the two comparison boxes reuse the shared .check-card /
+     .check-list / .check-row component; only the leading marker differs — a gold
+     right-arrow instead of the success tick (mirrors .check-row .ck geometry). */
+  .fvo-ar { color: var(--color-gold-500); flex: none; width: 16px; height: 1.5em; display: flex; align-items: center; justify-content: center; }
+  .fvo-ar svg { display: block; width: 16px; height: 16px; }
+
   /* Page-unique: legal/restricted status pills, token-bound to the state roles. */
   .stat { align-self: flex-start; display: inline-flex; align-items: center; padding: 4px 12px; border-radius: 8px; font-weight: 500; font-size: 14px; }
   .stat.ok { background: var(--color-success-tint); color: var(--color-success-strong); }
~~~~
