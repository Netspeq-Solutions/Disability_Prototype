# Software Requirement Specification (SRS)

## State Disability Management Information System (SDMIS)

**Department:** Women, Child, Senior Citizen & Divyangjan Welfare Department, Government of Sikkim

**Document Version:** 1.0
**Date:** 30 June 2026
**Prepared By:** Business Development Team / Project Owner / Development Lead
**Status:** Draft for Client Review

---

## 1. Introduction

### 1.1 Purpose of the Document

This document defines the functional and non-functional requirements for the proposed **State Disability Management Information System (SDMIS)** to be developed for the Women, Child, Senior Citizen & Divyangjan Welfare Department, Government of Sikkim.

The purpose of this document is to clearly explain what the system will do, how the work will flow from one user to another, what data will be captured, and what reports and dashboards will be produced. It acts as a common agreement between the department and the development team. Once approved, it becomes the base for design, development, testing, and final acceptance of the system.

### 1.2 Intended Audience

This document is meant for the following readers:

- **Department Officials** – to confirm that the system matches their work needs.
- **Project Stakeholders** – to understand the scope and approve the requirements.
- **Development Team** – to design and build the system as described here.
- **QA (Testing) Team** – to prepare test cases and check the system against these requirements.
- **Support Team** – to understand the system before giving training and support.

---

## 2. Project Overview

### 2.1 Background

The department conducts a disability survey across the state to find and record details of Persons with Disabilities (PwDs). At present, Anganwadi workers visit households across **58 designated zones** and fill the survey details by hand in department-issued booklets using two paper forms:

- **Form A – Certified Disability Cases** (people who already hold a valid Disability Certificate and, where available, a UDID number).
- **Form B – Suspected / Probable Disability Cases** (people who appear to have a disability but are not yet medically certified).

These paper forms are then passed on for data entry, verification, and monitoring. Because the whole process is paper-based, it is slow, hard to track, and difficult to use for planning and reporting. The department wants a single web-based system to enter, verify, monitor, and report this data in a reliable and organised way.

### 2.2 Objectives of the Project

The main objectives of the SDMIS project are:

1. To move the disability survey data from paper forms into a single, central digital system.
2. To allow Inspectors to enter Form A and Form B data zone-wise, either from filled booklets or directly during field surveys.
3. To give Social Welfare Officers (SWO) a clear way to verify, approve, or return records for correction.
4. To allow conversion of a Form B (suspected) record into a Form A (certified) record after medical certification, while keeping a full history.
5. To give HQ officials live dashboards and detailed reports for monitoring and decision-making.
6. To maintain accurate, searchable, and exportable beneficiary data for welfare planning and service delivery.

### 2.3 Scope of the Project

#### 2.3.1 Included Scope

- Web-based data entry for Form A and Form B (4-step structured forms).
- Zone-wise data entry by 116 Inspectors (2 per zone across 58 zones).
- Verification workflow (Approve / Return with remarks) by the SWO.
- Form B to Form A conversion with audit trail.
- Role-based access for Administrator, Inspector, SWO, and HQ users.
- Master data and zone/official configuration by the Administrator.
- Reports module with multiple filters and export to Excel and PDF.
- Monitoring dashboard for HQ.

#### 2.3.2 Excluded Scope

- The household survey itself (already completed/carried out by Anganwadi workers on paper) is **not** part of system data collection; the system begins at data entry.
- Issue of Disability Certificates or UDID numbers (these are issued by the competent medical authority outside this system).
- Mobile application (not included in the current phase).
- Procurement of any third-party hardware or devices.
- Direct integration with external certification or pension disbursement systems (unless taken up later as a change request).

### 2.4 Stakeholders

| Stakeholder | Interest in the System |
|---|---|
| Department (Women, Child, Senior Citizen & Divyangjan Welfare) | Owner of the system and the data |
| Anganwadi Workers | Source of the survey data (paper forms) |
| Inspectors | Enter the survey data into the system |
| Social Welfare Officers (SWO) | Verify and approve the entered data |
| HQ Officials | Monitor progress and use reports |
| Administrator | Configure zones, officials, and master data |
| Development & Support Team | Build, deliver, and support the system |

