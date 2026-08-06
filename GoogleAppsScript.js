/**
 * GOOGLE APPS SCRIPT - ESTOQUE PMI INTEGRATION
 * 
 * Como instalar na sua planilha do Google Sheets:
 * 1. Abra sua planilha do Google Sheets (ex: "ESTOQUE PMI").
 * 2. No menu superior, clique em "Extensões" > "Apps Script".
 * 3. Apague todo o código existente no editor do Apps Script (como "function myFunction() {}") e cole este script.
 * 4. Salve o projeto clicando no ícone de disquete ou pressionando Ctrl+S.
 * 5. Clique em "Implantar" (canto superior direito) > "Nova implantação".
 * 6. Clique na engrenagem ao lado de "Selecionar tipo" e escolha "Aplicativo da Web" (Web app).
 * 7. Configure a implantação:
 *    - Descrição: API de Integração do Estoque
 *    - Executar como: "Eu" (Sua conta Google)
 *    - Quem tem acesso: "Qualquer pessoa" (Importante para o app conseguir salvar dados offline)
 * 8. Clique em "Implantar". O Google irá pedir autorização de acesso ao seu Drive e Planilhas. Clique em "Autorizar acesso", selecione sua conta e depois "Avançado" > "Acessar (não seguro)".
 * 9. Copie a URL do Web App gerada e cole nas configurações do aplicativo de Estoque.
 */

// Nome da pasta no Google Drive onde as fotos dos itens serão armazenadas
var DRIVE_FOLDER_NAME = "Estoque_PMI_Fotos";

// Configurações das Abas da Planilha (Ajustado para "Página1" com acento conforme sua planilha)
var PRODUCTS_SHEET_NAME = "Página1";
var MOVEMENTS_SHEET_NAME = "MOVIMENTACOES";

/**
 * Método GET: Retorna os dados atuais de Produtos e Movimentações em formato JSON
 */
function doGet(e) {
  var action = e.parameter.action;

  if (action === 'getData') {
    return createJsonResponse(handleGetData());
  }

  return createJsonResponse({
    success: false,
    error: "Ação inválida ou ausente. Use ?action=getData"
  });
}

/**
 * Método POST: Recebe operações de salvar produto, salvar movimentação ou sincronizar em lote
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error("Nenhum dado enviado no corpo da requisição.");
    }

    var data = JSON.parse(e.postData.contents);
    var action = data.action;
    var result;

    if (action === 'saveProduct') {
      result = handleSaveProduct(data.product);
    } else if (action === 'saveMovement') {
      result = handleSaveMovement(data.movement);
    } else if (action === 'syncBatch') {
      result = handleSyncBatch(data.products, data.movements);
    } else {
      throw new Error("Ação desconhecida: " + action);
    }

    return createJsonResponse({ success: true, data: result });
  } catch (error) {
    return createJsonResponse({ success: false, error: error.message });
  }
}

/**
 * Retorna uma resposta HTTP em formato JSON
 */
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Busca ou cria a pasta de fotos no Google Drive
 */
function getOrCreateFolder() {
  var folders = DriveApp.getFoldersByName(DRIVE_FOLDER_NAME);
  if (folders.hasNext()) {
    return folders.next();
  } else {
    var folder = DriveApp.createFolder(DRIVE_FOLDER_NAME);
    // Permite que qualquer pessoa com o link veja as imagens (necessário para exibição no app)
    folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return folder;
  }
}

/**
 * Busca ou cria a subpasta de fotos para um produto específico dentro da pasta principal
 */
