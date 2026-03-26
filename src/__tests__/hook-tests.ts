// Tests for Stacks React hooks
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStacksSession } from '../hooks/useStacksSession';
