// Unit tests for Clarity value factories
import { describe, it, expect } from 'vitest';
import { makeUint, makeInt, makeBool, makePrincipal, makeNone, makeSome } from '../lib/clarity-v4/clarity-primitives';
