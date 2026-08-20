// Original TR-909 sample data. Keep these arrays available while callers migrate
// to the multi-kit manifest below.
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

export const DRUM_KIT_IDS = ['tr-909', 'cr-78', 'lm-2', 'mrk-2', 'tr-505'] as const;

export type DrumKitId = (typeof DRUM_KIT_IDS)[number];

export const DEFAULT_DRUM_KIT_ID: DrumKitId = 'cr-78';

export interface DrumSampleDefinition {
  id: string;
  filename: string;
  label: string;
  path: string;
}

export interface DrumKitDefinition {
  id: DrumKitId;
  name: string;
  label: string;
  description: string;
  basePath: string;
  source: string;
  sourceUrl: string | null;
  license: string;
  licenseUrl: string | null;
  licenseNote: string;
  audioFormat: {
    container: 'WAV';
    encoding: 'PCM';
    bitDepth: 16 | 24;
    sampleRateHz: 44100 | 48000;
    channels: 1;
  };
  samples: Record<InstrumentType, readonly DrumSampleDefinition[]>;
}

export interface DrumSampleRef extends DrumSampleDefinition {
  kitId: DrumKitId;
  instrument: InstrumentType;
  index: number;
  key: string;
  sample: DrumSampleDefinition;
  /** Readable alias retained for callers of the original metadata helper. */
  name: string;
}

const ORAMICS_COMMIT = '84d3405e107ad52986e7ca99af6a4ed3efe205de';
const ORAMICS_BASE_URL = `https://github.com/oramics/sampled/tree/${ORAMICS_COMMIT}/DM`;

const KIT_BASE_PATHS: Record<DrumKitId, string> = {
  'tr-909': '/audio/tr_909',
  'cr-78': '/audio/kits/cr-78/samples',
  'lm-2': '/audio/kits/lm-2/samples',
  'mrk-2': '/audio/kits/mrk-2/samples',
  'tr-505': '/audio/kits/tr-505/samples'
};

const samplePath = (
  kitId: DrumKitId,
  instrument: InstrumentType,
  filename: string
): string => kitId === 'tr-909'
  ? `${KIT_BASE_PATHS[kitId]}/${instrument}/${filename}`
  : `${KIT_BASE_PATHS[kitId]}/${filename}`;

const defineSample = (
  kitId: DrumKitId,
  instrument: InstrumentType,
  filename: string,
  label: string
): DrumSampleDefinition => ({
  id: filename.replace(/\.[^.]+$/, ''),
  filename,
  label,
  path: samplePath(kitId, instrument, filename)
});

const numberedLabel = (label: string, index: number): string =>
  `${label} ${String(index + 1).padStart(2, '0')}`;

const tr909Samples: Record<InstrumentType, readonly DrumSampleDefinition[]> = {
  kick: SAMPLE_DATA.kick.map((filename, index) =>
    defineSample('tr-909', 'kick', filename, numberedLabel('Kick', index))
  ),
  snare: SAMPLE_DATA.snare.map((filename, index) =>
    defineSample(
      'tr-909',
      'snare',
      filename,
      index < 2 ? `Hand Clap ${index + 1}` : numberedLabel('Snare', index - 2)
    )
  ),
  hat: SAMPLE_DATA.hat.map((filename, index) =>
    defineSample(
      'tr-909',
      'hat',
      filename,
      index < 6 ? numberedLabel('Closed Hi-Hat', index) : numberedLabel('Open Hi-Hat', index - 6)
    )
  ),
  tom: SAMPLE_DATA.tom.map((filename, index) => {
    const voice = index < 16 ? 'High Tom' : index < 32 ? 'Low Tom' : 'Mid Tom';
    const voiceIndex = index % 16;
    return defineSample('tr-909', 'tom', filename, numberedLabel(voice, voiceIndex));
  })
};

