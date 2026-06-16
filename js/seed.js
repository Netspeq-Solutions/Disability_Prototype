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

  // A zone has several Anganwadi-worker enumerators (one per AWC); a record picks one
  function buildEnumerators(zoneId, name, i) {
    var count = 2 + (i % 2); // 2 or 3 per zone
    var list = [];
    for (var k = 0; k < count; k++) {
      list.push({
        id: zoneId + '_en' + (k + 1),
        name: fullName(i * 3 + k + 200),
        awc: name + ' AWC-' + (k + 1),
        project: name + ' ICDS Project',
        district: pick(DISTRICTS, i),
        contact: '9' + (400000000 + ((i * 7 + k) * 137) % 499999999)
      });
    }
    return list;
  }

  function buildZones() {
    return ZONE_NAMES.map(function (name, i) {
      var n = i + 1;
      var code = 'Z' + (n < 10 ? '0' + n : n);
      var id = 'zone_' + code.toLowerCase();
      return {
        id: id,
        code: code,
        name: name,
        gpus: [name + ' GPU-I', name + ' GPU-II', name + ' GPU-III'],
        wards: ['Ward 1', 'Ward 2', 'Ward 3', 'Ward 4'],
        enumerators: buildEnumerators(id, name, i)
      };
    });
  }

  function buildOfficials(zones) {
    var officials = [];
    officials.push({ id: 'user_admin', name: 'System Administrator', username: 'admin', role: 'admin', zoneId: null });
    officials.push({ id: 'user_hq', name: 'HQ Monitoring Cell', username: 'hq', role: 'hq', zoneId: null });

    zones.forEach(function (z, i) {
      var num = z.code.replace('Z', '');
      // 2 inspectors per zone
      officials.push({
        id: 'user_insp_' + z.code.toLowerCase() + '_a',
        name: fullName(i * 2),
        username: 'insp_' + z.code.toLowerCase() + '_a',
        role: 'inspector', zoneId: z.id
      });
      officials.push({
        id: 'user_insp_' + z.code.toLowerCase() + '_b',
        name: fullName(i * 2 + 1),
        username: 'insp_' + z.code.toLowerCase() + '_b',
        role: 'inspector', zoneId: z.id
      });
      // 1 SWO per zone
      officials.push({
        id: 'user_swo_' + z.code.toLowerCase(),
        name: fullName(i + 100),
        username: 'swo_' + z.code.toLowerCase(),
        role: 'swo', zoneId: z.id
      });
    });
    return officials;
  }

  // Build a single beneficiary record
  function buildBeneficiary(i, zone, formType, status, inspectorId, swoId, surveyId) {
    var C = SDMIS.constants;
    var age = ri(3, 78);
    var gender = rand(C.gender.slice(0, 2));
    var residency = Math.random() > 0.25 ? 'local' : 'nonlocal';
    var occupation = rand(C.occupation);

    var step2 = {
      education: rand(C.education),
      educationOther: '',
      institute: rand(['Govt. Sr. Sec. School', 'Govt. Primary School', 'Private School', '']),
      occupation: occupation,
      postName: occupation === 'Government Employee' ? rand(['Clerk', 'Teacher', 'Office Asst.']) : '',
      employmentType: occupation === 'Government Employee' ? rand(C.employmentType) : '',
      employmentRemark: '',
      businessName: occupation === 'Self Employed' ? rand(['General Store', 'Tailoring', 'Dairy']) : '',
      annualIncome: rand(C.annualIncome)
    };
    if (step2.education === 'Others') step2.educationOther = 'Vocational training';

    var facilities = C.facilities.filter(function () { return Math.random() > 0.4; });

    var rec = {
      id: store.uid('ben'),
      surveyId: surveyId || null,
      formType: formType,
      zoneId: zone.id,
      gpu: rand(zone.gpus),
      ward: rand(zone.wards),
      status: status,
      createdBy: inspectorId,
      reviewedBy: (status === 'approved' || status === 'returned') ? swoId : null,
      returnRemark: status === 'returned' ? 'Aadhaar number appears incomplete. Please verify and resubmit.' : '',
      createdAt: new Date(Date.now() - ri(1, 60) * 86400000).toISOString(),
      convertedFrom: null,
      enumeratorId: (zone.enumerators && zone.enumerators.length) ? rand(zone.enumerators).id : null,
      step1: {
        name: fullName(i + 7),
        parentName: fullName(i + 50),
        age: age,
        gender: gender,
        address: rand(zone.gpus) + ', ' + zone.name,
        gpu: rand(zone.gpus),
        ward: rand(zone.wards),
        houseNo: 'H-' + ri(1, 120),
        pin: '73710' + ri(1, 9),
        contact: '9' + ri(100000000, 899999999),
        altContactName: fullName(i + 30),
        altContactNo: '8' + ri(100000000, 899999999),
        aadhaar: '' + ri(2000, 9999) + ' ' + ri(1000, 9999) + ' ' + ri(1000, 9999),
        voterId: age >= 18 ? 'SK' + ri(1000000, 9999999) : '',
        offsprings: age > 25 ? [{ age: ri(1, 20), gender: rand(C.gender) }] : [],
        siblings: [{ age: ri(2, 40), gender: rand(C.gender) }],
        residency: residency,
        coiNo: residency === 'local' ? 'COI/' + ri(1000, 9999) : '',
        rcNo: '',
        sikkimSubjectNo: residency === 'local' ? 'SSC/' + ri(100, 999) : '',
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

    if (formType === 'A') {
      rec.step4A = {
        disabilityType: disType,
        disabilityOther: disType === 'Others' ? 'Rare neurological condition' : '',
        disabilityPercent: ri(40, 100),
        certNo: 'DC/' + zone.code + '/' + ri(1000, 9999),
        certImage: '',
        udid: 'SK' + zone.code + ri(100000000000, 999999999999),
        issueDate: '20' + ri(15, 23) + '-0' + ri(1, 9) + '-1' + ri(0, 9),
        issuePlace: zone.name + ' District Hospital',
        aids: aids,
        aidsOther: '',
        benefits: rand(['Disability Pension', 'Scholarship', 'None', 'Bus Pass']),
        pensionStatus: rand(C.pensionStatus),
        pensionSince: '20' + ri(16, 23),
        medicalProblems: rand(['', '', 'Hypertension', 'Diabetes', 'Epilepsy']),
        medicalSince: '20' + ri(15, 23),
        services: rand(['', 'Physiotherapy', 'Special education']),
        caregiverName: fullName(i + 80),
        caregiverRelation: rand(['Father', 'Mother', 'Sibling', 'Spouse', 'Guardian'])
      };
    } else {
      rec.step4B = {
        suspectedDisabilityType: disType,
        disabilityOther: disType === 'Others' ? 'Suspected developmental delay' : '',
        aids: aids,
        aidsOther: '',
        benefits: rand(['None', 'Awaiting certification']),
        pensionStatus: 'No',
        pensionSince: '',
        medicalProblems: rand(['', 'Frequent seizures', 'Mobility difficulty']),
        medicalSince: '20' + ri(18, 23),
        services: rand(['', 'Under observation']),
        caregiverName: fullName(i + 80),
        caregiverRelation: rand(['Father', 'Mother', 'Sibling', 'Guardian'])
      };
    }

    return rec;
  }

  function buildSurveys() {
    return [
      { id: 'survey_2024_25', name: 'PwD Survey 2024-25', period: '2024-25', status: 'closed', createdAt: '2024-04-01T00:00:00.000Z' },
      { id: 'survey_2025_26', name: 'PwD Survey 2025-26', period: '2025-26', status: 'active', createdAt: '2025-04-01T00:00:00.000Z' }
    ];
  }

  function buildBeneficiaries(zones, officials, activeSurveyId) {
    var records = [];
    var statuses = ['draft', 'submitted', 'submitted', 'approved', 'approved', 'returned'];

    function inspOf(zone) { return officials.filter(function (o) { return o.zoneId === zone.id && o.role === 'inspector'; })[0]; }
    function swoOf(zone) { return officials.filter(function (o) { return o.zoneId === zone.id && o.role === 'swo'; })[0]; }

    // Spread sample records across the first 8 zones
    for (var z = 0; z < 8; z++) {
      var zone = zones[z];
      var insA = inspOf(zone), swo = swoOf(zone);
      var count = ri(2, 4);
      for (var k = 0; k < count; k++) {
        var formType = Math.random() > 0.45 ? 'A' : 'B';
        var status = rand(statuses);
        records.push(buildBeneficiary(records.length, zone, formType, status, insA.id, swo.id, activeSurveyId));
      }
    }

    // Guarantee a reliable demo in zone Z01 (used by the demo SWO login):
    // 2 records pending verification + 1 approved Form B that can be converted.
    var z01 = zones[0], i01 = inspOf(z01), s01 = swoOf(z01);
    records.push(buildBeneficiary(records.length, z01, 'A', 'submitted', i01.id, s01.id, activeSurveyId));
    records.push(buildBeneficiary(records.length, z01, 'B', 'submitted', i01.id, s01.id, activeSurveyId));
    records.push(buildBeneficiary(records.length, z01, 'B', 'approved', i01.id, s01.id, activeSurveyId));

    return records;
  }

  // Non-destructive migration for databases seeded before surveys / zone-level enumerator existed
  function migrate() {
    if (!store.isSeeded()) return;
    var db = store.read();
    var changed = false;
    if (!db.surveys || !db.surveys.length) {
      db.surveys = buildSurveys();
      changed = true;
    }
    var active = db.surveys.filter(function (s) { return s.status === 'active'; })[0] || db.surveys[0];
    (db.beneficiaries || []).forEach(function (r) {
      if (!r.surveyId) { r.surveyId = active.id; changed = true; }
    });
    // Each zone keeps a LIST of enumerators; migrate the old single-object / cover shape
    (db.zones || []).forEach(function (z, i) {
      if (!z.enumerators) {
        if (z.enumerator && (z.enumerator.name || z.enumerator.awc)) {
          z.enumerator.id = z.enumerator.id || (z.id + '_en1');
          z.enumerators = [z.enumerator];
        } else {
          z.enumerators = buildEnumerators(z.id, z.name, i);
        }
        delete z.enumerator;
        changed = true;
      }
    });
    // Point each record at one of its zone's enumerators
    (db.beneficiaries || []).forEach(function (r) {
      if (!r.enumeratorId) {
        var z = (db.zones || []).filter(function (x) { return x.id === r.zoneId; })[0];
        if (z && z.enumerators && z.enumerators.length) { r.enumeratorId = z.enumerators[0].id; changed = true; }
      }
    });
    if (changed) { store.write(db); console.log('SDMIS migrated to multi-enumerator schema'); }
  }

  function run(force) {
    if (store.isSeeded() && !force) { migrate(); return; }
    var surveys = buildSurveys();
    var activeSurvey = surveys.filter(function (s) { return s.status === 'active'; })[0] || surveys[0];
    var zones = buildZones();
    var officials = buildOfficials(zones);
    var beneficiaries = buildBeneficiaries(zones, officials, activeSurvey.id);
    store.seedDb({ surveys: surveys, zones: zones, officials: officials, beneficiaries: beneficiaries });
    console.log('SDMIS seeded:', surveys.length, 'surveys,', zones.length, 'zones,', officials.length, 'officials,', beneficiaries.length, 'records');
  }

  return { run: run };
})();
