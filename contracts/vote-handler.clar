;; vote-handler.clar
;; Governance and proposal voting for AdStack platform
;; Registered users can create proposals and cast votes to influence
;; platform parameters, fee structures, and policy changes.

;; --- Constants ---

(define-constant CONTRACT_OWNER tx-sender)
(define-constant CONTRACT_VERSION "4.0.0")
(define-constant ERR_NOT_AUTHORIZED (err u400))
(define-constant ERR_PROPOSAL_NOT_FOUND (err u401))
(define-constant ERR_ALREADY_VOTED (err u402))
(define-constant ERR_VOTING_CLOSED (err u403))
(define-constant ERR_INVALID_TITLE (err u404))
(define-constant ERR_INVALID_DESCRIPTION (err u405))
(define-constant ERR_INVALID_DURATION (err u406))
(define-constant ERR_PROPOSAL_ALREADY_EXECUTED (err u407))
(define-constant ERR_QUORUM_NOT_MET (err u408))
(define-constant ERR_NOT_REGISTERED (err u409))
(define-constant ERR_PROPOSAL_LIMIT_REACHED (err u410))

;; Maximum active proposals per proposer to prevent spam
(define-constant MAX_ACTIVE_PROPOSALS_PER_USER u5)

;; Proposal status
(define-constant STATUS_ACTIVE u1)
(define-constant STATUS_PASSED u2)
(define-constant STATUS_REJECTED u3)
(define-constant STATUS_EXECUTED u4)
(define-constant STATUS_CANCELLED u5)

;; Constraints
(define-constant MAX_TITLE_LENGTH u64)
(define-constant MAX_DESCRIPTION_LENGTH u256)
(define-constant MIN_VOTING_PERIOD u144) ;; ~1 day
(define-constant MAX_VOTING_PERIOD u4320) ;; ~30 days
(define-constant QUORUM_THRESHOLD u10) ;; Minimum 10 votes for quorum
(define-constant MIN_PASSING_MARGIN u2) ;; Must win by at least 2 votes

;; --- Data Variables ---

(define-data-var proposal-nonce uint u0)
(define-data-var total-proposals uint u0)
(define-data-var governance-paused bool false)

;; --- Data Maps ---

(define-map proposals
  { proposal-id: uint }
  {
    proposer: principal,
    title: (string-ascii 64),
    description: (string-ascii 256),
    votes-for: uint,
    votes-against: uint,
    total-voters: uint,
    start-height: uint,
    end-height: uint,
    status: uint,
    created-at: uint,
    executed-at: uint,
  }
)

;; Track individual votes
(define-map votes
  { proposal-id: uint, voter: principal }
  { in-favor: bool, voted-at: uint }
)

;; Track proposer activity
(define-map proposer-counts
  { proposer: principal }
  { count: uint }
)

;; --- Private Functions ---

(define-private (is-contract-owner)
  (is-eq tx-sender CONTRACT_OWNER)
)

(define-private (increment-proposal-nonce)
  (let ((current (var-get proposal-nonce)))
    (var-set proposal-nonce (+ current u1))
    current
  )
)

(define-private (is-voting-open (proposal-id uint))
  (match (map-get? proposals { proposal-id: proposal-id })
    proposal (and
      (is-eq (get status proposal) STATUS_ACTIVE)
      (<= stacks-block-height (get end-height proposal))
    )
    false
  )
)

;; --- Read-Only Functions ---

(define-read-only (get-proposal (proposal-id uint))
  (map-get? proposals { proposal-id: proposal-id })
)

(define-read-only (get-proposal-count)
  (var-get total-proposals)
)

(define-read-only (get-proposal-status (proposal-id uint))
  (match (map-get? proposals { proposal-id: proposal-id })
    proposal (ok (get status proposal))
    ERR_PROPOSAL_NOT_FOUND
  )
)

