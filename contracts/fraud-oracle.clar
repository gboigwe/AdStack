;; AI-Powered Fraud Detection Oracle
;; Integrates off-chain ML models with on-chain verification

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-invalid-oracle (err u101))
(define-constant err-invalid-proof (err u102))
(define-constant err-expired-data (err u103))
(define-constant err-unauthorized (err u104))
(define-constant err-already-flagged (err u105))
(define-constant err-not-found (err u106))

;; Data validity period (in blocks)
(define-constant data-validity-blocks u144) ;; ~24 hours

;; Data Variables
(define-data-var oracle-admin principal contract-owner)
(define-data-var model-version uint u1)
(define-data-var min-confidence-threshold uint u85) ;; 85% minimum confidence

;; Oracle Data Maps
(define-map authorized-oracles principal bool)

;; Fraud prediction records
(define-map fraud-predictions
  { campaign-id: uint, publisher-id: principal }
  {
    fraud-score: uint,          ;; 0-100 scale
    confidence: uint,           ;; 0-100 scale
    risk-level: (string-ascii 16), ;; "low", "medium", "high", "critical"
    prediction-block: uint,
    model-version: uint,
    features-hash: (buff 32),   ;; Hash of input features
    merkle-root: (buff 32),     ;; Merkle root for proof verification
    is-fraud: bool,
    verified: bool
  }
)

;; ML model metadata
(define-map model-metadata
  uint ;; version
  {
    accuracy: uint,             ;; 0-100 scale
    precision: uint,            ;; 0-100 scale
    recall: uint,               ;; 0-100 scale
    f1-score: uint,             ;; 0-100 scale
    deployment-block: uint,
    ipfs-hash: (string-ascii 64),
    active: bool
  }
)

;; Fraud flags and actions
(define-map fraud-flags
  { campaign-id: uint, publisher-id: principal }
  {
    flagged-at: uint,
    fraud-score: uint,
    action-taken: (string-ascii 32), ;; "warning", "suspended", "banned"
    auto-flagged: bool,
    reviewed: bool,
    reviewer: (optional principal)
  }
)

;; Verification proofs for fraud predictions
(define-map verification-proofs
  { campaign-id: uint, publisher-id: principal }
  {
    merkle-proof: (list 10 (buff 32)),
    leaf-data: (buff 256),
    verified-at: uint
  }
)

;; Historical fraud statistics
(define-map campaign-fraud-stats
  uint ;; campaign-id
  {
    total-predictions: uint,
    fraud-detected: uint,
    false-positives: uint,
    true-positives: uint,
    last-updated: uint
  }
)

;; Publisher fraud history
(define-map publisher-fraud-history
  principal
  {
    total-flags: uint,
    confirmed-fraud: uint,
    false-flags: uint,
    risk-score: uint,           ;; Cumulative risk 0-100
    last-incident: uint,
    is-blacklisted: bool
  }
)

;; Admin Functions

;; Set oracle admin
(define-public (set-oracle-admin (new-admin principal))
  (begin
    (asserts! (is-eq tx-sender (var-get oracle-admin)) err-owner-only)
    (ok (var-set oracle-admin new-admin))
  )
)

;; Authorize oracle
(define-public (authorize-oracle (oracle principal))
  (begin
    (asserts! (is-eq tx-sender (var-get oracle-admin)) err-owner-only)
    (ok (map-set authorized-oracles oracle true))
  )
)

;; Revoke oracle
(define-public (revoke-oracle (oracle principal))
  (begin
    (asserts! (is-eq tx-sender (var-get oracle-admin)) err-owner-only)
    (ok (map-delete authorized-oracles oracle))
  )
)

;; Update model version
(define-public (deploy-model
  (version uint)
  (accuracy uint)
  (precision uint)
  (recall uint)
  (f1-score uint)
  (ipfs-hash (string-ascii 64))
)
  (begin
    (asserts! (is-eq tx-sender (var-get oracle-admin)) err-owner-only)
    (map-set model-metadata version {
      accuracy: accuracy,
      precision: precision,
      recall: recall,
      f1-score: f1-score,
      deployment-block: block-height,
      ipfs-hash: ipfs-hash,
      active: true
    })
    (var-set model-version version)
    (ok version)
  )
)

;; Oracle Functions

;; Submit fraud prediction from ML model
(define-public (submit-fraud-prediction
  (campaign-id uint)
  (publisher-id principal)
  (fraud-score uint)
  (confidence uint)
  (risk-level (string-ascii 16))
  (features-hash (buff 32))
  (merkle-root (buff 32))
)
  (let
    (
      (is-fraud (>= fraud-score (var-get min-confidence-threshold)))
    )
    (asserts! (is-authorized-oracle tx-sender) err-unauthorized)
    (asserts! (<= fraud-score u100) err-invalid-oracle)
    (asserts! (<= confidence u100) err-invalid-oracle)

    ;; Store prediction
    (map-set fraud-predictions
      { campaign-id: campaign-id, publisher-id: publisher-id }
      {
        fraud-score: fraud-score,
        confidence: confidence,
        risk-level: risk-level,
        prediction-block: block-height,
        model-version: (var-get model-version),
        features-hash: features-hash,
        merkle-root: merkle-root,
        is-fraud: is-fraud,
        verified: false
      }
    )

    ;; Auto-flag if high confidence fraud detected
    (if (and is-fraud (>= confidence u90))
      (try! (auto-flag-fraud campaign-id publisher-id fraud-score))
      true
    )

    ;; Update statistics
    (update-campaign-stats campaign-id is-fraud)

    (ok is-fraud)
  )
)

