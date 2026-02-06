"""
Merkle Tree Implementation
For generating cryptographic proofs of fraud predictions
"""

import hashlib
from typing import List, Tuple, Optional


class MerkleTree:
    """
    Merkle Tree for generating cryptographic proofs
    """

    def __init__(self, leaves: List[str]):
        """
        Initialize Merkle tree with leaf data

        Args:
            leaves: List of leaf data strings
        """
        if not leaves:
            raise ValueError("Cannot create Merkle tree with empty leaves")

        self.leaves = leaves
        self.leaf_hashes = [self._hash(leaf) for leaf in leaves]
        self.tree = self._build_tree(self.leaf_hashes)
        self.root = self.tree[-1][0] if self.tree else None

    def _hash(self, data: str) -> str:
        """
        Hash data using SHA256

        Args:
            data: String data to hash

        Returns:
            Hexadecimal hash string
        """
        return hashlib.sha256(data.encode()).hexdigest()

    def _hash_pair(self, left: str, right: str) -> str:
        """
        Hash a pair of hashes together

        Args:
            left: Left hash
            right: Right hash

        Returns:
            Combined hash
        """
        # Concatenate and hash
        combined = left + right
        return self._hash(combined)

    def _build_tree(self, hashes: List[str]) -> List[List[str]]:
        """
        Build Merkle tree from leaf hashes

        Args:
            hashes: List of leaf hashes

        Returns:
            Complete Merkle tree as list of levels
        """
        if not hashes:
            return []

        tree = [hashes[:]]  # Copy leaf level

        current_level = hashes
        while len(current_level) > 1:
            next_level = []

            # Process pairs
            for i in range(0, len(current_level), 2):
                left = current_level[i]

                # If odd number, duplicate last hash
                if i + 1 < len(current_level):
                    right = current_level[i + 1]
                else:
                    right = left

                parent = self._hash_pair(left, right)
                next_level.append(parent)

            tree.append(next_level)
            current_level = next_level

        return tree

    def get_root(self) -> str:
        """
        Get Merkle root hash

        Returns:
            Root hash
        """
        return self.root

    def get_proof(self, leaf_index: int) -> List[Tuple[str, str]]:
        """
        Generate Merkle proof for a leaf

        Args:
            leaf_index: Index of leaf to prove

        Returns:
            List of (hash, position) tuples for proof
            Position is 'left' or 'right'
        """
        if leaf_index < 0 or leaf_index >= len(self.leaf_hashes):
            raise ValueError(f"Invalid leaf index: {leaf_index}")

        proof = []
        current_index = leaf_index

        # Traverse tree from leaf to root
        for level in range(len(self.tree) - 1):
            current_level = self.tree[level]
            is_right = current_index % 2 == 1

            if is_right:
                # Sibling is on the left
                sibling_index = current_index - 1
                proof.append((current_level[sibling_index], 'left'))
            else:
                # Sibling is on the right
                sibling_index = current_index + 1
                if sibling_index < len(current_level):
                    proof.append((current_level[sibling_index], 'right'))
                else:
                    # Odd number of nodes, duplicate self
                    proof.append((current_level[current_index], 'right'))

            # Move to parent index
            current_index = current_index // 2

        return proof

    def verify_proof(
        self,
        leaf_data: str,
        proof: List[Tuple[str, str]],
        root: Optional[str] = None
    ) -> bool:
        """
        Verify a Merkle proof

        Args:
            leaf_data: Original leaf data
            proof: Merkle proof as list of (hash, position) tuples
            root: Expected root hash (uses tree root if not provided)

        Returns:
            True if proof is valid
        """
        if root is None:
            root = self.root

        # Start with leaf hash
        current_hash = self._hash(leaf_data)

        # Apply proof elements
        for sibling_hash, position in proof:
            if position == 'left':
                current_hash = self._hash_pair(sibling_hash, current_hash)
            else:
                current_hash = self._hash_pair(current_hash, sibling_hash)

        return current_hash == root

    def get_proof_hex(self, leaf_index: int) -> List[str]:
        """
        Get proof as list of hex strings (for blockchain)

        Args:
            leaf_index: Index of leaf to prove

        Returns:
            List of hex hashes for proof
        """
        proof = self.get_proof(leaf_index)
        return [hash_val for hash_val, _ in proof]

    def to_dict(self) -> dict:
        """
        Export tree structure to dictionary

        Returns:
            Tree data as dictionary
        """
        return {
            'leaves': self.leaves,
            'leaf_hashes': self.leaf_hashes,
            'root': self.root,
            'tree_depth': len(self.tree),
            'leaf_count': len(self.leaves)
        }


def create_fraud_proof(
    campaign_id: int,
    publisher_id: str,
    impressions: int,
    clicks: int,
    fraud_score: float,
    timestamp: int
) -> Tuple[str, List[str]]:
    """
    Create Merkle proof for fraud prediction

    Args:
        campaign_id: Campaign ID
        publisher_id: Publisher address
        impressions: Number of impressions
        clicks: Number of clicks
        fraud_score: Predicted fraud score
        timestamp: Prediction timestamp

    Returns:
        Tuple of (merkle_root, proof_elements)
    """
    # Create leaf data
    leaves = [
        f"campaign:{campaign_id}",
        f"publisher:{publisher_id}",
        f"impressions:{impressions}",
        f"clicks:{clicks}",
        f"fraud_score:{fraud_score:.4f}",
        f"timestamp:{timestamp}"
    ]

    # Build tree
    tree = MerkleTree(leaves)

    # Get proof for fraud score (leaf index 4)
    proof = tree.get_proof_hex(4)

    return tree.get_root(), proof


def verify_fraud_proof(
    fraud_score_leaf: str,
    proof: List[str],
    expected_root: str
) -> bool:
    """
    Verify fraud prediction proof

    Args:
        fraud_score_leaf: Fraud score leaf data
        proof: List of proof hashes
        expected_root: Expected Merkle root

    Returns:
        True if proof is valid
    """
    # Create tree with dummy leaves to get structure
    dummy_leaves = [''] * (len(proof) + 1)
    tree = MerkleTree(dummy_leaves)

    # Convert proof to required format
    proof_tuples = []
    for i, hash_val in enumerate(proof):
        position = 'left' if i % 2 == 0 else 'right'
        proof_tuples.append((hash_val, position))

    # Verify
    return tree.verify_proof(fraud_score_leaf, proof_tuples, expected_root)