---

## 3. Existing System Study

### 3.1 Existing Workflow

The current process is fully manual and works in four stages:

1. **Survey Data Collection** – Anganwadi workers visit households across 58 zones and write the details by hand into department-issued booklets using Form A and Form B. The filled forms are then submitted for further processing.
2. **Data Entry** – The collected forms are handed to Inspectors for record keeping. There is no single digital system to hold this data.
3. **Verification** – Records are checked manually by the Social Welfare Officer. Corrections are sent back informally.
4. **Monitoring** – HQ has no live view of progress and depends on manually prepared summaries.

### 3.2 Existing Challenges

- Paper records are hard to store, search, and protect from loss or damage.
- No live tracking of how many records are entered, verified, or pending per zone.
- Verification and correction are informal, with no clear record of who approved or returned a form and why.
- Converting a suspected case (Form B) into a certified case (Form A) after certification is hard to track on paper.
- Reports must be made by hand, which is slow and error-prone.
- Data is not available in one place for planning welfare services.

---

## 4. Proposed Solution

### 4.1 Overview

The proposed SDMIS is a web-based system that digitises the full flow from data entry to monitoring. Inspectors enter Form A and Form B data zone-wise through guided, step-by-step forms. SWOs verify each record and either approve it or return it with remarks. Approved Form B records can later be converted to Form A after certification. HQ officials view live dashboards and generate filtered reports. The Administrator sets up zones, officials, and master dropdown values. Access is controlled by user role.

### 4.2 Key Modules

1. **User & Role Management** – manage users, roles, and access.
2. **Zone & Master Data Configuration** – set up zones, officials, and dropdown lists.
3. **Beneficiary Data Entry – Form A** – certified disability cases (4 steps).
4. **Beneficiary Data Entry – Form B** – suspected/probable cases (4 steps).
5. **Verification** – SWO approve/return workflow.
6. **Form B to Form A Conversion** – certify and convert with audit trail.
7. **Reports** – filtered summary and detailed reports with export.
8. **Monitoring Dashboard** – live status and statistics for HQ.

### 4.3 Workflow Improvements

- One central digital store replaces scattered paper records.
- Clear, trackable Submit → Verify → Approve/Return flow.
- Conditional fields reduce wrong or incomplete entries.
- Live progress tracking per zone, form type, and status.
- Reports and exports are generated in seconds, not days.

### 4.4 Benefits

- Faster and more accurate data entry.
- Better control and accountability during verification.
- Complete history of every record, including conversions.
- Easy monitoring and planning using live data and reports.
- A reliable, single source of truth for disability data in the state.

---

## 5. Functional Requirements

The functional requirements are described module-wise below. Each module lists its description, features, workflow, inputs, outputs, user roles involved, and use cases.

### 5.1 MODULE 1: User & Role Management

#### Description
This module lets the Administrator create and manage system users and control what each user can do based on their role.

#### Features
- Create user (name, username, role, assigned zone where applicable).
- Assign one of four roles: Administrator, Inspector, SWO, HQ Official.
- Activate or deactivate a user.
- Reset user password.
- Role-based access control so each user sees only their own screens.

#### Workflow Diagrams
- **Process Flow:** Admin opens User Management → enters user details → assigns role and zone → saves → user can log in.
- **Approval Flow:** Not applicable (Admin action is direct).
- **Module Flow:** User Management → Zone/Official mapping → Login & Access control.

#### Inputs
- Name, Username, Role, Assigned Zone (for Inspector/SWO), Status (Active/Inactive).

#### Outputs
- User list, login credentials, role-based access for each user.

#### User Roles Involved
- Administrator.

#### Use Cases
- UC-1: Admin creates an Inspector and assigns a zone.
- UC-2: Admin deactivates a user who has left.
- UC-3: Admin resets a forgotten password.

### 5.2 MODULE 2: Zone & Master Data Configuration

#### Description
This module lets the Administrator set up the 58 zones, map officials (Inspectors and SWO) to zones, and manage the master dropdown lists used in the forms.

