// Tests for wallet auth request building
import { describe, it, expect } from 'vitest';
import { buildAuthRequest, parseAuthResponse, extractStxAddress } from '../lib/connect/auth-request';
