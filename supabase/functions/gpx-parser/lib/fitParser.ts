
// Basic FIT file parser for extracting GPS and sensor data
export interface FitRecord {
  lat: number;
  lng: number;
  elevation?: number;
  timestamp?: string;
  power?: number;
  heart_rate?: number;
  cadence?: number;
  speed?: number;
  temperature?: number;
}

/**
 * Parse FIT file data and extract trackpoints
 * This is a simplified parser that extracts basic GPS and sensor data
 */
export function parseFitFile(buffer: ArrayBuffer): FitRecord[] {
  console.log('Starting FIT file parsing, buffer size:', buffer.byteLength);
  
  const dataView = new DataView(buffer);
  const records: FitRecord[] = [];
  
  try {
    // FIT file header validation
    if (buffer.byteLength < 14) {
      console.error('FIT file too small');
      return [];
    }
    
    // Check FIT file signature
    const headerSize = dataView.getUint8(0);
    const protocolVersion = dataView.getUint8(1);
    const profileVersion = dataView.getUint16(2, true);
    
    // Read file type signature
    const signature = new Uint8Array(buffer, 8, 4);
    const fitSignature = Array.from(signature).map(b => String.fromCharCode(b)).join('');
    
    if (fitSignature !== '.FIT') {
      console.error('Invalid FIT file signature:', fitSignature);
      return [];
    }
    
    console.log('FIT file validation passed:', {
      headerSize,
      protocolVersion,
      profileVersion,
      signature: fitSignature
    });
    
    // Start parsing from after header
    let offset = headerSize;
    let recordCount = 0;
    
    while (offset < buffer.byteLength - 2 && recordCount < 10000) { // Safety limit
      try {
        const record = parseNextRecord(dataView, offset);
        if (record) {
          if (record.record && isValidGpsRecord(record.record)) {
            records.push(record.record);
          }
          offset = record.nextOffset;
        } else {
          offset += 1; // Move forward if we can't parse this record
        }
        recordCount++;
      } catch (parseError) {
        console.log('Error parsing record at offset', offset, ':', parseError);
        offset += 1;
      }
    }
    
    console.log(`Parsed ${records.length} valid GPS records from FIT file`);
    return records;
    
  } catch (error) {
    console.error('Error parsing FIT file:', error);
    return [];
  }
}

function parseNextRecord(dataView: DataView, offset: number): { record: FitRecord | null, nextOffset: number } | null {
  if (offset >= dataView.byteLength - 1) {
    return null;
  }
  
  const recordHeader = dataView.getUint8(offset);
  
  // Check for definition record (bit 6 set)
  if (recordHeader & 0x40) {
    // Skip definition records for now
    const fieldCount = dataView.getUint8(offset + 5);
    return { record: null, nextOffset: offset + 6 + (fieldCount * 3) };
  }
  
  // Data record
  const localMessageType = recordHeader & 0x0F;
  
  // Try to extract GPS data based on common FIT record patterns
  if (offset + 20 < dataView.byteLength) {
    try {
      // Look for GPS coordinates in various FIT formats
      const record = extractGpsData(dataView, offset);
      if (record) {
        return { record, nextOffset: offset + getRecordSize(dataView, offset) };
      }
    } catch (e) {
      // Continue if this record doesn't contain GPS data
    }
  }
  
  return { record: null, nextOffset: offset + getRecordSize(dataView, offset) };
}

function extractGpsData(dataView: DataView, offset: number): FitRecord | null {
  try {
    // FIT coordinates are stored as semicircles (2^31 / 180 degrees)
    const semicirclesToDegrees = 180 / Math.pow(2, 31);
    
    // Try different offset patterns for GPS data
    const patterns = [
      { latOffset: 4, lngOffset: 8, elevOffset: 12, powerOffset: 16 },
      { latOffset: 8, lngOffset: 12, elevOffset: 16, powerOffset: 20 },
      { latOffset: 12, lngOffset: 16, elevOffset: 20, powerOffset: 24 }
    ];
    
    for (const pattern of patterns) {
      if (offset + pattern.powerOffset + 4 < dataView.byteLength) {
        const latRaw = dataView.getInt32(offset + pattern.latOffset, true);
        const lngRaw = dataView.getInt32(offset + pattern.lngOffset, true);
        
        if (latRaw !== 0 && lngRaw !== 0 && latRaw !== -1 && lngRaw !== -1) {
          const lat = latRaw * semicirclesToDegrees;
          const lng = lngRaw * semicirclesToDegrees;
          
          // Validate coordinates are reasonable
          if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
            const record: FitRecord = { lat, lng };
            
            // Try to extract additional data
            try {
              const elevRaw = dataView.getUint16(offset + pattern.elevOffset, true);
              if (elevRaw && elevRaw !== 0xFFFF && elevRaw < 10000) {
                record.elevation = (elevRaw / 5) - 500; // FIT elevation scale/offset
              }
              
              const powerRaw = dataView.getUint16(offset + pattern.powerOffset, true);
              if (powerRaw && powerRaw !== 0xFFFF && powerRaw < 2000) {
                record.power = powerRaw;
              }
            } catch (e) {
              // Optional data extraction failed, but we have GPS
            }
            
            return record;
          }
        }
      }
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

function isValidGpsRecord(record: FitRecord): boolean {
  return record.lat !== undefined && 
         record.lng !== undefined && 
         record.lat >= -90 && 
         record.lat <= 90 && 
         record.lng >= -180 && 
         record.lng <= 180;
}

function getRecordSize(dataView: DataView, offset: number): number {
  // Estimate record size based on header
  const recordHeader = dataView.getUint8(offset);
  
  if (recordHeader & 0x40) {
    // Definition record
    const fieldCount = dataView.getUint8(offset + 5);
    return 6 + (fieldCount * 3);
  } else {
    // Data record - use a reasonable default size
    return 20;
  }
}