#### Features
- Add or edit zones (name, code, GPUs, wards).
- Assign 2 Inspectors and 1 SWO per zone.
- Manage master dropdown data such as Disability Types, Pension Schemes, Services, and Caregiver Types.

#### Workflow Diagrams
- **Process Flow:** Admin adds zone → adds officials → assigns officials to zone → updates master lists.
- **Approval Flow:** Not applicable.
- **Module Flow:** Zone setup → Official mapping → Master data → available to Form A/B and Reports.

#### Inputs
- Zone name and code, GPU and ward list, official-to-zone mapping, master list values.

#### Outputs
- Configured zone list, official assignments, ready-to-use dropdown master data.

#### User Roles Involved
- Administrator.

#### Use Cases
- UC-4: Admin adds a new zone and assigns two Inspectors and one SWO.
- UC-5: Admin adds a new disability type to the master list.

### 5.3 MODULE 3: Beneficiary Data Entry – Form A (Certified Disability Cases)

#### Description
Form A captures full details of beneficiaries who already hold a valid Disability Certificate and, where available, a UDID number. The information is captured in four steps and is used to maintain a complete database of certified disability cases.

#### Features
The form is filled in **four steps**:

**Step 1 – Personal Information** (to be filled in BLOCK LETTERS):

| Field | Mandatory | Notes |
|---|---|---|
| Name | Yes | |
| Father's / Mother's Name | Yes | |
| Age | Yes | |
| Address | Yes | |
| GPU | Yes | |
| Ward Number | Yes | |
| House Number | No | |
| PIN Code | Yes | |
| Contact Number | Yes | |
| Additional Contact Person Name & Number | Yes | |
| Aadhaar Number | Yes | |
| Voter ID Number | Conditional | Required only if age is 18 years or above |
| Offsprings | Optional | Repeatable: Age, Gender; with totals (Male/Female) |
| Siblings | Optional | Repeatable: Age, Gender; with totals (Male/Female) |
| Residency Status | Yes | Local or Non-Local |
| COI / RC / Sikkim Subject Certificate Number | Conditional | If Local: optional (form proceeds even if not available) |
| Identity Proof Number | Conditional | If Non-Local: at least one valid ID proof required |
| Marital Status | Yes | |
| Passport Size Photograph | Yes | Upload image |

**Step 2 – Qualification & Occupation Information:**

| Field | Type | Mandatory | Options / Rule |
|---|---|---|---|
| Education Qualification | Dropdown | Yes | Below 8, Class X, Class XII, Graduate, Post Graduate, Others (Others → Remarks shown) |
| Institute / School | Text | No | |
| Occupation | Dropdown | Yes | Government Employee, Private Employee, Self Employed, Unemployed |
| Post Name | Text | Conditional | Required if Occupation = Government Employee |
| Type of Employment | Dropdown | Conditional | Required if Government Employee: Regular, Contractual, Adhoc, Others |
| Employment Remarks | Text | Conditional | Required if Type of Employment = Others |
| Business Name | Text | Conditional | Required if Occupation = Self Employed |
| Cumulative Annual Income | Dropdown | Yes | Below ₹50,000, Above ₹50,000, Above ₹1,00,000 |

*(For Private Employee and Unemployed, no extra fields are shown.)*

**Step 3 – Family Information:**

| Field | Type | Mandatory | Options |
|---|---|---|---|
| House Type | Dropdown | Yes | Kutcha (Own), RCC (Own), Rented |
| No. of Family | Numeric | Yes | Numbers only |
| Facilities at Home | Checkbox | Yes | Water, Toilet, Electricity, Accessibility |
| Accessibility Facility | Text | No | Details such as ramps, handrails, etc. |
| Language Spoken | Text | No | |

**Step 4 – Disability Information (Form A only):**

