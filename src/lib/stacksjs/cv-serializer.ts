// Stacks.js ClarityValue serialization to hex
import type { ClarityValue, UintCV, IntCV, BoolCV, NoneCV, BufferCV, StringAsciiCV, StringUtf8CV } from './clarity-value-factory';

export type SerializedCV = { hex: string; type: string };
