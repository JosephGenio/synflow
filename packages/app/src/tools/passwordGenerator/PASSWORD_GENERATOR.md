# Password Generator Tool

## Overview

A client-side password generator that creates cryptographically secure passwords directly in the browser. No data is sent to any server — all generation, analysis, and display happens locally using the Web Crypto API.

## Architecture

```
tools/
  PasswordGeneratorScreen.tsx      # Main screen component (UI)
  passwordGenerator/
    engine.ts                      # Pure logic: generation, entropy, presets, word list
    usePasswordGenerator.ts        # React hook: state management, clipboard, config
    PASSWORD_GENERATOR.md          # This file
```

### Data Flow

```
[Presets / User Controls]
        |
        v
  PasswordConfig (state)
        |
   +---------+-----------+
   |                     |
   v                     v
generatePassword()   analyzeStrength()
   |                     |
   v                     v
password (string)    StrengthAnalysis
   |                     |
   +----------+----------+
              |
              v
     PasswordGeneratorScreen (render)
```

The `engine.ts` module is a pure TypeScript module with zero React dependencies. All randomness comes from `crypto.getRandomValues()`. The `usePasswordGenerator` hook manages React state and calls the engine on every config change.

## Presets

| ID | Label | Mode | Config |
|---|---|---|---|
| `pin` | PIN | Characters | 4 digits only |
| `simple` | Simple | Characters | 8 chars, uppercase + lowercase + numbers |
| `strong` | Strong | Characters | 16 chars, all character types (default on load) |
| `passphrase` | Passphrase | Passphrase | 4 words, dash separator, capitalized |
| `maximum` | Maximum | Characters | 32 chars, all character types |

On page load, the **Strong** preset is automatically selected and a password is generated immediately.

## Password Engine

### Character Mode

1. Builds a charset string from enabled toggles (uppercase, lowercase, numbers, symbols)
2. Filters out ambiguous characters (`O`, `0`, `l`, `1`, `I`) if the option is enabled
3. Filters out any user-specified custom exclusions
4. Uses `crypto.getRandomValues()` to pick random indices from the charset
5. Repeats for the configured length

### Passphrase Mode

1. Selects random words from an embedded ~800-word EFF-style diceware list
2. Optionally capitalizes the first letter of each word
3. Optionally appends a random digit to one random word
4. Joins words with the configured separator

### Entropy Calculation

- **Character mode**: `entropy = log2(charsetSize) * length`
- **Passphrase mode**: `entropy = log2(wordListSize) * wordCount` (plus `log2(10) + log2(wordCount)` if a number is included)

### Crack Time Estimation

Assumes an attacker with **10 billion guesses per second** (modern GPU cluster). Calculates the average-case time as `2^entropy / guessesPerSecond / 2`.

Output ranges: Instant, seconds, minutes, hours, days, years, thousand years, million years, billion years, Centuries+.

## Strength Levels

| Level | Entropy (bits) | Score Range | Segments Filled |
|---|---|---|---|
| Weak | < 28 | 0–21 | 1 / 5 |
| Fair | 28–49 | 22–38 | 2 / 5 |
| Good | 50–69 | 39–54 | 3 / 5 |
| Strong | 70–99 | 55–77 | 4 / 5 |
| Very Strong | 100+ | 78–100 | 5 / 5 |

Score is calculated as `min(100, round((entropy / 128) * 100))`.

## UI Sections

1. **Password Display Card** — Shows the generated password in monospace, with Copy and Regenerate buttons
2. **Presets Row** — Horizontal scrollable pills; active preset highlighted in green
3. **Customization Panel** — Mode tabs (Characters / Passphrase), length slider, character type toggles, exclude options, passphrase word count/separator/capitalize/number toggles
4. **Strength Analysis Panel** — 5-segment strength bar, strength label, entropy in bits, crack time estimate, charset size

## Security Considerations

- **`crypto.getRandomValues()` only** — `Math.random()` is never used. The Web Crypto API provides cryptographically secure pseudorandom numbers suitable for password generation.
- **No server communication** — Passwords never leave the browser. No API calls, no analytics, no logging.
- **No storage** — Generated passwords are held only in React state and are discarded on navigation.
- **Clipboard** — Uses the Clipboard API (`navigator.clipboard.writeText`). The password is only written to clipboard when the user explicitly clicks Copy.
- **Ambiguous character exclusion** — Helps prevent transcription errors when passwords are read aloud or hand-typed (e.g., `O` vs `0`, `l` vs `1`).

## Adding New Presets

To add a new preset, edit the `getPresets()` function in `engine.ts`:

```typescript
{
  id: 'my-preset',           // Unique ID
  label: 'My Preset',        // Display label on the pill button
  description: '...',        // Short description shown below label
  config: {
    mode: 'characters',      // or 'passphrase'
    characters: { ... },     // CharacterOptions
    passphrase: { ... },     // PassphraseOptions
  },
}
```

The preset will automatically appear in the UI. To make it the default on page load, update `getDefaultConfig()` to return the matching preset's config.
