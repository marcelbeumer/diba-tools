(function() {
  var qsa = document.querySelectorAll.bind(document);
  var element = document.createElement.bind(document);
  var text = document.createTextNode.bind(document);
  var slice = Array.prototype.slice;
  var months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  var renderContainer;


  function setStyle(el, style) {
    for (var name in style) {
      el.style[name] = style[name];
    }
  }


  function getRenderContainer() {
    if (!renderContainer) {
      renderContainer = qsa('.diba-tools-container')[0] || document.createElement('div');
      renderContainer.className = 'diba-tools-container';
      renderContainer.innerHTML = '';

      setStyle(renderContainer, {
        'zIndex': 9999,
        'position': 'absolute',
        'fontFamily': 'Menlo',
        'font-size': '13px',
        'top': '0px',
        'left': '0px',
        'border': '1px solid black',
        'backgroundColor': 'white',
        'padding': '1em'
      });

      document.body.appendChild(renderContainer);
    }
    return renderContainer;
  }


  function createHTML(html) {
    var el = document.createElement('div');
    el.innerHTML = html;
    return el.firstChild;
  }


  function renderRecords(records) {
    var table = element('table');
    var body = element('tbody');
    table.appendChild(body);
    records.forEach(function(record) {
      var row = element('tr');
      var prop, cell, value;

      for (prop in record) {
        cell = element('td');
        value = record[prop];

        if (prop === 'amount') value = (value + '').replace(/\./g, ',');
        if (prop === 'date') {
          value = value.split('.');
          value = value[0] + ' ' + months[parseInt(value[1], 10) - 1] + ' ' + value[2];
        }

        cell.appendChild(text(value));
        row.appendChild(cell);
      }

      body.appendChild(row);
    });
    return table;
  }


  function render(incoming, outgoing) {
    var c = getRenderContainer();
    c.innerHTML = '';
    c.appendChild(createHTML('<h1>Incoming</h1>'));
    c.appendChild(renderRecords(incoming));
    c.appendChild(createHTML('<h1>Outgoing</h1>'));
    c.appendChild(renderRecords(outgoing));
  }


  function filterRecord(record) {
    var where = record.where.toLowerCase();
    var what = record.what.toLowerCase();

    if (/^lastschrift\s*/.test(what)) {
      record.what = record.what.replace(/^[Ll]astschrift\s*/,'');
    }

    if (/^überweisung\s*/.test(what)) {
      record.what = record.what.replace(/^[Üü]berweisung\s*/,'');
    }

    if (/^gutschrift\s*/.test(what)) {
      record.what = record.what.replace(/^[Gg]utschrift\s*/,'');
    }

    if (/^EC [0-9A-Z]+ [0-9A-Z]+/.test(record.what)) {
      record.what = '';
    }

    if (/^NR\d+\s+/.test(record.what)) {
      record.what = record.what.replace(/^NR\d+\s+/, '');
    }

    if (/^(\d+\s)?ELV\d+/.test(record.what)) {
      record.what = record.what.replace(/^(\d+\s)?ELV\d+\s+/, '');
    }

    if (/(^|\s)edeka($|\s)/.test(where)) {
      record.where = 'Edeka';
      record.what = '';
      record.cat = 'groceries';
    }

    if (/(^|\s)penny($|\s)/.test(where)) {
      record.where = 'Penny';
      record.what = '';
      record.cat = 'groceries';
    }

    if (/(^|\s)vollcorner($|\s)/.test(where)) {
      record.where = 'Vollcorner';
      record.what = '';
      record.cat = 'groceries';
    }

    if (/(^|\s)rewe($|\s)/.test(where)) {
      record.where = 'Rewe';
      record.what = '';
      record.cat = 'groceries';
    }

    if (/(^|\s)paypal europe s\.a\.r\.l\.($|\s)/.test(where)) {
      record.where = 'Paypal';
    }

    if (/(^|\s)(swm)($|\s)/.test(where)) {
      record.cat = 'utilities';
    }

    if (/(^|\s)google \*svcsapps($|\s)/.test(where)) {
      record.where = 'Google Apps';
      record.what =  'Google Apps for ' + (record.where.match(/google \*svcsapps\s*(.*)/) || [])[1];
      record.cat = 'infra';
    }

    if (/(^|\s)amazon web services($|\s)/.test(where)) {
      record.where = 'Amazon AWS';
      record.what = 'Web Services';
      record.cat = 'infra';
    }

    if (/(^|\s)digitalocean($|\s)/.test(where)) {
      record.where = 'Digital Ocean';
      record.what = 'VPS';
      record.cat = 'infra';
    }

    if (/(^|\s)tchibo mobil($|\s)/.test(where)) {
      record.where = 'Tchibo';
      record.what = 'Phone';
      record.cat = 'infra';
    }

    if (/(^|\s)scribd.com($|\s)/.test(where)) {
      record.where = 'Scribd';
      record.what = 'Subscription';
      record.cat = 'media';
    }

    if (/(^|\s)techniker krankenkasse($|\s)/.test(where)) {
      record.where = 'TK';
      record.what = 'Health insurance';
      record.cat = 'health';
    }

    return record;
  }


  function getRecords() {
    var rows = slice.call(qsa('.kontoumsaetzte tbody tr'));
    var records = [];

    rows = slice.call(rows).filter(function(r) {
        return !r.classList.contains('actions');
    });

    rows.forEach(function(row) {
      var amount = parseFloat(row.querySelector('.umsatzbetrag')
        .innerText.replace(/\./g, '').replace(/,/g, '.'), 10);

      var record = filterRecord({
        date: row.querySelector('.buchungsdatum').innerText,
        where: row.querySelector('td:nth-of-type(2)').innerText,
        what: row.querySelector('td:nth-of-type(3)').innerText,
        cat: '',
        amount: amount
      });

      if (record) records.push(record);
    });

    return records;
  }


  function go() {
    var records = getRecords();
    var incoming;
    var outgoing;

    incoming = records.filter(function(record) {
      if (record.amount > 0) return record;
    });

    outgoing = records.filter(function(record) {
      if (record.amount < 0) {
        record.amount = -record.amount;
        return record;
      }
    });

    render(incoming, outgoing);
  }

  go();

})();
