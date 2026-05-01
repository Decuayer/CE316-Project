/**
 * Student Detail Page - Task 15 [R9]
 *
 * Detailed execution log for a single student plus a side-by-side diff.
 *
 * UI inventory (see iae-design.md "UI Design > Student Detail" and
 * evaluation-flow-design.md "Comparison and diff UI"):
 *
 *   - Header: studentId, status pill, timestamp, link back to Results
 *   - Pipeline timeline:
 *       ZIP extracted? -> source found? -> compiled? -> executed?
 *       -> output matched?
 *     Each step shows ok/failed with the recorded message.
 *   - Compile output panel (stdout + stderr)             [R7]
 *   - Run output panel (stdout + stderr)                 [R7]
 *   - Side-by-side diff [R8]:
 *       expected (left) vs actual (right)
 *       toggle "Show whitespace markers" (default ON) renders:
 *         space  -> -
 *         tab    -> ->
 *         CR     -> CR-glyph
 *         LF     -> LF-glyph + actual newline (so layout is preserved)
 *         CRLF   -> CR-glyph + LF-glyph + actual newline
 *       line-by-line: differing lines highlighted red,
 *                     matching lines in default color
 *
 * Why the whitespace toggle? The comparator is strict (===). When a run
 * fails because the program emits "\n" but the lecturer pasted "\r\n"
 * into the expected field, the markers make the failure obvious instead
 * of mysterious.
 *
 * Data flow:
 *   onMount -> ipc.project.getResults(projectId)
 *           -> students.find(s => s.studentId === studentId)
 *           -> render. If missing, show "no results yet" empty state.
 */
export default function StudentDetail() {
  // TODO: const { id, studentId } = useParams<{ id: string; studentId: string }>()
  // TODO: load ProjectResults via ipc.project.getResults(id)
  // TODO: pluck the matching StudentResult by studentId; render empty state if missing
  // TODO [R9]: render header with status pill + timestamp + back link
  // TODO [R9]: render pipeline timeline (ZIP -> source -> compile -> run -> match)
  // TODO [R7]: render compile/run output panels (stdout + stderr)
  // TODO [R8]: render side-by-side diff with whitespace-marker toggle
  // TODO [R8]: implement diff line highlighting (red for diff, default for match)

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Student Detail</h1>
      <p className="text-muted-foreground">
        Student detail view is scaffolded. See the TODOs (Task 15) for the
        pipeline timeline, compile/run output panels, and the side-by-side
        diff with whitespace-marker toggle.
      </p>
    </div>
  );
}
