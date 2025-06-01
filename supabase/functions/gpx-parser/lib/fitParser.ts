
// Enhanced FIT file parser for extracting GPS and sensor data
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
  distance?: number;
}

/**
 * Parse FIT file data and extract trackpoints with enhanced data extraction
 */
export function parseFitFile(buffer: ArrayBuffer): FitRecord[] {
  console.log('Starting enhanced FIT file parsing, buffer size:', buffer.byteLength);
  
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
    const dataSize = dataView.getUint32(4, true);
    
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
      dataSize,
      signature: fitSignature
    });
    
    // Start parsing from after header
    let offset = headerSize;
    let recordCount = 0;
    const maxOffset = Math.min(headerSize + dataSize, buffer.byteLength - 2);
    
    // Track message definitions for proper parsing
    const messageDefinitions = new Map();
    
    while (offset < maxOffset && recordCount < 50000) { // Increased safety limit
      try {
        const result = parseNextRecord(dataView, offset, messageDefinitions);
        if (result) {
          if (result.record && isValidGpsRecord(result.record)) {
            records.push(result.record);
          }
          offset = result.nextOffset;
        } else {
          offset += 1; // Move forward if we can't parse this record
        }
        recordCount++;
      } catch (parseError) {
        console.log('Error parsing record at offset', offset, ':', parseError);
        offset += 1;
      }
      
      // Log progress for large files
      if (recordCount % 1000 === 0 && recordCount > 0) {
        console.log(`Processed ${recordCount} records, found ${records.length} GPS records`);
      }
    }
    
    console.log(`Parsed ${records.length} valid GPS records from ${recordCount} total records`);
    
    // Add sequence timestamps if missing
    if (records.length > 0 && !records[0].timestamp) {
      console.log('Adding estimated timestamps to records');
      const baseTime = new Date();
      records.forEach((record, index) => {
        record.timestamp = new Date(baseTime.getTime() + (index * 1000)).toISOString();
      });
    }
    
    return records;
    
  } catch (error) {
    console.error('Error parsing FIT file:', error);
    return [];
  }
}

function parseNextRecord(dataView: DataView, offset: number, messageDefinitions: Map<number, any>): { record: FitRecord | null, nextOffset: number } | null {
  if (offset >= dataView.byteLength - 1) {
    return null;
  }
  
  const recordHeader = dataView.getUint8(offset);
  
  // Check for definition record (bit 6 set)
  if (recordHeader & 0x40) {
    // Parse definition record
    const localMessageType = recordHeader & 0x0F;
    
    if (offset + 5 >= dataView.byteLength) {
      return null;
    }
    
    const architecture = dataView.getUint8(offset + 1);
    const globalMessageNumber = dataView.getUint16(offset + 2, architecture === 0);
    const fieldCount = dataView.getUint8(offset + 4);
    
    // Store definition for later use
    const definition = {
      globalMessageNumber,
      fieldCount,
      fields: []
    };
    
    // Parse field definitions
    let fieldOffset = offset + 5;
    for (let i = 0; i < fieldCount && fieldOffset + 2 < dataView.byteLength; i++) {
      const fieldDefinitionNumber = dataView.getUint8(fieldOffset);
      const size = dataView.getUint8(fieldOffset + 1);
      const baseType = dataView.getUint8(fieldOffset + 2);
      
      definition.fields.push({
        fieldDefinitionNumber,
        size,
        baseType
      });
      
      fieldOffset += 3;
    }
    
    messageDefinitions.set(localMessageType, definition);
    
    return { record: null, nextOffset: offset + 5 + (fieldCount * 3) };
  }
  
  // Data record
  const localMessageType = recordHeader & 0x0F;
  const definition = messageDefinitions.get(localMessageType);
  
  if (!definition) {
    // Skip unknown message types
    return { record: null, nextOffset: offset + 1 };
  }
  
  // Calculate record size
  let recordSize = 1; // Header byte
  for (const field of definition.fields) {
    recordSize += field.size;
  }
  
  if (offset + recordSize > dataView.byteLength) {
    return null;
  }
  
  // Parse data based on global message number
  if (definition.globalMessageNumber === 20) { // Record message
    const record = parseRecordMessage(dataView, offset + 1, definition);
    return { record, nextOffset: offset + recordSize };
  }
  
  return { record: null, nextOffset: offset + recordSize };
}

