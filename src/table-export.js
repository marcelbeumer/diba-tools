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

  function getRecords() {
    var rows = slice.call(qsa('.kontoumsaetzte tbody tr'));
    var records = [];

    rows = slice.call(rows).filter(function(r) {
        return !r.classList.contains('actions');
    });

    rows.forEach(function(row) {
      var amount = parseFloat(row.querySelector('.umsatzbetrag')
        .innerText.replace(/\./g, '').replace(/,/g, '.'), 10);

      records.push({
        date: row.querySelector('.buchungsdatum').innerText,
        where: row.querySelector('td:nth-of-type(2)').innerText,
        what: '',
        who: '',
        cat: '',
        amount: amount
      });
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
