// useAccountTokens: fetch FT and NFT holdings for a Stacks address
import { useState, useEffect, useCallback } from 'react';

export interface FtBalance {
  balance: string;
  total_sent: string;
  total_received: string;
}