(define-read-only (get-vote (proposal-id uint) (voter principal))
  (map-get? votes { proposal-id: proposal-id, voter: voter })
)

(define-read-only (has-voted (proposal-id uint) (voter principal))
  (is-some (map-get? votes { proposal-id: proposal-id, voter: voter }))
)

(define-read-only (get-vote-tally (proposal-id uint))
  (match (map-get? proposals { proposal-id: proposal-id })
    proposal (ok {
      votes-for: (get votes-for proposal),
      votes-against: (get votes-against proposal),
      total-voters: (get total-voters proposal),
    })
    ERR_PROPOSAL_NOT_FOUND
  )
)

(define-read-only (is-governance-paused)
  (var-get governance-paused)
)

(define-read-only (get-proposer-count (proposer principal))
  (default-to { count: u0 } (map-get? proposer-counts { proposer: proposer }))
)

(define-read-only (get-contract-version)
  CONTRACT_VERSION
)

;; --- Public Functions ---

;; Create a new governance proposal
(define-public (create-proposal
    (title (string-ascii 64))
    (description (string-ascii 256))
    (duration uint))
  (let (
    (proposal-id (increment-proposal-nonce))
    (end-block (+ stacks-block-height duration))
    (proposer-count (get count (get-proposer-count tx-sender)))
  )
    ;; Validations
    (asserts! (not (var-get governance-paused)) ERR_NOT_AUTHORIZED)
    (asserts! (> (len title) u0) ERR_INVALID_TITLE)
    (asserts! (<= (len title) MAX_TITLE_LENGTH) ERR_INVALID_TITLE)
    (asserts! (> (len description) u0) ERR_INVALID_DESCRIPTION)
    (asserts! (<= (len description) MAX_DESCRIPTION_LENGTH) ERR_INVALID_DESCRIPTION)
    (asserts! (>= duration MIN_VOTING_PERIOD) ERR_INVALID_DURATION)
    (asserts! (<= duration MAX_VOTING_PERIOD) ERR_INVALID_DURATION)

    ;; Create proposal
    (map-set proposals
      { proposal-id: proposal-id }
      {
        proposer: tx-sender,
        title: title,
        description: description,
        votes-for: u0,
        votes-against: u0,
        total-voters: u0,
        start-height: stacks-block-height,
        end-height: end-block,
        status: STATUS_ACTIVE,
        created-at: stacks-block-height,
        executed-at: u0,
      }
    )

    ;; Update proposer count
    (map-set proposer-counts
      { proposer: tx-sender }
      { count: (+ proposer-count u1) }
    )
    (var-set total-proposals (+ (var-get total-proposals) u1))

    (print {
      event: "proposal-created",
      proposal-id: proposal-id,
      proposer: tx-sender,
      title: title,
      duration: duration,
      timestamp: stacks-block-time,
    })

    (ok proposal-id)
  )
)

;; Cast a vote on an active proposal
(define-public (cast-vote (proposal-id uint) (in-favor bool))
  (let (
    (proposal (unwrap! (map-get? proposals { proposal-id: proposal-id }) ERR_PROPOSAL_NOT_FOUND))
  )
    ;; Governance must not be paused
    (asserts! (not (var-get governance-paused)) ERR_NOT_AUTHORIZED)
    ;; Voting must be open
    (asserts! (is-eq (get status proposal) STATUS_ACTIVE) ERR_VOTING_CLOSED)
    (asserts! (<= stacks-block-height (get end-height proposal)) ERR_VOTING_CLOSED)
    ;; Cannot vote twice
    (asserts! (not (has-voted proposal-id tx-sender)) ERR_ALREADY_VOTED)

    ;; Record vote
    (map-set votes
      { proposal-id: proposal-id, voter: tx-sender }
      { in-favor: in-favor, voted-at: stacks-block-height }
    )

    ;; Update tally
    (map-set proposals
      { proposal-id: proposal-id }
      (merge proposal {
        votes-for: (if in-favor
          (+ (get votes-for proposal) u1)
          (get votes-for proposal)
        ),
        votes-against: (if (not in-favor)
          (+ (get votes-against proposal) u1)
          (get votes-against proposal)
        ),
        total-voters: (+ (get total-voters proposal) u1),
      })
    )

    (print {
      event: "vote-cast",
      proposal-id: proposal-id,
      voter: tx-sender,
      in-favor: in-favor,
      timestamp: stacks-block-time,
    })

    (ok true)
  )
)

