// Test script to verify DICOM metadata extraction
const fs = require('fs');
const path = require('path');

async function testDicomExtraction() {
  console.log('Testing DICOM metadata extraction...\n');
  
  // Import the service
  const { dicomMetadataService } = require('./dist/services/DicomMetadataService');
  
  // Path to your test DICOM file
  const dicomFilePath = path.join(__dirname, '..', '1.2.840.114257.1.1.3360.20251118.091531.8920812.1.222.dcm');
  
  if (!fs.existsSync(dicomFilePath)) {
    console.error('❌ DICOM file not found at:', dicomFilePath);
    console.log('Please provide the correct path to your DICOM file');
    process.exit(1);
  }
  
  console.log('✓ DICOM file found:', dicomFilePath);
  console.log('File size:', (fs.statSync(dicomFilePath).size / 1024).toFixed(2), 'KB\n');
  
  try {
    // Read the file
    const fileBuffer = fs.readFileSync(dicomFilePath);
    console.log('✓ File read successfully\n');
    
    // Check if it's a DICOM file
    const isDicom = dicomMetadataService.isDicomFile(fileBuffer);
    console.log('Is DICOM file:', isDicom ? '✓ YES' : '✗ NO');
    
    if (!isDicom) {
      console.error('❌ File is not a valid DICOM file');
      process.exit(1);
    }
    
    // Extract metadata
    console.log('\nExtracting metadata...');
    const metadata = dicomMetadataService.extractMetadata(fileBuffer);
    
    console.log('\n📋 Extracted Metadata:');
    console.log('═══════════════════════════════════════');
    console.log('Patient Name:', metadata.patientName || 'N/A');
    console.log('Patient ID:', metadata.patientId || 'N/A');
    console.log('Patient Birth Date:', metadata.patientBirthDate || 'N/A');
    console.log('Patient Sex:', metadata.patientSex || 'N/A');
    console.log('Patient Age:', metadata.patientAge || 'N/A');
    console.log('Study Date:', metadata.studyDate || 'N/A');
    console.log('Study Description:', metadata.studyDescription || 'N/A');
    console.log('Modality:', metadata.modality || 'N/A');
    console.log('Institution Name:', metadata.institutionName || 'N/A');
    console.log('═══════════════════════════════════════');
    
    console.log('\n✅ Metadata extraction successful!');
    
  } catch (error) {
    console.error('\n❌ Error during extraction:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testDicomExtraction();
