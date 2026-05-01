/**
 * Configurations Page - Task 12 [R4][R5]
 *
 * Lists every saved language configuration and lets the lecturer create,
 * edit, delete, import, or export them.
 *
 * UI inventory (see iae-design.md "UI Design > Configurations"):
 *   - Header with "New Configuration" primary button             [R4]
 *   - Toolbar: "Import" + "Export selected" buttons              [R5]
 *   - Card grid (or table) of every Configuration showing:
 *       name, language, sourceFileExpected, createdAt
 *   - Per-row actions: Edit [R4], Export [R5], Delete [R4]
 *   - Create / Edit modal with fields:
 *       name, language,
 *       compileCommand (optional), compileArgs (optional),
 *       runCommand, runArgs (optional),
 *       sourceFileExpected
 *     and a hint listing the available template variables:
 *       {{sourceFile}}, {{outputName}}, {{args}}
 *   - Confirmation modal on Delete (warn that snapshotted projects are unaffected)
 *
 * Data flow:
 *   onMount   -> ipc.config.getAll()
 *   onCreate  -> ipc.config.create()  -> reload
 *   onUpdate  -> ipc.config.update()  -> reload
 *   onDelete  -> confirm -> ipc.config.delete() -> reload
 *   onImport  -> ipc.dialog.openFile([{ name: 'JSON', extensions: ['json'] }])
 *             -> ipc.config.import(filePath) -> reload
 *   onExport  -> ipc.dialog.saveFile(`${config.name}.json`, ...)
 *             -> ipc.config.export(id, targetPath)
 */
export default function Configurations() {
  // TODO [R4]: useState<Configuration[]>([]) + useEffect(loadAll)
  // TODO [R4]: modal state for create/edit (selectedConfigId, formValues)
  // TODO [R4]: render header with "New Configuration" button
  // TODO [R5]: render toolbar with Import + Export-selected buttons
  // TODO [R4]: render the grid/table with per-row Edit/Export/Delete
  // TODO [R4]: render the create/edit modal with the template-variable hint
  // TODO [R4]: render the delete-confirmation modal

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Configurations</h1>
      <p className="text-muted-foreground">
        Configuration management UI is scaffolded. See the TODOs at the top of
        this file (Task 12 in the implementation plan) for the work remaining.
      </p>
    </div>
  );
}
