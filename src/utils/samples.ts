// Sample data for TR-909 drum machine
export const SAMPLE_DATA = {
  kick: [
    'BT0A0A7.WAV', 'BT0A0D0.WAV', 'BT0A0D3.WAV', 'BT0A0DA.WAV', 'BT0AAD0.WAV', 'BT0AADA.WAV',
    'BT3A0D0.WAV', 'BT3A0D3.WAV', 'BT3A0D7.WAV', 'BT3A0DA.WAV', 'BT3AAD0.WAV', 'BT3AADA.WAV',
    'BT7A0D0.WAV', 'BT7A0D3.WAV', 'BT7A0D7.WAV', 'BT7A0DA.WAV', 'BT7AAD0.WAV', 'BT7AADA.WAV',
    'BTAA0D0.WAV', 'BTAA0D3.WAV', 'BTAA0D7.WAV', 'BTAA0DA.WAV', 'BTAAAD0.WAV', 'BTAAADA.WAV'
  ],
  snare: [
    'HANDCLP1.WAV', 'HANDCLP2.WAV', 'ST0T0S0.WAV', 'ST0T0S3.WAV', 'ST0T0S7.WAV', 'ST0T0SA.WAV',
    'ST0T3S3.WAV', 'ST0T3S7.WAV', 'ST0T3SA.WAV', 'ST0T7S3.WAV', 'ST0T7S7.WAV', 'ST0T7SA.WAV',
    'ST0TAS3.WAV', 'ST0TAS7.WAV', 'ST0TASA.WAV', 'ST3T0S0.WAV', 'ST3T0S3.WAV', 'ST3T0S7.WAV',
    'ST3T0SA.WAV', 'ST3T3S3.WAV', 'ST3T3S7.WAV', 'ST3T3SA.WAV', 'ST3T7S3.WAV', 'ST3T7S7.WAV',
    'ST3T7SA.WAV', 'ST3TAS3.WAV', 'ST3TAS7.WAV', 'ST3TASA.WAV', 'STAT0SA.WAV', 'STAT3S3.WAV',
    'STAT3S7.WAV', 'STAT3SA.WAV', 'STAT7S3.WAV', 'STAT7S7.WAV', 'STAT7SA.WAV', 'STATAS3.WAV',
    'STATAS7.WAV', 'STATASA.WAV'
  ],
  hat: [
    'HHCD0.WAV', 'HHCD2.WAV', 'HHCD4.WAV', 'HHCD6.WAV', 'HHCD8.WAV', 'HHCDA.WAV',
    'HHOD0.WAV', 'HHOD2.WAV', 'HHOD4.WAV', 'HHOD6.WAV', 'HHOD8.WAV', 'HHODA.WAV'
  ],
  tom: [
    'HT0D0.WAV', 'HT0D3.WAV', 'HT0D7.WAV', 'HT0DA.WAV', 'HT3D0.WAV', 'HT3D3.WAV',
    'HT3D7.WAV', 'HT3DA.WAV', 'HT7D0.WAV', 'HT7D3.WAV', 'HT7D7.WAV', 'HT7DA.WAV',
    'HTAD0.WAV', 'HTAD3.WAV', 'HTAD7.WAV', 'HTADA.WAV', 'LT0D0.WAV', 'LT0D3.WAV',
    'LT0D7.WAV', 'LT0DA.WAV', 'LT3D0.WAV', 'LT3D3.WAV', 'LT3D7.WAV', 'LT3DA.WAV',
    'LT7D0.WAV', 'LT7D3.WAV', 'LT7D7.WAV', 'LT7DA.WAV', 'LTAD0.WAV', 'LTAD3.WAV',
    'LTAD7.WAV', 'LTADA.WAV', 'MT0D0.WAV', 'MT0D3.WAV', 'MT0D7.WAV', 'MT0DA.WAV',
    'MT3D0.WAV', 'MT3D3.WAV', 'MT3D7.WAV', 'MT3DA.WAV', 'MT7D0.WAV', 'MT7D3.WAV',
    'MT7D7.WAV', 'MT7DA.WAV', 'MTAD0.WAV', 'MTAD3.WAV', 'MTAD7.WAV', 'MTADA.WAV'
  ]
};

export type InstrumentType = keyof typeof SAMPLE_DATA;

export const INSTRUMENT_TYPES: InstrumentType[] = ['kick', 'snare', 'hat', 'tom'];

export const getInstrumentForTrack = (trackIndex: number): InstrumentType => {
  return INSTRUMENT_TYPES[trackIndex] || 'kick';
};

export const getSamplePath = (instrument: InstrumentType, sampleName: string): string => {
  return `/audio/tr_909/${instrument}/${sampleName}`;
};

export const getSampleName = (instrument: InstrumentType, sampleIndex: number): string => {
  const samples = SAMPLE_DATA[instrument];
  return samples[sampleIndex] || samples[0];
};

export const getSampleCount = (instrument: InstrumentType): number => {
  return SAMPLE_DATA[instrument].length;
};

// Sample Manager Utility Functions

/**
 * Generate a unique sample key for caching and identification
 * Format: "instrument:sampleIndex"
 */
export const getSampleKey = (instrument: InstrumentType, sampleIndex: number): string => {
  return `${instrument}:${sampleIndex}`;
};

/**
 * Get all sample paths for all instruments
 * Returns an array of full paths to all samples
 */
export const getAllSamplePaths = (): string[] => {
  const allPaths: string[] = [];
  
  INSTRUMENT_TYPES.forEach(instrument => {
    SAMPLE_DATA[instrument].forEach(sampleName => {
      allPaths.push(getSamplePath(instrument, sampleName));
    });
  });
  
  return allPaths;
};

/**
 * Calculate total sample count across all instruments
 */
export const getTotalSampleCount = (): number => {
  return INSTRUMENT_TYPES.reduce((total, instrument) => {
    return total + SAMPLE_DATA[instrument].length;
  }, 0);
};

/**
 * Get all sample metadata for a specific instrument
 * Returns array of objects with sample information
 */
export const getInstrumentSamples = (instrument: InstrumentType): Array<{
  index: number;
  name: string;
  path: string;
  key: string;
}> => {
  return SAMPLE_DATA[instrument].map((sampleName, index) => ({
    index,
    name: sampleName,
    path: getSamplePath(instrument, sampleName),
    key: getSampleKey(instrument, index)
  }));
};

/**
 * Get all samples metadata for all instruments
 * Returns a map of instrument to sample metadata arrays
 */
export const getAllSamplesMetadata = (): Record<InstrumentType, Array<{
  index: number;
  name: string;
  path: string;
  key: string;
}>> => {
  const metadata = {} as Record<InstrumentType, Array<{
    index: number;
    name: string;
    path: string;
    key: string;
  }>>;
  
  INSTRUMENT_TYPES.forEach(instrument => {
    metadata[instrument] = getInstrumentSamples(instrument);
  });
  
  return metadata;
};