;; Verify prediction with Merkle proof
(define-public (verify-prediction
  (campaign-id uint)
  (publisher-id principal)
  (merkle-proof (list 10 (buff 32)))
  (leaf-data (buff 256))
)
  (let
    (
      (prediction (unwrap! (get-fraud-prediction campaign-id publisher-id) err-not-found))
      (merkle-root (get merkle-root prediction))
      (computed-root (compute-merkle-root leaf-data merkle-proof))
    )
    ;; Verify Merkle proof
    (asserts! (is-eq computed-root merkle-root) err-invalid-proof)

    ;; Mark as verified
    (map-set fraud-predictions
      { campaign-id: campaign-id, publisher-id: publisher-id }
      (merge prediction { verified: true })
    )

    ;; Store verification proof
    (map-set verification-proofs
      { campaign-id: campaign-id, publisher-id: publisher-id }
      {
        merkle-proof: merkle-proof,
        leaf-data: leaf-data,
        verified-at: block-height
      }
    )

    (ok true)
  )
)

;; Manual fraud flag (admin/reviewer)
(define-public (flag-fraud
  (campaign-id uint)
  (publisher-id principal)
  (action (string-ascii 32))
)
  (begin
    (asserts! (is-eq tx-sender (var-get oracle-admin)) err-owner-only)
    (asserts! (is-none (get-fraud-flag campaign-id publisher-id)) err-already-flagged)

    (map-set fraud-flags
      { campaign-id: campaign-id, publisher-id: publisher-id }
      {
        flagged-at: block-height,
        fraud-score: u100,
        action-taken: action,
        auto-flagged: false,
        reviewed: true,
        reviewer: (some tx-sender)
      }
    )

    ;; Update publisher history
    (update-publisher-fraud-history publisher-id true)

    (ok true)
  )
)

;; Auto-flag fraud (called internally)
(define-private (auto-flag-fraud
  (campaign-id uint)
  (publisher-id principal)
  (fraud-score uint)
)
  (begin
    (map-set fraud-flags
      { campaign-id: campaign-id, publisher-id: publisher-id }
      {
        flagged-at: block-height,
        fraud-score: fraud-score,
        action-taken: "suspended",
        auto-flagged: true,
        reviewed: false,
        reviewer: none
      }
    )

    ;; Update publisher history
    (update-publisher-fraud-history publisher-id true)

    (ok true)
  )
)

;; Review and confirm/dismiss fraud flag
(define-public (review-fraud-flag
  (campaign-id uint)
  (publisher-id principal)
  (is-confirmed bool)
  (new-action (string-ascii 32))
)
  (let
    (
      (flag (unwrap! (get-fraud-flag campaign-id publisher-id) err-not-found))
    )
    (asserts! (is-eq tx-sender (var-get oracle-admin)) err-owner-only)

    (if is-confirmed
      (begin
        ;; Confirmed fraud
        (map-set fraud-flags
          { campaign-id: campaign-id, publisher-id: publisher-id }
          (merge flag {
            action-taken: new-action,
            reviewed: true,
            reviewer: (some tx-sender)
          })
        )
        (update-fraud-stats campaign-id true true)
      )
      (begin
        ;; False positive
        (map-delete fraud-flags { campaign-id: campaign-id, publisher-id: publisher-id })
        (update-fraud-stats campaign-id true false)
      )
    )

    (ok is-confirmed)
  )
)

;; Blacklist publisher
(define-public (blacklist-publisher (publisher principal))
  (begin
    (asserts! (is-eq tx-sender (var-get oracle-admin)) err-owner-only)

    (match (map-get? publisher-fraud-history publisher)
      history
        (map-set publisher-fraud-history publisher
          (merge history { is-blacklisted: true })
        )
      ;; Create new entry if doesn't exist
      (map-set publisher-fraud-history publisher {
        total-flags: u0,
        confirmed-fraud: u0,
        false-flags: u0,
        risk-score: u100,
        last-incident: block-height,
        is-blacklisted: true
      })
    )

    (ok true)
  )
)

;; Whitelist publisher
(define-public (whitelist-publisher (publisher principal))
  (begin
    (asserts! (is-eq tx-sender (var-get oracle-admin)) err-owner-only)

    (match (map-get? publisher-fraud-history publisher)
      history
        (map-set publisher-fraud-history publisher
          (merge history { is-blacklisted: false, risk-score: u0 })
        )
      true
    )

    (ok true)
  )
)

;; Private Helper Functions

;; Check if oracle is authorized
(define-private (is-authorized-oracle (oracle principal))
  (default-to false (map-get? authorized-oracles oracle))
)

