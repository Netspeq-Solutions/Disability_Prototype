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
      (opts.placeholder ? 'placeholder="' + esc(opts.placeholder) + '" ' : '') +
      (opts.attrs || '') + ' class="' + inputCls + '">';
  }

  function textarea(name, val, opts) {
    opts = opts || {};
    return '<textarea name="' + name + '" rows="' + (opts.rows || 2) + '" ' +
      (opts.placeholder ? 'placeholder="' + esc(opts.placeholder) + '" ' : '') +
      'class="' + inputCls + '">' + esc(val || '') + '</textarea>';
  }

  function select(name, options, val, opts) {
    opts = opts || {};
    var html = '<select name="' + name + '" ' + (opts.attrs || '') + ' class="' + inputCls + '">';
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
    field: field, text: text, textarea: textarea, select: select,
    checkGroup: checkGroup, badge: badge, statusBadge: statusBadge,
    collect: collect, emptyState: emptyState, inputCls: inputCls,
    pageSlice: pageSlice, renderPager: renderPager
  };
})();
