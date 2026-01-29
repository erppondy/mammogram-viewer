const fs = require('fs');
const path = require('path');

async function testConversion() {
  try {
    const { dicomConverterService } = require('./backend/dist/services/DicomConverterService');
    const dicomBuffer = fs.readFileSync('./000223.dcm');
    
    console.log('DICOM file size:', dicomBuffer.length, 'bytes');
    console.log('Starting conversion...');
    
    const pngBuffer = await dicomConverterService.convertToPNG(dicomBuffer, {
      maxWidth: 2048,
      maxHeight: 2048,
      quality: 90
    });
    
    console.log('Conversion successful!');
    console.log('PNG size:', pngBuffer.length, 'bytes');
    
    // Save for inspection
    fs.writeFileSync('/tmp/test-conversion.png', pngBuffer);
    console.log('Saved to /tmp/test-conversion.png');
  } catch (error) {
    console.error('Conversion failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testConversion();