;; Update campaign fraud statistics
(define-private (update-campaign-stats (campaign-id uint) (is-fraud bool))
  (match (map-get? campaign-fraud-stats campaign-id)
    stats
      (map-set campaign-fraud-stats campaign-id {
        total-predictions: (+ (get total-predictions stats) u1),
        fraud-detected: (if is-fraud (+ (get fraud-detected stats) u1) (get fraud-detected stats)),
        false-positives: (get false-positives stats),
        true-positives: (get true-positives stats),
        last-updated: block-height
      })
    ;; Create new entry
    (map-set campaign-fraud-stats campaign-id {
      total-predictions: u1,
      fraud-detected: (if is-fraud u1 u0),
      false-positives: u0,
      true-positives: u0,
      last-updated: block-height
    })
  )
  true
)

;; Update fraud stats after review
(define-private (update-fraud-stats (campaign-id uint) (was-flagged bool) (is-confirmed bool))
  (match (map-get? campaign-fraud-stats campaign-id)
    stats
      (map-set campaign-fraud-stats campaign-id
        (merge stats {
          false-positives: (if (and was-flagged (not is-confirmed))
            (+ (get false-positives stats) u1)
            (get false-positives stats)
          ),
          true-positives: (if (and was-flagged is-confirmed)
            (+ (get true-positives stats) u1)
            (get true-positives stats)
          ),
          last-updated: block-height
        })
      )
    true
  )
  true
)

;; Update publisher fraud history
(define-private (update-publisher-fraud-history (publisher principal) (is-fraud bool))
  (match (map-get? publisher-fraud-history publisher)
    history
      (let
        (
          (new-total-flags (+ (get total-flags history) u1))
          (new-risk-score (calculate-risk-score
            new-total-flags
            (get confirmed-fraud history)
          ))
        )
        (map-set publisher-fraud-history publisher {
          total-flags: new-total-flags,
          confirmed-fraud: (get confirmed-fraud history),
          false-flags: (get false-flags history),
          risk-score: new-risk-score,
          last-incident: block-height,
          is-blacklisted: (get is-blacklisted history)
        })
      )
    ;; Create new entry
    (map-set publisher-fraud-history publisher {
      total-flags: u1,
      confirmed-fraud: u0,
      false-flags: u0,
      risk-score: u30,
      last-incident: block-height,
      is-blacklisted: false
    })
  )
  true
)

;; Calculate risk score based on history
(define-private (calculate-risk-score (total-flags uint) (confirmed-fraud uint))
  (if (is-eq total-flags u0)
    u0
    (let
      (
        (fraud-rate (* (/ (* confirmed-fraud u100) total-flags) u1))
      )
      (if (>= fraud-rate u80) u100
        (if (>= fraud-rate u60) u80
          (if (>= fraud-rate u40) u60
            (if (>= fraud-rate u20) u40 u20)
          )
        )
      )
    )
  )
)

;; Compute Merkle root from leaf and proof
(define-private (compute-merkle-root (leaf (buff 256)) (proof (list 10 (buff 32))))
  (let
    (
      (leaf-hash (sha256 leaf))
    )
    (fold merkle-step proof leaf-hash)
  )
)

;; Merkle proof step
(define-private (merkle-step (proof-element (buff 32)) (current-hash (buff 32)))
  (sha256 (concat current-hash proof-element))
)

;; Read-Only Functions

;; Get fraud prediction
(define-read-only (get-fraud-prediction (campaign-id uint) (publisher-id principal))
  (map-get? fraud-predictions { campaign-id: campaign-id, publisher-id: publisher-id })
)

;; Get fraud flag
(define-read-only (get-fraud-flag (campaign-id uint) (publisher-id principal))
  (map-get? fraud-flags { campaign-id: campaign-id, publisher-id: publisher-id })
)

;; Get publisher fraud history
(define-read-only (get-publisher-history (publisher principal))
  (map-get? publisher-fraud-history publisher)
)

;; Check if publisher is blacklisted
(define-read-only (is-blacklisted (publisher principal))
  (match (map-get? publisher-fraud-history publisher)
    history (get is-blacklisted history)
    false
  )
)

;; Get campaign fraud stats
(define-read-only (get-campaign-stats (campaign-id uint))
  (map-get? campaign-fraud-stats campaign-id)
)

;; Get model metadata
(define-read-only (get-model-info (version uint))
  (map-get? model-metadata version)
)

;; Get current model version
(define-read-only (get-current-model-version)
  (ok (var-get model-version))
)

;; Calculate model accuracy from stats
(define-read-only (calculate-model-accuracy (campaign-id uint))
  (match (map-get? campaign-fraud-stats campaign-id)
    stats
      (let
        (
          (total (get total-predictions stats))
          (tp (get true-positives stats))
          (tn (- total (+ (get fraud-detected stats) (get false-positives stats))))
          (accuracy (if (> total u0)
            (/ (* (+ tp tn) u100) total)
            u0
          ))
        )
        (ok accuracy)
      )
    (ok u0)
  )
)
