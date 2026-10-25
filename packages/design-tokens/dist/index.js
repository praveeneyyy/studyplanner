/**
 * AI Smart Study Planner Design Tokens
 * Notion-inspired master tokens for colors, typography, spacing, shadows, and motion across web and mobile.
 */
export const colorTokens = {
    light: {
        bgApp: '#FFFFFF',
        bgSurface: '#FFFFFF',
        bgSidebar: '#F7F7F5',
        bgElevated: '#EFEFED',
        bgHover: '#EFEFED',
        borderSubtle: '#E9E9E7',
        borderStrong: '#D4D4D2',
        textPrimary: '#37352F',
        textMuted: '#787774',
        textSubtle: '#9B9A97',
        accentBase: '#2383E2',
        accentHover: '#1B6EC2',
        accentSubtle: '#E7F3F8',
        warningBase: '#CB912F',
        warningSubtle: '#FBF3DB',
        errorBase: '#EB5757',
        errorSubtle: '#FDEBEC',
        successBase: '#2A9D8F',
        successSubtle: '#EDF3EC'
    },
    dark: {
        bgApp: '#191919',
        bgSurface: '#191919',
        bgSidebar: '#202020',
        bgElevated: '#2F2F2F',
        bgHover: '#2F2F2F',
        borderSubtle: '#2F2F2F',
        borderStrong: '#3F3F3F',
        textPrimary: '#D4D4D4',
        textMuted: '#9B9B9B',
        textSubtle: '#6A6A6A',
        accentBase: '#4E98E6',
        accentHover: '#65A7EC',
        accentSubtle: '#192734',
        warningBase: '#D6B24D',
        warningSubtle: '#372F18',
        errorBase: '#E0524C',
        errorSubtle: '#361F20',
        successBase: '#5E9E74',
        successSubtle: '#1E2B22'
    }
};
export const notionTagColors = {
    gray: {
        light: { bg: '#EBECED', text: '#454B4E' },
        dark: { bg: '#2A2B2D', text: '#9B9B9B' }
    },
    brown: {
        light: { bg: '#E9E5E3', text: '#5A433A' },
        dark: { bg: '#2F2723', text: '#BA9385' }
    },
    orange: {
        light: { bg: '#FAEBDD', text: '#854C1D' },
        dark: { bg: '#38281A', text: '#CA7D39' }
    },
    yellow: {
        light: { bg: '#FBF3DB', text: '#89632A' },
        dark: { bg: '#372F18', text: '#D6B24D' }
    },
    green: {
        light: { bg: '#EDF3EC', text: '#2B593F' },
        dark: { bg: '#1E2B22', text: '#5E9E74' }
    },
    blue: {
        light: { bg: '#E7F3F8', text: '#28456C' },
        dark: { bg: '#192734', text: '#5B8EC2' }
    },
    purple: {
        light: { bg: '#F4F0F7', text: '#492F64' },
        dark: { bg: '#2A2234', text: '#966BC7' }
    },
    pink: {
        light: { bg: '#FBF0F4', text: '#69314C' },
        dark: { bg: '#341E28', text: '#C46792' }
    },
    red: {
        light: { bg: '#FDEBEC', text: '#6C2928' },
        dark: { bg: '#361F20', text: '#BE5B59' }
    }
};
export const subjectColorTokens = {
    cs: { light: '#28456C', dark: '#5B8EC2', name: 'Blue' },
    math: { light: '#492F64', dark: '#966BC7', name: 'Purple' },
    physics: { light: '#89632A', dark: '#D6B24D', name: 'Yellow' },
    chem: { light: '#6C2928', dark: '#BE5B59', name: 'Red' },
    humanities: { light: '#2B593F', dark: '#5E9E74', name: 'Green' },
    lang: { light: '#854C1D', dark: '#CA7D39', name: 'Orange' },
    default: { light: '#454B4E', dark: '#9B9B9B', name: 'Gray' }
};
export const spacingTokens = {
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    5: '20px',
    6: '24px',
    8: '32px',
    10: '40px',
    12: '48px',
    16: '64px'
};
export const radiusTokens = {
    none: '0px',
    sm: '3px',
    md: '5px',
    lg: '8px',
    xl: '12px',
    full: '9999px'
};
export const motionTokens = {
    duration: {
        instant: 80,
        fast: 120,
        normal: 200,
        slow: 320,
        deliberate: 500
    },
    easing: {
        standard: 'cubic-bezier(0.2, 0, 0, 1)',
        enter: 'cubic-bezier(0, 0, 0.2, 1)',
        exit: 'cubic-bezier(0.4, 0, 1, 1)'
    }
};
export const typographyScale = {
    display: { size: '30px', lineHeight: '38px', weight: 700, letterSpacing: '-0.025em' },
    pageTitle: { size: '26px', lineHeight: '34px', weight: 700, letterSpacing: '-0.02em' },
    section: { size: '18px', lineHeight: '24px', weight: 600, letterSpacing: '-0.015em' },
    cardTitle: { size: '14px', lineHeight: '20px', weight: 600, letterSpacing: '-0.01em' },
    body: { size: '14px', lineHeight: '22px', weight: 400, letterSpacing: '0em' },
    label: { size: '13px', lineHeight: '18px', weight: 500, letterSpacing: '0.005em' },
    caption: { size: '12px', lineHeight: '16px', weight: 400, letterSpacing: '0.01em' },
    mono: { size: '12.5px', lineHeight: '18px', weight: 400, letterSpacing: '0em' }
};
//# sourceMappingURL=index.js.map