;; Finalize a proposal after voting period ends
;; Anyone can call this to resolve an expired proposal
(define-public (finalize-proposal (proposal-id uint))
  (let (
    (proposal (unwrap! (map-get? proposals { proposal-id: proposal-id }) ERR_PROPOSAL_NOT_FOUND))
  )
    (asserts! (is-eq (get status proposal) STATUS_ACTIVE) ERR_VOTING_CLOSED)
    (asserts! (> stacks-block-height (get end-height proposal)) ERR_VOTING_CLOSED)

    (let (
      (new-status (if (and
        (>= (get total-voters proposal) QUORUM_THRESHOLD)
        (> (get votes-for proposal) (get votes-against proposal))
        (>= (- (get votes-for proposal) (get votes-against proposal)) MIN_PASSING_MARGIN)
      )
        STATUS_PASSED
        STATUS_REJECTED
      ))
    )
      (map-set proposals
        { proposal-id: proposal-id }
        (merge proposal { status: new-status })
      )

      (print {
        event: "proposal-finalized",
        proposal-id: proposal-id,
        status: new-status,
        votes-for: (get votes-for proposal),
        votes-against: (get votes-against proposal),
        total-voters: (get total-voters proposal),
        quorum-met: (>= (get total-voters proposal) QUORUM_THRESHOLD),
        timestamp: stacks-block-time,
      })

      (ok new-status)
    )
  )
)

;; Mark a passed proposal as executed (admin only)
(define-public (execute-proposal (proposal-id uint))
  (let (
    (proposal (unwrap! (map-get? proposals { proposal-id: proposal-id }) ERR_PROPOSAL_NOT_FOUND))
  )
    (asserts! (is-contract-owner) ERR_NOT_AUTHORIZED)
    (asserts! (is-eq (get status proposal) STATUS_PASSED) ERR_PROPOSAL_ALREADY_EXECUTED)

    (map-set proposals
      { proposal-id: proposal-id }
      (merge proposal {
        status: STATUS_EXECUTED,
        executed-at: stacks-block-height,
      })
    )

    (print {
      event: "proposal-executed",
      proposal-id: proposal-id,
      timestamp: stacks-block-time,
    })

    (ok true)
  )
)

;; Cancel a proposal (proposer or admin)
(define-public (cancel-proposal (proposal-id uint))
  (let (
    (proposal (unwrap! (map-get? proposals { proposal-id: proposal-id }) ERR_PROPOSAL_NOT_FOUND))
  )
    (asserts! (or
      (is-eq tx-sender (get proposer proposal))
      (is-contract-owner)
    ) ERR_NOT_AUTHORIZED)
    (asserts! (is-eq (get status proposal) STATUS_ACTIVE) ERR_VOTING_CLOSED)

    (map-set proposals
      { proposal-id: proposal-id }
      (merge proposal { status: STATUS_CANCELLED })
    )

    (print {
      event: "proposal-cancelled",
      proposal-id: proposal-id,
      timestamp: stacks-block-time,
    })

    (ok true)
  )
)

;; --- Admin Functions ---

;; Pause/unpause governance
(define-public (set-governance-paused (paused bool))
  (begin
    (asserts! (is-contract-owner) ERR_NOT_AUTHORIZED)
    (var-set governance-paused paused)
    (print { event: "governance-pause-toggled", paused: paused, timestamp: stacks-block-time })
    (ok true)
  )
)
