
/**
 * CONFIGURAÇÕES INICIAIS
 * Importante: Substitua os IDs abaixo pelos IDs reais das suas planilhas no Google Drive.
 */
const MASTER_SHEET_ID = 'INSIRA_O_ID_DA_PLANILHA_MESTRA_AQUI';
const TEMPLATE_SHEET_ID = 'INSIRA_O_ID_DA_PLANILHA_MODELO_AQUI';

function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('Studio Scheduler SaaS')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function getOrCreateUserDatabase() {
  try {
    const userEmail = Session.getActiveUser().getEmail();
    const masterSpreadsheet = SpreadsheetApp.openById(MASTER_SHEET_ID);
    const masterSheet = masterSpreadsheet.getSheetByName('Usuarios') || masterSpreadsheet.insertSheet('Usuarios');
    
    const data = masterSheet.getDataRange().getValues();
    let userSheetId = '';
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === userEmail) {
        userSheetId = data[i][1];
        break;
      }
    }
    
    if (!userSheetId) {
      const templateFile = DriveApp.getFileById(TEMPLATE_SHEET_ID);
      const newFile = templateFile.makeCopy(`Database - ${userEmail}`);
      userSheetId = newFile.getId();
      masterSheet.appendRow([userEmail, userSheetId, new Date()]);
      
      const ss = SpreadsheetApp.openById(userSheetId);
      const configSheet = ss.getSheetByName('Configuracoes') || ss.insertSheet('Configuracoes');
      configSheet.clear();
      configSheet.getRange("A1:B9").setValues([
        ["studioName", "Daniele Dias Nails"],
        ["studioSubtitle", "Studio Nails"],
        ["anamnesisLink", ""],
        ["themeId", "gold"],
        ["themeMode", "system"],
        ["customColor", "#6366f1"],
        ["annualLimit", "81000"],
        ["procedures", "Banho de Gel,Blindagem,Manicure"],
        ["secondaryProcedures", "Decoração Especial,Remoção,Reparo Unitário"]
      ]);
      ss.insertSheet('Despesas');
    }
    
    return userSheetId;
  } catch (e) {
    throw new Error("Erro de acesso ao banco de dados: " + e.message);
  }
}

function getUserData() {
  try {
    const sheetId = getOrCreateUserDatabase();
    const ss = SpreadsheetApp.openById(sheetId);
    
    const appointmentsSheet = ss.getSheetByName('Agendamentos') || ss.insertSheet('Agendamentos');
    const clientsSheet = ss.getSheetByName('Clientes') || ss.insertSheet('Clientes');
    const configsSheet = ss.getSheetByName('Configuracoes') || ss.insertSheet('Configuracoes');
    const expensesSheet = ss.getSheetByName('Despesas') || ss.insertSheet('Despesas');
    
    const appointments = appointmentsSheet.getDataRange().getValues();
    const clients = clientsSheet.getDataRange().getValues();
    const configs = configsSheet.getDataRange().getValues();
    const expenses = expensesSheet.getDataRange().getValues();
    
    const configObj = {};
    configs.forEach(row => configObj[row[0]] = row[1]);

    return {
      appointments: appointments.length > 1 ? appointments.slice(1).map(row => ({
        id: String(row[0]), 
        date: row[1], 
        clientName: row[2], 
        whatsapp: row[3],
        time: row[4], 
        procedure: row[5], 
        secondaryProcedure: row[6],
        secondaryTime: row[7],
        deposit: parseFloat(row[8]) || 0, 
        totalValue: parseFloat(row[9]) || 0, 
        paymentMethod: row[10] || 'Pagamento Pendente',
        partnerName: row[11] || 'Daniele Dias'
      })) : [],
      expenses: expenses.length > 1 ? expenses.slice(1).map(row => ({
        id: String(row[0]),
        name: String(row[1]),
        value: parseFloat(row[2]) || 0,
        date: String(row[3]),
        createdAt: row[4],
        paymentMethod: row[5] || 'Pix'
      })) : [],
      clients: clients.length > 1 ? clients.slice(1).map(row => ({
        name: String(row[0]), whatsapp: String(row[1]), lastVisitDate: String(row[2])
      })) : [],
      settings: configObj,
      userEmail: Session.getActiveUser().getEmail()
    };
  } catch (e) {
    return { error: e.message };
  }
}

function saveExpense(exp) {
  const sheetId = getOrCreateUserDatabase();
  const ss = SpreadsheetApp.openById(sheetId);
  const sheet = ss.getSheetByName('Despesas') || ss.insertSheet('Despesas');
  
  if (!exp.id) exp.id = Utilities.getUuid();
  exp.createdAt = Date.now();
  
  sheet.appendRow([exp.id, exp.name, exp.value, exp.date, exp.createdAt, exp.paymentMethod || 'Pix']);
  return exp;
}

function deleteExpense(id) {
  const sheetId = getOrCreateUserDatabase();
  const ss = SpreadsheetApp.openById(sheetId);
  const sheet = ss.getSheetByName('Despesas');
  const data = sheet.getDataRange().getValues();
  const idToFind = String(id).trim();
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === idToFind) {
      sheet.deleteRow(i + 1);
      return true;
    }
  }
  return false;
}

