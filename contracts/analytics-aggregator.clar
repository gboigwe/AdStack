;; title: analytics-aggregator
;; version: 1.0.0
;; summary: Advanced metrics beyond basic view tracking
;; description: Conversion tracking, ROI calculation, publisher reports, hourly performance, and fraud scoring

;; constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-not-found (err u101))
(define-constant err-unauthorized (err u102))
(define-constant err-invalid-data (err u103))

;; data vars
(define-data-var total-conversions uint u0)
(define-data-var total-revenue uint u0)
(define-data-var total-ad-spend uint u0)

;; data maps
(define-map conversions
    { campaign-id: uint, conversion-id: uint }
    {
        user: principal,
        value: uint,
        conversion-type: (string-ascii 30),
        timestamp: uint,
        attributed-view-id: uint
    }
)

(define-map conversion-count
    { campaign-id: uint }
    {
        total: uint
    }
)

(define-map campaign-roi
    { campaign-id: uint }
    {
        total-spend: uint,
        total-revenue: uint,
        roi-percentage: uint, ;; Multiplied by 100
        conversions: uint,
        last-updated: uint
    }
)

(define-map publisher-reports
    { publisher: principal, period: uint }
    {
        total-views: uint,
        total-earnings: uint,
        avg-cpv: uint,
        quality-score: uint,
        campaigns-participated: uint,
        period-start: uint,
        period-end: uint
    }
)

(define-map hourly-stats
    { campaign-id: uint, hour-block: uint }
    {
        views: uint,
        clicks: uint,
        conversions: uint,
        revenue: uint,
        ctr: uint, ;; Click-through rate * 10000
        cvr: uint  ;; Conversion rate * 10000
    }
)

(define-map retention-metrics
    { campaign-id: uint }
    {
        unique-viewers: uint,
        returning-viewers: uint,
        retention-rate: uint, ;; Percentage * 100
        avg-views-per-user: uint
    }
)

(define-map fraud-scores
    { campaign-id: uint }
    {
        suspicious-views: uint,
        total-views: uint,
        fraud-percentage: uint, ;; * 100
        flagged-publishers: uint,
        last-audit: uint
    }
)

(define-map category-benchmarks
    { category: (string-ascii 30) }
    {
        avg-ctr: uint,
        avg-cvr: uint,
        avg-cpc: uint,
        total-campaigns: uint,
        last-updated: uint
    }
)

(define-map user-engagement
    { user: principal, campaign-id: uint }
    {
        total-views: uint,
        total-clicks: uint,
        time-spent: uint,
        last-interaction: uint,
        engagement-score: uint
    }
)

;; private functions
(define-private (calculate-roi (revenue uint) (spend uint))
    (if (> spend u0)
        (/ (* (- revenue spend) u10000) spend)
        u0
    )
)

(define-private (calculate-rate (numerator uint) (denominator uint))
    (if (> denominator u0)
        (/ (* numerator u10000) denominator)
        u0
    )
)

;; read only functions
(define-read-only (get-conversion (campaign-id uint) (conversion-id uint))
    (map-get? conversions { campaign-id: campaign-id, conversion-id: conversion-id })
)

(define-read-only (get-conversion-count (campaign-id uint))
    (default-to { total: u0 } (map-get? conversion-count { campaign-id: campaign-id }))
)

(define-read-only (get-campaign-roi (campaign-id uint))
    (map-get? campaign-roi { campaign-id: campaign-id })
)

(define-read-only (get-publisher-report (publisher principal) (period uint))
    (map-get? publisher-reports { publisher: publisher, period: period })
)

(define-read-only (get-hourly-stats (campaign-id uint) (hour-block uint))
    (map-get? hourly-stats { campaign-id: campaign-id, hour-block: hour-block })
)

(define-read-only (get-retention-metrics (campaign-id uint))
    (map-get? retention-metrics { campaign-id: campaign-id })
)

(define-read-only (get-fraud-score (campaign-id uint))
    (map-get? fraud-scores { campaign-id: campaign-id })
)

(define-read-only (get-category-benchmark (category (string-ascii 30)))
    (map-get? category-benchmarks { category: category })
)

(define-read-only (get-user-engagement (user principal) (campaign-id uint))
    (map-get? user-engagement { user: user, campaign-id: campaign-id })
)

;; public functions
(define-public (record-conversion
    (campaign-id uint)
    (user principal)
    (value uint)
    (conversion-type (string-ascii 30))
    (attributed-view-id uint)
)
    (let
        (
            (count-data (get-conversion-count campaign-id))
            (conversion-id (+ (get total count-data) u1))
        )
        (map-set conversions
            { campaign-id: campaign-id, conversion-id: conversion-id }
            {
                user: user,
                value: value,
                conversion-type: conversion-type,
                timestamp: stacks-block-time,
                attributed-view-id: attributed-view-id
            }
        )

        (map-set conversion-count
            { campaign-id: campaign-id }
            { total: conversion-id }
        )

        (var-set total-conversions (+ (var-get total-conversions) u1))
        (var-set total-revenue (+ (var-get total-revenue) value))

        (ok conversion-id)
    )
)

