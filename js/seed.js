/* SDMIS — one-time seeding of zones, officials and sample beneficiaries */
window.SDMIS = window.SDMIS || {};

SDMIS.seed = (function () {
  var store = SDMIS.store;

  // Sikkim-flavoured place-name pools for believable demo data
  var ZONE_NAMES = [
    'Gangtok', 'Ranipool', 'Pakyong', 'Rhenock', 'Rongli', 'Rorathang', 'Singtam',
    'Namchi', 'Jorethang', 'Ravangla', 'Melli', 'Temi', 'Yangang', 'Sumbuk',
    'Gyalshing', 'Geyzing', 'Pelling', 'Yuksom', 'Dentam', 'Soreng', 'Chakung',
    'Mangan', 'Dikchu', 'Chungthang', 'Lachung', 'Lachen', 'Phodong', 'Kabi',
    'Tadong', 'Sichey', 'Burtuk', 'Arithang', 'Development Area', 'Tibet Road',
    'Deorali', 'Tashiling', 'Marchak', 'Assam Lingzey', 'Rakdong', 'Tintek',
    'Khamdong', 'Sang', 'Martam', 'Rumtek', 'Sajong', 'Samdong', 'Central Pendam',
    'East Pendam', 'West Pendam', 'Aho', 'Yangtam', 'Lingdok', 'Tumin', 'Naga',
    'Penlong', 'Syari', 'Chandmari', 'Lower Sichey'
  ];

  var FIRST = ['Pemba', 'Tashi', 'Karma', 'Sonam', 'Dawa', 'Norbu', 'Tenzing', 'Pasang',
    'Suresh', 'Anil', 'Rajesh', 'Bina', 'Sita', 'Maya', 'Deepa', 'Anjali', 'Prakash',
    'Dorjee', 'Yangchen', 'Diki', 'Phurba', 'Nima', 'Lhamu', 'Chumki', 'Bhim', 'Hari'];
  var LAST = ['Bhutia', 'Lepcha', 'Sharma', 'Rai', 'Subba', 'Tamang', 'Gurung',
    'Pradhan', 'Chettri', 'Limboo', 'Dahal', 'Sherpa', 'Mukhia', 'Tshering'];

  function pick(arr, i) { return arr[i % arr.length]; }
  function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function ri(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

  function fullName(i) { return pick(FIRST, i) + ' ' + pick(LAST, Math.floor(i / 3) + i); }

  var DISTRICTS = ['East Sikkim', 'West Sikkim', 'North Sikkim', 'South Sikkim'];

  // ===== Demo document images (generated as inline SVG data-URIs) =====
  // Keeps the prototype self-contained (no binary assets) while giving the
  // SWO side-by-side review real-looking scanned forms / photos / certificates.
  function xmlEsc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
  }
  function clip(s, n) { s = String(s == null ? '' : s); return s.length > n ? s.slice(0, n - 1) + '…' : s; }
  function svgUri(svg) { return 'data:image/svg+xml,' + encodeURIComponent(svg); }
  function initials(name) {
    var p = (name || '').trim().split(/\s+/);
    return (((p[0] || '')[0] || '?') + ((p[1] || '')[0] || '')).toUpperCase();
  }
  var AVATAR_BG = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];
  function colorFor(s) {
    var h = 0; s = s || '';
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return AVATAR_BG[h % AVATAR_BG.length];
  }

  function mockPhoto(name) {
    var bg = colorFor(name);
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="220" height="280" viewBox="0 0 220 280">' +
      '<rect width="220" height="280" fill="#f1f5f9"/>' +
      '<rect x="6" y="6" width="208" height="268" fill="#ffffff" stroke="#94a3b8"/>' +
      '<rect x="14" y="14" width="192" height="252" fill="' + bg + '" opacity="0.10"/>' +
      '<circle cx="110" cy="112" r="50" fill="' + bg + '"/>' +
      '<path d="M44 256 q66 -78 132 0 z" fill="' + bg + '"/>' +
      '<text x="110" y="130" font-family="Arial, sans-serif" font-size="46" font-weight="700" fill="#ffffff" text-anchor="middle">' + xmlEsc(initials(name)) + '</text>' +
      '</svg>';
    return svgUri(svg);
  }

  function formField(y, label, val) {
    return '<text x="22" y="' + y + '" font-family="Georgia, serif" font-size="11" fill="#1e293b">' + xmlEsc(label) + '</text>' +
      '<line x1="118" y1="' + (y + 3) + '" x2="280" y2="' + (y + 3) + '" stroke="#cbd5e1"/>' +
      '<text x="122" y="' + y + '" font-family="\'Segoe Script\', \'Comic Sans MS\', cursive" font-size="12" fill="#1d4ed8">' + xmlEsc(clip(val, 22)) + '</text>';
  }

  function formShell(rec, page, total, inner) {
    var ft = rec.formType;
    return '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400">' +
      '<rect width="300" height="400" fill="#ffffff"/>' +
      '<rect x="0.5" y="0.5" width="299" height="399" fill="none" stroke="#cbd5e1"/>' +
      '<rect x="0" y="0" width="300" height="50" fill="#1e3a8a"/>' +
      '<text x="150" y="21" font-family="Georgia, serif" font-size="11" font-weight="700" fill="#ffffff" text-anchor="middle">GOVERNMENT OF SIKKIM</text>' +
      '<text x="150" y="37" font-family="Georgia, serif" font-size="8.5" fill="#c7d2fe" text-anchor="middle">Social Welfare Department · PwD Survey</text>' +
      '<text x="22" y="72" font-family="Georgia, serif" font-size="13" font-weight="700" fill="#0f172a">FORM - ' + xmlEsc(ft) + '</text>' +
      '<text x="278" y="72" font-family="Georgia, serif" font-size="9" fill="#64748b" text-anchor="end">Page ' + page + ' of ' + total + '</text>' +
      '<line x1="22" y1="80" x2="278" y2="80" stroke="#94a3b8"/>' +
      inner +
      '<text x="150" y="388" font-family="Georgia, serif" font-size="8" fill="#94a3b8" text-anchor="middle">Scanned copy · for verification only</text>' +
      '</svg>';
  }

  function mockFormPage1(rec) {
    var s = rec.step1;
    var y = 104, step = 30, inner = '';
    inner += '<text x="22" y="' + (y - 8) + '" font-family="Georgia, serif" font-size="10" font-weight="700" fill="#1e3a8a">(a) Personal Information</text>';
    inner += formField(y, 'Name', s.name); y += step;
    inner += formField(y, "Father/Mother", s.fatherName || s.parentName); y += step;
    inner += formField(y, 'Age / Gender', s.age + ' / ' + s.gender); y += step;
    inner += formField(y, 'Perm. Addr', s.permanentAddress || s.address); y += step;
    inner += formField(y, 'GPU / Ward', s.gpu + ' / ' + s.ward); y += step;
    inner += formField(y, 'Contact', s.contact); y += step;
    inner += formField(y, 'Aadhaar', s.aadhaar); y += step;
    return svgUri(formShell(rec, 1, 2, inner));
  }

  function mockFormPage2(rec) {
    var y = 104, step = 30, inner = '';
    inner += '<text x="22" y="' + (y - 8) + '" font-family="Georgia, serif" font-size="10" font-weight="700" fill="#1e3a8a">(d) Disability Information</text>';
    if (rec.formType === 'A') {
      var a = rec.step4A || {};
      inner += formField(y, 'Disability', a.disabilityType); y += step;
      inner += formField(y, 'Percentage', a.disabilityPercent + ' %'); y += step;
      inner += formField(y, 'Cert. Type', a.certType || a.certNo); y += step;
      inner += formField(y, 'UDID No.', a.udid || '—'); y += step;
      inner += formField(y, 'Aids', (a.aids || []).join(', ') || 'None'); y += step;
      inner += formField(y, 'Pension', a.pensionStatus); y += step;
      inner += formField(y, 'Care giver', a.caregiverName); y += step;
    } else {
      var b = rec.step4B || {};
      inner += formField(y, 'Suspected', b.suspectedDisabilityType); y += step;
      inner += formField(y, 'Aids', (b.aids || []).join(', ') || 'None'); y += step;
      inner += formField(y, 'Medical', b.medicalProblems || 'None'); y += step;
      inner += formField(y, 'Care giver', b.caregiverName); y += step;
      inner += '<text x="22" y="' + (y + 14) + '" font-family="Georgia, serif" font-size="9" fill="#b45309">Suspected case — pending certification.</text>';
    }
    return svgUri(formShell(rec, 2, 2, inner));
  }

  function mockCertificate(rec) {
    var a = rec.step4A || {};
    var s = rec.step1;
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400">' +
      '<rect width="300" height="400" fill="#ffffff"/>' +
      '<rect x="8" y="8" width="284" height="384" fill="none" stroke="#15803d" stroke-width="3"/>' +
      '<rect x="14" y="14" width="272" height="372" fill="none" stroke="#86efac"/>' +
      '<circle cx="150" cy="58" r="20" fill="none" stroke="#15803d" stroke-width="2"/>' +
      '<text x="150" y="64" font-family="Georgia, serif" font-size="16" fill="#15803d" text-anchor="middle">⚕</text>' +
      '<text x="150" y="100" font-family="Georgia, serif" font-size="14" font-weight="700" fill="#14532d" text-anchor="middle">DISABILITY CERTIFICATE</text>' +
      '<text x="150" y="118" font-family="Georgia, serif" font-size="8.5" fill="#3f6212" text-anchor="middle">(Under the RPwD Act, 2016)</text>' +
      '<line x1="40" y1="132" x2="260" y2="132" stroke="#86efac"/>' +
      formField(168, 'Name', s.name) +
      formField(198, 'Disability', a.disabilityType) +
      formField(228, 'Percentage', a.disabilityPercent + ' %') +
      formField(258, 'Cert. Type', a.certType || a.certNo) +
      formField(288, 'UDID No.', a.udid || '—') +
      formField(318, 'Issued at', a.issuePlace) +
      '<circle cx="80" cy="358" r="26" fill="none" stroke="#dc2626" stroke-width="1.5" opacity="0.8"/>' +
      '<text x="80" y="354" font-family="Arial, sans-serif" font-size="6" fill="#dc2626" text-anchor="middle" opacity="0.85">MEDICAL BOARD</text>' +
      '<text x="80" y="364" font-family="Arial, sans-serif" font-size="6" fill="#dc2626" text-anchor="middle" opacity="0.85">SIKKIM</text>' +
      '<text x="250" y="356" font-family="\'Segoe Script\', cursive" font-size="13" fill="#1d4ed8" text-anchor="middle">Dr. Authority</text>' +
      '<line x1="200" y1="362" x2="284" y2="362" stroke="#94a3b8"/>' +
      '<text x="242" y="374" font-family="Georgia, serif" font-size="8" fill="#64748b" text-anchor="middle">Chief Medical Officer</text>' +
      '</svg>';
    return svgUri(svg);
  }

  // Attach a set of demo documents to a record (scanned form pages + photo + certificate).
  function attachDemoImages(rec) {
    rec.formImages = [mockFormPage1(rec), mockFormPage2(rec)];
    rec.step1.photo = mockPhoto(rec.step1.name);
    if (rec.formType === 'A' && rec.step4A) rec.step4A.certImage = mockCertificate(rec);
  }

  function slug(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, ''); }
  function blocksOfDistrict(d) { var C = SDMIS.constants; return (C.blocks || []).filter(function (b) { return b.district === d; }); }
  function districtOfBlockName(name) { var C = SDMIS.constants; var b = (C.blocks || []).filter(function (x) { return x.name === name; })[0]; return b ? b.district : ''; }

  // Each inspector keeps their own flat list of Anganwadi-worker enumerators; a record picks one.
  function buildEnumerators(ownerId, district, i) {
    var count = 2 + (i % 2); // 2 or 3 per inspector
    var list = [];
    for (var k = 0; k < count; k++) {
      list.push({
        id: ownerId + '_en' + (k + 1),
        name: fullName(i * 3 + k + 200),
        awc: district + ' AWC-' + (k + 1),
        project: district + ' ICDS Project',
        district: district,
        contact: '9' + (400000000 + ((i * 7 + k) * 137) % 499999999)
      });
    }
    return list;
  }

  // Officials on the new model: inspectors mapped to Blocks (with their own enumerators),
  // SWOs mapped to a District.
  function buildOfficials() {
    var C = SDMIS.constants;
    var officials = [];
    officials.push({ id: 'user_admin', name: 'System Administrator', username: 'admin', role: 'admin', blocks: [], district: '', enumerators: [] });
    officials.push({ id: 'user_hq', name: 'HQ Monitoring Cell', username: 'hq', role: 'hq', blocks: [], district: '', enumerators: [] });

    (C.districts || []).forEach(function (d, i) {
      var dslug = slug(d);
      var dblocks = blocksOfDistrict(d);
      // one district-level SWO
      officials.push({
        id: 'user_swo_' + dslug, name: fullName(i + 100), username: 'swo_' + dslug,
        role: 'swo', district: d, blocks: [], enumerators: []
      });
      // one inspector covering all of the district's blocks (demonstrates multi-block mapping)
      var iid = 'user_insp_' + dslug;
      officials.push({
        id: iid, name: fullName(i * 2), username: 'insp_' + dslug,
        role: 'inspector', blocks: dblocks.map(function (b) { return b.name; }), district: '',
        enumerators: buildEnumerators(iid, d, i)
      });
    });
    return officials;
  }

  // Build a single beneficiary record for a given inspector / block / district
  function buildBeneficiary(i, formType, status, inspector, swo, block, district, surveyId) {
    var C = SDMIS.constants;
    var age = ri(3, 78);
    var gender = rand(C.gender.slice(0, 2));
    var residency = Math.random() > 0.25 ? 'local' : 'nonlocal';
    var coiType = residency === 'local' ? rand(C.coiDocTypes) : '';
    var occupation = rand(C.occupation);

    var step2 = {
      education: rand(C.education),
      educationOther: '',
      institute: rand(['Govt. Sr. Sec. School', 'Govt. Primary School', 'Private School', '']),
      occupation: occupation,
      postName: occupation === 'Government Employee' ? rand(['Clerk', 'Teacher', 'Office Asst.']) : '',
      employmentType: occupation === 'Government Employee' ? rand(C.employmentType) : '',
      employmentRemark: '',
      placeOfEmployment: occupation === 'Private' ? rand(['Hotel Sikkim', 'XYZ Pvt Ltd', 'Himalayan Traders', 'Apex Constructions']) : '',
      businessName: occupation === 'Self Employed' ? rand(['General Store', 'Tailoring', 'Dairy']) : '',
      annualIncome: rand(C.annualIncome)
    };
    if (step2.education === 'Others') step2.educationOther = 'Vocational training';

    var facilities = C.facilities.filter(function () { return Math.random() > 0.4; });

    // GPU / Ward pulled from the admin-managed masters so form dropdowns match
    var gpu = rand(C.gpus), ward = rand(C.wards);
    var enums = (inspector && inspector.enumerators) || [];

    var rec = {
      id: store.uid('ben'),
      surveyId: surveyId || null,
      formType: formType,
      gpu: gpu,
      ward: ward,
      status: status,
      createdBy: inspector.id,
      reviewedBy: (status === 'approved' || status === 'returned') ? (swo && swo.id) : null,
      returnRemark: status === 'returned' ? 'Aadhaar number appears incomplete. Please verify and resubmit.' : '',
      createdAt: new Date(Date.now() - ri(1, 60) * 86400000).toISOString(),
      convertedFrom: null,
      enumeratorId: enums.length ? rand(enums).id : null,
      step1: {
        name: fullName(i + 7),
        parentName: '',
        fatherName: fullName(i + 50),
        motherName: fullName(i + 65),
        dob: '',
        age: age,
        gender: gender,
        permanentAddress: 'Near ' + gpu + ', ' + block + ', ' + district,
        permSameAsCurrent: Math.random() > 0.3 ? 'Yes' : 'No',
        address: 'Present residence, ' + block,
        district: district,
        block: block,
        gpu: gpu,
        ward: ward,
        houseNo: 'H-' + ri(1, 120),
        pin: '73710' + ri(1, 9),
        contact: '9' + ri(100000000, 899999999),
        altMobile: Math.random() > 0.5 ? '7' + ri(100000000, 899999999) : '',
        altContactName: fullName(i + 30),
        altContactNo: '8' + ri(100000000, 899999999),
        aadhaar: '' + ri(2000, 9999) + ' ' + ri(1000, 9999) + ' ' + ri(1000, 9999),
        voterId: age >= 18 ? 'SK' + ri(1000000, 9999999) : '',
        offsprings: age > 25 ? [{ age: ri(1, 20), gender: rand(C.gender) }] : [],
        siblings: [{ age: ri(2, 40), gender: rand(C.gender) }],
        residency: residency,
        coiDocType: coiType,
        coiDocNo: coiType ? coiType + '/' + ri(1000, 9999) : '',
        idProofNo: residency === 'nonlocal' ? 'PAN/ABCDE' + ri(1000, 9999) + 'X' : '',
        maritalStatus: age >= 18 ? rand(C.maritalStatus) : 'Single',
        photo: ''
      },
      step2: step2,
      step3: {
        houseType: rand(C.houseType),
        familyCount: ri(2, 9),
        facilities: facilities,
        accessibilityDetail: facilities.indexOf('Accessibility') > -1 ? 'Ramp at entrance' : '',
        language: rand(['Nepali', 'Bhutia', 'Lepcha', 'Hindi', 'Limboo'])
      },
      step4A: null,
      step4B: null
    };

    var aids = C.aids.slice(0, C.aids.length - 1).filter(function () { return Math.random() > 0.7; });
    var disType = rand(C.disabilityType);

    // caregiver: ~60% have one; type drives salary vs relation
    function buildCaregiver() {
      var present = Math.random() > 0.4 ? 'Yes' : 'No';
      if (present !== 'Yes') {
        return { caregiverPresent: 'No', caregiverType: '', caregiverName: '', caregiverSalary: '', caregiverRelation: '' };
      }
      var type = rand(C.caregiverTypes);
      var hired = type === 'Hired' || type === 'Professional';
      return {
        caregiverPresent: 'Yes',
        caregiverType: type,
        caregiverName: fullName(i + 80),
        caregiverSalary: hired ? '₹' + (ri(3, 12) * 1000) + '/month' : '',
        caregiverRelation: hired ? '' : rand(['Father', 'Mother', 'Sibling', 'Spouse', 'Guardian'])
      };
    }
    function pickServices() {
      return C.services.filter(function () { return Math.random() > 0.78; });
    }
    function pickSchemes(status) {
      return status === 'Yes' ? C.pensionSchemes.filter(function () { return Math.random() > 0.6; }).slice(0, 2) : [];
    }

    if (formType === 'A') {
      var penA = rand(C.pensionStatus);
      var certTypeA = rand(C.certificateTypes);
      rec.step4A = Object.assign({
        disabilityType: disType,
        disabilityOther: disType === 'Others' ? 'Rare neurological condition' : '',
        disabilityPercent: ri(40, 100),
        certType: certTypeA,
        // Temporary certificates carry a "Valid Till" date; Permanent ones a UDID
        validTill: certTypeA === 'Temporary' ? ('20' + ri(26, 28) + '-0' + ri(1, 9) + '-1' + ri(0, 9)) : '',
        certImage: '',
        // UDID (18 digits) is issued only for a Permanent certificate
        udid: certTypeA === 'Permanent' ? (String(ri(100000000, 999999999)) + String(ri(100000000, 999999999))) : '',
        issueDate: '20' + ri(15, 23) + '-0' + ri(1, 9) + '-1' + ri(0, 9),
        issuePlace: district + ' District Hospital',
        aids: aids,
        aidsOther: '',
        benefits: rand([['Disability Pension'], ['Scholarship'], [], ['Bus Pass'], ['Disability Pension', 'Bus Pass']]),
        pensionStatus: penA,
        pensionSchemes: pickSchemes(penA),
        pensionSince: penA === 'Yes' ? '20' + ri(16, 23) : '',
        medicalProblems: rand(['', '', 'Hypertension', 'Diabetes', 'Epilepsy']),
        medicalSince: '20' + ri(15, 23),
        services: pickServices()
      }, buildCaregiver());
    } else {
      rec.step4B = Object.assign({
        suspectedDisabilityType: disType,
        disabilityOther: disType === 'Others' ? 'Suspected developmental delay' : '',
        aids: aids,
        aidsOther: '',
        benefits: rand([[], ['Awaiting certification']]),
        pensionStatus: 'No',
        pensionSchemes: [],
        pensionSince: '',
        medicalProblems: rand(['', 'Frequent seizures', 'Mobility difficulty']),
        medicalSince: '20' + ri(18, 23),
        services: pickServices()
      }, buildCaregiver());
    }

    attachDemoImages(rec);
    return rec;
  }

  // Turn a constants default entry into an { id, name, ...extra } master record.
  // (Blocks are objects carrying a parent District; other masters are plain strings.)
  function masterRecord(item) {
    if (item && typeof item === 'object') return Object.assign({ id: store.uid('mst') }, item);
    return { id: store.uid('mst'), name: item };
  }

  // Seed the admin-configurable master lists from the constants defaults
  function buildMasters() {
    var C = SDMIS.constants;
    var out = {};
    (C.masterKeys || []).forEach(function (m) {
      out[m.key] = (C[m.key] || []).map(masterRecord);
    });
    return out;
  }

  function buildSurveys() {
    return [
      { id: 'survey_2024_25', name: 'PwD Survey 2024-25', period: '2024-25', status: 'closed', createdAt: '2024-04-01T00:00:00.000Z' },
      { id: 'survey_2025_26', name: 'PwD Survey 2025-26', period: '2025-26', status: 'active', createdAt: '2025-04-01T00:00:00.000Z' }
    ];
  }

  function buildBeneficiaries(officials, activeSurveyId) {
    var records = [];
    var statuses = ['draft', 'submitted', 'submitted', 'approved', 'approved', 'returned'];
    var inspectors = officials.filter(function (o) { return o.role === 'inspector'; });
    var swos = officials.filter(function (o) { return o.role === 'swo'; });
    function swoForDistrict(d) { return swos.filter(function (s) { return s.district === d; })[0]; }

    // Records live in an inspector's blocks; the SWO for that block's district reviews them.
    inspectors.forEach(function (insp) {
      var iblocks = (insp.blocks || []);
      if (!iblocks.length) return;
      var count = ri(2, 4);
      for (var k = 0; k < count; k++) {
        var block = rand(iblocks);
        var district = districtOfBlockName(block);
        var swo = swoForDistrict(district);
        var formType = Math.random() > 0.45 ? 'A' : 'B';
        var status = rand(statuses);
        records.push(buildBeneficiary(records.length, formType, status, insp, swo, block, district, activeSurveyId));
      }
    });

    // Guarantee a reliable demo for the first inspector / its SWO (used by the demo logins):
    // 2 records pending verification + 1 approved Form B.
    var i0 = inspectors[0];
    if (i0 && (i0.blocks || []).length) {
      var b0 = i0.blocks[0], d0 = districtOfBlockName(b0), s0 = swoForDistrict(d0);
      records.push(buildBeneficiary(records.length, 'A', 'submitted', i0, s0, b0, d0, activeSurveyId));
      records.push(buildBeneficiary(records.length, 'B', 'submitted', i0, s0, b0, d0, activeSurveyId));
      records.push(buildBeneficiary(records.length, 'B', 'approved', i0, s0, b0, d0, activeSurveyId));
    }

    return records;
  }

  // Non-destructive migration for databases seeded before surveys / zone-level enumerator existed
  function migrate() {
    if (!store.isSeeded()) return;
    var db = store.read();
    var C = SDMIS.constants;
    var changed = false;
    if (!db.surveys || !db.surveys.length) {
      db.surveys = buildSurveys();
      changed = true;
    }
    // Backfill admin-configurable masters as { id, name } records
    if (!db.masters) { db.masters = {}; changed = true; }
    (C.masterKeys || []).forEach(function (m) {
      var cur = db.masters[m.key];
      if (!Array.isArray(cur)) {
        db.masters[m.key] = (C[m.key] || []).map(masterRecord);
        changed = true;
      } else if (cur.length && typeof cur[0] !== 'object') {
        // legacy string-array → { id, name }
        db.masters[m.key] = cur.map(function (name) { return { id: store.uid('mst'), name: name }; });
        changed = true;
      }
    });
    // Blocks now carry a parent District — backfill it from the constants defaults by name
    var blockDistrict = {};
    (C.blocks || []).forEach(function (b) { blockDistrict[b.name] = b.district; });
    if (Array.isArray(db.masters.blocks)) {
      db.masters.blocks.forEach(function (b) {
        if (b && typeof b === 'object' && !b.district && blockDistrict[b.name]) { b.district = blockDistrict[b.name]; changed = true; }
      });
    }
    // Backfill new fields introduced by the enhanced form (split parents, DOB, block, etc.)
    (db.beneficiaries || []).forEach(function (r) {
      var s1 = r.step1 || {};
      if (typeof s1.fatherName === 'undefined') { s1.fatherName = s1.parentName || ''; changed = true; }
      if (typeof s1.motherName === 'undefined') { s1.motherName = ''; changed = true; }
      ['dob', 'altMobile', 'block', 'permanentAddress', 'district'].forEach(function (k) { if (typeof s1[k] === 'undefined') { s1[k] = ''; changed = true; } });
      if (typeof s1.permSameAsCurrent === 'undefined') { s1.permSameAsCurrent = 'Yes'; changed = true; }
      // Permanent Address is now the primary address field — backfill it from the old present address
      if (!String(s1.permanentAddress || '').trim() && String(s1.address || '').trim()) { s1.permanentAddress = s1.address; changed = true; }
      // legacy addressType is no longer used
      if (typeof s1.coiDocType === 'undefined') {
        if (s1.coiNo) { s1.coiDocType = 'COI'; s1.coiDocNo = s1.coiNo; }
        else if (s1.rcNo) { s1.coiDocType = 'RC'; s1.coiDocNo = s1.rcNo; }
        else if (s1.sikkimSubjectNo) { s1.coiDocType = 'SSE'; s1.coiDocNo = s1.sikkimSubjectNo; }
        else { s1.coiDocType = ''; s1.coiDocNo = ''; }
        changed = true;
      }
      if (r.step2 && typeof r.step2.placeOfEmployment === 'undefined') { r.step2.placeOfEmployment = ''; changed = true; }
      // certNo → certType (Permanent when a UDID was recorded, else Temporary)
      if (r.step4A && typeof r.step4A.certType === 'undefined') {
        r.step4A.certType = r.step4A.udid ? 'Permanent' : 'Temporary';
        delete r.step4A.certNo;
        changed = true;
      }
      // Valid Till (Temporary certificate) — new field on Form A
      if (r.step4A && typeof r.step4A.validTill === 'undefined') { r.step4A.validTill = ''; changed = true; }
      [r.step4A, r.step4B].forEach(function (s4) {
        if (!s4) return;
        if (typeof s4.services === 'string') { s4.services = s4.services ? [s4.services] : []; changed = true; }
        if (typeof s4.services === 'undefined') { s4.services = []; changed = true; }
        if (typeof s4.pensionSchemes === 'undefined') { s4.pensionSchemes = []; changed = true; }
        // "Any other benefits" is now a list of entries (was a single string)
        if (typeof s4.benefits === 'string') { s4.benefits = (s4.benefits && s4.benefits !== 'None') ? [s4.benefits] : []; changed = true; }
        if (typeof s4.benefits === 'undefined') { s4.benefits = []; changed = true; }
        if (typeof s4.caregiverPresent === 'undefined') {
          s4.caregiverPresent = s4.caregiverName ? 'Yes' : 'No';
          s4.caregiverType = s4.caregiverName ? 'Family Member' : '';
          s4.caregiverSalary = '';
          changed = true;
        }
      });
    });
    var active = db.surveys.filter(function (s) { return s.status === 'active'; })[0] || db.surveys[0];
    (db.beneficiaries || []).forEach(function (r) {
      if (!r.surveyId) { r.surveyId = active.id; changed = true; }
    });
    // Move officials off the old zone model onto Blocks (inspectors) / District (SWOs).
    // Enumerators, previously stored on the zone, move onto each inspector as a flat list.
    // Officials that shared an old zone are mapped to the SAME district so the inspector's
    // records stay visible to that zone's SWO.
    var allBlocks = (db.masters.blocks || []);
    var allDistricts = (db.masters.districts || []);
    function blockDistrictOf(name) { var b = allBlocks.filter(function (x) { return x.name === name; })[0]; return b ? (b.district || '') : ''; }
    var zoneDistrict = {}; var di = 0;
    (db.zones || []).forEach(function (z) { zoneDistrict[z.id] = allDistricts.length ? allDistricts[di++ % allDistricts.length].name : ''; });
    function pickDistrict(zoneId, idx) {
      if (zoneId && zoneDistrict[zoneId]) return zoneDistrict[zoneId];
      return allDistricts.length ? allDistricts[idx % allDistricts.length].name : '';
    }
    (db.officials || []).forEach(function (o, idx) {
      if (o.role === 'inspector') {
        if (!Array.isArray(o.enumerators)) {
          var z = o.zoneId ? (db.zones || []).filter(function (x) { return x.id === o.zoneId; })[0] : null;
          o.enumerators = (z && z.enumerators) ? z.enumerators.slice() : [];
          changed = true;
        }
        if (!Array.isArray(o.blocks) || !o.blocks.length) {
          var d = pickDistrict(o.zoneId, idx);
          var bs = allBlocks.filter(function (b) { return b.district === d; }).map(function (b) { return b.name; });
          o.blocks = bs.length ? bs : (allBlocks.length ? [allBlocks[idx % allBlocks.length].name] : []);
          o.district = '';
          changed = true;
        }
      } else if (o.role === 'swo') {
        if (!o.district) {
          o.district = pickDistrict(o.zoneId, idx);
          o.blocks = [];
          changed = true;
        }
      } else if (!Array.isArray(o.enumerators)) { o.enumerators = []; changed = true; }
      if (typeof o.zoneId !== 'undefined') { delete o.zoneId; changed = true; }
    });
    // Ensure every beneficiary has a block/district and a resolvable enumerator; drop zoneId
    (db.beneficiaries || []).forEach(function (r) {
      var s1 = r.step1 || {};
      var insp = (db.officials || []).filter(function (o) { return o.id === r.createdBy; })[0];
      if (!s1.block) { s1.block = (insp && insp.blocks && insp.blocks.length) ? insp.blocks[0] : ((allBlocks[0] || {}).name || ''); changed = true; }
      if (!s1.district && s1.block) { s1.district = blockDistrictOf(s1.block); changed = true; }
      if (!r.enumeratorId && insp && insp.enumerators && insp.enumerators.length) { r.enumeratorId = insp.enumerators[0].id; changed = true; }
      if (typeof r.zoneId !== 'undefined') { delete r.zoneId; changed = true; }
    });
    // Backfill demo documents for records seeded before attachments existed
    (db.beneficiaries || []).forEach(function (r) {
      if (!r.formImages || !r.formImages.length) { attachDemoImages(r); changed = true; }
    });
    if (changed) { store.write(db); console.log('SDMIS migrated to multi-enumerator schema'); }
  }

  function run(force) {
    if (store.isSeeded() && !force) { migrate(); return; }
    var surveys = buildSurveys();
    var activeSurvey = surveys.filter(function (s) { return s.status === 'active'; })[0] || surveys[0];
    var officials = buildOfficials();
    var beneficiaries = buildBeneficiaries(officials, activeSurvey.id);
    store.seedDb({ surveys: surveys, zones: [], officials: officials, beneficiaries: beneficiaries, masters: buildMasters() });
    console.log('SDMIS seeded:', surveys.length, 'surveys,', officials.length, 'officials,', beneficiaries.length, 'records');
  }

  return { run: run };
})();
