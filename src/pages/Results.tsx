/**
 * Results Page - Task 16 [R9]
 *
 * Summary table of the latest execution run for the current project.
 *
 * UI inventory (see iae-design.md "UI Design > Results"):
 *   - Header: project name + run-at timestamp + back-to-detail link
 *   - Filter dropdown by status:
 *       pass | fail | compile_error | runtime_error | timeout
 *       | missing_source | zip_error
 *   - Table with columns:
 *       Student ID | Compile | Run | Output Match | Overall Status
 *   - Color-coded status pill (green/red/amber)
 *   - Click row -> /projects/:id/results/:studentId  (StudentDetail)
 *
 * Data flow:
 *   onMount -> ipc.project.getResults(projectId)
 *           -> render table; if null, show empty state with "Run" CTA
 *              that links back to /projects/:id (ProjectDetail).
 */
export default function Results() {
  // TODO: const { id } = useParams<{ id: string }>()
  // TODO: useState<ProjectResults | null>(null) + useEffect(load)
  // TODO: filter state (selected status) + sort state (column + direction)
  // TODO [R9]: render header with timestamp and back link
  // TODO: render status filter dropdown
  // TODO [R9]: render summary table with color-coded status pills
  // TODO: render empty state when results are null

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Results</h1>
      <p className="text-muted-foreground">
        Results summary table is scaffolded. See the TODOs (Task 16) for the
        wire-up against ipc.project.getResults and the status table.
      </p>
    </div>
  );
}
