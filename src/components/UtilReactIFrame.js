import React from 'react'


function UtilReactIFrame({ content, wrap = true }) {
    const frameRef = React.useRef(null);

    React.useEffect(() => {
        const document = frameRef.current.contentDocument;
        document.body.innerHTML = content 
    }, [content])

    return <iframe title='util-react-iframe' ref={frameRef} style={{ height: wrap ? 'auto' : '500px'}}/>
}

export default UtilReactIFrame;