const cr78Samples: Record<InstrumentType, readonly DrumSampleDefinition[]> = {
  kick: [
    defineSample('cr-78', 'kick', 'kick.wav', 'Kick'),
    defineSample('cr-78', 'kick', 'kick-accent.wav', 'Kick Accent')
  ],
  snare: [
    defineSample('cr-78', 'snare', 'snare.wav', 'Snare'),
    defineSample('cr-78', 'snare', 'snare-accent.wav', 'Snare Accent')
  ],
  hat: [
    defineSample('cr-78', 'hat', 'hihat.wav', 'Hi-Hat'),
    defineSample('cr-78', 'hat', 'hihat-accent.wav', 'Hi-Hat Accent'),
    defineSample('cr-78', 'hat', 'hihat-metal.wav', 'Metal Hi-Hat')
  ],
  tom: [
    defineSample('cr-78', 'tom', 'bongo-h.wav', 'High Bongo'),
    defineSample('cr-78', 'tom', 'bongo-l.wav', 'Low Bongo'),
    defineSample('cr-78', 'tom', 'conga-l.wav', 'Low Conga')
  ]
};

const lm2Samples: Record<InstrumentType, readonly DrumSampleDefinition[]> = {
  kick: [
    defineSample('lm-2', 'kick', 'kick.wav', 'Kick'),
    defineSample('lm-2', 'kick', 'kick-alt.wav', 'Kick Alternate')
  ],
  snare: [
    defineSample('lm-2', 'snare', 'snare-l.wav', 'Snare Low'),
    defineSample('lm-2', 'snare', 'snare-m.wav', 'Snare Mid'),
    defineSample('lm-2', 'snare', 'snare-h.wav', 'Snare High'),
    defineSample('lm-2', 'snare', 'clap.wav', 'Hand Clap')
  ],
  hat: [
    defineSample('lm-2', 'hat', 'hihat-closed.wav', 'Closed Hi-Hat'),
    defineSample('lm-2', 'hat', 'hihat-closed-long.wav', 'Closed Hi-Hat Long'),
    defineSample('lm-2', 'hat', 'hihat-closed-short.wav', 'Closed Hi-Hat Short'),
    defineSample('lm-2', 'hat', 'hihat-open.wav', 'Open Hi-Hat')
  ],
  tom: [
    defineSample('lm-2', 'tom', 'tom-l.wav', 'Tom Low'),
    defineSample('lm-2', 'tom', 'tom-ll.wav', 'Tom Lowest'),
    defineSample('lm-2', 'tom', 'tom-m.wav', 'Tom Mid'),
    defineSample('lm-2', 'tom', 'tom-h.wav', 'Tom High'),
    defineSample('lm-2', 'tom', 'tom-hh.wav', 'Tom Highest')
  ]
};

const mrk2Samples: Record<InstrumentType, readonly DrumSampleDefinition[]> = {
  kick: [defineSample('mrk-2', 'kick', 'kick.wav', 'Kick')],
  snare: [defineSample('mrk-2', 'snare', 'snare.wav', 'Snare')],
  hat: [
    defineSample('mrk-2', 'hat', 'hihat-closed.wav', 'Closed Hi-Hat'),
    defineSample('mrk-2', 'hat', 'hihat-open.wav', 'Open Hi-Hat')
  ],
  tom: [
    defineSample('mrk-2', 'tom', 'tom.wav', 'Tom'),
    defineSample('mrk-2', 'tom', 'bongo.wav', 'Bongo')
  ]
};

