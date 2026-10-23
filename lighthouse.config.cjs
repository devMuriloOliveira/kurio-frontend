const urls = [
  'http://localhost:4173/',
  'http://localhost:4173/nfts/emerald-ape-042',
]

module.exports = (profile) => ({
  ci: {
    collect: {
      staticDistDir: './dist',
      isSinglePageApplication: true,
      url: urls,
      numberOfRuns: 3,
      settings: profile === 'desktop' ? { preset: 'desktop' } : {},
    },
    upload: {
      target: 'filesystem',
      outputDir: `./lighthouse-reports/${profile}`,
      reportFilenamePattern: '%%PATHNAME%%-%%DATETIME%%-report.%%EXTENSION%%',
    },
  },
})