function getOrCreateProductFolder(productId, productName) {
  var parentFolder = getOrCreateFolder();
  // Remove caracteres especiais inválidos para nomes de pastas
  var cleanName = (productName || "").replace(/[\\\/*?:"<>|]/g, "").trim();
  var folderName = productId + " - " + cleanName;
  
  var subFolders = parentFolder.getFoldersByName(folderName);
  if (subFolders.hasNext()) {
    return subFolders.next();
  } else {
    var folder = parentFolder.createFolder(folderName);
    // Permite que qualquer pessoa com o link veja as imagens desta subpasta
    folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return folder;
  }
}

/**
 * Salva uma imagem Base64 no Google Drive e retorna a URL pública direta
 */
function saveBase64Image(base64Data, filename, folder) {
  if (!base64Data || !base64Data.startsWith("data:image")) {
    // Se não for base64 (já for um link http por exemplo), retorna a própria URL
    return base64Data;
  }

  // Se não foi passada uma pasta específica, usa a raiz
  if (!folder) {
    folder = getOrCreateFolder();
  }

  // Extrai mimetype e os dados raw (suporta formatos como image/png, image/jpeg, etc.)
  var matches = base64Data.match(/^data:(image\/[a-z0-9\-+.]+);base64,(.+)$/i);
  if (!matches) {
    return base64Data;
  }

  var contentType = matches[1];
  var rawBase64 = matches[2];

  var decoded = Utilities.base64Decode(rawBase64);
  var blob = Utilities.newBlob(decoded, contentType, filename);
  var file = folder.createFile(blob);

  // Configura compartilhamento público para visualização
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  // URL de visualização direta e robusta (Google Content Proxy)
  return "https://lh3.googleusercontent.com/d/" + file.getId();
}


/**
 * Obtém os dados das duas abas da planilha
 */
function handleGetData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // Inicializa abas se não existirem
  var prodSheet = ss.getSheetByName(PRODUCTS_SHEET_NAME) || initProductsSheet(ss);
  var movSheet = ss.getSheetByName(MOVEMENTS_SHEET_NAME) || initMovementsSheet(ss);

  var products = [];
  var movements = [];

  // Dicionário para normalizar os cabeçalhos existentes do usuário
  var headerMapping = {
    'CODIGO DE BARRA': 'CODIGO_BARRAS',
    'CÓDIGO DE BARRAS': 'CODIGO_BARRAS',
    'ULTIMA ATUALIZACAO': 'DATA_CADASTRO',
    'ÚLTIMA ATUALIZAÇÃO': 'DATA_CADASTRO'
  };

  // Lendo produtos
  var prodValues = prodSheet.getDataRange().getValues();
  if (prodValues.length > 1) {
    var headers = prodValues[0].map(function (h) {
      var norm = h.toString().toUpperCase().trim();
      return headerMapping[norm] || norm;
    });

    for (var i = 1; i < prodValues.length; i++) {
      var row = prodValues[i];
      var prod = {};
      for (var j = 0; j < headers.length; j++) {
        var key = headers[j];
        var val = row[j];
        if (key === 'ID_PRODUTO') prod.id = String(val);
        else if (key === 'NOME') prod.nome = String(val);
        else if (key === 'DESCRICAO') prod.descricao = String(val);
        else if (key === 'CATEGORIA') prod.categoria = String(val);
        else if (key === 'FOTO') prod.foto = String(val);
        else if (key === 'QUANTIDADE') prod.quantidade = Number(val);
        else if (key === 'QUANTIDADE_MINIMA') prod.quantidadeMinima = Number(val);
        else if (key === 'LOCALIZACAO') prod.localizacao = String(val);
        else if (key === 'DATA_CADASTRO') {
          if (val instanceof Date) {
            prod.dataCadastro = Utilities.formatDate(val, Session.getScriptTimeZone(), "yyyy-MM-dd");
          } else {
            prod.dataCadastro = String(val);
          }
        }
        else if (key === 'STATUS') prod.status = String(val);
        else if (key === 'CODIGO_BARRAS') prod.codigoBarras = String(val);
        else if (key === 'FOTOS') {
          prod.fotos = val ? String(val).split(';') : [];
        }
      }
      if (prod.id) products.push(prod);
    }
  }

  // Lendo movimentações
  var movValues = movSheet.getDataRange().getValues();
  if (movValues.length > 1) {
    var movHeaderMapping = {
      'ID_MOVIMENTACAO': 'ID_MOVIMENTACAO',
      'ID_PRODUTO': 'ID_PRODUTO',
      'TIPO': 'TIPO',
      'QUANTIDADE': 'QUANTIDADE',
      'DATA': 'DATA',
      'RESPONSAVEL': 'RESPONSAVEL',
      'RESPONSÁVEL': 'RESPONSAVEL',
      'OBSERVACAO': 'OBSERVACAO',
      'OBSERVAÇÃO': 'OBSERVACAO',
      'NOTA_FISCAL': 'NOTA_FISCAL',
      'NOTA FISCAL': 'NOTA_FISCAL'
    };
    var headers = movValues[0].map(function (h) {
      var norm = h.toString().toUpperCase().trim();
      return movHeaderMapping[norm] || norm;
    });

    for (var i = 1; i < movValues.length; i++) {
      var row = movValues[i];
      var mov = {};
      for (var j = 0; j < headers.length; j++) {
        var key = headers[j];
        var val = row[j];
        if (key === 'ID_MOVIMENTACAO') mov.id = String(val);
        else if (key === 'ID_PRODUTO') mov.produtoId = String(val);
        else if (key === 'TIPO') mov.tipo = String(val);
        else if (key === 'QUANTIDADE') mov.quantidade = Number(val);
        else if (key === 'DATA') {
          if (val instanceof Date) {
            mov.data = val.toISOString();
          } else {
            mov.data = String(val);
          }
        }
        else if (key === 'RESPONSAVEL') mov.responsavel = String(val);
        else if (key === 'OBSERVACAO') mov.observacao = String(val);
        else if (key === 'NOTA_FISCAL') mov.notaFiscal = String(val);
      }
      if (mov.id) movements.push(mov);
    }
  }

  return { products: products, movements: movements };
}

/**
 * Salva ou atualiza um produto na planilha, enviando fotos para o Drive
 */
function handleSaveProduct(prod) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(PRODUCTS_SHEET_NAME) || initProductsSheet(ss);

  // 1. Obter cabeçalhos atuais e garantir que colunas adicionais existam
  var headers = sheet.getRange(1, 1, 1, Math.max(1, sheet.getLastColumn())).getValues()[0];
  if (headers[0] === "") headers = []; // Corrige caso esteja vazia

  var requiredHeaders = [
    'ID_PRODUTO', 'NOME', 'DESCRICAO', 'CATEGORIA', 'FOTO',
    'QUANTIDADE', 'QUANTIDADE_MINIMA', 'LOCALIZACAO',
    'DATA_CADASTRO', 'STATUS', 'CODIGO_BARRAS', 'FOTOS'
  ];

  var headerMapping = {
    'CODIGO DE BARRA': 'CODIGO_BARRAS',
    'CÓDIGO DE BARRAS': 'CODIGO_BARRAS',
    'ULTIMA ATUALIZACAO': 'DATA_CADASTRO',
    'ÚLTIMA ATUALIZAÇÃO': 'DATA_CADASTRO'
  };

  requiredHeaders.forEach(function (req) {
    var found = false;
    for (var i = 0; i < headers.length; i++) {
      var h = headers[i].toString().toUpperCase().trim();
      if (h === req || headerMapping[h] === req) {
        found = true;
        break;
      }
    }
    if (!found) {
      sheet.getRange(1, headers.length + 1).setValue(req);
      headers.push(req);
    }
  });

  // Mapear cabeçalhos normalizados para posicionamento correto
  var normalizedHeaders = headers.map(function (h) {
    var norm = h.toString().toUpperCase().trim();
    return headerMapping[norm] || norm;
  });

  // 2. Processar fotos no Google Drive (converter base64 em arquivos)
  var imageUrls = [];
  if (prod.fotos && prod.fotos.length > 0) {
    // Buscar ou criar subpasta específica para o produto
    var productFolder = getOrCreateProductFolder(prod.id, prod.nome);
    for (var i = 0; i < prod.fotos.length; i++) {
      var fotoData = prod.fotos[i];
      if (fotoData.startsWith("data:image")) {
        var filename = prod.id + "_foto_" + i + "_" + Date.now() + ".jpg";
        var driveUrl = saveBase64Image(fotoData, filename, productFolder);
        imageUrls.push(driveUrl);
      } else {
        imageUrls.push(fotoData);
      }
    }
  }

  prod.fotos = imageUrls;
  prod.foto = imageUrls.length > 0 ? imageUrls[0] : "";

  // 3. Localizar na Planilha por ID_PRODUTO
  var values = sheet.getDataRange().getValues();
  var rowIdx = -1;
  var idColIdx = normalizedHeaders.indexOf('ID_PRODUTO');

  if (idColIdx !== -1) {
    for (var i = 1; i < values.length; i++) {
      if (String(values[i][idColIdx]).trim() === prod.id.trim()) {
        rowIdx = i + 1; // +1 porque as linhas são base 1
        break;
      }
    }
  }

  // Dicionário de propriedades do produto
  var propMap = {
    'ID_PRODUTO': prod.id,
    'NOME': prod.nome,
    'DESCRICAO': prod.descricao || "",
    'CATEGORIA': prod.categoria,
    'FOTO': prod.foto,
    'QUANTIDADE': prod.quantidade,
    'QUANTIDADE_MINIMA': prod.quantidadeMinima || 0,
    'LOCALIZACAO': prod.localizacao || "",
    'DATA_CADASTRO': prod.dataCadastro || new Date().toISOString().split('T')[0],
    'STATUS': prod.status || "Ativo",
    'CODIGO_BARRAS': prod.codigoBarras || "",
    'FOTOS': prod.fotos.join(';')
  };

  // Constrói array ordenado conforme as colunas reais da planilha
  var rowData = normalizedHeaders.map(function (h) {
    return propMap[h] !== undefined ? propMap[h] : "";
  });

  if (rowIdx !== -1) {
    // Atualizar linha existente mantendo cabeçalhos
    sheet.getRange(rowIdx, 1, 1, rowData.length).setValues([rowData]);
  } else {
    // Adicionar nova linha
    sheet.appendRow(rowData);
  }

  return prod;
}

function handleSaveMovement(mov) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(MOVEMENTS_SHEET_NAME) || initMovementsSheet(ss);

  var values = sheet.getDataRange().getValues();
  var headers = values[0];

  // Garantir cabeçalhos padrão na aba
  var requiredHeaders = [
    'ID_MOVIMENTACAO', 'ID_PRODUTO', 'TIPO', 'QUANTIDADE',
    'DATA', 'RESPONSAVEL', 'OBSERVACAO', 'NOTA_FISCAL'
  ];

  var movHeaderMapping = {
    'ID_MOVIMENTACAO': 'ID_MOVIMENTACAO',
    'ID_PRODUTO': 'ID_PRODUTO',
    'TIPO': 'TIPO',
    'QUANTIDADE': 'QUANTIDADE',
    'DATA': 'DATA',
    'RESPONSAVEL': 'RESPONSAVEL',
    'RESPONSÁVEL': 'RESPONSAVEL',
    'OBSERVACAO': 'OBSERVACAO',
    'OBSERVAÇÃO': 'OBSERVACAO',
    'NOTA_FISCAL': 'NOTA_FISCAL',
    'NOTA FISCAL': 'NOTA_FISCAL'
  };

  requiredHeaders.forEach(function (req) {
    var found = false;
    for (var i = 0; i < headers.length; i++) {
      var h = headers[i].toString().toUpperCase().trim();
      if (h === req || movHeaderMapping[h] === req) {
        found = true;
        break;
      }
    }
    if (!found) {
      sheet.getRange(1, headers.length + 1).setValue(req);
      headers.push(req);
    }
  });

  // Mapear cabeçalhos normalizados para posicionamento correto
  var normalizedHeaders = headers.map(function (h) {
    var norm = h.toString().toUpperCase().trim();
    return movHeaderMapping[norm] || norm;
  });

  var propMap = {
    'ID_MOVIMENTACAO': mov.id,
    'ID_PRODUTO': mov.produtoId,
    'TIPO': mov.tipo,
    'QUANTIDADE': mov.quantidade,
    'DATA': mov.data || new Date().toISOString(),
    'RESPONSAVEL': mov.responsavel || "Almoxarife",
    'OBSERVACAO': mov.observacao || "",
    'NOTA_FISCAL': mov.notaFiscal || ""
  };

  // Constrói array ordenado conforme as colunas reais da planilha
  var rowData = normalizedHeaders.map(function (h) {
    return propMap[h] !== undefined ? propMap[h] : "";
  });

  sheet.appendRow(rowData);
  return mov;
}