const tr505Samples: Record<InstrumentType, readonly DrumSampleDefinition[]> = {
  kick: [defineSample('tr-505', 'kick', 'tr505-kick.wav', 'Kick')],
  snare: [
    defineSample('tr-505', 'snare', 'tr505-snare.wav', 'Snare'),
    defineSample('tr-505', 'snare', 'tr505-clap.wav', 'Hand Clap')
  ],
  hat: [
    defineSample('tr-505', 'hat', 'tr505-hihat-closed.wav', 'Closed Hi-Hat'),
    defineSample('tr-505', 'hat', 'tr505-hihat-open.wav', 'Open Hi-Hat')
  ],
  tom: [
    defineSample('tr-505', 'tom', 'tr505-tom-l.wav', 'Tom Low'),
    defineSample('tr-505', 'tom', 'tr505-tom-m.wav', 'Tom Mid'),
    defineSample('tr-505', 'tom', 'tr505-tom-h.wav', 'Tom High')
  ]
};

export const DRUM_KITS: Record<DrumKitId, DrumKitDefinition> = {
  'tr-909': {
    id: 'tr-909',
    name: 'Roland TR-909',
    label: 'Roland TR-909',
    description: 'The original TR-909 sample library bundled with this project.',
    basePath: KIT_BASE_PATHS['tr-909'],
    source: 'Existing project sample collection',
    sourceUrl: null,
    license: 'Undocumented',
    licenseUrl: null,
    licenseNote: 'The repository does not currently document the source license for this existing kit.',
    audioFormat: {
      container: 'WAV',
      encoding: 'PCM',
      bitDepth: 16,
      sampleRateHz: 44100,
      channels: 1
    },
    samples: tr909Samples
  },
  'cr-78': {
    id: 'cr-78',
    name: 'Roland CR-78',
    label: 'Roland CR-78',
    description: 'Roland CompuRhythm CR-78 analog rhythm-machine samples.',
    basePath: KIT_BASE_PATHS['cr-78'],
    source: 'Oramics Sampled',
    sourceUrl: `${ORAMICS_BASE_URL}/CR-78`,
    license: 'Public Domain',
    licenseUrl: `https://github.com/oramics/sampled/blob/${ORAMICS_COMMIT}/DM/CR-78/README.md`,
    licenseNote: 'The source manifest explicitly designates this kit as Public Domain.',
    audioFormat: {
      container: 'WAV',
      encoding: 'PCM',
      bitDepth: 24,
      sampleRateHz: 48000,
      channels: 1
    },
    samples: cr78Samples
  },
  'lm-2': {
    id: 'lm-2',
    name: 'LinnDrum LM-2',
    label: 'LinnDrum LM-2',
    description: 'Classic LinnDrum LM-2 digital drum-machine samples.',
    basePath: KIT_BASE_PATHS['lm-2'],
    source: 'Oramics Sampled',
    sourceUrl: `${ORAMICS_BASE_URL}/LM-2`,
    license: 'Public Domain',
    licenseUrl: `https://github.com/oramics/sampled/blob/${ORAMICS_COMMIT}/DM/LM-2/README.md`,
    licenseNote: 'The source manifest explicitly designates this kit as Public Domain.',
    audioFormat: {
      container: 'WAV',
      encoding: 'PCM',
      bitDepth: 16,
      sampleRateHz: 44100,
      channels: 1
    },
    samples: lm2Samples
  },
  'mrk-2': {
    id: 'mrk-2',
    name: 'Maestro Rhythm King MRK-2',
    label: 'Maestro Rhythm King MRK-2',
    description: 'Maestro Rhythm King MRK-2 analog rhythm-machine samples.',
    basePath: KIT_BASE_PATHS['mrk-2'],
    source: 'Oramics Sampled',
    sourceUrl: `${ORAMICS_BASE_URL}/MRK-2`,
    license: 'Public Domain',
    licenseUrl: `https://github.com/oramics/sampled/blob/${ORAMICS_COMMIT}/DM/MRK-2/README.md`,
    licenseNote: 'The source manifest explicitly designates this kit as Public Domain.',
    audioFormat: {
      container: 'WAV',
      encoding: 'PCM',
      bitDepth: 16,
      sampleRateHz: 44100,
      channels: 1
    },
    samples: mrk2Samples
  },
  'tr-505': {
    id: 'tr-505',
    name: 'Roland TR-505',
    label: 'Roland TR-505',
    description: 'Roland TR-505 digital drum-machine samples.',
    basePath: KIT_BASE_PATHS['tr-505'],
    source: 'Oramics Sampled',
    sourceUrl: `${ORAMICS_BASE_URL}/TR-505`,
    license: 'Public Domain',
    licenseUrl: `https://github.com/oramics/sampled/blob/${ORAMICS_COMMIT}/DM/TR-505/README.md`,
    licenseNote: 'The source manifest explicitly designates this kit as Public Domain.',
    audioFormat: {
      container: 'WAV',
      encoding: 'PCM',
      bitDepth: 16,
      sampleRateHz: 44100,
      channels: 1
    },
    samples: tr505Samples
  }
};

