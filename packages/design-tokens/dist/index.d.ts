/**
 * AI Smart Study Planner Design Tokens
 * Notion-inspired master tokens for colors, typography, spacing, shadows, and motion across web and mobile.
 */
export type ThemeMode = 'light' | 'dark' | 'system';
export declare const colorTokens: {
    readonly light: {
        readonly bgApp: "#FFFFFF";
        readonly bgSurface: "#FFFFFF";
        readonly bgSidebar: "#F7F7F5";
        readonly bgElevated: "#EFEFED";
        readonly bgHover: "#EFEFED";
        readonly borderSubtle: "#E9E9E7";
        readonly borderStrong: "#D4D4D2";
        readonly textPrimary: "#37352F";
        readonly textMuted: "#787774";
        readonly textSubtle: "#9B9A97";
        readonly accentBase: "#2383E2";
        readonly accentHover: "#1B6EC2";
        readonly accentSubtle: "#E7F3F8";
        readonly warningBase: "#CB912F";
        readonly warningSubtle: "#FBF3DB";
        readonly errorBase: "#EB5757";
        readonly errorSubtle: "#FDEBEC";
        readonly successBase: "#2A9D8F";
        readonly successSubtle: "#EDF3EC";
    };
    readonly dark: {
        readonly bgApp: "#191919";
        readonly bgSurface: "#191919";
        readonly bgSidebar: "#202020";
        readonly bgElevated: "#2F2F2F";
        readonly bgHover: "#2F2F2F";
        readonly borderSubtle: "#2F2F2F";
        readonly borderStrong: "#3F3F3F";
        readonly textPrimary: "#D4D4D4";
        readonly textMuted: "#9B9B9B";
        readonly textSubtle: "#6A6A6A";
        readonly accentBase: "#4E98E6";
        readonly accentHover: "#65A7EC";
        readonly accentSubtle: "#192734";
        readonly warningBase: "#D6B24D";
        readonly warningSubtle: "#372F18";
        readonly errorBase: "#E0524C";
        readonly errorSubtle: "#361F20";
        readonly successBase: "#5E9E74";
        readonly successSubtle: "#1E2B22";
    };
};
export declare const notionTagColors: {
    readonly gray: {
        readonly light: {
            readonly bg: "#EBECED";
            readonly text: "#454B4E";
        };
        readonly dark: {
            readonly bg: "#2A2B2D";
            readonly text: "#9B9B9B";
        };
    };
    readonly brown: {
        readonly light: {
            readonly bg: "#E9E5E3";
            readonly text: "#5A433A";
        };
        readonly dark: {
            readonly bg: "#2F2723";
            readonly text: "#BA9385";
        };
    };
    readonly orange: {
        readonly light: {
            readonly bg: "#FAEBDD";
            readonly text: "#854C1D";
        };
        readonly dark: {
            readonly bg: "#38281A";
            readonly text: "#CA7D39";
        };
    };
    readonly yellow: {
        readonly light: {
            readonly bg: "#FBF3DB";
            readonly text: "#89632A";
        };
        readonly dark: {
            readonly bg: "#372F18";
            readonly text: "#D6B24D";
        };
    };
    readonly green: {
        readonly light: {
            readonly bg: "#EDF3EC";
            readonly text: "#2B593F";
        };
        readonly dark: {
            readonly bg: "#1E2B22";
            readonly text: "#5E9E74";
        };
    };
    readonly blue: {
        readonly light: {
            readonly bg: "#E7F3F8";
            readonly text: "#28456C";
        };
        readonly dark: {
            readonly bg: "#192734";
            readonly text: "#5B8EC2";
        };
    };
    readonly purple: {
        readonly light: {
            readonly bg: "#F4F0F7";
            readonly text: "#492F64";
        };
        readonly dark: {
            readonly bg: "#2A2234";
            readonly text: "#966BC7";
        };
    };
    readonly pink: {
        readonly light: {
            readonly bg: "#FBF0F4";
            readonly text: "#69314C";
        };
        readonly dark: {
            readonly bg: "#341E28";
            readonly text: "#C46792";
        };
    };
    readonly red: {
        readonly light: {
            readonly bg: "#FDEBEC";
            readonly text: "#6C2928";
        };
        readonly dark: {
            readonly bg: "#361F20";
            readonly text: "#BE5B59";
        };
    };
};
export declare const subjectColorTokens: {
    readonly cs: {
        readonly light: "#28456C";
        readonly dark: "#5B8EC2";
        readonly name: "Blue";
    };
    readonly math: {
        readonly light: "#492F64";
        readonly dark: "#966BC7";
        readonly name: "Purple";
    };
    readonly physics: {
        readonly light: "#89632A";
        readonly dark: "#D6B24D";
        readonly name: "Yellow";
    };
    readonly chem: {
        readonly light: "#6C2928";
        readonly dark: "#BE5B59";
        readonly name: "Red";
    };
    readonly humanities: {
        readonly light: "#2B593F";
        readonly dark: "#5E9E74";
        readonly name: "Green";
    };
    readonly lang: {
        readonly light: "#854C1D";
        readonly dark: "#CA7D39";
        readonly name: "Orange";
    };
    readonly default: {
        readonly light: "#454B4E";
        readonly dark: "#9B9B9B";
        readonly name: "Gray";
    };
};
export declare const spacingTokens: {
    readonly 1: "4px";
    readonly 2: "8px";
    readonly 3: "12px";
    readonly 4: "16px";
    readonly 5: "20px";
    readonly 6: "24px";
    readonly 8: "32px";
    readonly 10: "40px";
    readonly 12: "48px";
    readonly 16: "64px";
};
export declare const radiusTokens: {
    readonly none: "0px";
    readonly sm: "3px";
    readonly md: "5px";
    readonly lg: "8px";
    readonly xl: "12px";
    readonly full: "9999px";
};
export declare const motionTokens: {
    readonly duration: {
        readonly instant: 80;
        readonly fast: 120;
        readonly normal: 200;
        readonly slow: 320;
        readonly deliberate: 500;
    };
    readonly easing: {
        readonly standard: "cubic-bezier(0.2, 0, 0, 1)";
        readonly enter: "cubic-bezier(0, 0, 0.2, 1)";
        readonly exit: "cubic-bezier(0.4, 0, 1, 1)";
    };
};
export declare const typographyScale: {
    readonly display: {
        readonly size: "30px";
        readonly lineHeight: "38px";
        readonly weight: 700;
        readonly letterSpacing: "-0.025em";
    };
    readonly pageTitle: {
        readonly size: "26px";
        readonly lineHeight: "34px";
        readonly weight: 700;
        readonly letterSpacing: "-0.02em";
    };
    readonly section: {
        readonly size: "18px";
        readonly lineHeight: "24px";
        readonly weight: 600;
        readonly letterSpacing: "-0.015em";
    };
    readonly cardTitle: {
        readonly size: "14px";
        readonly lineHeight: "20px";
        readonly weight: 600;
        readonly letterSpacing: "-0.01em";
    };
    readonly body: {
        readonly size: "14px";
        readonly lineHeight: "22px";
        readonly weight: 400;
        readonly letterSpacing: "0em";
    };
    readonly label: {
        readonly size: "13px";
        readonly lineHeight: "18px";
        readonly weight: 500;
        readonly letterSpacing: "0.005em";
    };
    readonly caption: {
        readonly size: "12px";
        readonly lineHeight: "16px";
        readonly weight: 400;
        readonly letterSpacing: "0.01em";
    };
    readonly mono: {
        readonly size: "12.5px";
        readonly lineHeight: "18px";
        readonly weight: 400;
        readonly letterSpacing: "0em";
    };
};
//# sourceMappingURL=index.d.ts.map