(define-public (update-campaign-roi
    (campaign-id uint)
    (spend uint)
    (revenue uint)
    (num-conversions uint)
)
    (let
        (
            (roi (calculate-roi revenue spend))
        )
        (map-set campaign-roi
            { campaign-id: campaign-id }
            {
                total-spend: spend,
                total-revenue: revenue,
                roi-percentage: roi,
                conversions: num-conversions,
                last-updated: stacks-block-time
            }
        )

        (ok roi)
    )
)

(define-public (generate-publisher-report
    (publisher principal)
    (period uint)
    (total-views uint)
    (total-earnings uint)
    (campaigns-participated uint)
)
    (let
        (
            (avg-cpv (if (> total-views u0) (/ total-earnings total-views) u0))
            (quality-score u100) ;; Simplified - would be calculated based on performance
        )
        (map-set publisher-reports
            { publisher: publisher, period: period }
            {
                total-views: total-views,
                total-earnings: total-earnings,
                avg-cpv: avg-cpv,
                quality-score: quality-score,
                campaigns-participated: campaigns-participated,
                period-start: (- stacks-block-time period),
                period-end: stacks-block-time
            }
        )

        (ok true)
    )
)

(define-public (track-hourly-performance
    (campaign-id uint)
    (views uint)
    (clicks uint)
    (num-conversions uint)
    (revenue uint)
)
    (let
        (
            (hour-block (/ stacks-block-time u144)) ;; ~1 hour blocks
            (ctr (calculate-rate clicks views))
            (cvr (calculate-rate num-conversions views))
        )
        (map-set hourly-stats
            { campaign-id: campaign-id, hour-block: hour-block }
            {
                views: views,
                clicks: clicks,
                conversions: num-conversions,
                revenue: revenue,
                ctr: ctr,
                cvr: cvr
            }
        )

        (ok true)
    )
)

(define-public (update-retention-rate
    (campaign-id uint)
    (unique-viewers uint)
    (returning-viewers uint)
    (total-views uint)
)
    (let
        (
            (retention-rate (calculate-rate returning-viewers unique-viewers))
            (avg-views (if (> unique-viewers u0) (/ total-views unique-viewers) u0))
        )
        (map-set retention-metrics
            { campaign-id: campaign-id }
            {
                unique-viewers: unique-viewers,
                returning-viewers: returning-viewers,
                retention-rate: retention-rate,
                avg-views-per-user: avg-views
            }
        )

        (ok retention-rate)
    )
)

(define-public (calculate-fraud-score
    (campaign-id uint)
    (suspicious-views uint)
    (total-views uint)
    (flagged-publishers uint)
)
    (let
        (
            (fraud-percentage (calculate-rate suspicious-views total-views))
        )
        (map-set fraud-scores
            { campaign-id: campaign-id }
            {
                suspicious-views: suspicious-views,
                total-views: total-views,
                fraud-percentage: fraud-percentage,
                flagged-publishers: flagged-publishers,
                last-audit: stacks-block-time
            }
        )

        (ok fraud-percentage)
    )
)

(define-public (update-category-benchmark
    (category (string-ascii 30))
    (avg-ctr uint)
    (avg-cvr uint)
    (avg-cpc uint)
    (total-campaigns uint)
)
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)

        (map-set category-benchmarks
            { category: category }
            {
                avg-ctr: avg-ctr,
                avg-cvr: avg-cvr,
                avg-cpc: avg-cpc,
                total-campaigns: total-campaigns,
                last-updated: stacks-block-time
            }
        )

        (ok true)
    )
)

(define-public (track-user-engagement
    (user principal)
    (campaign-id uint)
    (views uint)
    (clicks uint)
    (time-spent uint)
)
    (let
        (
            (engagement-score (+ (* views u1) (* clicks u5) (/ time-spent u100)))
        )
        (map-set user-engagement
            { user: user, campaign-id: campaign-id }
            {
                total-views: views,
                total-clicks: clicks,
                time-spent: time-spent,
                last-interaction: stacks-block-time,
                engagement-score: engagement-score
            }
        )

        (ok engagement-score)
    )
)

(define-public (batch-update-metrics
    (campaign-id uint)
    (spend uint)
    (revenue uint)
    (num-conversions uint)
    (unique-viewers uint)
    (returning-viewers uint)
)
    (let
        (
            (roi-result (update-campaign-roi campaign-id spend revenue num-conversions))
            (retention-result (update-retention-rate campaign-id unique-viewers returning-viewers (+ unique-viewers returning-viewers)))
        )
        (ok true)
    )
)

;; Admin functions
(define-public (reset-campaign-analytics (campaign-id uint))
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)

        (map-delete campaign-roi { campaign-id: campaign-id })
        (map-delete retention-metrics { campaign-id: campaign-id })
        (map-delete fraud-scores { campaign-id: campaign-id })

        (ok true)
    )
)
