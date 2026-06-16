/* SDMIS — shared 4-step Form A / Form B wizard engine */
window.SDMIS = window.SDMIS || {};

SDMIS.formWizard = (function () {
  var ui = SDMIS.ui, C = SDMIS.constants, store = SDMIS.store;

  function blankRecord(formType, zoneId, createdBy, surveyId) {
    return {
      formType: formType, surveyId: surveyId || null, zoneId: zoneId, gpu: '', ward: '',
      status: 'draft', createdBy: createdBy, reviewedBy: null, returnRemark: '',
      createdAt: new Date().toISOString(), convertedFrom: null, enumeratorId: null,
      step1: {
        name: '', parentName: '', age: '', gender: '', address: '', gpu: '', ward: '',
        houseNo: '', pin: '', contact: '', altContactName: '', altContactNo: '',
        aadhaar: '', voterId: '', offsprings: [], siblings: [],
        residency: 'local', coiNo: '', rcNo: '', sikkimSubjectNo: '', idProofNo: '',
        maritalStatus: '', photo: ''
      },
      step2: { education: '', educationOther: '', institute: '', occupation: '', postName: '', employmentType: '', employmentRemark: '', businessName: '', annualIncome: '' },
      step3: { houseType: '', familyCount: '', facilities: [], accessibilityDetail: '', language: '' },
      step4A: formType === 'A' ? { disabilityType: '', disabilityOther: '', disabilityPercent: '', certNo: '', certImage: '', udid: '', issueDate: '', issuePlace: '', aids: [], aidsOther: '', benefits: '', pensionStatus: '', pensionSince: '', medicalProblems: '', medicalSince: '', services: '', caregiverName: '', caregiverRelation: '' } : null,
      step4B: formType === 'B' ? { suspectedDisabilityType: '', disabilityOther: '', aids: [], aidsOther: '', benefits: '', pensionStatus: '', pensionSince: '', medicalProblems: '', medicalSince: '', services: '', caregiverName: '', caregiverRelation: '' } : null
    };
  }

  // ============ EDITABLE WIZARD ============
  function open($container, opts) {
    // opts: { record, zone, afterSave (fn), onCancel (fn) }
    var rec = JSON.parse(JSON.stringify(opts.record));
    var zone = opts.zone;
    var survey = rec.surveyId ? store.find('surveys', rec.surveyId) : null;
    var formType = rec.formType;
    var step = 1;
    var steps = ['Personal', 'Qualification & Occupation', 'Family', formType === 'A' ? 'Disability (Certified)' : 'Suspected Disability'];

    function render() {
      var dots = steps.map(function (label, i) {
        var n = i + 1;
        var state = n < step ? 'done' : (n === step ? 'active' : 'todo');
        var dotCls = state === 'active' ? 'bg-indigo-600 text-white' : state === 'done' ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500';
        var lineCls = n < step ? 'bg-emerald-500' : 'bg-slate-200';
        return (i > 0 ? '<div class="flex-1 h-0.5 ' + lineCls + ' mx-1"></div>' : '') +
          '<div class="flex flex-col items-center">' +
            '<div class="step-dot w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ' + dotCls + '">' + (state === 'done' ? '✓' : n) + '</div>' +
            '<div class="hidden sm:block text-[11px] mt-1 ' + (n === step ? 'text-indigo-600 font-medium' : 'text-slate-400') + ' text-center max-w-[110px]">' + label + '</div>' +
          '</div>';
      }).join('');

      // compact label shown only on mobile (under the dots)
      var mobileStepLabel = '<div class="sm:hidden text-center text-xs font-medium text-indigo-600 mt-2">Step ' + step + ' of ' + steps.length + ' · ' + ui.esc(steps[step - 1]) + '</div>';

      var formBadge = (formType === 'A'
        ? ui.badge('Form A · Certified', 'bg-emerald-100 text-emerald-700')
        : ui.badge('Form B · Suspected', 'bg-amber-100 text-amber-700')) +
        (survey ? ' ' + ui.badge(survey.period, 'bg-indigo-100 text-indigo-700') : '');

      var returnedBanner = rec.status === 'returned'
        ? '<div class="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg px-4 py-2 mb-4">↩ Returned by SWO: ' + ui.esc(rec.returnRemark || 'Please review and correct.') + '</div>'
        : '';

      var selEnum = (zone && zone.enumerators ? zone.enumerators : []).filter(function (e) { return e.id === rec.enumeratorId; })[0];
      var surveyBanner = (survey || zone)
        ? '<div class="bg-indigo-50 border border-indigo-200 text-indigo-700 text-sm rounded-lg px-4 py-2 mb-4">' +
            (survey ? 'Survey: <b>' + ui.esc(survey.name) + '</b> (' + ui.esc(survey.period) + ')' : '') +
            (survey && zone ? ' &nbsp;·&nbsp; ' : '') +
            (zone ? 'Zone: <b>' + ui.esc(zone.name) + '</b>' : '') +
            (selEnum ? ' &nbsp;·&nbsp; Enumerator: <b>' + ui.esc(selEnum.name) + '</b>' : '') +
          '</div>'
        : '';

      $container.html(
        '<div class="max-w-4xl mx-auto">' +
          '<div class="flex items-center justify-between mb-4">' +
            '<button id="wiz-back-list" class="text-sm text-slate-500 hover:text-slate-800">&larr; Back to records</button>' +
            formBadge +
          '</div>' +
          returnedBanner +
          surveyBanner +
          '<div class="bg-white rounded-xl border shadow-sm">' +
            '<div class="px-3 sm:px-6 pt-5 pb-4 border-b"><div class="flex items-center justify-center">' + dots + '</div>' + mobileStepLabel + '</div>' +
            '<div id="wiz-body" class="p-4 sm:p-6"></div>' +
            '<div class="px-4 sm:px-6 py-4 border-t bg-slate-50 rounded-b-xl flex justify-between gap-2">' +
              '<button id="wiz-prev" class="px-3 sm:px-4 py-2 text-sm rounded-md border border-slate-300 text-slate-600 hover:bg-slate-100 ' + (step === 1 ? 'invisible' : '') + '">&larr; <span class="hidden sm:inline">Previous</span><span class="sm:hidden">Back</span></button>' +
              '<div class="flex gap-2">' +
                '<button id="wiz-draft" class="px-3 sm:px-4 py-2 text-sm rounded-md border border-indigo-300 text-indigo-600 hover:bg-indigo-50">Save<span class="hidden sm:inline"> Draft</span></button>' +
                (step < steps.length
                  ? '<button id="wiz-next" class="px-4 sm:px-5 py-2 text-sm rounded-md bg-indigo-600 text-white hover:bg-indigo-700">Next &rarr;</button>'
                  : '<button id="wiz-submit" class="px-4 sm:px-5 py-2 text-sm rounded-md bg-emerald-600 text-white hover:bg-emerald-700">Submit<span class="hidden sm:inline"> for Verification</span></button>') +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>'
      );

      $('#wiz-body').html(stepHtml(step));
      bindStep(step);

      $('#wiz-back-list').on('click', function () { if (opts.onCancel) opts.onCancel(); });
      $('#wiz-prev').on('click', function () { collectStep(step); step--; render(); });
      $('#wiz-next').on('click', function () {
        collectStep(step);
        if (validateStep(step)) { step++; render(); }
        else ui.toast('Please fix the highlighted fields', 'error');
      });
      $('#wiz-draft').on('click', function () {
        collectStep(step); saveRecord('draft');
      });
      $('#wiz-submit').on('click', function () {
        collectStep(step);
        // validate all steps
        var bad = 0;
        for (var s = 1; s <= steps.length; s++) { if (!validateStep(s, true)) bad++; }
        if (bad) {
          ui.toast('Some steps have missing required fields', 'error');
          // jump to first invalid
          for (var s2 = 1; s2 <= steps.length; s2++) { if (!validateStep(s2, true)) { step = s2; render(); break; } }
          return;
        }
        saveRecord('submitted');
      });
    }

    function saveRecord(status) {
      rec.status = status;
      if (status === 'submitted') { rec.returnRemark = ''; }
      var saved;
      if (rec.id) { saved = store.replace('beneficiaries', rec.id, rec); }
      else { saved = store.insert('beneficiaries', rec); rec.id = saved.id; }
      store.audit(status === 'submitted' ? 'submit' : 'save-draft', rec.id, 'Form ' + formType);
      ui.toast(status === 'submitted' ? 'Record submitted for verification' : 'Draft saved', 'success');
      if (opts.afterSave) opts.afterSave(saved);
    }

    // ---------- step HTML (1 = Personal, 2 = Qualification, 3 = Family, 4 = Disability) ----------
    function stepHtml(n) {
      if (n === 1) return step1Html();
      if (n === 2) return step2Html();
      if (n === 3) return step3Html();
      return step4Html();
    }

    function step1Html() {
      var s = rec.step1;
      var gpuOpts = zone ? zone.gpus : [];
      var wardOpts = zone ? zone.wards : [];
      var enumList = (zone && zone.enumerators) ? zone.enumerators : [];
      var enumField = enumList.length
        ? ui.field('Enumerator (who collected this survey)', ui.select('enumeratorId', enumList.map(function (en) { return { value: en.id, label: en.name + (en.awc ? ' — ' + en.awc : '') }; }), rec.enumeratorId || '', { placeholder: 'Select enumerator' }), { required: true, name: 'enumeratorId', cls: 'mb-4 max-w-md' })
        : '<div class="bg-amber-50 border border-amber-200 text-amber-700 text-xs rounded px-3 py-2 mb-4">No enumerators set for this zone yet. Add them via the “Enumerators” button on the records page before submitting.</div>';
      return '<p class="text-xs text-slate-400 mb-4 uppercase tracking-wide">Personal Information &nbsp;·&nbsp; please use BLOCK LETTERS</p>' +
        enumField +
        '<div class="grid md:grid-cols-2 gap-x-5">' +
          ui.field('Name', ui.text('name', s.name, { attrs: 'style="text-transform:uppercase"' }), { required: true, name: 'name' }) +
          ui.field("Father's / Mother's Name", ui.text('parentName', s.parentName), { required: true, name: 'parentName' }) +
          ui.field('Age', ui.text('age', s.age, { type: 'number', attrs: 'min=0 max=120' }), { required: true, name: 'age' }) +
          ui.field('Gender', ui.select('gender', C.gender, s.gender), { required: true, name: 'gender' }) +
          ui.field('Address', ui.textarea('address', s.address), { required: true, name: 'address', cls: 'md:col-span-2' }) +
          ui.field('GPU', gpuOpts.length ? ui.select('gpu', gpuOpts, s.gpu) : ui.text('gpu', s.gpu), { required: true, name: 'gpu' }) +
          ui.field('Ward Number', wardOpts.length ? ui.select('ward', wardOpts, s.ward) : ui.text('ward', s.ward), { required: true, name: 'ward' }) +
          ui.field('House Number', ui.text('houseNo', s.houseNo), { name: 'houseNo' }) +
          ui.field('PIN Code', ui.text('pin', s.pin, { attrs: 'maxlength=6' }), { required: true, name: 'pin' }) +
          ui.field('Contact Number', ui.text('contact', s.contact, { type: 'tel', attrs: 'maxlength=10' }), { required: true, name: 'contact' }) +
          ui.field('Aadhaar Number', ui.text('aadhaar', s.aadhaar), { required: true, name: 'aadhaar' }) +
          ui.field('Additional Contact Person Name', ui.text('altContactName', s.altContactName), { required: true, name: 'altContactName' }) +
          ui.field('Additional Contact Number', ui.text('altContactNo', s.altContactNo, { type: 'tel', attrs: 'maxlength=10' }), { required: true, name: 'altContactNo' }) +
          '<div id="voterId-wrap">' + ui.field('Voter ID Number', ui.text('voterId', s.voterId), { name: 'voterId', hint: 'Applicable for age 18 and above' }) + '</div>' +
          ui.field('Marital Status', ui.select('maritalStatus', C.maritalStatus, s.maritalStatus), { name: 'maritalStatus' }) +
        '</div>' +
        // repeatable family members
        '<div class="grid md:grid-cols-2 gap-5 mt-2">' +
          repeatBlock('Offsprings', 'offsprings', s.offsprings) +
          repeatBlock('Siblings', 'siblings', s.siblings) +
        '</div>' +
        // residency
        '<div class="mt-4 border-t pt-4">' +
          ui.field('Residency Status', ui.select('residency', C.residency, s.residency), { required: true, name: 'residency', cls: 'max-w-xs' }) +
          '<div id="residency-local" class="grid md:grid-cols-3 gap-x-5">' +
            ui.field('COI Number', ui.text('coiNo', s.coiNo), { name: 'coiNo' }) +
            ui.field('RC Number', ui.text('rcNo', s.rcNo), { name: 'rcNo' }) +
            ui.field('Sikkim Subject Certificate No.', ui.text('sikkimSubjectNo', s.sikkimSubjectNo), { name: 'sikkimSubjectNo' }) +
            '<p class="text-xs text-slate-400 md:col-span-3 -mt-1">Optional — application may proceed even if these are unavailable.</p>' +
          '</div>' +
          '<div id="residency-nonlocal">' +
            ui.field('Identity Proof Number', ui.text('idProofNo', s.idProofNo), { name: 'idProofNo', hint: 'At least one valid identity proof is required for non-local beneficiaries.' }) +
          '</div>' +
        '</div>' +
        // photo
        '<div class="mt-4 border-t pt-4">' +
          ui.field('Passport Size Photograph', '<input type="file" accept="image/*" id="photo-input" class="text-sm">', { name: 'photo' }) +
          '<div id="photo-preview" class="mt-2">' + (s.photo ? '<img src="' + s.photo + '" class="h-24 rounded border">' : '') + '</div>' +
        '</div>';
    }

    function repeatBlock(label, key, items) {
      var rows = (items || []).map(function (it, i) { return repeatRow(key, it, i); }).join('');
      return '<div class="border rounded-lg p-3 bg-slate-50">' +
        '<div class="flex items-center justify-between mb-2"><span class="text-sm font-medium text-slate-600">' + label + '</span>' +
        '<button type="button" class="rep-add text-xs text-indigo-600 hover:underline" data-key="' + key + '">+ Add</button></div>' +
        '<div class="rep-rows space-y-2" data-key="' + key + '">' + (rows || '<p class="text-xs text-slate-400 rep-empty">None added</p>') + '</div></div>';
    }
    function repeatRow(key, it, i) {
      it = it || { age: '', gender: '' };
      return '<div class="rep-row flex gap-2 items-center" data-key="' + key + '">' +
        '<input type="number" min="0" placeholder="Age" value="' + ui.esc(it.age) + '" class="rep-age ' + ui.inputCls + ' w-20">' +
        ui.select('', C.gender, it.gender).replace('class="', 'class="rep-gender flex-1 ') +
        '<button type="button" class="rep-del text-rose-500 text-sm px-1">&times;</button>' +
        '</div>';
    }

    function step2Html() {
      var s = rec.step2;
      return '<p class="text-xs text-slate-400 mb-4 uppercase tracking-wide">Step 2 · Qualification &amp; Occupation</p>' +
        '<div class="grid md:grid-cols-2 gap-x-5">' +
          ui.field('Education Qualification', ui.select('education', C.education, s.education), { required: true, name: 'education' }) +
          '<div id="education-other-wrap">' + ui.field('Education Remarks', ui.text('educationOther', s.educationOther), { name: 'educationOther' }) + '</div>' +
          ui.field('Institute / School', ui.text('institute', s.institute), { name: 'institute' }) +
          ui.field('Occupation', ui.select('occupation', C.occupation, s.occupation), { required: true, name: 'occupation' }) +
          '<div id="occ-post-wrap">' + ui.field('Post Name', ui.text('postName', s.postName), { name: 'postName' }) + '</div>' +
          '<div id="occ-emptype-wrap">' + ui.field('Type of Employment', ui.select('employmentType', C.employmentType, s.employmentType), { name: 'employmentType' }) + '</div>' +
          '<div id="occ-emprem-wrap">' + ui.field('Employment Remarks', ui.text('employmentRemark', s.employmentRemark), { name: 'employmentRemark' }) + '</div>' +
          '<div id="occ-biz-wrap">' + ui.field('Business Name', ui.text('businessName', s.businessName), { name: 'businessName' }) + '</div>' +
          ui.field('Cumulative Annual Income', ui.select('annualIncome', C.annualIncome, s.annualIncome), { required: true, name: 'annualIncome' }) +
        '</div>';
    }

    function step3Html() {
      var s = rec.step3;
      return '<p class="text-xs text-slate-400 mb-4 uppercase tracking-wide">Step 3 · Family Information</p>' +
        '<div class="grid md:grid-cols-2 gap-x-5">' +
          ui.field('House Type', ui.select('houseType', C.houseType, s.houseType), { required: true, name: 'houseType' }) +
          ui.field('No. of Family Members', ui.text('familyCount', s.familyCount, { type: 'number', attrs: 'min=1' }), { required: true, name: 'familyCount' }) +
          ui.field('Language Spoken', ui.text('language', s.language), { name: 'language' }) +
        '</div>' +
        ui.field('Facilities at Home', ui.checkGroup('facilities', C.facilities, s.facilities), { name: 'facilities' }) +
        '<div id="accessibility-wrap">' + ui.field('Accessibility Facility Details', ui.textarea('accessibilityDetail', s.accessibilityDetail, { placeholder: 'Ramps, handrails, etc.' }), { name: 'accessibilityDetail' }) + '</div>';
    }

    function step4Html() {
      if (formType === 'A') return step4AHtml();
      return step4BHtml();
    }

    function step4AHtml() {
      var s = rec.step4A;
      return '<p class="text-xs text-slate-400 mb-4 uppercase tracking-wide">Step 4 · Disability Information (Certified)</p>' +
        '<div class="grid md:grid-cols-2 gap-x-5">' +
          ui.field('Disability Type', ui.select('disabilityType', C.disabilityType, s.disabilityType), { required: true, name: 'disabilityType' }) +
          '<div id="dis-other-wrap">' + ui.field('Specify Other Disability', ui.text('disabilityOther', s.disabilityOther), { name: 'disabilityOther' }) + '</div>' +
          ui.field('Disability Percentage (%)', ui.text('disabilityPercent', s.disabilityPercent, { type: 'number', attrs: 'min=0 max=100' }), { required: true, name: 'disabilityPercent' }) +
          ui.field('Disability Certificate Number', ui.text('certNo', s.certNo), { required: true, name: 'certNo' }) +
          ui.field('UDID Number', ui.text('udid', s.udid, { attrs: 'maxlength=18' }).replace(ui.inputCls, ui.inputCls + ' udid-box'), { name: 'udid', hint: '18-character alphanumeric' }) +
          ui.field('Certificate Issue Date', ui.text('issueDate', s.issueDate, { type: 'date' }), { name: 'issueDate' }) +
          ui.field('Place of Issue', ui.text('issuePlace', s.issuePlace), { name: 'issuePlace' }) +
        '</div>' +
        ui.field('Upload Disability Certificate', '<input type="file" accept="image/*" id="cert-input" class="text-sm">', { name: 'certImage' }) +
        '<div id="cert-preview" class="mb-3">' + (s.certImage ? '<img src="' + s.certImage + '" class="h-24 rounded border">' : '') + '</div>' +
        ui.field('Aids &amp; Appliances Used / Required', ui.checkGroup('aids', C.aids, s.aids), { required: true, name: 'aids' }) +
        '<div id="aids-other-wrap">' + ui.field('Specify Other Aid/Appliance', ui.text('aidsOther', s.aidsOther), { name: 'aidsOther' }) + '</div>' +
        commonStep4Html(s);
    }

    function step4BHtml() {
      var s = rec.step4B;
      return '<p class="text-xs text-slate-400 mb-4 uppercase tracking-wide">Step 4 · Suspected Disability Information</p>' +
        '<div class="bg-amber-50 border border-amber-200 text-amber-700 text-xs rounded px-3 py-2 mb-4">Form B captures suspected cases — certificate, UDID and disability percentage are recorded only after certification (during Form B → Form A conversion).</div>' +
        '<div class="grid md:grid-cols-2 gap-x-5">' +
          ui.field('Suspected Disability Type', ui.select('suspectedDisabilityType', C.disabilityType, s.suspectedDisabilityType), { required: true, name: 'suspectedDisabilityType' }) +
          '<div id="dis-other-wrap">' + ui.field('Specify Other Disability', ui.text('disabilityOther', s.disabilityOther), { name: 'disabilityOther' }) + '</div>' +
        '</div>' +
        ui.field('Aids &amp; Appliances Used / Required', ui.checkGroup('aids', C.aids, s.aids), { name: 'aids' }) +
        '<div id="aids-other-wrap">' + ui.field('Specify Other Aid/Appliance', ui.text('aidsOther', s.aidsOther), { name: 'aidsOther' }) + '</div>' +
        commonStep4Html(s);
    }

    function commonStep4Html(s) {
      return '<div class="grid md:grid-cols-2 gap-x-5 border-t pt-4 mt-2">' +
          ui.field('Benefits Availed from Govt. Schemes', ui.text('benefits', s.benefits), { name: 'benefits' }) +
          ui.field('Pension Receiving Status', ui.select('pensionStatus', C.pensionStatus, s.pensionStatus), { name: 'pensionStatus' }) +
          '<div id="pension-since-wrap">' + ui.field('Pension Receiving Since', ui.text('pensionSince', s.pensionSince, { placeholder: 'Year' }), { name: 'pensionSince' }) + '</div>' +
          ui.field('Associated Medical Problems', ui.text('medicalProblems', s.medicalProblems), { name: 'medicalProblems' }) +
          ui.field('Medical Problems Since', ui.text('medicalSince', s.medicalSince, { placeholder: 'Year' }), { name: 'medicalSince' }) +
          ui.field('Services Currently Receiving', ui.text('services', s.services), { name: 'services' }) +
          ui.field('Care Giver Name', ui.text('caregiverName', s.caregiverName), { name: 'caregiverName' }) +
          ui.field('Relationship with Beneficiary', ui.text('caregiverRelation', s.caregiverRelation), { name: 'caregiverRelation' }) +
        '</div>';
    }

    // ---------- bind conditional logic per step ----------
    function bindStep(n) {
      if (n === 1) bindStep1();
      if (n === 2) bindStep2();
      if (n === 3) bindStep3();
      if (n === 4) bindStep4();
    }

    function bindStep1() {
      function toggleVoter() {
        var age = parseInt($('[name=age]').val(), 10);
        $('#voterId-wrap').toggle(!isNaN(age) && age >= 18);
      }
      function toggleResidency() {
        var r = $('[name=residency]').val();
        $('#residency-local').toggle(r === 'local');
        $('#residency-nonlocal').toggle(r === 'nonlocal');
      }
      $('[name=age]').on('input', toggleVoter);
      $('[name=residency]').on('change', toggleResidency);
      toggleVoter(); toggleResidency();

      // repeatable rows
      $('#wiz-body').on('click', '.rep-add', function () {
        var key = $(this).data('key');
        var $rows = $('.rep-rows[data-key="' + key + '"]');
        $rows.find('.rep-empty').remove();
        $rows.append(repeatRow(key, null));
      });
      $('#wiz-body').on('click', '.rep-del', function () {
        var $row = $(this).closest('.rep-row');
        var $rows = $row.parent();
        $row.remove();
        if (!$rows.children('.rep-row').length) $rows.html('<p class="text-xs text-slate-400 rep-empty">None added</p>');
      });

      // photo upload
      $('#photo-input').on('change', function () { readImage(this, '#photo-preview', function (b64) { rec.step1.photo = b64; }); });
    }

    function bindStep2() {
      function refresh() {
        $('#education-other-wrap').toggle($('[name=education]').val() === 'Others');
        var occ = $('[name=occupation]').val();
        $('#occ-post-wrap').toggle(occ === 'Government Employee');
        $('#occ-emptype-wrap').toggle(occ === 'Government Employee');
        $('#occ-biz-wrap').toggle(occ === 'Self Employed');
        $('#occ-emprem-wrap').toggle(occ === 'Government Employee' && $('[name=employmentType]').val() === 'Others');
      }
      $('[name=education], [name=occupation], [name=employmentType]').on('change', refresh);
      refresh();
    }

    function bindStep3() {
      function refresh() {
        var checked = $('[name=facilities]:checked').map(function () { return $(this).val(); }).get();
        $('#accessibility-wrap').toggle(checked.indexOf('Accessibility') > -1);
      }
      $('[name=facilities]').on('change', refresh);
      refresh();
    }

    function bindStep4() {
      function refresh() {
        var dt = $('[name=disabilityType], [name=suspectedDisabilityType]').val();
        $('#dis-other-wrap').toggle(dt === 'Others');
        var aidsChecked = $('[name=aids]:checked').map(function () { return $(this).val(); }).get();
        $('#aids-other-wrap').toggle(aidsChecked.indexOf('Other') > -1);
        $('#pension-since-wrap').toggle($('[name=pensionStatus]').val() === 'Yes');
      }
      $('[name=disabilityType], [name=suspectedDisabilityType], [name=aids], [name=pensionStatus]').on('change', refresh);
      refresh();
      if (formType === 'A') {
        $('#cert-input').on('change', function () { readImage(this, '#cert-preview', function (b64) { rec.step4A.certImage = b64; }); });
      }
    }

    function readImage(input, previewSel, cb) {
      var file = input.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function (e) {
        cb(e.target.result);
        $(previewSel).html('<img src="' + e.target.result + '" class="h-24 rounded border">');
      };
      reader.readAsDataURL(file);
    }

    // ---------- collect current step into rec ----------
    function collectStep(n) {
      var $body = $('#wiz-body');
      if (n === 1) {
        var d = ui.collect($body);
        if (typeof d.enumeratorId !== 'undefined') rec.enumeratorId = d.enumeratorId || null;
        ['name', 'parentName', 'age', 'gender', 'address', 'gpu', 'ward', 'houseNo', 'pin', 'contact', 'aadhaar', 'altContactName', 'altContactNo', 'voterId', 'maritalStatus', 'residency', 'coiNo', 'rcNo', 'sikkimSubjectNo', 'idProofNo'].forEach(function (k) {
          if (typeof d[k] !== 'undefined') rec.step1[k] = d[k];
        });
        rec.gpu = rec.step1.gpu; rec.ward = rec.step1.ward;
        // repeatables
        rec.step1.offsprings = collectRepeat('offsprings');
        rec.step1.siblings = collectRepeat('siblings');
      } else if (n === 2) {
        Object.assign(rec.step2, ui.collect($body));
      } else if (n === 3) {
        var d3 = ui.collect($body);
        rec.step3.houseType = d3.houseType; rec.step3.familyCount = d3.familyCount;
        rec.step3.facilities = d3.facilities || []; rec.step3.accessibilityDetail = d3.accessibilityDetail;
        rec.step3.language = d3.language;
      } else if (n === 4) {
        var target = formType === 'A' ? rec.step4A : rec.step4B;
        var d4 = ui.collect($body);
        Object.keys(target).forEach(function (k) {
          if (k === 'aids') target.aids = d4.aids || [];
          else if (k === 'certImage') { /* handled by file reader */ }
          else if (typeof d4[k] !== 'undefined') target[k] = d4[k];
        });
      }
    }

    function collectRepeat(key) {
      var out = [];
      $('.rep-rows[data-key="' + key + '"] .rep-row').each(function () {
        var age = $(this).find('.rep-age').val();
        var gender = $(this).find('.rep-gender').val();
        if (age || gender) out.push({ age: age, gender: gender });
      });
      return out;
    }

    // ---------- validation ----------
    function validateStep(n, silent) {
      var ok = true;
      function fail(name, msg) {
        ok = false;
        if (silent) return;
        var $f = $('#wiz-body [data-field="' + name + '"]');
        $f.find('.field-error').text(msg || 'Required').removeClass('hidden');
        $f.find('input, select, textarea').first().addClass('border-rose-400');
      }
      if (!silent) {
        $('#wiz-body .field-error').addClass('hidden');
        $('#wiz-body input, #wiz-body select, #wiz-body textarea').removeClass('border-rose-400');
      }

      if (n === 1) {
        var s = rec.step1;
        if (zone && (zone.enumerators || []).length && !rec.enumeratorId) fail('enumeratorId', 'Select the enumerator who collected this survey');
        ['name', 'parentName', 'age', 'gender', 'address', 'gpu', 'ward', 'pin', 'contact', 'aadhaar', 'altContactName', 'altContactNo'].forEach(function (k) {
          if (!String(s[k] || '').trim()) fail(k);
        });
        if (s.residency === 'nonlocal' && !String(s.idProofNo || '').trim()) fail('idProofNo', 'At least one ID proof required for non-local');
        if (s.pin && !/^\d{6}$/.test(s.pin)) fail('pin', 'PIN must be 6 digits');
      } else if (n === 2) {
        var s2 = rec.step2;
        if (!s2.education) fail('education');
        if (s2.education === 'Others' && !s2.educationOther.trim()) fail('educationOther', 'Specify education');
        if (!s2.occupation) fail('occupation');
        if (s2.occupation === 'Government Employee') {
          if (!s2.postName.trim()) fail('postName', 'Required for Govt employee');
          if (!s2.employmentType) fail('employmentType', 'Required for Govt employee');
          if (s2.employmentType === 'Others' && !s2.employmentRemark.trim()) fail('employmentRemark', 'Specify employment type');
        }
        if (s2.occupation === 'Self Employed' && !s2.businessName.trim()) fail('businessName', 'Required for self employed');
        if (!s2.annualIncome) fail('annualIncome');
      } else if (n === 3) {
        var s3 = rec.step3;
        if (!s3.houseType) fail('houseType');
        if (!String(s3.familyCount).trim() || parseInt(s3.familyCount, 10) < 1) fail('familyCount', 'Enter a valid number');
      } else if (n === 4) {
        if (formType === 'A') {
          var a = rec.step4A;
          if (!a.disabilityType) fail('disabilityType');
          if (a.disabilityType === 'Others' && !a.disabilityOther.trim()) fail('disabilityOther', 'Specify disability');
          if (!String(a.disabilityPercent).trim()) fail('disabilityPercent');
          if (!a.certNo.trim()) fail('certNo');
          if (a.udid && a.udid.length !== 18) fail('udid', 'UDID must be 18 characters');
          if (!a.aids.length) fail('aids', 'Select at least one (or include applicable)');
          if (a.aids.indexOf('Other') > -1 && !a.aidsOther.trim()) fail('aidsOther', 'Specify other aid');
        } else {
          var b = rec.step4B;
          if (!b.suspectedDisabilityType) fail('suspectedDisabilityType');
          if (b.suspectedDisabilityType === 'Others' && !b.disabilityOther.trim()) fail('disabilityOther', 'Specify disability');
        }
      }
      return ok;
    }

    render();
  }

  // ============ READ-ONLY RENDER (for SWO review / detail) ============
  function readOnlyHtml(rec) {
    var zone = store.find('zones', rec.zoneId);
    function row(label, val) {
      if (val === '' || val === null || typeof val === 'undefined' || (Array.isArray(val) && !val.length)) val = '—';
      if (Array.isArray(val)) val = val.join(', ');
      return '<div class="flex py-1.5 border-b border-slate-100 text-sm"><div class="w-1/2 text-slate-400">' + ui.esc(label) + '</div><div class="w-1/2 text-slate-700 font-medium">' + ui.esc(val) + '</div></div>';
    }
    function section(title, inner) {
      return '<div class="mb-5"><h4 class="text-sm font-semibold text-indigo-600 mb-1 uppercase tracking-wide">' + title + '</h4><div>' + inner + '</div></div>';
    }
    var s1 = rec.step1, s2 = rec.step2, s3 = rec.step3;
    var fam = (s1.offsprings || []).map(function (o) { return o.age + '/' + o.gender; }).join(', ');
    var sib = (s1.siblings || []).map(function (o) { return o.age + '/' + o.gender; }).join(', ');
    var survey = rec.surveyId ? store.find('surveys', rec.surveyId) : null;
    var ens = (zone && zone.enumerators) || [];
    var en = ens.filter(function (e) { return e.id === rec.enumeratorId; })[0] || {};

    var html =
      section('Survey Cover',
        row('Survey', survey ? survey.name + ' (' + survey.period + ')' : '—') +
        row('Zone', zone ? zone.name + ' (' + zone.code + ')' : '—') +
        '<div class="mt-2 text-xs font-semibold text-slate-500 uppercase">Enumerator</div>' +
        row('Name', en.name) + row('AWC', en.awc) + row('Project', en.project) + row('District', en.district) + row('Contact', en.contact)
      ) +
      section('Personal Information',
        row('Name', s1.name) + row("Father's/Mother's Name", s1.parentName) + row('Age', s1.age) + row('Gender', s1.gender) +
        row('Address', s1.address) + row('GPU', s1.gpu) + row('Ward', s1.ward) + row('House No.', s1.houseNo) +
        row('PIN', s1.pin) + row('Contact', s1.contact) + row('Aadhaar', s1.aadhaar) + row('Voter ID', s1.voterId) +
        row('Additional Contact', s1.altContactName + ' / ' + s1.altContactNo) +
        row('Offsprings', fam) + row('Siblings', sib) +
        row('Residency', s1.residency === 'local' ? 'Local' : 'Non-Local') +
        (s1.residency === 'local' ? row('COI / RC / Sikkim Subject', [s1.coiNo, s1.rcNo, s1.sikkimSubjectNo].filter(Boolean).join(' · ')) : row('ID Proof', s1.idProofNo)) +
        row('Marital Status', s1.maritalStatus) +
        (s1.photo ? '<div class="mt-2"><img src="' + s1.photo + '" class="h-24 rounded border"></div>' : '')
      ) +
      section('Qualification & Occupation',
        row('Education', s2.education + (s2.educationOther ? ' (' + s2.educationOther + ')' : '')) + row('Institute', s2.institute) +
        row('Occupation', s2.occupation) + row('Post Name', s2.postName) + row('Employment Type', s2.employmentType + (s2.employmentRemark ? ' (' + s2.employmentRemark + ')' : '')) +
        row('Business Name', s2.businessName) + row('Annual Income', s2.annualIncome)
      ) +
      section('Family Information',
        row('House Type', s3.houseType) + row('Family Members', s3.familyCount) + row('Facilities', s3.facilities) +
        row('Accessibility Details', s3.accessibilityDetail) + row('Language', s3.language)
      );

    if (rec.formType === 'A' && rec.step4A) {
      var a = rec.step4A;
      html += section('Disability Information (Certified)',
        row('Disability Type', a.disabilityType + (a.disabilityOther ? ' (' + a.disabilityOther + ')' : '')) +
        row('Disability %', a.disabilityPercent) + row('Certificate No.', a.certNo) + row('UDID', a.udid) +
        row('Issue Date', a.issueDate) + row('Place of Issue', a.issuePlace) +
        row('Aids & Appliances', a.aids) + (a.aidsOther ? row('Other Aid', a.aidsOther) : '') +
        row('Benefits', a.benefits) + row('Pension', a.pensionStatus + (a.pensionSince ? ' since ' + a.pensionSince : '')) +
        row('Medical Problems', a.medicalProblems + (a.medicalSince ? ' since ' + a.medicalSince : '')) +
        row('Services', a.services) + row('Care Giver', a.caregiverName + ' (' + a.caregiverRelation + ')') +
        (a.certImage ? '<div class="mt-2"><img src="' + a.certImage + '" class="h-24 rounded border"></div>' : '')
      );
    } else if (rec.step4B) {
      var b = rec.step4B;
      html += section('Suspected Disability Information',
        row('Suspected Disability Type', b.suspectedDisabilityType + (b.disabilityOther ? ' (' + b.disabilityOther + ')' : '')) +
        row('Aids & Appliances', b.aids) + (b.aidsOther ? row('Other Aid', b.aidsOther) : '') +
        row('Benefits', b.benefits) + row('Pension', b.pensionStatus) +
        row('Medical Problems', b.medicalProblems + (b.medicalSince ? ' since ' + b.medicalSince : '')) +
        row('Services', b.services) + row('Care Giver', b.caregiverName + ' (' + b.caregiverRelation + ')')
      );
    }
    return html;
  }

  return { open: open, readOnlyHtml: readOnlyHtml, blankRecord: blankRecord };
})();