| Field | Type | Notes |
|---|---|---|
| Disability Type | Dropdown | Blindness, Low Vision, Hearing Impairment, Locomotor, Intellectual, Mental Illness, Speech & Language, Multiple, Others (Others → remarks) |
| Disability Percentage | Number | |
| Disability Certificate Number + Certificate Image | Text + Upload | |
| UDID Number | Boxed input | 18-character mix of letters and numbers |
| Certificate Issue Date | Date | |
| Place of Issue | Text | |
| Aids and Appliances Used/Required | Multi-select | Wheelchair, Crutches, Walking Stick, Hearing Aid, Prosthetic Limb, Orthotic Device, Tricycle, White Cane, Braille Kit, Speech Aid Device, Walker, Special Footwear, Other (Other → text) |
| Benefits Availed from Government Schemes | Text/Select | |
| Pension Receiving Status | Yes/No | If Yes → Pension Receiving Since |
| Associated Medical Problems | Text | If any → Since |
| Services Currently Receiving | Select | |
| Care Giver Name | Text | |
| Relationship with Beneficiary | Text | |

**Other features:**
- Save as Draft and continue later.
- Field validation, conditional show/hide, and inline error messages.
- Submit the record for SWO verification.

#### Workflow Diagrams
- **Process Flow:** Inspector selects zone → fills Step 1 to 4 → saves draft / submits.
- **Approval Flow:** Submitted → SWO verifies → Approved or Returned.
- **Module Flow:** Form A entry → Verification → Reports/Dashboard.

#### Inputs
- All Step 1–4 field values and uploaded images (photo, certificate).

#### Outputs
- A saved Form A beneficiary record with a status (Draft/Submitted/Approved/Returned).

#### User Roles Involved
- Inspector (create/edit/submit), SWO (review), HQ (view).

#### Use Cases
- UC-6: Inspector enters a certified case from a filled booklet and submits it.
- UC-7: Inspector saves a partly filled form as draft and completes it later.
- UC-8: Inspector edits a returned record and resubmits it.

### 5.4 MODULE 4: Beneficiary Data Entry – Form B (Suspected / Probable Disability Cases)

#### Description
Form B captures details of people who appear to have a disability during the survey but are not yet medically certified. It helps the department identify potential PwDs for further assessment and certification.

#### Features
- **Step 1, Step 2, and Step 3 are exactly the same as Form A** (Personal, Qualification & Occupation, Family).
- **Step 4 is different:** the certified-disability fields are **not** captured (no Disability Percentage, Certificate Number, UDID Number, Issue Date, or Place of Issue). Instead, the form records the **Suspected Disability Type** and other supporting information needed for assessment.
- Save as Draft, validation, and Submit for verification, same as Form A.

#### Workflow Diagrams
- **Process Flow:** Inspector selects zone → fills Step 1–3 (same as Form A) → fills Step 4 (suspected disability) → submits.
- **Approval Flow:** Submitted → SWO verifies → Approved or Returned.
- **Module Flow:** Form B entry → Verification → (later) Conversion to Form A → Reports/Dashboard.

#### Inputs
- Step 1–3 values (same as Form A) plus Suspected Disability Type and supporting details.

#### Outputs
- A saved Form B record with a status.

#### User Roles Involved
- Inspector (create/edit/submit), SWO (review/convert), HQ (view).

#### Use Cases
- UC-9: Inspector records a suspected case found during a field survey.
- UC-10: Inspector submits the Form B record for SWO verification.

### 5.5 MODULE 5: Verification (SWO)

#### Description
This module lets the Social Welfare Officer review records submitted by Inspectors and either approve them or return them for correction.

#### Features
- Verification queue showing submitted records (filterable by zone).
- Read-only detailed view of all four steps of a record.
- **Approve** the record (status becomes Approved).
- **Return** the record with remarks (status becomes Returned; it goes back to the Inspector flagged for correction).
- Audit entry created for each approve/return action.

#### Workflow Diagrams
- **Process Flow:** SWO opens queue → selects record → reviews details → Approve or Return with remark.
- **Approval Flow:** Submitted → (Approve → Approved) or (Return → Returned → Inspector corrects → Submitted again).
- **Module Flow:** Verification → Conversion (for approved Form B) → Reports/Dashboard.

#### Inputs
- SWO decision (Approve/Return) and return remarks.

#### Outputs
- Updated record status, return remarks, and audit trail entry.

#### User Roles Involved
- SWO (decision), Inspector (correction), HQ (view).

