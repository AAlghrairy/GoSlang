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

    return (
            <MonacoEditor
                height="75vh"
                options={options}
                theme= "vs-dark"
            />
    );
}

export default App;