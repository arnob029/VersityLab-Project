/**
 * Password Strength Utility
 * Attaches a real-time strength meter + symbol suggestion popup to a password input.
 *
 * Usage:
 *   initPasswordStrength('inputId', 'strengthWrapperId');
 *
 * The strength wrapper must already exist in the DOM (inserted by HTML or a call to
 * createStrengthUI()).
 */

const SYMBOLS = ['@', '$', '%', '!', '#', '^', '&', '*', '~', '?'];

/**
 * Evaluate the strength of a password.
 * Returns { level: 0-4, label, color, recommendation }
 */
function evaluatePassword(password) {
    if (!password) return { level: 0, label: '', color: '', recommendation: '' };

    const len = password.length;
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasDigit = /[0-9]/.test(password);
    const hasSymbol = /[@$%!#^&*~?]/.test(password);

    const variety = [hasLower, hasUpper, hasDigit, hasSymbol].filter(Boolean).length;

    let level, label, color, recommendation;

    if (len < 6 || variety <= 1) {
        level = 1; label = 'Weak'; color = '#ef4444';
        recommendation = 'Too short or too simple. Add uppercase, numbers & symbols.';
    } else if (variety === 2 || (variety >= 2 && len < 8)) {
        level = 2; label = 'Medium'; color = '#f59e0b';
        recommendation = 'Getting better! Add symbols like @ $ % # and make it longer.';
    } else if (variety === 3 || (variety >= 3 && len < 12)) {
        level = 3; label = 'Strong'; color = '#10b981';
        recommendation = len < 12
            ? 'Almost perfect! Try making it 12+ characters for maximum security.'
            : '';
    } else {
        level = 4; label = 'Very Strong'; color = '#8b5cf6';
        recommendation = ''; // Perfect!
    }

    return { level, label, color, recommendation };
}

/**
 * Insert the strength UI (bar + label + recommendation) right after the input's parent .form-group,
 * OR inside a provided wrapper element id.
 */
function createStrengthUI(inputEl, wrapperId) {
    let wrapper = document.getElementById(wrapperId);
    if (!wrapper) {
        wrapper = document.createElement('div');
        wrapper.id = wrapperId;
        inputEl.closest('.form-group').appendChild(wrapper);
    }
    wrapper.innerHTML = `
        <div class="pwd-strength-bar-track">
            <div class="pwd-strength-bar-fill" id="${wrapperId}-fill"></div>
        </div>
        <div class="pwd-strength-meta">
            <span class="pwd-strength-label" id="${wrapperId}-label"></span>
            <span class="pwd-strength-rec" id="${wrapperId}-rec"></span>
        </div>
    `;
    wrapper.classList.add('pwd-strength-wrapper');
}

/**
 * Create the floating symbol suggestion popup anchored above an input.
 */
function createSymbolPopup(inputEl, popupId) {
    let popup = document.getElementById(popupId);
    if (popup) return popup;

    popup = document.createElement('div');
    popup.id = popupId;
    popup.className = 'pwd-symbol-popup';
    popup.innerHTML = `
        <div class="pwd-symbol-title">💡 Use special symbols to strengthen:</div>
        <div class="pwd-symbol-chips">
            ${SYMBOLS.map(s => `<span class="pwd-symbol-chip" data-sym="${s}">${s}</span>`).join('')}
        </div>
        <div class="pwd-symbol-hint">Click a symbol to insert it at cursor position</div>
    `;

    // Insert popup right before the input's wrapper in the DOM
    const formGroup = inputEl.closest('.form-group');
    formGroup.style.position = 'relative';
    formGroup.appendChild(popup);

    // Click-to-insert symbol into password field
    popup.querySelectorAll('.pwd-symbol-chip').forEach(chip => {
        chip.addEventListener('mousedown', (e) => {
            e.preventDefault(); // prevent input from losing focus
            const sym = chip.dataset.sym;
            const start = inputEl.selectionStart;
            const end = inputEl.selectionEnd;
            const val = inputEl.value;
            inputEl.value = val.slice(0, start) + sym + val.slice(end);
            inputEl.setSelectionRange(start + 1, start + 1);
            inputEl.focus();
            inputEl.dispatchEvent(new Event('input'));
        });
    });

    return popup;
}

/**
 * Main initializer. Call this for each password field you want to enhance.
 * @param {string} inputId         - The id of the <input type="password">
 * @param {string} wrapperId       - Id for the strength bar wrapper div (will be created if missing)
 * @param {string} [popupId]       - Id for the symbol popup (auto-derived if omitted)
 */
function initPasswordStrength(inputId, wrapperId, popupId) {
    const inputEl = document.getElementById(inputId);
    if (!inputEl) return;

    popupId = popupId || (inputId + '-sym-popup');

    createStrengthUI(inputEl, wrapperId);
    createSymbolPopup(inputEl, popupId);

    const popup  = document.getElementById(popupId);
    const fill   = document.getElementById(wrapperId + '-fill');
    const label  = document.getElementById(wrapperId + '-label');
    const rec    = document.getElementById(wrapperId + '-rec');

    // Show / hide popup on focus/blur
    inputEl.addEventListener('focus', () => {
        popup.classList.add('visible');
    });

    inputEl.addEventListener('blur', () => {
        // Small delay so chip click fires before popup hides
        setTimeout(() => popup.classList.remove('visible'), 180);
    });

    // Update strength bar on input
    inputEl.addEventListener('input', () => {
        const val = inputEl.value;
        const { level, label: lbl, color, recommendation } = evaluatePassword(val);

        if (!val) {
            fill.style.width = '0%';
            fill.style.background = '';
            label.textContent = '';
            rec.textContent = '';
            return;
        }

        const widths = ['0%', '25%', '50%', '75%', '100%'];
        fill.style.width  = widths[level];
        fill.style.background = color;
        label.textContent = lbl;
        label.style.color = color;
        rec.textContent   = recommendation;

        // Highlight chips that are already used in the password
        popup.querySelectorAll('.pwd-symbol-chip').forEach(chip => {
            chip.classList.toggle('used', val.includes(chip.dataset.sym));
        });
    });
}
