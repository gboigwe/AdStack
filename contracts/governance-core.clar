;; governance-core.clar
;; Core governance contract for proposal creation, voting, and execution

;; Constants
(define-constant CONTRACT_OWNER tx-sender)
(define-constant ERR_UNAUTHORIZED (err u9000))
(define-constant ERR_PROPOSAL_NOT_FOUND (err u9001))
(define-constant ERR_ALREADY_VOTED (err u9002))
(define-constant ERR_VOTING_CLOSED (err u9003))
(define-constant ERR_QUORUM_NOT_MET (err u9004))
(define-constant ERR_PROPOSAL_FAILED (err u9005))
(define-constant ERR_INVALID_PARAMS (err u9006))
(define-constant ERR_ALREADY_EXECUTED (err u9007))

;; Proposal states
(define-constant STATE_PENDING u0)
(define-constant STATE_ACTIVE u1)
(define-constant STATE_SUCCEEDED u2)
(define-constant STATE_DEFEATED u3)
(define-constant STATE_EXECUTED u4)
(define-constant STATE_CANCELLED u5)

;; Governance parameters
(define-data-var proposal-threshold uint u100000) ;; Min tokens to create proposal
(define-data-var quorum-percentage uint u40) ;; 40% quorum required
(define-data-var voting-period uint u4320) ;; ~30 days in blocks
(define-data-var execution-delay uint u1440) ;; ~10 days delay

;; Data variables
(define-data-var proposal-nonce uint u0)
(define-data-var total-voting-power uint u0)

;; Proposal data
(define-map proposals
  { proposal-id: uint }
  {
    proposer: principal,
    title: (string-utf8 256),
    description: (string-utf8 2048),
    state: uint,
    for-votes: uint,
    against-votes: uint,
    abstain-votes: uint,
    start-block: uint,
    end-block: uint,
    execution-delay-end: uint,
    created-at: uint,
    executed-at: (optional uint),
    contract-call: (optional {
      contract-address: principal,
      function-name: (string-ascii 128),
      function-args: (list 10 (buff 128))
    })
  }
)

;; Vote records
(define-map votes
  { proposal-id: uint, voter: principal }
  {
    vote-weight: uint,
    support: uint, ;; 0=against, 1=for, 2=abstain
    cast-at: uint
  }
)

;; Voter power snapshots
(define-map voter-power-at-block
  { voter: principal, block-height: uint }
  { voting-power: uint }
)

;; Proposal execution queue
(define-map execution-queue
  { proposal-id: uint }
  {
    queued: bool,
    queued-at: uint,
    executed: bool
  }
)

;; Authorization
(define-read-only (is-contract-owner)
  (is-eq tx-sender CONTRACT_OWNER)
)

;; Create proposal
(define-public (create-proposal
  (title (string-utf8 256))
  (description (string-utf8 2048))
  (contract-call-data (optional {
    contract-address: principal,
    function-name: (string-ascii 128),
    function-args: (list 10 (buff 128))
  }))
)
  (let
    (
      (proposal-id (+ (var-get proposal-nonce) u1))
      (proposer-power (get-voting-power tx-sender))
      (start-block (+ stacks-block-height u1))
      (end-block (+ start-block (var-get voting-period)))
      (delay-end (+ end-block (var-get execution-delay)))
    )
    ;; Validate proposer has enough tokens
    (asserts! (>= proposer-power (var-get proposal-threshold)) ERR_UNAUTHORIZED)

    ;; Create proposal
    (map-set proposals
      { proposal-id: proposal-id }
      {
        proposer: tx-sender,
        title: title,
        description: description,
        state: STATE_PENDING,
        for-votes: u0,
        against-votes: u0,
        abstain-votes: u0,
        start-block: start-block,
        end-block: end-block,
        execution-delay-end: delay-end,
        created-at: stacks-block-time,
        executed-at: none,
        contract-call: contract-call-data
      }
    )

    ;; Initialize execution queue
    (map-set execution-queue
      { proposal-id: proposal-id }
      {
        queued: false,
        queued-at: u0,
        executed: false
      }
    )

    ;; Increment nonce
    (var-set proposal-nonce proposal-id)

    (ok proposal-id)
  )
)

