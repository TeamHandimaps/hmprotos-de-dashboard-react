import React from "react";

/** Wrapper component around an IFrame to help display any kind of HTML content. */
function UtilReactIFrame({ content, wrap = true }) {
  const frameRef = React.useRef(null); // this will be the ref to our iframe html component

  React.useEffect(() => {
    const document = frameRef.current.contentDocument;
    document.body.innerHTML = content; // TODO: Figure out how to more securely set this for certain content.
  }, [content]);

  return <iframe title="util-react-iframe" ref={frameRef} style={{ height: wrap ? "auto" : "500px" }} />;
}

export default UtilReactIFrame;
