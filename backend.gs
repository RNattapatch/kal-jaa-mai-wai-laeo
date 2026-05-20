/**
 * แคลจ๋าไม่ไหวแล้ว — Apps Script Backend
 *
 * Deploy:
 * 1. สร้าง Google Sheet ใหม่ ตั้งชื่อ "KalJaa Sync"
 * 2. Extensions → Apps Script → paste code นี้
 * 3. Script editor: File → Project properties → Script Properties → Add:
 *      key:   SHEET_ID
 *      value: <Sheet ID จาก URL ของ Google Sheet>
 *    (Sheet ID = ส่วนระหว่าง /d/ กับ /edit ใน URL)
 * 4. Deploy → New deployment → Type: Web app
 *      Execute as: Me
 *      Who has access: Anyone
 * 5. คัดลอก Web App URL ที่ได้ → paste ในแอพที่หน้า Settings → Google Sheets Sync
 *
 * ทุก event จาก app จะถูก append เป็น 1 row ใน sheet "EVENTS"
 * คอลัมน์: timestamp | userId | date | event_type | event_json
 */

function doPost(e) {
  try {
    const sheetId = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
    if (!sheetId) {
      return ContentService
        .createTextOutput(JSON.stringify({ ok:false, error:'SHEET_ID not set in Script Properties' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

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
    const sheetId = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
    if (!sheetId) {
      return ContentService.createTextOutput(JSON.stringify({ ok:false, error:'SHEET_ID not set' })).setMimeType(ContentService.MimeType.JSON);
    }
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