#### Use Cases
- UC-11: SWO approves a correctly filled record.
- UC-12: SWO returns a record with remarks for correction.

### 5.6 MODULE 6: Form B to Form A Conversion

#### Description
After medical assessment and certification, a verified Form B (suspected) record can be converted into a Form A (certified) record. This module manages that conversion and keeps a full history.

#### Business Rules
- The system shall provide an option to convert a verified Form B record into a Form A record.
- During conversion, all data from Step 1 (Personal), Step 2 (Qualification & Occupation), and Step 3 (Family) shall be retained.
- The Disability Information section shall be updated with the certified details: Disability Type, Disability Percentage, Disability Certificate Number, and UDID Number.
- After successful conversion, the record shall be removed from the active Form B records.
- The converted record shall appear under Form A as a Certified Disability Case.
- The system shall keep an audit trail of the conversion, including the date and the user who performed it.
- Converted records shall appear in Form A reports and shall no longer appear in Form B reports.

#### Workflow Diagrams
- **Process Flow:** SWO opens an approved Form B → selects Convert to Form A → enters certified details → confirms.
- **Approval Flow:** Verified Form B → Convert → Form A (Certified).
- **Module Flow:** Verification → Conversion → Form A records → Reports.

#### Inputs
- Certified Disability Type, Percentage, Certificate Number, UDID Number.

#### Outputs
- A new Form A (certified) record, audit trail entry, and removal from Form B lists.

#### User Roles Involved
- SWO.

#### Use Cases
- UC-13: SWO converts a certified suspected case into a Form A record.

### 5.7 MODULE 7: Reports

#### Description
The Reports module lets authorised users generate and view survey reports based on Form A and Form B data. (Described in detail in Section 8.)

#### User Roles Involved
- SWO, HQ Official.

### 5.8 MODULE 8: Monitoring Dashboard

#### Description
The dashboard gives HQ a live view of survey and data-entry progress and key statistics. (Described in detail in Section 9.)

#### User Roles Involved
- HQ Official.

---

## 6. Non-Functional Requirements

### 6.1 Performance
- The system should respond to a normal page or form action within about 3 seconds under normal load.
- The system should support multiple Inspectors (target up to around 150 concurrent users, including 116 Inspectors plus SWOs, HQ, and Admin) working at the same time without noticeable slowdown.

### 6.2 Security
- **SSL Security** – all data shall be sent over a secure (HTTPS) connection.
- **Password Encryption** – user passwords shall be stored in encrypted form.
- **Role-Based Access** – each user can access only the screens and data allowed for their role.
- **Security Audit** – key actions (approve, return, convert, login) shall be logged for audit.

### 6.3 Availability
- The system shall target **99% uptime** during working hours.

### 6.4 Browser Compatibility
- The system shall work on the latest versions of **Chrome, Firefox, and Safari**.

### 6.5 Device Compatibility
- The system shall be usable on desktop, **tablet**, and **mobile phone** screens (responsive layout).

---

## 7. User Roles & Permissions

| Feature / Action | Administrator | Inspector | SWO | HQ Official |
|---|:---:|:---:|:---:|:---:|
| Manage users & roles | Yes | No | No | No |
| Configure zones & officials | Yes | No | No | No |
| Manage master dropdown data | Yes | No | No | No |
| Create / edit Form A & B (own zone) | No | Yes | No | No |
| Submit records for verification | No | Yes | No | No |
| Verify (Approve / Return) records | No | No | Yes | No |
| Convert Form B to Form A | No | No | Yes | No |
| View reports | No | View own zone* | Yes | Yes |
| View monitoring dashboard | No | No | Yes | Yes |

\*Inspector access to reports is limited to their assigned zone (where enabled).

---

## 8. Reports Requirements

The Reports module lets authorised users generate and view detailed and summary reports from Form A and Form B data. Users can view, search, filter, and export reports for monitoring, analysis, and decision-making.

### 8.1 Report Filters
Reports may be generated using any combination of the following filters:
Form Type (Form A / Form B), Zone, GPU, Ward, Gender, Age Group, Disability Type / Suspected Disability Type, Education Qualification, Occupation, Annual Income Category, House Type, Marital Status, Local / Non-Local Status, Pension Receiving Status, Benefits Availed, Services Receiving.

