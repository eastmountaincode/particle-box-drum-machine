# Oberheim DMX

Samples from SV Modular / Jerry Sievert's DrumKit collection, distributed under
CC0 1.0 Universal. See LICENSE.txt for the source project's CC0 text.

- Source: https://github.com/SVModular/DrumKit/tree/58755a32837522a64b6b886b764dbefc9a2b8fd3/res/samples/dmx
- License: https://github.com/SVModular/DrumKit/blob/58755a32837522a64b6b886b764dbefc9a2b8fd3/LICENSE.txt
- Module documentation: https://library.vcvrack.com/DrumKit/DMX

The upstream samples are mono, little-endian 32-bit floats at 44,100 Hz, with
amplitudes scaled to modular-synth voltage (up to +/-5). Conversion divides
amplitudes by 5 and writes 24-bit signed PCM WAV at the original sample rate.
No time stretching, trimming, EQ, or per-sample normalization is applied.
The sample rate is specified in upstream src/model/SampleManager.hpp.

Upstream filenames are numbered. Track categories were chosen by comparing
waveforms and spectra with labelled DMX reference sounds. Hat variations retain
neutral numbered labels rather than claiming open/closed articulations.

| Upstream file | WAV file | Track |
| --- | --- | --- |
| 11.raw | kick.wav | Kick |
| 12.raw | snare.wav | Snare |
| 04.raw | clap.wav | Snare |
| 01.raw | hi-hat-1.wav | Hat |
| 07.raw | hi-hat-2.wav | Hat |
| 08.raw | hi-hat-3.wav | Hat |
| 02.raw | crash.wav | Hat |
| 10.raw | tom.wav | Tom/percussion |
| 03.raw | cabasa.wav | Tom/percussion |
| 09.raw | rimshot.wav | Tom/percussion |

Files 05.raw and 06.raw are not included in this selection.
