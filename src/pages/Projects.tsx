/**
 * Projects Page - Task 13 [R3][R10]
 *
 * Lists every saved project so the lecturer can open one or create a new one.
 *
 * UI inventory (see iae-design.md "UI Design > Projects List"):
 *   - "New Project" primary button                                       [R3]
 *   - Search box + filter (by configuration / status)
 *   - Sortable table with columns:
 *       name, configuration, language, students count, pass rate, last run
 *   - Row click navigates to /projects/<id>                              [R10]
 *
 * Create-Project modal:
 *   - name: string (required)
 *   - configurationId: select from ipc.config.getAll()                   [R3]
 *   - input: DataSource - radio "Type text" | "Pick a file"
 *       text  -> textarea (one argv element per line)
 *       file  -> ipc.dialog.openFile([{ name: 'Text', extensions: ['txt','*'] }])
 *   - expectedOutput: DataSource - same shape as input
 *   - On submit: ipc.project.create({ name, configurationId, input, expectedOutput })
 *               -> navigate(`/projects/${created.id}`)
 *
 * Data flow:
 *   onMount   -> ipc.project.getAll()
 *   onCreate  -> ipc.project.create() -> navigate(`/projects/${id}`)
 *   onDelete  -> confirm -> ipc.project.delete() -> reload
 */
export default function Projects() {
  // TODO [R10]: useState<Project[]>([]) + useEffect(loadAll)
  // TODO [R3]: useState for create-project modal open/closed + form values
  // TODO: search + sort state
  // TODO [R3]: render header with "New Project" button
  // TODO: render search box + filter dropdowns
  // TODO [R10]: render sortable table with row-click navigation
  // TODO [R3]: render create-project modal with:
  //   - configuration <select> populated from ipc.config.getAll()
  //   - input/expectedOutput DataSource pickers (text/file toggle)

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Projects</h1>
      <p className="text-muted-foreground">
        Project list is scaffolded. See the TODOs in this file (Task 13) for
        the wire-up against ipc.project and the create-project modal with
        DataSource pickers for input + expected output.
      </p>
    </div>
  );
}
