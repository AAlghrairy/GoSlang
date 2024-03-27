// referenced from https://blog.logrocket.com/build-web-editor-with-react-monaco-editor/

import MonacoEditor from 'react-monaco-editor';
import React, { useState } from 'react';

const options = {
    autoIndent: 'full',
    contextmenu: true,
    fontFamily: 'consolas',
    fontSize: 13,
    lineHeight: 24,
    hideCursorInOverviewRuler: true,
    matchBrackets: 'always',
    minimap: {
        enabled: true,
    },
    scrollbar: {
        horizontalSliderSize: 4,
        verticalSliderSize: 18,
    },
    selectOnLineNumbers: true,
    roundedSelection: false,
    readOnly: false,
    cursorStyle: 'line',
    automaticLayout: true,
};

function App() {
    const [theme, setTheme] = useState('vs-light');

    const setDarkTheme = (e) => {
        e.preventDefault();
        setTheme((prev) => (prev === 'vs-dark' ? 'hc-black' : 'vs-dark'));
    };

    const setLightTheme = (e) => {
        e.preventDefault();
        setTheme('vs-light');
    };
    return (
        <div>
            <div>
                <button onClick={setDarkTheme} type="button">
                    Set dark theme ({theme === 'vs-dark' ? 'hc-black' : 'vs-dark'})
                </button>
                {theme !== 'vs-light' && (
                    <button onClick={setLightTheme} type="button">
                        Set light theme
                    </button>
                )}
            </div>
            <hr />
            <MonacoEditor
                height="500"
                options={options}
                theme={theme}
            />
        </div>
    );
}

export default App;