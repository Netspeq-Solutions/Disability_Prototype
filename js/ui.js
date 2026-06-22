/* SDMIS — shared UI render helpers */
window.SDMIS = window.SDMIS || {};

SDMIS.ui = (function () {
  function esc(s) {
    if (s === null || typeof s === 'undefined') return '';
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // ---- toast notifications ----
  function toast(msg, type) {
    type = type || 'info';
    var colors = {
      info: 'bg-slate-800',
      success: 'bg-emerald-600',
      error: 'bg-rose-600',
      warn: 'bg-amber-600'
    };
    var $t = $('<div>')
      .addClass('text-white px-4 py-2.5 rounded-lg shadow-lg text-sm mb-2 ' + (colors[type] || colors.info))
      .text(msg);
    $('#toast-host').append($t);
    setTimeout(function () { $t.fadeOut(250, function () { $(this).remove(); }); }, 2800);
  }

  // ---- modal ----
  function modal(opts) {
    // opts: { title, bodyHtml, confirmText, onConfirm, wide }
    closeModal();
    var width = opts.wide ? 'max-w-2xl' : 'max-w-md';
    var $overlay = $(
      '<div id="modal-overlay" class="fixed inset-0 bg-black/40 z-50 flex items-start justify-center overflow-y-auto py-10 px-4">' +
        '<div class="bg-white rounded-xl shadow-xl w-full ' + width + '">' +
          '<div class="px-5 py-3.5 border-b flex items-center justify-between">' +
            '<h3 class="font-semibold text-slate-800">' + esc(opts.title || '') + '</h3>' +
            '<button id="modal-x" class="text-slate-400 hover:text-slate-700 text-xl leading-none">&times;</button>' +
          '</div>' +
          '<div class="px-5 py-4" id="modal-body">' + (opts.bodyHtml || '') + '</div>' +
          (opts.hideFooter ? '' :
          '<div class="px-5 py-3 border-t flex justify-end gap-2 bg-slate-50 rounded-b-xl">' +
            '<button id="modal-cancel" class="px-3.5 py-1.5 text-sm rounded-md border border-slate-300 text-slate-600 hover:bg-slate-100">Cancel</button>' +
            '<button id="modal-confirm" class="px-3.5 py-1.5 text-sm rounded-md bg-indigo-600 text-white hover:bg-indigo-700">' + esc(opts.confirmText || 'Confirm') + '</button>' +
          '</div>') +
        '</div>' +
      '</div>'
    );
    $('body').append($overlay);
    $('#modal-x, #modal-cancel').on('click', closeModal);
    $('#modal-confirm').on('click', function () {
      if (opts.onConfirm) {
        var ok = opts.onConfirm();
        if (ok !== false) closeModal();
      } else closeModal();
    });
    return $overlay;
  }
  function closeModal() { $('#modal-overlay').remove(); }

  // ---- lightbox (full-screen image viewer with prev/next + tap-to-zoom) ----
  function lightbox(images, startIndex) {
    images = (images || []).filter(function (i) { return i && i.src; });
    if (!images.length) return;
    var idx = Math.min(Math.max(0, startIndex || 0), images.length - 1);
    var zoomed = false;
    closeLightbox();
    var multi = images.length > 1;
    var $o = $(
      '<div id="lightbox-overlay" class="fixed inset-0 bg-black/90 z-[70] flex flex-col select-none">' +
        '<div class="flex items-center justify-between px-4 py-3 text-white text-sm shrink-0">' +
          '<span id="lb-cap" class="truncate pr-3"></span>' +
          '<div class="flex items-center gap-4 whitespace-nowrap">' +
            '<span id="lb-count" class="text-white/60"></span>' +
            '<button id="lb-close" class="text-3xl leading-none hover:text-rose-300">&times;</button>' +
          '</div>' +
        '</div>' +
        '<div id="lb-stage" class="flex-1 overflow-auto flex items-center justify-center px-2 pb-4">' +
          '<img id="lb-img" class="max-h-full max-w-full object-contain transition-transform duration-150" style="cursor:zoom-in">' +
        '</div>' +
        (multi ? '<button id="lb-prev" class="absolute left-2 top-1/2 -translate-y-1/2 text-white bg-black/40 hover:bg-black/70 rounded-full w-11 h-11 text-2xl leading-none">&lsaquo;</button>' : '') +
        (multi ? '<button id="lb-next" class="absolute right-2 top-1/2 -translate-y-1/2 text-white bg-black/40 hover:bg-black/70 rounded-full w-11 h-11 text-2xl leading-none">&rsaquo;</button>' : '') +
      '</div>'
    );
    $('body').append($o);
    function show() {
      var im = images[idx];
      zoomed = false;
      $('#lb-img').css({ transform: 'scale(1)', cursor: 'zoom-in' }).attr('src', im.src);
      $('#lb-cap').text(im.label || '');
      $('#lb-count').text((idx + 1) + ' / ' + images.length);
    }
    function go(d) { idx = (idx + d + images.length) % images.length; show(); }
    $('#lb-close').on('click', closeLightbox);
    $o.on('click', function (e) { if (e.target === this || e.target.id === 'lb-stage') closeLightbox(); });
    $('#lb-prev').on('click', function (e) { e.stopPropagation(); go(-1); });
    $('#lb-next').on('click', function (e) { e.stopPropagation(); go(1); });
    $('#lb-img').on('click', function (e) {
      e.stopPropagation();
      zoomed = !zoomed;
      $(this).css({ transform: zoomed ? 'scale(2)' : 'scale(1)', cursor: zoomed ? 'zoom-out' : 'zoom-in' });
    });
    $(document).on('keydown.lightbox', function (e) {
      if (e.key === 'Escape') closeLightbox();
      else if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'ArrowRight') go(1);
    });
    show();
  }
  function closeLightbox() { $('#lightbox-overlay').remove(); $(document).off('keydown.lightbox'); }

  // ---- form field builders ----
  function field(label, inner, opts) {
    opts = opts || {};
    var req = opts.required ? ' <span class="text-rose-500">*</span>' : '';
    var hint = opts.hint ? '<p class="text-xs text-slate-400 mt-0.5">' + esc(opts.hint) + '</p>' : '';
    var err = '<p class="text-xs text-rose-500 mt-0.5 hidden field-error"></p>';
    return '<div class="mb-3 ' + (opts.cls || '') + '" data-field="' + esc(opts.name || '') + '">' +
      (label ? '<label class="block text-sm font-medium text-slate-600 mb-1">' + esc(label) + req + '</label>' : '') +
      inner + hint + err + '</div>';
  }

  var inputCls = 'w-full border border-slate-300 rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none';

  function text(name, val, opts) {
    opts = opts || {};
    return '<input type="' + (opts.type || 'text') + '" name="' + name + '" value="' + esc(val || '') + '" ' +
      'autocomplete="off" ' +
      (opts.placeholder ? 'placeholder="' + esc(opts.placeholder) + '" ' : '') +
      (opts.attrs || '') + ' class="' + inputCls + '">';
  }

  function textarea(name, val, opts) {
    opts = opts || {};
    return '<textarea name="' + name + '" rows="' + (opts.rows || 2) + '" autocomplete="off" ' +
      (opts.placeholder ? 'placeholder="' + esc(opts.placeholder) + '" ' : '') +
      'class="' + inputCls + '">' + esc(val || '') + '</textarea>';
  }

  function select(name, options, val, opts) {
    opts = opts || {};
    var html = '<select name="' + name + '" autocomplete="off" ' + (opts.attrs || '') + ' class="' + inputCls + '">';
    html += '<option value="">' + esc(opts.placeholder || '-- Select --') + '</option>';
    options.forEach(function (o) {
      var value = typeof o === 'object' ? o.value : o;
      var lbl = typeof o === 'object' ? o.label : o;
      html += '<option value="' + esc(value) + '"' + (String(val) === String(value) ? ' selected' : '') + '>' + esc(lbl) + '</option>';
    });
    html += '</select>';
    return html;
  }

  function checkGroup(name, options, vals) {
    vals = vals || [];
    return '<div class="flex flex-wrap gap-3">' + options.map(function (o) {
      var checked = vals.indexOf(o) > -1 ? ' checked' : '';
      return '<label class="inline-flex items-center gap-1.5 text-sm text-slate-600">' +
        '<input type="checkbox" name="' + name + '" value="' + esc(o) + '"' + checked + ' class="rounded border-slate-300 text-indigo-600">' +
        esc(o) + '</label>';
    }).join('') + '</div>';
  }

  // styled radio group (pill buttons). options: array of strings or {value,label}
  function radioGroup(name, options, val) {
    return '<div class="flex flex-wrap gap-2 radio-pills" data-name="' + esc(name) + '">' + options.map(function (o) {
      var value = typeof o === 'object' ? o.value : o;
      var lbl = typeof o === 'object' ? o.label : o;
      var checked = String(val) === String(value);
      return '<label class="radio-pill' + (checked ? ' radio-pill-on' : '') + '">' +
        '<input type="radio" name="' + esc(name) + '" value="' + esc(value) + '"' + (checked ? ' checked' : '') + ' class="sr-only">' +
        '<span>' + esc(lbl) + '</span></label>';
    }).join('') + '</div>';
  }

  // multi-select (Select2-enhanced). vals: array of selected values.
  function multiSelect(name, options, vals, opts) {
    opts = opts || {};
    vals = vals || [];
    var html = '<select name="' + name + '" multiple autocomplete="off" class="ms2 ' + inputCls + '" ' +
      'data-placeholder="' + esc(opts.placeholder || 'Select...') + '">';
    options.forEach(function (o) {
      var value = typeof o === 'object' ? o.value : o;
      var lbl = typeof o === 'object' ? o.label : o;
      var sel = vals.indexOf(value) > -1 ? ' selected' : '';
      html += '<option value="' + esc(value) + '"' + sel + '>' + esc(lbl) + '</option>';
    });
    html += '</select>';
    return html;
  }

  // initialise Select2 on any un-enhanced .ms2 within $scope
  function enhanceMultiSelects($scope) {
    if (!$.fn || !$.fn.select2) return;
    ($scope || $(document)).find('select.ms2').each(function () {
      var $s = $(this);
      if ($s.hasClass('select2-hidden-accessible')) return;
      $s.select2({
        width: '100%',
        placeholder: $s.data('placeholder') || 'Select...',
        closeOnSelect: false,
        dropdownParent: $s.closest('#modal-overlay').length ? $s.closest('#modal-overlay') : $(document.body)
      });
    });
  }

  function badge(text, cls) {
    return '<span class="inline-block px-2 py-0.5 rounded-full text-xs font-medium ' + (cls || 'bg-slate-100 text-slate-600') + '">' + esc(text) + '</span>';
  }

  function statusBadge(status) {
    var C = SDMIS.constants;
    return badge(C.statuses[status] || status, C.statusBadge[status] || '');
  }

  // collect simple input/select/textarea values within a container into an object
  function collect($scope) {
    var data = {};
    $scope.find('input, select, textarea').each(function () {
      var $f = $(this);
      var name = $f.attr('name');
      if (!name) return;
      var type = $f.attr('type');
      if (type === 'checkbox') {
        if (!Array.isArray(data[name])) data[name] = [];
        if ($f.is(':checked')) data[name].push($f.val());
      } else if (type === 'radio') {
        if ($f.is(':checked')) data[name] = $f.val();
      } else {
        data[name] = $f.val();
      }
    });
    return data;
  }

  function emptyState(msg, icon) {
    return '<div class="text-center py-12 text-slate-400">' +
      '<div class="text-4xl mb-2">' + (icon || '📋') + '</div>' +
      '<p class="text-sm">' + esc(msg) + '</p></div>';
  }

  // ---- pagination ----
  function pageSlice(arr, page, perPage) {
    var total = arr.length;
    var pages = Math.max(1, Math.ceil(total / perPage));
    page = Math.min(Math.max(1, page), pages);
    var start = (page - 1) * perPage;
    return { items: arr.slice(start, start + perPage), page: page, pages: pages, total: total, start: start };
  }

  // renders a pager bar; binds page-button clicks to onPage(newPage)
  function renderPager($host, meta, onPage) {
    if (meta.total === 0) { $host.empty(); return; }
    var from = meta.start + 1, to = Math.min(meta.start + meta.items.length, meta.total);
    function btn(label, page, disabled, active) {
      return '<button class="pager-btn px-2.5 py-1 rounded-md text-sm border ' +
        (active ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-200 text-slate-600 hover:bg-slate-100') +
        (disabled ? ' opacity-40 cursor-not-allowed' : '') + '" ' +
        (disabled ? 'disabled' : 'data-page="' + page + '"') + '>' + label + '</button>';
    }
    // compact page-number window
    var nums = '';
    var win = [];
    for (var p = 1; p <= meta.pages; p++) {
      if (p === 1 || p === meta.pages || Math.abs(p - meta.page) <= 1) win.push(p);
      else if (win[win.length - 1] !== '…') win.push('…');
    }
    win.forEach(function (p) {
      nums += (p === '…') ? '<span class="px-1 text-slate-400">…</span>' : btn(p, p, false, p === meta.page);
    });

    $host.html(
      '<div class="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 border-t text-sm">' +
        '<span class="text-slate-400">Showing ' + from + '–' + to + ' of ' + meta.total + '</span>' +
        '<div class="flex items-center gap-1">' +
          btn('&larr; Prev', meta.page - 1, meta.page <= 1, false) + nums + btn('Next &rarr;', meta.page + 1, meta.page >= meta.pages, false) +
        '</div>' +
      '</div>'
    );
    $host.find('.pager-btn[data-page]').on('click', function () { onPage(parseInt($(this).data('page'), 10)); });
  }

  return {
    esc: esc, toast: toast, modal: modal, closeModal: closeModal,
    lightbox: lightbox, closeLightbox: closeLightbox,
    field: field, text: text, textarea: textarea, select: select,
    checkGroup: checkGroup, radioGroup: radioGroup, multiSelect: multiSelect, enhanceMultiSelects: enhanceMultiSelects,
    badge: badge, statusBadge: statusBadge,
    collect: collect, emptyState: emptyState, inputCls: inputCls,
    pageSlice: pageSlice, renderPager: renderPager
  };
})();