;; Cast vote
(define-public (cast-vote (proposal-id uint) (support uint))
  (let
    (
      (proposal (unwrap! (get-proposal proposal-id) ERR_PROPOSAL_NOT_FOUND))
      (existing-vote (map-get? votes { proposal-id: proposal-id, voter: tx-sender }))
      (voter-weight (get-voting-power tx-sender))
      (current-for (get for-votes proposal))
      (current-against (get against-votes proposal))
      (current-abstain (get abstain-votes proposal))
    )
    ;; Validate voting is active
    (asserts! (>= stacks-block-height (get start-block proposal)) ERR_VOTING_CLOSED)
    (asserts! (<= stacks-block-height (get end-block proposal)) ERR_VOTING_CLOSED)
    (asserts! (is-none existing-vote) ERR_ALREADY_VOTED)
    (asserts! (<= support u2) ERR_INVALID_PARAMS)

    ;; Record vote
    (map-set votes
      { proposal-id: proposal-id, voter: tx-sender }
      {
        vote-weight: voter-weight,
        support: support,
        cast-at: stacks-block-time
      }
    )

    ;; Update vote tallies
    (map-set proposals
      { proposal-id: proposal-id }
      (merge proposal {
        for-votes: (if (is-eq support u1) (+ current-for voter-weight) current-for),
        against-votes: (if (is-eq support u0) (+ current-against voter-weight) current-against),
        abstain-votes: (if (is-eq support u2) (+ current-abstain voter-weight) current-abstain)
      })
    )

    (ok true)
  )
)

;; Queue proposal for execution
(define-public (queue-proposal (proposal-id uint))
  (let
    (
      (proposal (unwrap! (get-proposal proposal-id) ERR_PROPOSAL_NOT_FOUND))
      (queue-entry (unwrap! (map-get? execution-queue { proposal-id: proposal-id }) ERR_PROPOSAL_NOT_FOUND))
    )
    ;; Validate proposal succeeded
    (asserts! (>= stacks-block-height (get end-block proposal)) ERR_VOTING_CLOSED)
    (asserts! (not (get queued queue-entry)) ERR_ALREADY_EXECUTED)

    ;; Check if proposal passed
    (let
      (
        (total-votes (+ (+ (get for-votes proposal) (get against-votes proposal)) (get abstain-votes proposal)))
        (quorum-required (/ (* (var-get total-voting-power) (var-get quorum-percentage)) u100))
        (passed (> (get for-votes proposal) (get against-votes proposal)))
        (quorum-met (>= total-votes quorum-required))
      )
      (asserts! quorum-met ERR_QUORUM_NOT_MET)
      (asserts! passed ERR_PROPOSAL_FAILED)

      ;; Queue for execution
      (map-set execution-queue
        { proposal-id: proposal-id }
        {
          queued: true,
          queued-at: stacks-block-time,
          executed: false
        }
      )

      ;; Update proposal state
      (map-set proposals
        { proposal-id: proposal-id }
        (merge proposal { state: STATE_SUCCEEDED })
      )

      (ok true)
    )
  )
)

;; Execute proposal
(define-public (execute-proposal (proposal-id uint))
  (let
    (
      (proposal (unwrap! (get-proposal proposal-id) ERR_PROPOSAL_NOT_FOUND))
      (queue-entry (unwrap! (map-get? execution-queue { proposal-id: proposal-id }) ERR_PROPOSAL_NOT_FOUND))
    )
    ;; Validate execution conditions
    (asserts! (get queued queue-entry) ERR_UNAUTHORIZED)
    (asserts! (not (get executed queue-entry)) ERR_ALREADY_EXECUTED)
    (asserts! (>= stacks-block-height (get execution-delay-end proposal)) ERR_VOTING_CLOSED)

    ;; Mark as executed
    (map-set execution-queue
      { proposal-id: proposal-id }
      (merge queue-entry { executed: true })
    )

    (map-set proposals
      { proposal-id: proposal-id }
      (merge proposal {
        state: STATE_EXECUTED,
        executed-at: (some stacks-block-time)
      })
    )

    ;; TODO: Execute contract call if provided
    ;; This would require dynamic contract calling which is complex in Clarity

    (ok true)
  )
)

