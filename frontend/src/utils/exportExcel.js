/**
 * Zero-dependency Excel (.xlsx) exporter
 * Builds a minimal valid .xlsx file from scratch using only Blob + native browser APIs.
 * Supports multiple sheets, bold headers, and auto column widths.
 */

/* ── tiny deflate-less zip (stored, no compression) ──────────────────────── */
function u8(str) {
  const bytes = [];
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    if (c < 128) {
      bytes.push(c);
    } else if (c < 2048) {
      bytes.push(192 | (c >> 6), 128 | (c & 63));
    } else {
      bytes.push(224 | (c >> 12), 128 | ((c >> 6) & 63), 128 | (c & 63));
    }
  }
  return new Uint8Array(bytes);
}

function le4(n) { return [n & 255, (n >> 8) & 255, (n >> 16) & 255, (n >> 24) & 255]; }
function le2(n) { return [n & 255, (n >> 8) & 255]; }

function crc32(data) {
  const table = [];
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    table[i] = c;
  }
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) crc = table[(crc ^ data[i]) & 255] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function concat(...arrays) {
  const total = arrays.reduce((s, a) => s + a.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const a of arrays) { out.set(a, offset); offset += a.length; }
  return out;
}

function zipEntry(name, data) {
  const nameBytes = u8(name);
  const crc       = crc32(data);
  const local = new Uint8Array([
    0x50, 0x4b, 0x03, 0x04,   // local file signature
    0x14, 0x00,               // version needed
    0x00, 0x00,               // general purpose flag
    0x00, 0x00,               // compression (stored)
    0x00, 0x00, 0x00, 0x00,   // mod time / date
    ...le4(crc),
    ...le4(data.length),      // compressed size
    ...le4(data.length),      // uncompressed size
    ...le2(nameBytes.length),
    0x00, 0x00,               // extra field length
    ...nameBytes,
  ]);
  return { local, data, name: nameBytes, crc, size: data.length };
}

function buildZip(files) {
  const entries = [];
  let offset = 0;
  const parts = [];

  for (const [name, content] of files) {
    const data = typeof content === 'string' ? u8(content) : content;
    const e    = zipEntry(name, data);
    parts.push(e.local, e.data);
    entries.push({ e, offset });
    offset += e.local.length + e.data.length;
  }

  const centralParts = [];
  for (const { e, offset: off } of entries) {
    const central = new Uint8Array([
      0x50, 0x4b, 0x01, 0x02,   // central dir signature
      0x14, 0x00,               // version made by
      0x14, 0x00,               // version needed
      0x00, 0x00,               // flags
      0x00, 0x00,               // compression
      0x00, 0x00, 0x00, 0x00,   // mod time / date
      ...le4(e.crc),
      ...le4(e.size),
      ...le4(e.size),
      ...le2(e.name.length),
      0x00, 0x00,               // extra
      0x00, 0x00,               // comment
      0x00, 0x00,               // disk start
      0x00, 0x00,               // internal attr
      0x00, 0x00, 0x00, 0x00,   // external attr
      ...le4(off),
      ...e.name,
    ]);
    centralParts.push(central);
  }

  const centralSize   = centralParts.reduce((s, c) => s + c.length, 0);
  const endRecord = new Uint8Array([
    0x50, 0x4b, 0x05, 0x06,
    0x00, 0x00, 0x00, 0x00,
    ...le2(entries.length),
    ...le2(entries.length),
    ...le4(centralSize),
    ...le4(offset),
    0x00, 0x00,
  ]);

  return concat(...parts, ...centralParts, endRecord);
}

/* ── XML helpers ─────────────────────────────────────────────────────────── */
function esc(v) {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function colLetter(n) {
  // n is 0-indexed
  let s = '';
  n++;
  while (n > 0) {
    const rem = (n - 1) % 26;
    s = String.fromCharCode(65 + rem) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

/* ── build sheet XML ─────────────────────────────────────────────────────── */
function buildSheet(rows, headers) {
  // rows: array of arrays (first row = headers if headers param omitted)
  const allRows = headers ? [headers, ...rows] : rows;
  const numCols  = allRows[0]?.length || 0;

  // compute column widths
  const widths = Array(numCols).fill(8);
  for (const row of allRows) {
    row.forEach((cell, ci) => {
      const len = String(cell ?? '').length;
      if (len + 2 > widths[ci]) widths[ci] = Math.min(len + 2, 40);
    });
  }

  const colsXml = widths.map((w, i) =>
    `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`
  ).join('');

  const rowsXml = allRows.map((row, ri) => {
    const isHeader = headers ? ri === 0 : false;
    const cells = row.map((cell, ci) => {
      const addr  = `${colLetter(ci)}${ri + 1}`;
      const val   = cell ?? '';
      const isNum = !isHeader && typeof cell === 'number';
      const sAttr = isHeader ? ' s="1"' : '';
      if (isNum) {
        return `<c r="${addr}"${sAttr}><v>${val}</v></c>`;
      }
      return `<c r="${addr}" t="inlineStr"${sAttr}><is><t>${esc(val)}</t></is></c>`;
    }).join('');
    return `<row r="${ri + 1}">${cells}</row>`;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <cols>${colsXml}</cols>
  <sheetData>${rowsXml}</sheetData>
</worksheet>`;
}

/* ── main export function ────────────────────────────────────────────────── */
/**
 * sheets: Array of { name: string, headers: string[], rows: any[][] }
 * filename: e.g. 'workout_2025-01-01.xlsx'
 */
export function exportToExcel(sheets, filename) {
  const sheetFiles = [];
  const sheetNames = [];

  sheets.forEach(({ name, headers, rows }, idx) => {
    const xml = buildSheet(rows, headers);
    sheetFiles.push([`xl/worksheets/sheet${idx + 1}.xml`, xml]);
    sheetNames.push(name);
  });

  /* workbook.xml */
  const sheetsXml = sheetNames.map((n, i) =>
    `<sheet name="${esc(n)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`
  ).join('');
  const workbook = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
          xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>${sheetsXml}</sheets>
</workbook>`;

  /* workbook rels */
  const wbRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
${sheetNames.map((_, i) =>
  `  <Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`
).join('\n')}
  <Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

  /* styles.xml — font index 1 = bold for headers */
  const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2">
    <font><sz val="11"/><name val="Calibri"/></font>
    <font><b/><sz val="11"/><name val="Calibri"/></font>
  </fonts>
  <fills count="2">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
  </fills>
  <borders count="1">
    <border><left/><right/><top/><bottom/><diagonal/></border>
  </borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="2">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0"/>
  </cellXfs>
</styleSheet>`;

  /* [Content_Types].xml */
  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml"  ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
${sheetNames.map((_, i) =>
  `  <Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`
).join('\n')}
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`;

  /* _rels/.rels */
  const rootRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

  const zipFiles = [
    ['[Content_Types].xml', contentTypes],
    ['_rels/.rels',         rootRels],
    ['xl/workbook.xml',     workbook],
    ['xl/_rels/workbook.xml.rels', wbRels],
    ['xl/styles.xml',       styles],
    ...sheetFiles,
  ];

  const zipData = buildZip(zipFiles);
  const blob    = new Blob([zipData], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url     = URL.createObjectURL(blob);
  const a       = document.createElement('a');
  a.href        = url;
  a.download    = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
