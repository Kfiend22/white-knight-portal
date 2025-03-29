const PdfPrinter = require('pdfmake');
const fs = require('fs');
const path = require('path');

// Define fonts
const fonts = {
  Roboto: {
    normal: path.join(__dirname, '..', 'fonts', 'Roboto-Regular.ttf'),
    bold: path.join(__dirname, '..', 'fonts', 'Roboto-Medium.ttf'),
    italics: path.join(__dirname, '..', 'fonts', 'Roboto-Italic.ttf'),
    bolditalics: path.join(__dirname, '..', 'fonts', 'Roboto-MediumItalic.ttf')
  }
};

// Check if fonts exist, if not use fallback
const checkFontsExist = () => {
  const fontPaths = [
    fonts.Roboto.normal,
    fonts.Roboto.bold,
    fonts.Roboto.italics,
    fonts.Roboto.bolditalics
  ];
  
  const allFontsExist = fontPaths.every(fontPath => fs.existsSync(fontPath));
  
  if (!allFontsExist) {
    console.warn('Some font files are missing. Using fallback fonts.');
    fonts.Roboto = {
      normal: 'Helvetica',
      bold: 'Helvetica-Bold',
      italics: 'Helvetica-Oblique',
      bolditalics: 'Helvetica-BoldOblique'
    };
  }
};

// Check fonts before creating printer
checkFontsExist();

// Create a new PDF printer
const printer = new PdfPrinter(fonts);

/**
 * Generate a rate sheet PDF for a single facility
 * @param {Object} application - The application object
 * @param {Object} facility - The facility object
 * @param {Array} rates - Array of rate objects for the facility
 * @returns {Promise<Buffer>} - PDF buffer
 */
const generateFacilityRateSheet = async (application, facility, rates) => {
  // Create document definition
  const docDefinition = {
    content: [
      { text: 'Rate Sheet', style: 'header' },
      { text: `Facility: ${facility.facilityName}`, style: 'subheader' },
      { text: `Address: ${facility.address1}, ${facility.city}, ${facility.state} ${facility.zip}` },
      { text: 'Service Rates', style: 'subheader', margin: [0, 15, 0, 5] },
      {
        table: {
          headerRows: 1,
          widths: ['*', 'auto'],
          body: [
            [{ text: 'Service Type', style: 'tableHeader' }, { text: 'Rate ($)', style: 'tableHeader' }],
            ...rates.map(rate => ([getServiceTypeLabel(rate.serviceType), { text: `$${rate.rate.toFixed(2)}`, alignment: 'right' }]))
          ]
        }
      },
      { text: 'Signature', style: 'subheader', margin: [0, 30, 0, 5] },
      { text: 'By signing below, you agree to the rates listed above.' },
      {
        columns: [
          {
            width: '50%',
            text: 'Signature: _______________________________',
            margin: [0, 20, 0, 0]
          },
          {
            width: '50%',
            text: 'Date: _______________________________',
            margin: [0, 20, 0, 0]
          }
        ]
      },
      {
        columns: [
          {
            width: '50%',
            text: 'Print Name: _______________________________',
            margin: [0, 20, 0, 0]
          },
          {
            width: '50%',
            text: 'Title: _______________________________',
            margin: [0, 20, 0, 0]
          }
        ]
      },
      { text: 'White Knight Motor Club', style: 'footer', margin: [0, 30, 0, 0] },
      { text: new Date().toLocaleDateString(), style: 'footer' }
    ],
    styles: {
      header: { fontSize: 18, bold: true, margin: [0, 0, 0, 10] },
      subheader: { fontSize: 14, bold: true, margin: [0, 10, 0, 5] },
      tableHeader: { bold: true, fontSize: 12, color: 'black', fillColor: '#eeeeee' },
      footer: { fontSize: 10, color: 'gray', alignment: 'right' }
    },
    defaultStyle: {
      fontSize: 10
    }
  };

  // Create PDF document
  const pdfDoc = printer.createPdfKitDocument(docDefinition);
  
  // Return PDF as buffer
  return new Promise((resolve, reject) => {
    const chunks = [];
    pdfDoc.on('data', chunk => chunks.push(chunk));
    pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
    pdfDoc.on('error', reject);
    pdfDoc.end();
  });
};

/**
 * Generate a consolidated rate sheet PDF for multiple facilities
 * @param {Object} application - The application object
 * @param {Array} facilities - Array of facility objects
 * @param {Array} rates - Array of rate objects for all facilities
 * @returns {Promise<Buffer>} - PDF buffer
 */
