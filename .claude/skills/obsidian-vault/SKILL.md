---
name: obsidian-vault
description: Search, create, and manage notes in the T4 Fastwork project's Obsidian vault with wikilinks and index notes. Use when user wants to find, create, or organize notes in Obsidian for this project.
---

# Obsidian Vault (T4 Fastwork)

## Vault location

`D:\Github\T4 Fastwork\Obsidian-Fastwork\`

This vault is scoped to the T4 Fastwork project (gitignored from the code repo — see root `.gitignore`). Mostly flat at root level.

## Naming conventions

- **Index notes**: aggregate related topics (e.g., `Projects Index.md`, `Decisions Index.md`)
- **Title case** for all note names
- No folders for organization - use links and index notes instead

## Linking

- Use Obsidian `[[wikilinks]]` syntax: `[[Note Title]]`
- Notes link to dependencies/related notes at the bottom
- Index notes are just lists of `[[wikilinks]]`

## Workflows

### Search for notes

```bash
# Search by filename
find "D:/Github/T4 Fastwork/Obsidian-Fastwork/" -name "*.md" | grep -i "keyword"

# Search by content
grep -rl "keyword" "D:/Github/T4 Fastwork/Obsidian-Fastwork/" --include="*.md"
```

Or use Grep/Glob tools directly on the vault path.

### Create a new note

1. Use **Title Case** for filename
2. Write content as a unit of learning (per vault rules)
3. Add `[[wikilinks]]` to related notes at the bottom

### Find related notes

Search for `[[Note Title]]` across the vault to find backlinks:

```bash
grep -rl "\\[\\[Note Title\\]\\]" "D:/Github/T4 Fastwork/Obsidian-Fastwork/"
```

### Find index notes

```bash
find "D:/Github/T4 Fastwork/Obsidian-Fastwork/" -name "*Index*"
```
