# SDMIS Prototype — Implementation Plan

## Context

The **State Disability Management Information System (SDMIS)** is for the Women, Child, Senior Citizen & Divyangjan Welfare Department (Sikkim). The requirements doc (`RequirementGatheringReport(SDMIS)_V1_KD.docx`) describes a 4-stage workflow:

1. **Survey** — Anganwadi workers complete paper Form A / Form B across **58 zones** *(already done — out of scope for entry).*
2. **Data Entry** — **116 Inspectors** (2 per zone) enter Form A/B data zone-wise.
3. **Verification** — **SWO** (Social Welfare Officer) approves records or returns them for correction.
4. **Monitoring** — **HQ** views dashboards and consolidated reports.

We are building a **clickable front-end prototype** to demonstrate this workflow. No backend — **HTML + Tailwind CSS + jQuery + localStorage** only. Confirmed decisions: full system, single-page SPA with modular JS files, mock login with seeded users, and pre-seeded demo data (58 zones + officials + sample beneficiary records).

The folder currently contains only the source `.docx` (and a temporary `_extract/` scratch folder used to read it — to be deleted).

## Roles & Landing Pages

| Role | Landing page | Capabilities |
|------|-------------|--------------|
| **Admin** | Config dashboard | Add/edit zones, add/assign officials (Inspector/SWO) zone-wise, manage master dropdown data |
| **Inspector** | Zone work-list | Create/edit Form A & Form B for their assigned zone(s); submit for verification |
| **SWO** | Verification queue | Review submitted records, Approve or Return-with-remarks; trigger Form B→A conversion |
| **HQ** | Monitoring dashboard | Read-only stats, progress tracking, Reports module |

Role-based access enforced in the SPA router: each route declares allowed roles; unauthorized navigation redirects to that role's landing page.

## Architecture

Single-page app, modular files loaded by `index.html` via `<script>` tags (no build step — prototype-friendly).

```
index.html              # Tailwind (CDN) + jQuery (CDN) + app shell (sidebar/topbar/content)
css/app.css             # small custom overrides
js/
  store.js              # localStorage CRUD layer + schema/keys + ID generation
  seed.js               # one-time seeding of zones, officials, sample beneficiaries
  auth.js               # mock login, current-user/session, role guard
  router.js             # hash-based router (#/login, #/admin, #/inspector, ...), role gating
  ui.js                 # shared render helpers (nav, toasts, modals, tables, stepper)
  constants.js          # dropdown option sets (education, occupation, disability types, aids, etc.)
  pages/
    login.js
    admin.js            # zones + officials config
    inspector.js        # record list + Form A/B multi-step wizard
    swo.js              # verification queue + detail review
    hq.js               # dashboard widgets
    reports.js          # filters, tables, stats, export
    formWizard.js       # shared 4-step Form A/B engine (Form B hides cert fields in Step 4)
```

**Tailwind**: use the CDN (`https://cdn.tailwindcss.com`) for zero-build styling.
**jQuery**: CDN. DOM rendering via template strings + jQuery event delegation.

## Data Model (localStorage)

Single namespaced root key `sdmis.v1` holding JSON, with sub-collections (each an array of objects):

- `zones`: `{ id, name, code, gpus:[...], wards:[...] }` — seed 58.
- `officials`: `{ id, name, username, role: 'admin'|'inspector'|'swo'|'hq', zoneId|null }` — seed 2 inspectors + 1 SWO per zone, plus 1 admin + 1 HQ.
- `beneficiaries`: the Form A/B records (see below).
- `auditLog`: `{ id, ts, userId, action, recordId, note }` — used for conversion + verification trail.
- `session`: current logged-in user id.

**Beneficiary record shape** (covers both forms):
```
{
  id, formType: 'A'|'B', zoneId, gpu, ward,
  status: 'draft'|'submitted'|'approved'|'returned',
  createdBy (inspectorId), reviewedBy (swoId|null), returnRemark,
  step1: { name, parentName, age, gender, address, gpu, ward, houseNo, pin,
           contact, altContactName, altContactNo, aadhaar, voterId,
           offsprings:[{age,gender}], siblings:[{age,gender}],
           residency:'local'|'nonlocal', coiNo, rcNo, sikkimSubjectNo, idProofNo,
           maritalStatus, photo(base64) },
  step2: { education, educationOther, institute,
           occupation, postName, employmentType, employmentRemark, businessName,
           annualIncome },
  step3: { houseType, familyCount, facilities:[water,toilet,electricity,accessibility],
           accessibilityDetail, language },
  step4A: { disabilityType, disabilityOther, disabilityPercent, certNo, certImage(base64),
            udid, issueDate, issuePlace, aids:[...], aidsOther,
            benefits, pensionStatus, pensionSince, medicalProblems, medicalSince,
            services, caregiverName, caregiverRelation },   // Form A only
  step4B: { suspectedDisabilityType, ...supporting fields, aids, benefits, ... }, // Form B
  convertedFrom: recordId|null
}
```

## Form Field Spec (from the doc — drives `formWizard.js` + `constants.js`)

**Step 1 – Personal:** Name*, Father's/Mother's Name*, Age*, Address*, GPU*, Ward*, House No (opt), PIN*, Contact*, Additional Contact Name+No*, Aadhaar*, Voter ID (only if age ≥ 18), Offsprings (repeatable: age/gender + totals), Siblings (repeatable), Residency (Local → COI/RC/Sikkim Subject optional; Non-Local → at least one ID proof required), Marital Status, Passport Photo (file→base64). BLOCK-LETTER hint.

