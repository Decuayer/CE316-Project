/**
 * Project Detail Page - Task 14 [R3][R6][R7][R10]
 *
 * The lecturer's primary workspace for a single project. From here they
 * review the snapshotted configuration, import student submissions, run
 * the evaluation pipeline, clean up artifacts, and review results.
 *
 * UI inventory (see iae-design.md "UI Design > Project Detail" and
 * evaluation-flow-design.md "Run button states" + "Clean up artifacts"):
 *
 *   - Header: project name, configuration name+language, "Edit project" button
 *   - Configuration summary card:
 *       sourceFileExpected, compileCommand+Args (or "Interpreted"),
 *       runCommand+Args
 *   - Input + Expected Output panels:
 *       Display the DataSource (text inline OR file path with "Open" button)
 *       "Edit" buttons open the modal that toggles text/file modes
 *   - Submissions section [R6]:
 *       "Select ZIP Directory" button -> ipc.dialog.openDirectory()
 *                                     -> ipc.execution.importZips(...)
 *       List of extracted student folders + a count
 *   - Run button [R7]:
 *       Three states (see evaluation-flow-design.md "Run button states"):
 *         Idle:     label "Run", enabled
 *         Running:  label "Running...", disabled, spinner inside the button
 *         Done:     returns to Idle; results table refreshes below
 *       Drives the loading state PURELY from the lifecycle of
 *       ipc.execution.run() - no separate progress channel in v1.
 *   - "Clean up artifacts" button (secondary):
 *       On click -> confirmation modal:
 *         "This will delete compiled binaries and any other generated files in
 *          every student folder. Source files will be kept. Continue?"
 *       Confirm -> ipc.execution.cleanup(projectId)
 *   - Results summary [R9]:
 *       Pass/fail counts per status from the latest ProjectResults.
 *       "View full results" link to /projects/:id/results
 *
 * Data flow:
 *   onMount        -> ipc.project.getById(id),
 *                     ipc.project.getResults(id),
 *                     ipc.execution.getStudents(id)
 *   onImportZips   -> ipc.dialog.openDirectory()
 *                  -> ipc.execution.importZips(id, dirPath)
 *                  -> reload student list
 *   onRun          -> setRunning(true)
 *                  -> ipc.execution.run(id)
 *                  -> setRunning(false)
 *                  -> ipc.project.getResults(id) -> refresh results summary
 *   onCleanup      -> confirm modal
 *                  -> ipc.execution.cleanup(id)
 *                  -> reload student list (artifacts gone)
 *   onEdit         -> open modal with input/expectedOutput as DataSource pickers
 *                  -> ipc.project.update(id, ...)
 */
export default function ProjectDetail() {
  // TODO: const { id } = useParams<{ id: string }>()
  // TODO: useState for project, results, students[], running, modals
  // TODO [R6]: render Submissions section with "Select ZIP Directory" button
  // TODO [R7]: render the three-state Run button driven by run()'s promise lifecycle
  // TODO: render the "Clean up artifacts" button + confirmation modal
  // TODO [R3]: render configuration summary + Input/Expected Output panels (DataSource view)
  // TODO [R9]: render results summary tiles with link to /projects/:id/results

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Project Detail</h1>
      <p className="text-muted-foreground">
        Project detail workspace is scaffolded. See the TODOs (Task 14) for
        the configuration summary, Input/Expected DataSource panels, ZIP
        picker, the three-state Run button, the cleanup-artifacts modal,
        and the results summary tiles.
      </p>
    </div>
  );
}
