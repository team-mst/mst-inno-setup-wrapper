# MST Inno Setup Wrapper

Wrapper around Inno Setup CLI (iscc.exe)

## Inputs

### `script-name`

**Required** File name of an Inno Setup script.

### `working-directory`

A directory path where the Inno Setup script is. Default value is the empty string, which represents the current directory of the action execution.

## Outputs

### `installer-path`

Full file path of the newly created installer.

### `installer-file-name`

File name of the newly created installer.

### `installer-simple-file-name`

File name without the extension of the newly created installer.

## Example usage
```yaml
- name: Create installer
  uses: team-mst/mst-inno-setup-wrapper@v1
  with:
    script-name: installer.iss
    working-directory: ${{ working-directory }}
```