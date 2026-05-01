/**
 * Help Page - Task 18 [R2]
 *
 * Built-in HTML manual rendered inside the app. Reachable from the sidebar
 * AND from a top-level "Help" menu item. The manual must work fully offline
 * - the app is a Windows installer with no external dependencies.
 *
 * Required sections (suggested outline):
 *
 *   1. Overview
 *      - What IAE does
 *      - The lecturer workflow at a glance
 *
 *   2. Creating a Configuration                                    [R4][R5]
 *      - Compile vs interpreted languages
 *      - sourceFileExpected
 *      - Template variables: {{sourceFile}}, {{outputName}}, {{args}}
 *      - Importing / Exporting configurations
 *
 *   3. Creating a Project                                              [R3]
 *      - Picking a configuration (snapshot semantics)
 *      - input: DataSource (typed text or file path)
 *      - expectedOutput: DataSource (same shape)
 *
 *   4. Importing Student Submissions                                   [R6]
 *      - Picking a directory of ZIP files
 *      - studentId = ZIP filename without ".zip"
 *
 *   5. Running an Evaluation                                       [R7][R8]
 *      - Run button states (Idle / Running / Done)
 *      - Per-execution timeout (10 seconds)
 *      - Strict byte-for-byte output comparison
 *      - Cleanup artifacts button
 *
 *   6. Reading Results                                                 [R9]
 *      - Status meanings:
 *          pass, fail, compile_error, runtime_error,
 *          timeout, missing_source, zip_error
 *      - Whitespace-marker toggle in the diff view
 *
 *   7. Saving / Reopening Projects                                    [R10]
 *      - Where files live on disk (~/.iae/projects/<id>/)
 *
 * Implementation:
 *   - Plain JSX (no external loads, no markdown library) so the manual
 *     remains visible offline and inside an air-gapped environment.
 *   - Sticky anchored navigation on the left, content scrolls on the right.
 */
export default function Help() {
  // TODO [R2]: render the manual sections per the outline above
  // TODO [R2]: anchored sub-section navigation (sticky left column)
  // TODO [R2]: highlight the active section as the reader scrolls

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Help</h1>
      <p className="text-muted-foreground">
        Help manual is scaffolded. See the TODO outline at the top of this
        file (Task 18) for the seven required sections.
      </p>
    </div>
  );
}