function parseRecordMessage(dataView: DataView, offset: number, definition: any): FitRecord | null {
  try {
    const record: Partial<FitRecord> = {};
    let currentOffset = offset;
    
    for (const field of definition.fields) {
      const value = readFieldValue(dataView, currentOffset, field);
      
      // Map field numbers to record properties
      switch (field.fieldDefinitionNumber) {
        case 253: // timestamp
          if (value !== null && value !== 0xFFFFFFFF) {
            // FIT timestamp is seconds since UTC 00:00 Dec 31 1989
            const fitEpoch = new Date('1989-12-31T00:00:00Z').getTime();
            record.timestamp = new Date(fitEpoch + (value * 1000)).toISOString();
          }
          break;
        case 0: // position_lat
          if (value !== null && value !== 0x7FFFFFFF) {
            record.lat = value * (180 / Math.pow(2, 31));
          }
          break;
        case 1: // position_long
          if (value !== null && value !== 0x7FFFFFFF) {
            record.lng = value * (180 / Math.pow(2, 31));
          }
          break;
        case 2: // altitude
          if (value !== null && value !== 0xFFFF) {
            record.elevation = (value / 5) - 500; // Scale and offset
          }
          break;
        case 6: // speed
          if (value !== null && value !== 0xFFFF) {
            record.speed = value / 1000; // Convert to m/s
          }
          break;
        case 7: // power
          if (value !== null && value !== 0xFFFF) {
            record.power = value;
          }
          break;
        case 3: // heart_rate
          if (value !== null && value !== 0xFF) {
            record.heart_rate = value;
          }
          break;
        case 4: // cadence
          if (value !== null && value !== 0xFF) {
            record.cadence = value;
          }
          break;
        case 5: // distance
          if (value !== null && value !== 0xFFFFFFFF) {
            record.distance = value / 100; // Convert to meters
          }
          break;
        case 13: // temperature
          if (value !== null && value !== 0x7F) {
            record.temperature = value;
          }
          break;
      }
      
      currentOffset += field.size;
    }
    
    // Only return if we have valid GPS coordinates
    if (record.lat !== undefined && record.lng !== undefined &&
        record.lat >= -90 && record.lat <= 90 &&
        record.lng >= -180 && record.lng <= 180) {
      return record as FitRecord;
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

function readFieldValue(dataView: DataView, offset: number, field: any): number | null {
  try {
    const { size, baseType } = field;
    
    if (offset + size > dataView.byteLength) {
      return null;
    }
    
    // Read value based on base type
    switch (baseType & 0x0F) {
      case 0x00: // enum
      case 0x01: // sint8
        return size === 1 ? dataView.getInt8(offset) : null;
      case 0x02: // uint8
        return size === 1 ? dataView.getUint8(offset) : null;
      case 0x83: // sint16
        return size === 2 ? dataView.getInt16(offset, true) : null;
      case 0x84: // uint16
        return size === 2 ? dataView.getUint16(offset, true) : null;
      case 0x85: // sint32
        return size === 4 ? dataView.getInt32(offset, true) : null;
      case 0x86: // uint32
        return size === 4 ? dataView.getUint32(offset, true) : null;
      case 0x88: // float32
        return size === 4 ? dataView.getFloat32(offset, true) : null;
      case 0x89: // float64
        return size === 8 ? dataView.getFloat64(offset, true) : null;
      default:
        // Try to read as uint based on size
        if (size === 1) return dataView.getUint8(offset);
        if (size === 2) return dataView.getUint16(offset, true);
        if (size === 4) return dataView.getUint32(offset, true);
        return null;
    }
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
