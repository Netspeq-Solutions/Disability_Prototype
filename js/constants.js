/* SDMIS — Master data / dropdown option sets (from the requirements doc) */
window.SDMIS = window.SDMIS || {};

SDMIS.constants = {
  roles: {
    admin: 'Administrator',
    inspector: 'Inspector',
    swo: 'Social Welfare Officer',
    hq: 'HQ Official'
  },

  statuses: {
    draft: 'Draft',
    submitted: 'Submitted',
    returned: 'Returned',
    approved: 'Approved'
  },

  statusBadge: {
    draft: 'bg-slate-100 text-slate-700',
    submitted: 'bg-amber-100 text-amber-800',
    returned: 'bg-rose-100 text-rose-700',
    approved: 'bg-emerald-100 text-emerald-700'
  },

  gender: ['Male', 'Female', 'Other'],

  maritalStatus: ['Single', 'Married', 'Widowed', 'Divorced', 'Separated'],

  residency: [
    { value: 'local', label: 'Local' },
    { value: 'nonlocal', label: 'Others' }
  ],

  coiDocTypes: ['COI', 'RC', 'SSE'],

  // ---- Address masters (admin-configurable) ----
  // Inspectors are mapped to one or more Blocks; SWOs are mapped to a District.
  // Each Block belongs to a District, so a District-level SWO covers all its blocks.
  districts: ['Gangtok', 'Mangan', 'Pakyong', 'Namchi', 'Gyalshing', 'Soreng'],
  blocks: [
    { name: 'Rakdong-Tintek', district: 'Gangtok' },
    { name: 'Khamdong', district: 'Gangtok' },
    { name: 'Dzongu', district: 'Mangan' },
    { name: 'Chungthang', district: 'Mangan' },
    { name: 'Duga', district: 'Pakyong' },
    { name: 'Rangpo', district: 'Pakyong' },
    { name: 'Namthang', district: 'Namchi' },
    { name: 'Jorethang', district: 'Namchi' },
    { name: 'Yuksom', district: 'Gyalshing' },
    { name: 'Dentam', district: 'Gyalshing' },
    { name: 'Yangthang', district: 'Soreng' },
    { name: 'Chongrang', district: 'Soreng' }
  ],
  gpus: ['GPU-I', 'GPU-II', 'GPU-III', 'GPU-IV', 'GPU-V', 'GPU-VI'],
  wards: ['Ward 1', 'Ward 2', 'Ward 3', 'Ward 4', 'Ward 5', 'Ward 6'],

  // Disability certificate type — Permanent requires a UDID number; Temporary does not
  certificateTypes: ['Temporary', 'Permanent'],

  education: ['Below 8', 'Class X', 'Class XII', 'Graduate', 'Post Graduate', 'Others'],

  occupation: ['Government Employee', 'Private', 'Self Employed', 'Unemployed'],

  employmentType: ['Regular', 'Contractual', 'Adhoc', 'Others'],

  annualIncome: ['Below ₹50,000', 'Above ₹50,000', 'Above ₹1,00,000'],

  houseType: ['Kutcha (Own)', 'RCC (Own)', 'Rented'],

  facilities: ['Water', 'Toilet', 'Electricity', 'Accessibility'],

  disabilityType: [
    'Blindness',
    'Low Vision',
    'Hearing Impairment',
    'Locomotor Disability',
    'Intellectual Disability',
    'Mental Illness',
    'Speech and Language Disability',
    'Multiple Disabilities',
    'Others'
  ],

  aids: [
    'Wheelchair', 'Crutches', 'Walking Stick', 'Hearing Aid', 'Prosthetic Limb',
    'Orthotic Device', 'Tricycle', 'White Cane', 'Braille Kit', 'Speech Aid Device',
    'Walker', 'Special Footwear', 'Other'
  ],

  pensionStatus: ['Yes', 'No'],

  // ---- Pension schemes (admin-configurable master) ----
  pensionSchemes: [
    'Indira Gandhi National Disability Pension Scheme (IGNDPS)',
    'Indira Gandhi National Old Age Pension Scheme (IGNOAPS)',
    'Indira Gandhi National Widow Pension Scheme (IGNWPS)',
    'State Disability Pension',
    'State Old Age Pension',
    'CMs Welfare Fund for PwD'
  ],

  // ---- Services receiving (admin-configurable master) ----
  services: [
    'Physiotherapy',
    'Occupational Therapy',
    'Speech Therapy',
    'Special Education',
    'Vocational Training',
    'Counselling / Psychological Support',
    'Home-based Care',
    'Aids & Appliances Support',
    'Day Care Centre',
    'Residential Care'
  ],

  // ---- Caregiver types (admin-configurable master) ----
  caregiverTypes: ['Family Member', 'Hired', 'Professional'],

  // keys exposed in the Admin → Masters tab (label + which collection drives a form dropdown)
  masterKeys: [
    { key: 'districts', label: 'Districts' },
    { key: 'blocks', label: 'Blocks' },
    { key: 'gpus', label: 'GPUs' },
    { key: 'wards', label: 'Wards' },
    { key: 'disabilityType', label: 'Disability Types' },
    { key: 'pensionSchemes', label: 'Pension Schemes' },
    { key: 'services', label: 'Services Receiving' },
    { key: 'caregiverTypes', label: 'Caregiver Types' }
  ],

  ageGroups: [
    { value: '0-5', label: '0 - 5 yrs', min: 0, max: 5 },
    { value: '6-18', label: '6 - 18 yrs', min: 6, max: 18 },
    { value: '19-40', label: '19 - 40 yrs', min: 19, max: 40 },
    { value: '41-60', label: '41 - 60 yrs', min: 41, max: 60 },
    { value: '60+', label: '60+ yrs', min: 61, max: 200 }
  ]
};
