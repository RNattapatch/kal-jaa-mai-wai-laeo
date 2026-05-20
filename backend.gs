/**
 * แคลจ๋าไม่ไหวแล้ว — Apps Script Backend
 *
 * Deploy:
 * 1. Extensions → Apps Script → paste code นี้
 * 2. Save → Deploy → New deployment → Type: Web app
 *      Execute as: Me
 *      Who has access: Anyone
 * 3. คัดลอก Web App URL → paste ในแอพที่หน้า Settings → Google Sheets Sync
 *
 * ทุก event จาก app จะถูก append เป็น 1 row ใน sheet "EVENTS"
 * คอลัมน์: timestamp | userId | date | event_type | event_json
 */

// === Hardcoded config (แก้ตรงนี้ถ้าเปลี่ยน sheet) ===
const SHEET_ID = '1081AMjkvkOrzPuUadKrlSL84j13Y1d4w7KcYe1peoN8';

function doPost(e) {
  try {
    const sheetId = SHEET_ID;

    const body = JSON.parse(e.postData.contents);
    const userId = body.userId || 'anonymous';
    const events = body.events || [];

    const ss = SpreadsheetApp.openById(sheetId);
    let sheet = ss.getSheetByName('EVENTS');
    if (!sheet) {
      sheet = ss.insertSheet('EVENTS');
      sheet.appendRow(['timestamp', 'userId', 'date', 'event_type', 'event_json']);
      sheet.setFrozenRows(1);
    }

    // For each sync, replace this user's rows with the new snapshot
    // (so we don't accumulate duplicates each sync — simple approach)
    const allRows = sheet.getDataRange().getValues();
    const rowsToKeep = [allRows[0]]; // header
    for (let i = 1; i < allRows.length; i++) {
      if (allRows[i][1] !== userId) rowsToKeep.push(allRows[i]);
    }
    // For events from this user
    for (const ev of events) {
      rowsToKeep.push([
        ev.ts || new Date().toISOString(),
        userId,
        ev.date || '',
        ev.type || '',
        JSON.stringify(ev.data || {})
      ]);
    }

    sheet.clear();
    sheet.getRange(1, 1, rowsToKeep.length, 5).setValues(rowsToKeep);
    sheet.setFrozenRows(1);

    return ContentService
      .createTextOutput(JSON.stringify({ ok:true, syncedAt: new Date().toISOString(), rowCount: rowsToKeep.length - 1 }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok:false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    const sheetId = SHEET_ID;
    const userId = (e.parameter && e.parameter.userId) || null;
    if (!userId) {
      return ContentService.createTextOutput(JSON.stringify({ ok:false, error:'userId required' })).setMimeType(ContentService.MimeType.JSON);
    }
    const sheet = SpreadsheetApp.openById(sheetId).getSheetByName('EVENTS');
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({ ok:true, events:[] })).setMimeType(ContentService.MimeType.JSON);
    }
    const allRows = sheet.getDataRange().getValues();
    const events = [];
    for (let i = 1; i < allRows.length; i++) {
      const row = allRows[i];
      if (row[1] === userId) {
        events.push({
          ts: row[0],
          userId: row[1],
          date: row[2],
          type: row[3],
          data: tryParse(row[4])
        });
      }
    }
    return ContentService.createTextOutput(JSON.stringify({ ok:true, events })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok:false, error:String(err) })).setMimeType(ContentService.MimeType.JSON);
  }
}

function tryParse(s) {
  try { return JSON.parse(s); } catch (e) { return s; }
}