export const getDrumKit = (
  kitId: DrumKitId = DEFAULT_DRUM_KIT_ID
): DrumKitDefinition => DRUM_KITS[kitId];

export const getInstrumentForTrack = (trackIndex: number): InstrumentType =>
  INSTRUMENT_TYPES[trackIndex] || 'kick';

const isInstrumentType = (value: string): value is InstrumentType =>
  INSTRUMENT_TYPES.includes(value as InstrumentType);

export function getSample(instrument: InstrumentType, sampleIndex: number): DrumSampleRef;
export function getSample(
  kitId: DrumKitId,
  instrument: InstrumentType,
  sampleIndex: number
): DrumSampleRef;
export function getSample(
  kitIdOrInstrument: DrumKitId | InstrumentType,
  instrumentOrIndex: InstrumentType | number,
  maybeSampleIndex?: number
): DrumSampleRef {
  const legacyCall = maybeSampleIndex === undefined;
  const kitId = legacyCall ? DEFAULT_DRUM_KIT_ID : kitIdOrInstrument as DrumKitId;
  const instrument = legacyCall
    ? kitIdOrInstrument as InstrumentType
    : instrumentOrIndex as InstrumentType;
  const sampleIndex = legacyCall ? instrumentOrIndex as number : maybeSampleIndex;
  const samples = getDrumKit(kitId).samples[instrument];
  const resolvedIndex = sampleIndex >= 0 && sampleIndex < samples.length ? sampleIndex : 0;
  const sample = samples[resolvedIndex];

  return {
    ...sample,
    kitId,
    instrument,
    index: resolvedIndex,
    key: `${kitId}:${instrument}:${resolvedIndex}`,
    sample,
    name: sample.label
  };
}

export function getSamplePath(instrument: InstrumentType, sampleName: string): string;
export function getSamplePath(
  kitId: DrumKitId,
  instrument: InstrumentType,
  sampleIndexOrName: number | string
): string;
export function getSamplePath(
  kitIdOrInstrument: DrumKitId | InstrumentType,
  instrumentOrName: InstrumentType | string,
  maybeSampleIndexOrName?: number | string
): string {
  if (maybeSampleIndexOrName === undefined && isInstrumentType(kitIdOrInstrument)) {
    const sampleName = instrumentOrName as string;
    const sample = getDrumKit().samples[kitIdOrInstrument]
      .find((candidate) => candidate.filename === sampleName);
    return sample?.path ?? samplePath(DEFAULT_DRUM_KIT_ID, kitIdOrInstrument, sampleName);
  }

  const kitId = kitIdOrInstrument as DrumKitId;
  const instrument = instrumentOrName as InstrumentType;

  if (typeof maybeSampleIndexOrName === 'number') {
    return getSample(kitId, instrument, maybeSampleIndexOrName).path;
  }

  const sampleName = maybeSampleIndexOrName as string;
  const sample = getDrumKit(kitId).samples[instrument]
    .find((candidate) => candidate.filename === sampleName);
  return sample?.path ?? samplePath(kitId, instrument, sampleName);
}