### 8.2 Report Features
- View summary reports.
- View detailed beneficiary reports.
- Search beneficiary records.
- Filter records using multiple criteria.
- Export reports to **Excel and PDF**.
- View zone-wise statistics.
- View disability-wise statistics.
- View gender-wise statistics.
- View Form A and Form B comparative reports.

These reports help SWO and HQ officials monitor survey progress, analyse beneficiary data, and support departmental planning and decision-making.

---

## 9. Dashboard Requirements

The HQ dashboard shall present live information drawn from the entered records, including:
- Total number of beneficiaries surveyed.
- Form A vs Form B counts.
- Zone-wise data-entry progress.
- Verification status breakdown (Draft, Submitted, Approved, Returned).
- Top disability types.

All figures shall update automatically as records are entered and verified.

---

## 10. Prototype / UI Reference

A clickable front-end prototype has been developed to demonstrate the complete workflow (login, role-based landing pages, Form A/B wizards, verification, conversion, reports, and dashboard).

- **Screenshots:** Form A and Form B sample layouts (see Annexure).
- **Prototype:** the clickable HTML prototype delivered with this document.

---

## 11. Assumptions & Dependencies

### 11.1 Assumptions
- The department will provide all required master data (zones, GPUs, wards, official lists).
- Internet connectivity will be available at data-entry locations.
- The paper survey by Anganwadi workers is already complete, and forms are available for entry.
- Each zone will have two Inspectors and one SWO as planned.

### 11.2 Dependencies
- Availability of certified disability details (Certificate Number, UDID) at the time of Form B to Form A conversion.
- Timely review and sign-off of this SRS by the department.
- Access to any third-party services (e.g., SMS/Email) if added later.

---

## 12. Exclusions

The following items are clearly out of scope for the current phase:
- The physical household survey and paper data collection.
- Issue of Disability Certificates and UDID numbers (done by the competent authority).
- A dedicated mobile application (Phase-I excludes mobile app).
- Procurement of any third-party hardware.
- Direct integration with external pension or certification systems unless requested as a change request.

---

## 13. Integration Requirements

For the current phase, no external integration is mandatory. The following may be considered in future phases through a change request:
- **SMS Gateway** – for notifications (optional, future).
- **Email Service** – for alerts and credentials (optional, future).
- **API Integration** – with other departmental systems (optional, future).
- **Payment Gateway** – not applicable for this system.
- **Hardware Components** – none required.

---

## 14. Infrastructure Requirements

### 14.1 Server Requirements
- A web/application server and a database server (cloud or department data centre) sized for the expected user load.

### 14.2 Software Requirements
- **Operating System:** Linux or Windows Server.
- **Database:** A relational database (e.g., MySQL / PostgreSQL / SQL Server).
- **Web Server:** A standard web server (e.g., Nginx / Apache / IIS).

### 14.3 Backup
- **Daily database backup** shall be taken and stored securely.

---

## 15. Technical Support

After go-live, the support team shall provide functional and technical support, fix reported issues, and help users with day-to-day problems during the agreed support period.

---

## 16. Training Requirements

- **Stakeholder Training** – training sessions for Inspectors, SWOs, HQ officials, and the Administrator.
- **Documentation** – User Manual and supporting documents (with attendance sheets for training).
- **Handholding Support** – on-site/online support during the initial period after go-live.

---

## 17. Acceptance Criteria

The system shall be considered accepted when:
- **UAT Approval** – User Acceptance Testing is completed and signed off by the department.
- **Successful Deployment** – the system is deployed and running in the production environment.
- **Training Completion** – the planned training and documentation are delivered.

---

## 18. Annexures

The following items are attached/referenced with this document:
- Minutes of Meeting (MOM).
- Form A and Form B sample formats (Form A 1.jpeg, Form B 1.jpeg).
- Report formats.
- Prototype screens (clickable prototype).
- Supporting documents.
- Service Level Agreement (SLA), where applicable.

---

*End of Document — SRS for State Disability Management Information System (SDMIS), Version 1.0.*