/**
 * Sincroniza um lote de produtos e movimentações enviados em lote (Modo offline -> online)
 */
function handleSyncBatch(products, movements) {
  var syncedProducts = [];
  var syncedMovements = [];

  if (products && products.length > 0) {
    for (var i = 0; i < products.length; i++) {
      var saved = handleSaveProduct(products[i]);
      syncedProducts.push(saved);
    }
  }

  if (movements && movements.length > 0) {
    for (var i = 0; i < movements.length; i++) {
      var saved = handleSaveMovement(movements[i]);
      syncedMovements.push(saved);
    }
  }

  return { products: syncedProducts, movements: syncedMovements };
}

/**
 * Inicializa a aba de Produtos com os cabeçalhos corretos
 */
function initProductsSheet(ss) {
  var sheet = ss.insertSheet(PRODUCTS_SHEET_NAME);
  var headers = [
    'ID_PRODUTO', 'NOME', 'DESCRICAO', 'CATEGORIA', 'FOTO',
    'QUANTIDADE', 'QUANTIDADE_MINIMA', 'LOCALIZACAO',
    'DATA_CADASTRO', 'STATUS', 'CODIGO_BARRAS', 'FOTOS'
  ];
  sheet.appendRow(headers);
  sheet.getRange("1:1").setFontWeight("bold").setBackground("#efefef");
  return sheet;
}

/**
 * Inicializa a aba de Movimentações com os cabeçalhos corretos
 */
function initMovementsSheet(ss) {
  var sheet = ss.insertSheet(MOVEMENTS_SHEET_NAME);
  var headers = [
    'ID_MOVIMENTACAO', 'ID_PRODUTO', 'TIPO', 'QUANTIDADE',
    'DATA', 'RESPONSAVEL', 'OBSERVACAO', 'NOTA_FISCAL'
  ];
  sheet.appendRow(headers);
  sheet.getRange("1:1").setFontWeight("bold").setBackground("#efefef");
  return sheet;
}
