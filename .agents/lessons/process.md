# Lessons: process

## Measure Actions before cutting them
**What happened.** Asked to cut minutes, the first look found the expected waste: every change
ran the same suite twice (PR, then the push to `main`). The run data showed two things nobody
guessed. One `playwright install --with-deps` took 16m52s instead of the usual 13–21 s. And the
usage API billed **0 ms**, because standard runners are free for a public repository.
**Why it bit.** Without the measurement the work would have been sold as saving quota it never
used, and the real outlier (apt) would have stayed.
**How to apply.** Take per-job times and the billing figure from the last runs first, and write
the table down. Then report savings in the unit that is really spent: wall time today, quota
only if the repository goes private.
