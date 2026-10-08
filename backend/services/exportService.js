const ExcelJS = require('exceljs');
const xml2js = require('xml2js');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

class ExportService {
  async exportToExcel(data, filename, options = {}) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(options.sheetName || 'Data');

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('No data to export');
    }

    // Set columns
    const columns = Object.keys(data[0]).map(key => ({
      header: key.charAt(0).toUpperCase() + key.slice(1),
      key: key,
      width: 20
    }));
    worksheet.columns = columns;

    // Add data
    worksheet.addRows(data);

    // Style header row
    worksheet.getRow(1).font = { bold: true, size: 12 };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // Auto-filter
    worksheet.autoFilter = {
      from: 'A1',
      to: `${String.fromCharCode(64 + columns.length)}1`
    };

    // Add borders
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });

    // Freeze header row
    worksheet.views = [
      { state: 'frozen', xSplit: 0, ySplit: 1 }
    ];

    // Save file
    const exportPath = path.join(
      process.env.EXPORT_PATH || './exports',
      filename
    );
    await workbook.xlsx.writeFile(exportPath);

    logger.info(`Excel file created: ${exportPath}`);
    return exportPath;
  }

  async exportToXML(data, filename, options = {}) {
    const builder = new xml2js.Builder({
      rootName: options.rootName || 'data',
      xmldec: { version: '1.0', encoding: 'UTF-8' }
    });

    const xmlData = Array.isArray(data)
      ? { item: data }
      : data;

    const xml = builder.buildObject(xmlData);

    const exportPath = path.join(
      process.env.EXPORT_PATH || './exports',
      filename
    );
    await fs.writeFile(exportPath, xml, 'utf8');

    logger.info(`XML file created: ${exportPath}`);
    return exportPath;
  }

  async exportToJSON(data, filename, options = {}) {
    const json = JSON.stringify(data, null, options.pretty ? 2 : 0);

    const exportPath = path.join(
      process.env.EXPORT_PATH || './exports',
      filename
    );
    await fs.writeFile(exportPath, json, 'utf8');

    logger.info(`JSON file created: ${exportPath}`);
    return exportPath;
  }

  async exportToCSV(data, filename) {
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('No data to export');
    }

    const headers = Object.keys(data[0]);
    const csvRows = [];

    // Add header row
    csvRows.push(headers.join(','));

    // Add data rows
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        const escaped = String(value).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }

    const csv = csvRows.join('\n');

    const exportPath = path.join(
      process.env.EXPORT_PATH || './exports',
      filename
    );
    await fs.writeFile(exportPath, csv, 'utf8');

    logger.info(`CSV file created: ${exportPath}`);
    return exportPath;
  }

  getExportFormat(filename) {
    const ext = path.extname(filename).toLowerCase();
    const formats = {
      '.xlsx': 'excel',
      '.xls': 'excel',
      '.xml': 'xml',
      '.json': 'json',
      '.csv': 'csv'
    };
    return formats[ext] || 'json';
  }

  async export(data, filename, format) {
    switch (format.toLowerCase()) {
      case 'excel':
      case 'xlsx':
        return await this.exportToExcel(data, filename);
      case 'xml':
        return await this.exportToXML(data, filename);
      case 'json':
        return await this.exportToJSON(data, filename);
      case 'csv':
        return await this.exportToCSV(data, filename);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }
}

module.exports = new ExportService();