**Step 2 – Qualification & Occupation:**
- Education* dropdown: `Below 8, Class X, Class XII, Graduate, Post Graduate, Others` → Others reveals Remarks. Institute/School.
- Occupation* dropdown: `Government Employee, Private Employee, Self Employed, Unemployed` with conditionals:
  - Govt → Post Name* + Type of Employment* (`Regular, Contractual, Adhoc, Others` → Others reveals Remarks*)
  - Self Employed → Business Name*
  - Private / Unemployed → no extra fields
- Cumulative Annual Income* dropdown: `Below ₹50,000, Above ₹50,000, Above ₹1,00,000`

**Step 3 – Family:** House Type* (`Kutcha (Own), RCC (Own), Rented`), No. of Family* (numeric), Facilities at home (Water/Toilet/Electricity/Accessibility checkboxes), Accessibility Facility (text), Language Spoken.

**Step 4 – Disability (Form A):** Disability Type* (`Blindness, Low Vision, Hearing Impairment, … Others`→remarks), Disability %*, Certificate No + image upload, UDID (18-char alphanumeric, boxed input), Issue Date, Place of Issue, Aids & Appliances* (multi-select: Wheelchair, Crutches, Walking Stick, Hearing Aid, Prosthetic Limb, Orthotic Device, Tricycle, White Cane, Braille Kit, Speech Aid Device, Walker, Special Footwear, Other→text), Benefits Availed, Pension Status (Y/N)→Since, Associated Medical Problems→Since, Services Receiving, Caregiver Name, Relationship.

**Step 4 – Disability (Form B):** Same minus the certification fields (no Disability %, Cert No, UDID, Issue Date, Place of Issue). Captures **Suspected Disability Type** + supporting info. `formWizard.js` toggles these by `formType`.

Validation: required-field checks + conditional reveal/require, age-gated Voter ID, residency-based ID-proof rule, numeric-only family count, 18-char UDID mask. Inline error messages; block step advance until valid.

## Verification Workflow (SWO)

- Inspector **Submit** sets `status='submitted'`.
- SWO queue lists submitted records (filter by zone). Detail view (read-only render of all 4 steps).
- **Approve** → `status='approved'`, write audit entry. **Return** → `status='returned'` + `returnRemark`; record reappears in Inspector's list flagged for correction.

## Form B → Form A Conversion

On an **approved Form B** record, SWO sees **Convert to Form A**: a modal collects the certification fields (Disability Type, %, Cert No, UDID). On confirm: copy step1–3, populate step4A, set `formType='A'`, `convertedFrom=oldId`, remove the old Form B from active B lists (mark `status` or move), and write an audit entry `{action:'convert', ts, userId}`. Converted record shows under Form A and drops out of Form B reports.

## Reports Module (HQ)

- **Filters** (dropdowns, combinable): Form Type, Zone, GPU, Ward, Gender, Age Group, Disability Type, Education, Occupation, Annual Income, House Type, Marital Status, Local/Non-Local, Pension Status, Benefits, Services.
- **Views:** Summary cards + detailed beneficiary table; search box; zone-wise / disability-wise / gender-wise stat tables; Form A vs B comparison.
- **Export:** CSV (native, no lib) for "Excel"; **Print to PDF** via `window.print()` with a print stylesheet. (Note: true `.xlsx`/PDF libs avoided to honor the HTML/Tailwind/jQuery-only constraint; CSV + print is the pragmatic prototype path.)
- **Charts:** lightweight CSS/HTML bar rows (no chart lib) for the stat breakdowns.

## HQ Dashboard

Cards: total surveyed, Form A vs B counts, per-zone data-entry progress, verification status breakdown (draft/submitted/approved/returned), top disability types. All derived live from `beneficiaries`.

## Seed Data (`seed.js`)

Runs once (guarded by a `sdmis.v1.seeded` flag): 58 zones with codes + sample GPUs/wards; 1 admin, 1 HQ, 116 inspectors (2/zone) + 58 SWOs (1/zone) with predictable usernames (e.g. `insp_z01_a`, `swo_z01`); ~15–20 sample beneficiaries spread across a few zones and across both forms and all statuses, so verification/reports/dashboard all have content.

## Build Order

1. `store.js`, `constants.js`, `seed.js` — data layer + master data.
2. `index.html` shell + `ui.js` + `router.js` + `auth.js` + `login.js` — shell, routing, role-gated login.
3. `admin.js` — zones + officials config.
4. `formWizard.js` + `inspector.js` — the 4-step Form A/B wizard + record list (the core).
5. `swo.js` — verification queue + approve/return + conversion.
6. `hq.js` + `reports.js` — dashboard + reports/export.
7. Seed sample beneficiaries; polish, responsive nav, toasts.

## Cleanup

Delete the temporary `_extract/` folder created while reading the `.docx`.

## Verification (how to test end-to-end)

Open `index.html` in a browser (no server needed) and walk the workflow:
1. **Login as Admin** → confirm 58 zones seeded; add a zone; add an Inspector and assign to a zone.
2. **Login as Inspector** → create a **Form A** record: verify conditional logic (Education "Others" reveals remarks; Occupation "Government" reveals Post Name + Employment Type; Voter ID hidden when age < 18; Non-Local requires an ID proof). Save draft, then Submit. Create a **Form B** record and confirm Step 4 omits cert/UDID fields.
3. **Login as SWO** → see submitted records; **Return** one (add remark) and **Approve** another. Re-login as Inspector to confirm the returned record is flagged and editable. **Convert** an approved Form B → Form A and confirm it leaves Form B and appears under Form A.
4. **Login as HQ** → dashboard counts match; open **Reports**, apply multiple filters, view zone/gender/disability stats, export CSV, and print-to-PDF.
5. Reload the browser → confirm all data persists via localStorage. Confirm role gating: an Inspector cannot reach the Admin or HQ routes.
