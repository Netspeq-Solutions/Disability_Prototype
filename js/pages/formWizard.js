/* SDMIS — Form A / Form B data-collection sheet (paper-replica layout) */
window.SDMIS = window.SDMIS || {};

SDMIS.formWizard = (function () {
  var ui = SDMIS.ui, C = SDMIS.constants, store = SDMIS.store;

  function blankRecord(formType, zoneId, createdBy, surveyId) {
    return {
      formType: formType, surveyId: surveyId || null, zoneId: zoneId, gpu: '', ward: '',
      status: 'draft', createdBy: createdBy, reviewedBy: null, returnRemark: '',
      createdAt: new Date().toISOString(), convertedFrom: null, enumeratorId: null,
      formImages: [],
      step1: {
        surveyDate: new Date().toISOString().slice(0, 10),
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

  // ============ EDITABLE SHEET ============
  function open($container, opts) {
    // opts: { record, zone, afterSave (fn), onCancel (fn) }
    var rec = JSON.parse(JSON.stringify(opts.record));
    var zone = opts.zone;
    var survey = rec.surveyId ? store.find('surveys', rec.surveyId) : null;
    var formType = rec.formType;

    // ---------- paper-style field helpers ----------
    // inline "label ____" field that keeps the data-field / .field-error contract used by validation
    function pf(label, inner, name, o) {
      o = o || {};
      var req = o.req ? ' <b class="text-rose-500 font-normal">*</b>' : '';
      var style = o.basis ? ' style="flex:' + o.basis + '"' : '';
      var cls = 'pf' + (o.block ? ' pf-block' : '');
      return '<div class="' + cls + '"' + style + (o.id ? ' id="' + o.id + '"' : '') + ' data-field="' + ui.esc(name || '') + '">' +
        (label ? '<label class="pf-l">' + label + req + '</label>' : '') +
        '<div class="pf-in">' + inner + '</div>' +
        '<p class="field-error hidden text-xs text-rose-600 w-full"></p>' +
      '</div>';
    }
    // character-cell (comb) input — for Contact / Aadhaar / UDID
    function cells(name, val, count, o) {
      o = o || {};
      return '<input type="text" name="' + name + '" value="' + ui.esc(val || '') + '" maxlength="' + count + '" ' +
        (o.attrs || '') + ' class="cell-input' + (o.upper ? ' cell-upper' : '') + '" style="--cells:' + count + '">';
    }

    function render() {
      var formBadge = (formType === 'A'
        ? ui.badge('Form A · Certified', 'bg-emerald-100 text-emerald-700')
        : ui.badge('Form B · Suspected', 'bg-amber-100 text-amber-700')) +
        (survey ? ' ' + ui.badge(survey.period, 'bg-indigo-100 text-indigo-700') : '');

      var returnedBanner = rec.status === 'returned'
        ? '<div class="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg px-4 py-2 mb-4 no-print">↩ Returned by SWO: ' + ui.esc(rec.returnRemark || 'Please review and correct.') + '</div>'
        : '';

      var surveyBanner = (survey || zone)
        ? '<div class="bg-indigo-50 border border-indigo-200 text-indigo-700 text-sm rounded-lg px-4 py-2 mb-4 no-print">' +
            (survey ? 'Survey: <b>' + ui.esc(survey.name) + '</b> (' + ui.esc(survey.period) + ')' : '') +
            (survey && zone ? ' &nbsp;·&nbsp; ' : '') +
            (zone ? 'Zone: <b>' + ui.esc(zone.name) + '</b>' : '') +
          '</div>'
        : '';

      // Enumerator selector lives OUTSIDE the paper form (it's survey metadata, not part of the sheet)
      var enumList = (zone && zone.enumerators) ? zone.enumerators : [];
      var enumInner = enumList.length
        ? ui.select('enumeratorId', enumList.map(function (en) { return { value: en.id, label: en.name + (en.awc ? ' — ' + en.awc : '') }; }), rec.enumeratorId || '', { placeholder: 'Select enumerator' })
        : '<span class="text-amber-600 text-xs">No enumerators set for this zone yet — add them via the “Enumerators” button before submitting.</span>';
      var enumCard = '<div id="sec-enum" class="bg-white border rounded-xl shadow-sm p-4 mb-4 no-print">' +
        ui.field('Surveyed by (Enumerator)', enumInner, { required: enumList.length > 0, name: 'enumeratorId', cls: 'mb-0' }) +
        '</div>';

      $container.html(
        '<div class="max-w-3xl mx-auto pb-12">' +
          '<div class="flex items-center justify-between mb-4 no-print">' +
            '<button id="wiz-back-list" class="text-sm text-slate-500 hover:text-slate-800">&larr; Back to records</button>' +
            formBadge +
          '</div>' +
          returnedBanner +
          surveyBanner +
          '<div id="wiz-body">' +
            enumCard +
            '<div class="paper-sheet border shadow-sm">' +
              '<div class="pf-title">FORM - ' + formType + '</div>' +
              sectionPersonal() +
              sectionQual() +
              sectionFamily() +
              sectionDisability() +
              sectionAttachments() +
            '</div>' +
          '</div>' +
          '<div class="mt-5 flex justify-between gap-2 no-print">' +
            '<button id="wiz-draft" class="px-4 py-2 text-sm rounded-md border border-indigo-300 text-indigo-600 hover:bg-indigo-50">Save Draft</button>' +
            '<button id="wiz-submit" class="px-5 py-2 text-sm rounded-md bg-emerald-600 text-white hover:bg-emerald-700">Submit for Verification</button>' +
          '</div>' +
        '</div>'
      );

      bindStep1(); bindStep2(); bindStep3(); bindStep4(); bindAttachments();

      $('#wiz-back-list').on('click', function () { if (opts.onCancel) opts.onCancel(); });
      $('#wiz-draft').on('click', function () { collectAll(); saveRecord('draft'); });
      $('#wiz-submit').on('click', function () {
        collectAll();
        // clear all previous errors once, then validate every section
        $('#wiz-body .field-error').addClass('hidden');
        $('#wiz-body input, #wiz-body select, #wiz-body textarea').removeClass('border-rose-400');
        var ok = true;
        for (var s = 1; s <= 4; s++) { if (!validateStep(s, false, true)) ok = false; }
        if (!ok) {
          ui.toast('Some fields are missing or invalid', 'error');
          var $first = $('#wiz-body .border-rose-400').first();
          if ($first.length) $first[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }
        saveRecord('submitted');
      });
    }

    function collectAll() { collectStep(1); collectStep(2); collectStep(3); collectStep(4); }

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

    // ---------- (a) Personal information ----------
    function sectionPersonal() {
      var s = rec.step1;
      var gpuOpts = zone ? zone.gpus : [];
      var wardOpts = zone ? zone.wards : [];

      return '<div id="sec-1">' +
        // header: survey date (left) + passport photo box (right)
        '<div class="pf-head">' +
          '<div class="pf-head-l">' +
            pf('Survey Date', ui.text('surveyDate', s.surveyDate, { type: 'date' }), 'surveyDate', { basis: '1 1 100%' }) +
          '</div>' +
          '<div class="pf-photo no-print">' +
            '<div id="photo-preview" class="pf-photo-box">' + (s.photo ? '<img src="' + s.photo + '">' : 'Passport Size Photo') + '</div>' +
            '<input type="file" accept="image/*" id="photo-input" class="pf-photo-input">' +
          '</div>' +
        '</div>' +

        '<div class="pf-sec">Personal information</div>' +

        '<div class="pf-row">' +
          pf('1. Name', ui.text('name', s.name, { attrs: 'style="text-transform:uppercase"' }), 'name', { req: true, basis: '3 1 200px' }) +
          pf('Gender (M/F)', ui.select('gender', C.gender, s.gender), 'gender', { req: true, basis: '1 1 120px' }) +
          pf('Age', ui.text('age', s.age, { type: 'number', attrs: 'min=0 max=120' }), 'age', { req: true, basis: '0 1 80px' }) +
        '</div>' +
        pf("2. Father's / Mother's Name", ui.text('parentName', s.parentName), 'parentName', { req: true, block: true }) +
        pf('3. Address', ui.text('address', s.address), 'address', { req: true, block: true }) +
        '<div class="pf-row">' +
          pf('Ward', wardOpts.length ? ui.select('ward', wardOpts, s.ward) : ui.text('ward', s.ward), 'ward', { req: true, basis: '1 1 110px' }) +
          pf('House No.', ui.text('houseNo', s.houseNo), 'houseNo', { basis: '1 1 110px' }) +
          pf('GPU', gpuOpts.length ? ui.select('gpu', gpuOpts, s.gpu) : ui.text('gpu', s.gpu), 'gpu', { req: true, basis: '1 1 150px' }) +
          pf('Pin number', ui.text('pin', s.pin, { attrs: 'maxlength=6' }), 'pin', { req: true, basis: '1 1 110px' }) +
        '</div>' +

        pf('4. Contact number', ui.text('contact', s.contact, { type: 'tel', attrs: 'inputmode="numeric" maxlength=10' }), 'contact', { req: true, block: true }) +
        pf('5. Aadhar number', ui.text('aadhaar', s.aadhaar, { attrs: 'inputmode="numeric" maxlength=12' }), 'aadhaar', { req: true, block: true }) +

        '<div class="pf-row">' +
          pf('6. Voter ID (EPIC No.)', ui.text('voterId', s.voterId), 'voterId', { basis: '1 1 180px' }) +
          pf('COI Number', ui.text('coiNo', s.coiNo), 'coiNo', { basis: '1 1 180px' }) +
        '</div>' +

        '<div class="pf-row">' +
          pf('Marital Status', ui.select('maritalStatus', C.maritalStatus, s.maritalStatus), 'maritalStatus', { basis: '1 1 150px' }) +
        '</div>' +
        '<div class="pf-row">' +
          pf('Additional Contact Person', ui.text('altContactName', s.altContactName), 'altContactName', { req: true, basis: '2 1 200px' }) +
          pf('Contact No.', ui.text('altContactNo', s.altContactNo, { type: 'tel', attrs: 'maxlength=10' }), 'altContactNo', { req: true, basis: '1 1 150px' }) +
        '</div>' +

        // offsprings / siblings (M/F + age, as on the paper form)
        '<div class="pf-row mt-1">' +
          repeatBlock('Offsprings (M/F &amp; Age)', 'offsprings', s.offsprings) +
          repeatBlock('Siblings (M/F &amp; Age)', 'siblings', s.siblings) +
        '</div>' +
      '</div>';
    }

    function repeatBlock(label, key, items) {
      var rows = (items || []).map(function (it, i) { return repeatRow(key, it, i); }).join('');
      return '<div class="rep-block" style="flex:1 1 240px">' +
        '<div class="flex items-center justify-between mb-1"><span class="pf-l">' + label + '</span>' +
        '<button type="button" class="rep-add text-xs text-indigo-600 hover:underline no-print" data-key="' + key + '">+ Add</button></div>' +
        '<div class="rep-rows space-y-2" data-key="' + key + '">' + (rows || '<p class="text-xs text-slate-400 rep-empty">None added</p>') + '</div></div>';
    }
    function repeatRow(key, it, i) {
      it = it || { age: '', gender: '' };
      return '<div class="rep-row flex gap-2 items-center" data-key="' + key + '">' +
        '<input type="number" min="0" placeholder="Age" value="' + ui.esc(it.age) + '" class="rep-age ' + ui.inputCls + ' w-20">' +
        ui.select('', C.gender, it.gender).replace('class="', 'class="rep-gender flex-1 ') +
        '<button type="button" class="rep-del text-rose-500 text-sm px-1 no-print">&times;</button>' +
        '</div>';
    }

    // ---------- (b) Qualification & occupation ----------
    function sectionQual() {
      var s = rec.step2;
      return '<div id="sec-2">' +
        '<div class="pf-sec">(b) Qualification and occupation information</div>' +
        '<div class="pf-row">' +
          pf('1. Education', ui.select('education', C.education, s.education), 'education', { req: true, basis: '1 1 160px' }) +
          pf('Institute / School', ui.text('institute', s.institute), 'institute', { basis: '2 1 200px' }) +
          pf('Any other', ui.text('educationOther', s.educationOther), 'educationOther', { basis: '1 1 150px', id: 'education-other-wrap' }) +
        '</div>' +
        '<div class="pf-row">' +
          pf('2. Occupation', ui.select('occupation', C.occupation, s.occupation), 'occupation', { req: true, basis: '1 1 170px' }) +
          pf('Post held', ui.text('postName', s.postName), 'postName', { basis: '1 1 150px', id: 'occ-post-wrap' }) +
          pf('Nature of appointment', ui.select('employmentType', C.employmentType, s.employmentType), 'employmentType', { basis: '1 1 170px', id: 'occ-emptype-wrap' }) +
          pf('Any other', ui.text('employmentRemark', s.employmentRemark), 'employmentRemark', { basis: '1 1 150px', id: 'occ-emprem-wrap' }) +
          pf('Business name', ui.text('businessName', s.businessName), 'businessName', { basis: '1 1 150px', id: 'occ-biz-wrap' }) +
        '</div>' +
        '<div class="pf-row">' +
          pf('3. Cumulative annual income', ui.select('annualIncome', C.annualIncome, s.annualIncome), 'annualIncome', { req: true, basis: '0 1 240px' }) +
        '</div>' +
      '</div>';
    }

    // ---------- (c) Family information ----------
    function sectionFamily() {
      var s = rec.step3;
      return '<div id="sec-3">' +
        '<div class="pf-sec">(c) Family information</div>' +
        '<div class="pf-row">' +
          pf('1. House type', ui.select('houseType', C.houseType, s.houseType), 'houseType', { req: true, basis: '2 1 200px' }) +
          pf('No. of Family Members', ui.text('familyCount', s.familyCount, { type: 'number', attrs: 'min=1' }), 'familyCount', { req: true, basis: '1 1 150px' }) +
        '</div>' +
        '<div class="pf-block">' +
          '<label class="pf-l">2. Facilities at home</label>' +
          '<div class="mt-1">' + ui.checkGroup('facilities', C.facilities, s.facilities) + '</div>' +
        '</div>' +
        pf('Accessibility facility details', ui.textarea('accessibilityDetail', s.accessibilityDetail, { placeholder: 'Ramps, handrails, etc.' }), 'accessibilityDetail', { block: true, id: 'accessibility-wrap' }) +
        pf('3. Language spoken at Home', ui.text('language', s.language), 'language', { block: true }) +
      '</div>';
    }

    // ---------- (d) Disability information ----------
    function sectionDisability() {
      return formType === 'A' ? sectionDisabilityA() : sectionDisabilityB();
    }

    function sectionDisabilityA() {
      var s = rec.step4A;
      return '<div id="sec-4">' +
        '<div class="pf-sec">(d) Disability Information</div>' +
        '<div class="pf-row">' +
          pf('1. Disability type', ui.select('disabilityType', C.disabilityType, s.disabilityType), 'disabilityType', { req: true, basis: '2 1 200px' }) +
          pf('%', ui.text('disabilityPercent', s.disabilityPercent, { type: 'number', attrs: 'min=0 max=100' }), 'disabilityPercent', { req: true, basis: '0 1 80px' }) +
          pf('Certificate number', ui.text('certNo', s.certNo), 'certNo', { req: true, basis: '2 1 180px' }) +
          pf('Specify other', ui.text('disabilityOther', s.disabilityOther), 'disabilityOther', { basis: '1 1 150px', id: 'dis-other-wrap' }) +
        '</div>' +
        '<div class="pf-row">' +
          pf('2. UDID number', ui.text('udid', s.udid, { attrs: 'maxlength=18 style="text-transform:uppercase"' }), 'udid', { basis: '1 1 100%' }) +
        '</div>' +
        '<div class="pf-row">' +
          pf('Issue date', ui.text('issueDate', s.issueDate, { type: 'date' }), 'issueDate', { basis: '1 1 160px' }) +
          pf('Place of issue', ui.text('issuePlace', s.issuePlace), 'issuePlace', { basis: '2 1 200px' }) +
        '</div>' +
        '<div class="pf-block no-print">' +
          '<label class="pf-l">Upload Disability Certificate</label>' +
          '<div class="mt-1"><input type="file" accept="image/*" id="cert-input" class="text-sm"></div>' +
          '<div id="cert-preview" class="mt-2">' + (s.certImage ? '<img src="' + s.certImage + '" class="h-24 rounded border">' : '') + '</div>' +
        '</div>' +
        aidsBlock(s) +
        commonDisability(s) +
      '</div>';
    }

    function sectionDisabilityB() {
      var s = rec.step4B;
      return '<div id="sec-4">' +
        '<div class="pf-sec">(d) Suspected Disability Information</div>' +
        '<div class="bg-amber-50 border border-amber-200 text-amber-700 text-xs rounded px-3 py-2 mb-3 no-print">Form B captures suspected cases — certificate, UDID and disability percentage are recorded only after certification (during Form B → Form A conversion).</div>' +
        '<div class="pf-row">' +
          pf('1. Suspected disability type', ui.select('suspectedDisabilityType', C.disabilityType, s.suspectedDisabilityType), 'suspectedDisabilityType', { req: true, basis: '2 1 220px' }) +
          pf('Specify other', ui.text('disabilityOther', s.disabilityOther), 'disabilityOther', { basis: '1 1 150px', id: 'dis-other-wrap' }) +
        '</div>' +
        aidsBlock(s) +
        commonDisability(s) +
      '</div>';
    }

    function aidsBlock(s) {
      return '<div class="pf-block" data-field="aids">' +
          '<label class="pf-l">3. Aids &amp; appliance using / required</label>' +
          '<div class="mt-1">' + ui.checkGroup('aids', C.aids, s.aids) + '</div>' +
          '<p class="field-error hidden text-xs text-rose-600"></p>' +
        '</div>' +
        pf('Specify other aid / appliance', ui.text('aidsOther', s.aidsOther), 'aidsOther', { block: true, id: 'aids-other-wrap' });
    }

    function commonDisability(s) {
      return pf('4. Any other benefits', ui.text('benefits', s.benefits), 'benefits', { block: true }) +
        '<div class="pf-row">' +
          pf('5. Pension receiving (Yes/No)', ui.select('pensionStatus', C.pensionStatus, s.pensionStatus), 'pensionStatus', { basis: '1 1 200px' }) +
          pf('Since', ui.text('pensionSince', s.pensionSince, { placeholder: 'Year' }), 'pensionSince', { basis: '1 1 120px', id: 'pension-since-wrap' }) +
        '</div>' +
        '<div class="pf-row">' +
          pf('6. Associated Medical Problem', ui.text('medicalProblems', s.medicalProblems), 'medicalProblems', { basis: '2 1 220px' }) +
          pf('Since', ui.text('medicalSince', s.medicalSince, { placeholder: 'Year' }), 'medicalSince', { basis: '1 1 120px' }) +
        '</div>' +
        pf('7. Services receiving', ui.text('services', s.services), 'services', { block: true }) +
        '<div class="pf-row">' +
          pf('8. Care Giver', ui.text('caregiverName', s.caregiverName), 'caregiverName', { basis: '2 1 200px' }) +
          pf('Relation', ui.text('caregiverRelation', s.caregiverRelation), 'caregiverRelation', { basis: '1 1 150px' }) +
        '</div>';
    }

    // ---------- (e) Attachments — scanned / photographed paper form ----------
    function sectionAttachments() {
      return '<div id="sec-att" class="no-print">' +
        '<div class="pf-sec">Attachments — Scanned / Photographed Form</div>' +
        '<p class="text-xs text-slate-500 mb-2" style="line-height:1.5">Upload clear photos or scans of the filled paper <b>Form ' + formType + '</b> and any supporting documents. You can add multiple pages.</p>' +
        '<label for="form-upload" class="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-md border border-indigo-300 text-indigo-600 hover:bg-indigo-50 cursor-pointer">' +
          '<span class="text-base leading-none">＋</span> Add form page(s)' +
        '</label>' +
        '<input type="file" accept="image/*" id="form-upload" multiple class="hidden">' +
        '<div id="form-uploads" class="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-3"></div>' +
      '</div>';
    }

    function renderFormUploads() {
      var imgs = rec.formImages || [];
      $('#form-uploads').html(imgs.length
        ? imgs.map(function (src, i) {
            return '<div class="relative group rounded-lg border border-slate-200 overflow-hidden bg-slate-50">' +
              '<img src="' + src + '" class="w-full h-24 object-cover">' +
              '<span class="absolute bottom-0 inset-x-0 bg-black/55 text-white text-[10px] px-1.5 py-0.5 truncate">Page ' + (i + 1) + '</span>' +
              '<button type="button" class="form-upload-del absolute top-1 right-1 bg-black/60 hover:bg-rose-600 text-white rounded-full w-6 h-6 text-sm leading-none" data-i="' + i + '">&times;</button>' +
            '</div>';
          }).join('')
        : '<p class="text-xs text-slate-400 col-span-full">No form pages uploaded yet.</p>');
    }

    function bindAttachments() {
      renderFormUploads();
      $('#form-upload').on('change', function () {
        var files = Array.prototype.slice.call(this.files || []);
        files.forEach(function (file) {
          if (!/^image\//.test(file.type)) return;
          var reader = new FileReader();
          reader.onload = function (e) {
            rec.formImages = rec.formImages || [];
            rec.formImages.push(e.target.result);
            renderFormUploads();
          };
          reader.readAsDataURL(file);
        });
        this.value = '';
      });
      $('#form-uploads').on('click', '.form-upload-del', function () {
        rec.formImages.splice($(this).data('i'), 1);
        renderFormUploads();
      });
    }

    // ---------- bind conditional logic ----------
    function bindStep1() {

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

    // ---------- collect each section into rec ----------
    function collectStep(n) {
      var $body = $('#sec-' + n);
      if (n === 1) {
        var d = ui.collect($body);
        var $enum = $('#wiz-body [name="enumeratorId"]');
        if ($enum.length) rec.enumeratorId = $enum.val() || null;
        ['surveyDate', 'name', 'parentName', 'age', 'gender', 'address', 'gpu', 'ward', 'houseNo', 'pin', 'contact', 'aadhaar', 'altContactName', 'altContactNo', 'voterId', 'maritalStatus', 'residency', 'coiNo', 'rcNo', 'sikkimSubjectNo', 'idProofNo'].forEach(function (k) {
          if (typeof d[k] !== 'undefined') rec.step1[k] = d[k];
        });
        rec.gpu = rec.step1.gpu; rec.ward = rec.step1.ward;
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
    function validateStep(n, silent, noClear) {
      var ok = true;
      function fail(name, msg) {
        ok = false;
        if (silent) return;
        var $f = $('#wiz-body [data-field="' + name + '"]');
        $f.find('.field-error').first().text(msg || 'Required').removeClass('hidden');
        $f.find('input, select, textarea').first().addClass('border-rose-400');
      }
      if (!silent && !noClear) {
        $('#wiz-body .field-error').addClass('hidden');
        $('#wiz-body input, #wiz-body select, #wiz-body textarea').removeClass('border-rose-400');
      }

      if (n === 1) {
        var s = rec.step1;
        if (zone && (zone.enumerators || []).length && !rec.enumeratorId) fail('enumeratorId', 'Select the enumerator who collected this survey');
        ['name', 'parentName', 'age', 'gender', 'address', 'gpu', 'ward', 'pin', 'contact', 'aadhaar', 'altContactName', 'altContactNo'].forEach(function (k) {
          if (!String(s[k] || '').trim()) fail(k);
        });
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

  // ============ DOCUMENTS (uploaded images for side-by-side review) ============
  // Gather every image attached to a record, in review order.
  function recordImages(rec) {
    var imgs = [];
    (rec.formImages || []).forEach(function (src, i) {
      if (src) imgs.push({ src: src, label: 'Scanned Form — page ' + (i + 1) });
    });
    if (rec.step1 && rec.step1.photo) imgs.push({ src: rec.step1.photo, label: 'Passport Photo' });
    if (rec.formType === 'A' && rec.step4A && rec.step4A.certImage) imgs.push({ src: rec.step4A.certImage, label: 'Disability Certificate' });
    return imgs;
  }

  // Each .doc-thumb carries data-idx for opening the lightbox.
  // Scanned form pages render large & full-width (so they're readable side-by-side
  // with the data); the passport photo / certificate stay as compact thumbnails.
  function documentsHtml(rec) {
    var imgs = recordImages(rec);
    if (!imgs.length) {
      return '<div class="text-center text-sm text-slate-400 border border-dashed border-slate-300 rounded-lg py-10 px-4">No documents or images were uploaded with this record.</div>';
    }
    var forms = [], extras = [];
    imgs.forEach(function (im, i) { im._idx = i; (/^Scanned Form/.test(im.label) ? forms : extras).push(im); });

    var html = '';
    if (forms.length) {
      html += '<div class="space-y-3">' + forms.map(function (im) {
        return '<button type="button" class="doc-thumb group block w-full text-left" data-idx="' + im._idx + '">' +
          '<div class="relative rounded-lg border border-slate-200 overflow-hidden bg-white shadow-sm">' +
            '<img src="' + im.src + '" class="w-full h-auto block group-hover:opacity-95 transition">' +
            '<span class="absolute top-2 right-2 bg-black/60 text-white text-[11px] px-2 py-0.5 rounded">' + ui.esc(im.label) + ' · tap to zoom</span>' +
          '</div></button>';
      }).join('') + '</div>';
    }
    if (extras.length) {
      html += '<div class="grid grid-cols-2 gap-3' + (forms.length ? ' mt-3' : '') + '">' + extras.map(function (im) {
        return '<button type="button" class="doc-thumb group block text-left" data-idx="' + im._idx + '">' +
          '<div class="relative rounded-lg border border-slate-200 overflow-hidden bg-slate-100" style="aspect-ratio:3/4">' +
            '<img src="' + im.src + '" class="w-full h-full object-cover group-hover:opacity-90 transition">' +
            '<span class="absolute bottom-0 inset-x-0 bg-black/55 text-white text-[11px] px-2 py-1 truncate">' + ui.esc(im.label) + '</span>' +
          '</div></button>';
      }).join('') + '</div>';
    }
    return html;
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
        row('Survey Date', s1.surveyDate) +
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

  return { open: open, readOnlyHtml: readOnlyHtml, blankRecord: blankRecord, recordImages: recordImages, documentsHtml: documentsHtml };
})();
