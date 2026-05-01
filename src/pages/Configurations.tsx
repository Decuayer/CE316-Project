import { useCallback } from 'react';
import { ipc } from '@/lib/ipc';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Configurations Page - Task 12 [R4][R5]
 *
 * Lists every saved language configuration and lets the lecturer create,
 * edit, delete, import, or export them.
 *
 * Storage: rows in the SQLite `configurations` table.
 * Sharing: JSON files (R5) - import reads a .json into a new row,
 *          export writes a row to a .json file.
 *
 * UI inventory (see iae-design.md "UI Design > Configurations"):
 *   - Header with "New Configuration" primary button             [R4]
 *   - Toolbar: "Import JSON" + "Export selected" buttons          [R5]
 *   - Card grid (or table) of every Configuration showing:
 *       name, language, sourceFileExpected, createdAt
 *   - Per-row actions: Edit [R4], Export [R5], Delete [R4]
 *   - Create / Edit modal with fields:
 *       name, language, compileCommand?, compileArgs?, runCommand,
 *       runArgs?, sourceFileExpected
 *     and a hint listing the available template variables:
 *       {{sourceFile}}, {{outputName}}, {{args}}
 *   - Confirmation modal on Delete
 *     (warn that snapshotted projects retain their internal copy of the config)
 */
export default function Configurations() {
  // TODO [R4]: useState<Configuration[]>([]) + useEffect(loadAll)
  // TODO [R4]: modal state for create/edit (selectedConfigId, formValues)
  // TODO [R4]: render the grid/table with per-row Edit/Export/Delete
  // TODO [R4]: render the create/edit modal with the template-variable hint
  // TODO [R4]: render the delete-confirmation modal

  // R5: Import a configuration from a .json file selected by the user.
  // The DB row is created with a fresh id; the source file is unchanged.
  const handleImport = useCallback(async () => {
    const filePath = await ipc.dialog.openFile([
      { name: 'IAE Configuration', extensions: ['json'] },
    ]);
    if (!filePath) return;
    await ipc.config.import(filePath);
    // TODO [R4]: reload the configuration list
  }, []);

  // R5: Export the selected configuration to a .json file.
  // TODO [R5]: replace SELECTED_CONFIG_ID with state from the row selection above.
  const handleExport = useCallback(async () => {
    const SELECTED_CONFIG_ID: string | null = null;
    if (!SELECTED_CONFIG_ID) {
      // TODO [R5]: show a "select a configuration first" message
      return;
    }
    const targetPath = await ipc.dialog.saveFile('configuration.json', [
      { name: 'IAE Configuration', extensions: ['json'] },
    ]);
    if (!targetPath) return;
    await ipc.config.export(SELECTED_CONFIG_ID, targetPath);
  }, []);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Configurations</h1>
          <p className="text-muted-foreground">
            Compile + run profiles, stored in SQLite. Use Import/Export to
            share a profile as a .json file with another machine.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleImport}
            className={cn(buttonVariants({ variant: 'outline' }))}
          >
            Import JSON
          </button>
          <button
            type="button"
            onClick={handleExport}
            className={cn(buttonVariants({ variant: 'outline' }))}
          >
            Export selected
          </button>
          {/* TODO [R4]: render the "New Configuration" primary button here */}
        </div>
      </header>

      <p className="text-muted-foreground">
        Configuration list/edit UI is scaffolded. See the TODOs at the top of
        this file (Task 12 in the implementation plan) for the work remaining.
      </p>
    </div>
  );
}