const generateConsolidatedRateSheet = async (application, facilities, rates) => {
  // Create content array
  const content = [
    { text: 'Consolidated Rate Sheet', style: 'header' },
    { text: `Company: ${application.companyName}`, style: 'subheader' },
    { text: 'Service Rates by Facility', style: 'subheader', margin: [0, 15, 0, 5] }
  ];

  // Add each facility and its rates
  facilities.forEach(facility => {
    // Get rates for this facility
    const facilityRates = rates.filter(rate => rate.facilityId.toString() === facility._id.toString());
    
    // Add facility section
    content.push(
      { text: `Facility: ${facility.facilityName}`, style: 'facilityHeader', margin: [0, 15, 0, 5] },
      { text: `Address: ${facility.address1}, ${facility.city}, ${facility.state} ${facility.zip}` },
      {
        table: {
          headerRows: 1,
          widths: ['*', 'auto'],
          body: [
            [{ text: 'Service Type', style: 'tableHeader' }, { text: 'Rate ($)', style: 'tableHeader' }],
            ...facilityRates.map(rate => ([getServiceTypeLabel(rate.serviceType), { text: `$${rate.rate.toFixed(2)}`, alignment: 'right' }]))
          ]
        },
        margin: [0, 5, 0, 15]
      }
    );
  });

  // Add signature section
  content.push(
    { text: 'Signature', style: 'subheader', margin: [0, 30, 0, 5] },
    { text: 'By signing below, you agree to the rates listed above for all facilities.' },
    {
      columns: [
        {
          width: '50%',
          text: 'Signature: _______________________________',
          margin: [0, 20, 0, 0]
        },
        {
          width: '50%',
          text: 'Date: _______________________________',
          margin: [0, 20, 0, 0]
        }
      ]
    },
    {
      columns: [
        {
          width: '50%',
          text: 'Print Name: _______________________________',
          margin: [0, 20, 0, 0]
        },
        {
          width: '50%',
          text: 'Title: _______________________________',
          margin: [0, 20, 0, 0]
        }
      ]
    },
    { text: 'White Knight Motor Club', style: 'footer', margin: [0, 30, 0, 0] },
    { text: new Date().toLocaleDateString(), style: 'footer' }
  );

  // Create document definition
  const docDefinition = {
    content: content,
    styles: {
      header: { fontSize: 18, bold: true, margin: [0, 0, 0, 10] },
      subheader: { fontSize: 14, bold: true, margin: [0, 10, 0, 5] },
      facilityHeader: { fontSize: 12, bold: true, margin: [0, 10, 0, 5] },
      tableHeader: { bold: true, fontSize: 10, color: 'black', fillColor: '#eeeeee' },
      footer: { fontSize: 10, color: 'gray', alignment: 'right' }
    },
    defaultStyle: {
      fontSize: 10
    }
  };

  // Create PDF document
  const pdfDoc = printer.createPdfKitDocument(docDefinition);
  
  // Return PDF as buffer
  return new Promise((resolve, reject) => {
    const chunks = [];
    pdfDoc.on('data', chunk => chunks.push(chunk));
    pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
    pdfDoc.on('error', reject);
    pdfDoc.end();
  });
};

/**
 * Generate a blank rate sheet PDF template
 * @returns {Promise<Buffer>} - PDF buffer
 */
const generateBlankRateSheet = async () => {
  // Create document definition
  const docDefinition = {
    content: [
      { text: 'Rate Sheet Template', style: 'header' },
      { text: 'Facility Information', style: 'subheader', margin: [0, 15, 0, 5] },
      {
        table: {
          widths: ['*'],
          body: [
            [{ text: 'Facility Name: _______________________________' }],
            [{ text: 'Address: _______________________________' }],
            [{ text: 'City: ______________ State: ____ ZIP: _______' }]
          ]
        }
      },
      { text: 'Service Rates', style: 'subheader', margin: [0, 15, 0, 5] },
      {
        table: {
          headerRows: 1,
          widths: ['*', 'auto'],
          body: [
            [{ text: 'Service Type', style: 'tableHeader' }, { text: 'Rate ($)', style: 'tableHeader' }],
            ...SERVICE_TYPES.map(type => ([type.label, { text: '$_______', alignment: 'right' }]))
          ]
        }
      },
      { text: 'Signature', style: 'subheader', margin: [0, 30, 0, 5] },
      { text: 'By signing below, you agree to the rates listed above.' },
      {
        columns: [
          {
            width: '50%',
            text: 'Signature: _______________________________',
            margin: [0, 20, 0, 0]
          },
          {
            width: '50%',
            text: 'Date: _______________________________',
            margin: [0, 20, 0, 0]
          }
        ]
      },
      {
        columns: [
          {
            width: '50%',
            text: 'Print Name: _______________________________',
            margin: [0, 20, 0, 0]
          },
          {
            width: '50%',
            text: 'Title: _______________________________',
            margin: [0, 20, 0, 0]
          }
        ]
      },
      { text: 'White Knight Motor Club', style: 'footer', margin: [0, 30, 0, 0] },
      { text: new Date().toLocaleDateString(), style: 'footer' }
    ],
    styles: {
      header: { fontSize: 18, bold: true, margin: [0, 0, 0, 10] },
      subheader: { fontSize: 14, bold: true, margin: [0, 10, 0, 5] },
      tableHeader: { bold: true, fontSize: 12, color: 'black', fillColor: '#eeeeee' },
      footer: { fontSize: 10, color: 'gray', alignment: 'right' }
    },
    defaultStyle: {
      fontSize: 10
    }
  };

  // Create PDF document
  const pdfDoc = printer.createPdfKitDocument(docDefinition);
  
  // Return PDF as buffer
  return new Promise((resolve, reject) => {
    const chunks = [];
    pdfDoc.on('data', chunk => chunks.push(chunk));
    pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
    pdfDoc.on('error', reject);
    pdfDoc.end();
  });
};

// Helper function to get service type label
const getServiceTypeLabel = (serviceTypeId) => {
  const serviceType = SERVICE_TYPES.find(type => type.id === serviceTypeId);
  return serviceType ? serviceType.label : serviceTypeId;
};

// Service types
const SERVICE_TYPES = [
  { id: 'roadOnly', label: 'Road-Only Services' },
  { id: 'lightDuty', label: 'Light Duty Towing' },
  { id: 'mediumDuty', label: 'Medium Duty Towing' },
  { id: 'heavyDuty', label: 'Heavy Duty Towing' },
  { id: 'mobileMechanic', label: 'Mobile Mechanic Services' },
  { id: 'mediumHeavyTire', label: 'Medium & Heavy Duty Tire Services' },
  { id: 'accidentSceneTowing', label: 'Accident Scene Towing' },
  { id: 'secondaryTow', label: 'Secondary Towing' },
  { id: 'storageFacility', label: 'Storage Facility' }
];

module.exports = {
  generateFacilityRateSheet,
  generateConsolidatedRateSheet,
  generateBlankRateSheet
};