;; Cancel proposal (only by proposer or governance)
(define-public (cancel-proposal (proposal-id uint))
  (let
    (
      (proposal (unwrap! (get-proposal proposal-id) ERR_PROPOSAL_NOT_FOUND))
    )
    (asserts! (or
      (is-eq tx-sender (get proposer proposal))
      (is-contract-owner)
    ) ERR_UNAUTHORIZED)

    (map-set proposals
      { proposal-id: proposal-id }
      (merge proposal { state: STATE_CANCELLED })
    )

    (ok true)
  )
)

;; Update governance parameters (only via governance)
(define-public (update-proposal-threshold (new-threshold uint))
  (begin
    (asserts! (is-contract-owner) ERR_UNAUTHORIZED)
    (var-set proposal-threshold new-threshold)
    (ok true)
  )
)

(define-public (update-quorum-percentage (new-percentage uint))
  (begin
    (asserts! (is-contract-owner) ERR_UNAUTHORIZED)
    (asserts! (<= new-percentage u100) ERR_INVALID_PARAMS)
    (var-set quorum-percentage new-percentage)
    (ok true)
  )
)

(define-public (update-voting-period (new-period uint))
  (begin
    (asserts! (is-contract-owner) ERR_UNAUTHORIZED)
    (var-set voting-period new-period)
    (ok true)
  )
)

(define-public (update-total-voting-power (new-total uint))
  (begin
    (asserts! (is-contract-owner) ERR_UNAUTHORIZED)
    (var-set total-voting-power new-total)
    (ok true)
  )
)

;; Helper: Get voting power (stub - to be integrated with governance token)
(define-private (get-voting-power (voter principal))
  ;; TODO: Integrate with governance-token contract
  u1000000 ;; Placeholder: 1M voting power
)

;; Read-only functions
(define-read-only (get-proposal (proposal-id uint))
  (map-get? proposals { proposal-id: proposal-id })
)

(define-read-only (get-vote (proposal-id uint) (voter principal))
  (map-get? votes { proposal-id: proposal-id, voter: voter })
)

(define-read-only (get-proposal-state (proposal-id uint))
  (match (get-proposal proposal-id)
    proposal (ok (get state proposal))
    ERR_PROPOSAL_NOT_FOUND
  )
)

(define-read-only (get-vote-results (proposal-id uint))
  (match (get-proposal proposal-id)
    proposal (ok {
      for: (get for-votes proposal),
      against: (get against-votes proposal),
      abstain: (get abstain-votes proposal),
      total: (+ (+ (get for-votes proposal) (get against-votes proposal)) (get abstain-votes proposal))
    })
    ERR_PROPOSAL_NOT_FOUND
  )
)

(define-read-only (get-execution-status (proposal-id uint))
  (map-get? execution-queue { proposal-id: proposal-id })
)

(define-read-only (get-governance-params))
  (ok {
    proposal-threshold: (var-get proposal-threshold),
    quorum-percentage: (var-get quorum-percentage),
    voting-period: (var-get voting-period),
    execution-delay: (var-get execution-delay),
    total-voting-power: (var-get total-voting-power)
  })
)

(define-read-only (can-execute (proposal-id uint))
  (match (get-proposal proposal-id)
    proposal
      (match (get-execution-status proposal-id)
        queue
          (ok (and
            (get queued queue)
            (not (get executed queue))
            (>= stacks-block-height (get execution-delay-end proposal))
          ))
        (ok false)
      )
    ERR_PROPOSAL_NOT_FOUND
  )
)

(define-read-only (get-current-nonce)
  (ok (var-get proposal-nonce))
)