export function getSampleName(instrument: InstrumentType, sampleIndex: number): string;
export function getSampleName(
  kitId: DrumKitId,
  instrument: InstrumentType,
  sampleIndex: number
): string;
export function getSampleName(
  kitIdOrInstrument: DrumKitId | InstrumentType,
  instrumentOrIndex: InstrumentType | number,
  maybeSampleIndex?: number
): string {
  return maybeSampleIndex === undefined
    ? getSample(kitIdOrInstrument as InstrumentType, instrumentOrIndex as number).label
    : getSample(
      kitIdOrInstrument as DrumKitId,
      instrumentOrIndex as InstrumentType,
      maybeSampleIndex
    ).label;
}

export function getSampleCount(instrument: InstrumentType): number;
export function getSampleCount(kitId: DrumKitId, instrument: InstrumentType): number;
export function getSampleCount(
  kitIdOrInstrument: DrumKitId | InstrumentType,
  maybeInstrument?: InstrumentType
): number {
  const kitId = maybeInstrument === undefined ? DEFAULT_DRUM_KIT_ID : kitIdOrInstrument as DrumKitId;
  const instrument = maybeInstrument ?? kitIdOrInstrument as InstrumentType;
  return getDrumKit(kitId).samples[instrument].length;
}

/** Cache keys always include the kit so equal voice indexes cannot collide. */
export function getSampleKey(instrument: InstrumentType, sampleIndex: number): string;
export function getSampleKey(
  kitId: DrumKitId,
  instrument: InstrumentType,
  sampleIndex: number
): string;
export function getSampleKey(
  kitIdOrInstrument: DrumKitId | InstrumentType,
  instrumentOrIndex: InstrumentType | number,
  maybeSampleIndex?: number
): string {
  return maybeSampleIndex === undefined
    ? `${DEFAULT_DRUM_KIT_ID}:${kitIdOrInstrument}:${instrumentOrIndex}`
    : `${kitIdOrInstrument}:${instrumentOrIndex}:${maybeSampleIndex}`;
}

export function getInstrumentSamples(instrument: InstrumentType): DrumSampleRef[];
export function getInstrumentSamples(
  kitId: DrumKitId,
  instrument: InstrumentType
): DrumSampleRef[];
export function getInstrumentSamples(
  kitIdOrInstrument: DrumKitId | InstrumentType,
  maybeInstrument?: InstrumentType
): DrumSampleRef[] {
  const kitId = maybeInstrument === undefined ? DEFAULT_DRUM_KIT_ID : kitIdOrInstrument as DrumKitId;
  const instrument = maybeInstrument ?? kitIdOrInstrument as InstrumentType;
  return getDrumKit(kitId).samples[instrument]
    .map((_, sampleIndex) => getSample(kitId, instrument, sampleIndex));
}

export const getAllKitSampleRefs = (
  kitId: DrumKitId = DEFAULT_DRUM_KIT_ID
): DrumSampleRef[] => INSTRUMENT_TYPES.flatMap((instrument) =>
  getInstrumentSamples(kitId, instrument)
);

/** Defaults to the original kit for compatibility; pass a kit ID for another kit. */
export const getTotalSampleCount = (
  kitId: DrumKitId = DEFAULT_DRUM_KIT_ID
): number => getAllKitSampleRefs(kitId).length;

export const getAllSamplePaths = (
  kitId: DrumKitId = DEFAULT_DRUM_KIT_ID
): string[] => getAllKitSampleRefs(kitId).map((sample) => sample.path);

export const getAllSamplesMetadata = (
  kitId: DrumKitId = DEFAULT_DRUM_KIT_ID
): Record<InstrumentType, DrumSampleRef[]> => ({
  kick: getInstrumentSamples(kitId, 'kick'),
  snare: getInstrumentSamples(kitId, 'snare'),
  hat: getInstrumentSamples(kitId, 'hat'),
  tom: getInstrumentSamples(kitId, 'tom')
});