function saveAppointment(app) {
  const sheetId = getOrCreateUserDatabase();
  const ss = SpreadsheetApp.openById(sheetId);
  const sheet = ss.getSheetByName('Agendamentos');
  
  app.deposit = parseFloat(app.deposit) || 0;
  app.totalValue = parseFloat(app.totalValue) || 0;

  if (app.id) {
    const data = sheet.getDataRange().getValues();
    const idToFind = String(app.id).trim();
    for(let i = 1; i < data.length; i++) {
      if(String(data[i][0]).trim() === idToFind) {
        sheet.deleteRow(i + 1);
        break;
      }
    }
  } else {
    app.id = Utilities.getUuid();
  }
  
  sheet.appendRow([
    app.id, 
    app.date, 
    app.clientName, 
    app.whatsapp, 
    app.time, 
    app.procedure, 
    app.secondaryProcedure || "", 
    app.secondaryTime || "", 
    app.deposit, 
    app.totalValue, 
    app.paymentMethod, 
    app.partnerName || "Daniele Dias", 
    new Date()
  ]);
  
  const clientSheet = ss.getSheetByName('Clientes');
  const clientData = clientSheet.getDataRange().getValues();
  let found = false;
  const searchName = String(app.clientName).trim().toLowerCase();

  for(let i = 1; i < clientData.length; i++) {
    if(String(clientData[i][0]).trim().toLowerCase() === searchName) {
      clientSheet.getRange(i+1, 2, 1, 2).setValues([[app.whatsapp, app.date]]);
      found = true;
      break;
    }
  }
  if(!found && app.clientName && app.clientName !== 'Sem Nome') {
    clientSheet.appendRow([app.clientName, app.whatsapp, app.date]);
  }
  
  return app;
}

function deleteAppointment(id) {
  try {
    const sheetId = getOrCreateUserDatabase();
    const ss = SpreadsheetApp.openById(sheetId);
    const sheet = ss.getSheetByName('Agendamentos');
    if (!sheet) return false;

    const data = sheet.getDataRange().getValues();
    const idToFind = String(id).trim();
    
    if (!idToFind) return false;

    let rowToDelete = -1;
    for(let i = 1; i < data.length; i++) {
      if(String(data[i][0]).trim() === idToFind) {
        rowToDelete = i + 1;
        break;
      }
    }

    if (rowToDelete !== -1) {
      sheet.deleteRow(rowToDelete);
      return true;
    }
    return false;
  } catch (e) {
    throw new Error("Erro fatal ao excluir no Google Sheets: " + e.message);
  }
}

function updateUserSettings(settings) {
  const sheetId = getOrCreateUserDatabase();
  const ss = SpreadsheetApp.openById(sheetId);
  const sheet = ss.getSheetByName('Configuracoes');
  sheet.clear();
  Object.keys(settings).forEach(key => {
    sheet.appendRow([key, settings[key]]);
  });
  return true;
}

function deleteClient(name) {
  const sheetId = getOrCreateUserDatabase();
  const ss = SpreadsheetApp.openById(sheetId);
  const sheet = ss.getSheetByName('Clientes');
  const data = sheet.getDataRange().getValues();
  const searchName = String(name).trim().toLowerCase();
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim().toLowerCase() === searchName) {
      sheet.deleteRow(i + 1);
      return true;
    }
  }
  return false;
}

function updateClient(oldName, newData) {
  const sheetId = getOrCreateUserDatabase();
  const ss = SpreadsheetApp.openById(sheetId);
  
  const clientSheet = ss.getSheetByName('Clientes');
  const clientData = clientSheet.getDataRange().getValues();
  const searchName = String(oldName).trim().toLowerCase();
  
  for (let i = 1; i < clientData.length; i++) {
    if (String(clientData[i][0]).trim().toLowerCase() === searchName) {
      clientSheet.getRange(i + 1, 1, 1, 2).setValues([[newData.name, newData.whatsapp]]);
      break;
    }
  }

  const appSheet = ss.getSheetByName('Agendamentos');
  const appData = appSheet.getDataRange().getValues();
  if (appData.length > 1) {
    for (let j = 1; j < appData.length; j++) {
      if (String(appData[j][2]).trim().toLowerCase() === searchName) {
        appSheet.getRange(j + 1, 3, 1, 2).setValues([[newData.name, newData.whatsapp]]);
      }
    }
  }
  return true;
}

function bulkSaveClients(newClients) {
  const sheetId = getOrCreateUserDatabase();
  const ss = SpreadsheetApp.openById(sheetId);
  const clientSheet = ss.getSheetByName('Clientes');
  
  if (newClients && newClients.length > 0) {
    const rows = newClients.map(c => [c.name, c.whatsapp, c.lastVisitDate || ""]);
    const lastRow = clientSheet.getLastRow();
    clientSheet.getRange(lastRow + 1, 1, rows.length, 3).setValues(rows);
  }
  return true;
}
