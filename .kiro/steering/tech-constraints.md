# Expense & Budget Visualizer — Technical Constraints

This document records the technical constraints for the Expense & Budget Visualizer project. All implementation work must conform to these rules.

## Technology Stack

- **Structure:** HTML only for markup/structure.
- **Styling:** CSS only for styling.
- **Logic:** Vanilla JavaScript only. No frameworks or libraries such as React, Vue, Angular, or jQuery.
- **Backend:** No backend server. The app is fully client-side.

## Data Storage

- Use the browser **Local Storage API** for persistence.
- All data must be stored client-side only. No network requests to external services for data persistence.

## Browser Compatibility

- Must work in modern browsers: Chrome, Firefox, Edge, and Safari.
- Avoid features that are not broadly supported across these browsers unless a safe fallback is provided.

## File Organization

- Exactly **one** CSS file, located in `css/`.
- Exactly **one** JavaScript file, located in `js/`.
- Do not introduce additional CSS or JS files.

## Code Quality

- Keep code clean and readable.
- Use consistent naming, indentation, and structure.
- Add comments where logic is non-obvious.
